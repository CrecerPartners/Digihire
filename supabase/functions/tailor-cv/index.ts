import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_TIMEOUT_MS = 25_000;
const MAX_OUTPUT_TOKENS = 1024;

interface TailorRequest {
  job: {
    title: string;
    company: string;
    category: string;
    description?: string;
    requirements?: string;
    skills?: string[];
    work_mode?: string;
  };
  // Optional client-supplied profile; the authoritative copy is fetched
  // server-side from talent_profiles so stale/thin client payloads can't
  // degrade the tailoring quality.
  profile?: Record<string, unknown>;
}

interface TailorResult {
  cover_note: string;
  suggestions: string[];
  match_score: number | null;
  matching_skills: string[];
  missing_skills: string[];
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Models sometimes wrap JSON in markdown fences — strip them before parsing. */
function parseModelJson(raw: string): Record<string, unknown> {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  return JSON.parse(cleaned) as Record<string, unknown>;
}

function summarizeEntries(entries: unknown): string {
  if (!Array.isArray(entries) || entries.length === 0) return "Not provided";
  return entries
    .map((e) => {
      if (typeof e === "string") return e;
      if (e && typeof e === "object") {
        const obj = e as Record<string, unknown>;
        return String(obj.summary ?? JSON.stringify(obj));
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();

  try {
    // Require authenticated talent user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await req.json() as TailorRequest;
    const { job } = body;

    if (!job?.title) {
      return jsonResponse({ error: "job.title is required" }, 400);
    }

    const provider = Deno.env.get("AI_PROVIDER") ?? "openai";
    const apiKey = Deno.env.get("AI_API_KEY") ?? Deno.env.get("OPENAI_API_KEY") ?? "";

    if (!apiKey) {
      // Fail loudly: the old silent template fallback masked misconfiguration.
      return jsonResponse(
        { error: "AI tailoring is not configured. Please contact support.", code: "AI_NOT_CONFIGURED" },
        503,
      );
    }

    // Authoritative profile: fetch server-side (RLS-scoped to the caller),
    // fall back to the client payload only if the row is missing.
    const { data: dbProfile } = await supabaseClient
      .from("talent_profiles")
      .select("full_name, bio, skills, languages, experience_years, role_interests, industry_experience, work_history, education, certifications, city, country, work_preference, availability")
      .eq("id", user.id)
      .maybeSingle();

    const profile = (dbProfile ?? body.profile ?? {}) as Record<string, unknown>;

    const profileSkills = Array.isArray(profile.skills) ? profile.skills as string[] : [];
    const hasSubstance = Boolean(
      profile.bio || profileSkills.length > 0 ||
      (Array.isArray(profile.work_history) && (profile.work_history as unknown[]).length > 0),
    );
    if (!hasSubstance) {
      return jsonResponse(
        {
          error: "Your profile has no CV data yet. Complete your profile (bio, skills, work history) so the AI has something to adapt.",
          code: "PROFILE_EMPTY",
        },
        422,
      );
    }

    const prompt = `JOB POSTING
Title: ${job.title}
Company: ${job.company}
Category: ${job.category}
Work mode: ${job.work_mode ?? "Not specified"}
Description: ${job.description ?? "Not provided"}
Requirements: ${job.requirements ?? "Not provided"}
Skills wanted: ${job.skills?.join(", ") || "Not specified"}

CANDIDATE PROFILE (parsed from their CV)
Name: ${String(profile.full_name ?? "Candidate")}
Location: ${[profile.city, profile.country].filter(Boolean).join(", ") || "Not specified"}
Bio: ${String(profile.bio ?? "Not provided")}
Years of experience: ${profile.experience_years ?? "Not specified"}
Skills: ${profileSkills.join(", ") || "Not listed"}
Languages: ${Array.isArray(profile.languages) ? (profile.languages as string[]).join(", ") : "Not specified"}
Role interests: ${Array.isArray(profile.role_interests) ? (profile.role_interests as string[]).join(", ") : "Not specified"}
Industry experience: ${Array.isArray(profile.industry_experience) ? (profile.industry_experience as string[]).join(", ") : "Not specified"}
Work history:
${summarizeEntries(profile.work_history)}
Education:
${summarizeEntries(profile.education)}
Certifications:
${summarizeEntries(profile.certifications)}
Work preference: ${String(profile.work_preference ?? "Not specified")}
Availability: ${String(profile.availability ?? "Not specified")}

Return ONLY a valid JSON object with these exact keys:
{
  "cover_note": "A tailored 2-3 paragraph cover note (max 280 words), first person, specific to THIS job. Reference the candidate's real experience and the job's actual requirements. No placeholder brackets, no invented facts.",
  "suggestions": ["3 to 5 specific, actionable tips to strengthen this application or the candidate's profile for THIS role"],
  "match_score": 0-100 integer honestly scoring profile fit against the job requirements,
  "matching_skills": ["skills/experience the candidate has that this job asks for"],
  "missing_skills": ["skills/requirements the job asks for that the candidate lacks or hasn't evidenced"]
}`;

    const systemPrompt =
      "You are a career assistant for a talent marketplace. You compare a candidate's CV-derived profile against a specific job posting and produce an honest fit assessment plus a tailored cover note. Never fabricate experience the candidate does not have. Return ONLY a JSON object.";

    let rawContent = "";
    let model = "";
    let usage: Record<string, unknown> = {};

    if (provider === "openai") {
      model = Deno.env.get("AI_MODEL") ?? "gpt-4o-mini";
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(AI_TIMEOUT_MS),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.4,
          max_tokens: MAX_OUTPUT_TOKENS,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const upstream = (errBody as { error?: { message?: string } }).error?.message ?? `status ${res.status}`;
        console.error("tailor-cv openai error:", res.status, upstream);
        return jsonResponse({ error: `AI service error: ${upstream}`, code: "AI_UPSTREAM" }, 502);
      }

      const data = await res.json();
      rawContent = data.choices?.[0]?.message?.content ?? "";
      usage = data.usage ?? {};
    } else {
      // Anthropic Claude
      model = Deno.env.get("AI_MODEL") ?? "claude-sonnet-4-6";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: AbortSignal.timeout(AI_TIMEOUT_MS),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: MAX_OUTPUT_TOKENS,
          temperature: 0.4,
          system: systemPrompt,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const upstream = (errBody as { error?: { message?: string } }).error?.message ?? `status ${res.status}`;
        console.error("tailor-cv anthropic error:", res.status, upstream);
        return jsonResponse({ error: `AI service error: ${upstream}`, code: "AI_UPSTREAM" }, 502);
      }

      const data = await res.json();
      rawContent = data.content?.[0]?.text ?? "";
      usage = data.usage ?? {};
    }

    const parsed = parseModelJson(rawContent);

    const result: TailorResult = {
      cover_note: typeof parsed.cover_note === "string" ? parsed.cover_note : "",
      suggestions: Array.isArray(parsed.suggestions) ? (parsed.suggestions as unknown[]).map(String) : [],
      match_score: Number.isFinite(Number(parsed.match_score))
        ? Math.max(0, Math.min(100, Math.round(Number(parsed.match_score))))
        : null,
      matching_skills: Array.isArray(parsed.matching_skills) ? (parsed.matching_skills as unknown[]).map(String) : [],
      missing_skills: Array.isArray(parsed.missing_skills) ? (parsed.missing_skills as unknown[]).map(String) : [],
    };

    if (!result.cover_note) {
      console.error("tailor-cv: model returned no cover_note", rawContent.slice(0, 300));
      return jsonResponse({ error: "AI returned an unusable response. Please try again.", code: "AI_BAD_OUTPUT" }, 502);
    }

    // Metrics line — visible in Supabase edge function logs.
    console.log(JSON.stringify({
      fn: "tailor-cv",
      provider,
      model,
      latency_ms: Date.now() - startedAt,
      usage,
      match_score: result.match_score,
    }));

    return jsonResponse(result);

  } catch (err: unknown) {
    const isTimeout = err instanceof DOMException && err.name === "TimeoutError";
    const message = isTimeout
      ? "The AI request timed out. Please try again."
      : err instanceof Error ? err.message : "Internal server error";
    console.error("tailor-cv error:", message);
    return jsonResponse({ error: message }, isTimeout ? 504 : 500);
  }
});
