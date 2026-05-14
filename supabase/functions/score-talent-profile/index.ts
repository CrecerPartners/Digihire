import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a sales talent evaluator for Digihire, a platform that matches sales professionals with top brands in Africa and globally.

Score the talent profile below on 5 dimensions (0–100 each) and return ONLY valid JSON with no markdown, no explanation — just the raw JSON object matching this exact schema:
{
  "overall_score": number,
  "experience_score": number,
  "skills_score": number,
  "completeness_score": number,
  "education_score": number,
  "availability_score": number,
  "summary": "2–3 sentence professional summary of the candidate",
  "strengths": ["up to 3 specific strengths"],
  "suggested_roles": ["up to 3 best-fit role titles"],
  "ai_tags": ["up to 5 short lowercase tags e.g. b2b, saas, senior, fintech"]
}

Scoring guide:
- experience_score: quality and relevance of work history + years of experience (0 yrs = 10, 1–2 yrs = 40, 3–5 yrs = 65, 5+ yrs = 85+)
- skills_score: breadth, specificity and sales-relevance of listed skills
- completeness_score: how many key fields are filled (bio, cv, work history, education, skills, links = 100 if all present)
- education_score: education level + certifications (no info = 20, secondary = 40, degree = 70, postgrad = 85, relevant certs add +10)
- availability_score: available = 100, looking = 60, unavailable = 20
- overall_score: weighted average: experience 30% + skills 30% + completeness 20% + education 10% + availability 10%`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller is authenticated admin
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const meta = user.user_metadata ?? {};
    const roles: string[] = Array.isArray(meta.account_types)
      ? meta.account_types
      : meta.account_type ? [meta.account_type] : [];
    if (!roles.includes("admin")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { talent_id } = await req.json();
    if (!talent_id) {
      return new Response(JSON.stringify({ error: "talent_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch profile with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("talent_profiles")
      .select("*")
      .eq("id", talent_id)
      .single();

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: "Talent profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build profile summary for AI
    const profileText = `
Name: ${profile.full_name}
Bio: ${profile.bio || "Not provided"}
Experience: ${profile.experience_years ?? 0} years
Skills: ${(profile.skills ?? []).join(", ") || "None listed"}
Role Interests: ${(profile.role_interests ?? []).join(", ") || "None"}
Industry Experience: ${(profile.industry_experience ?? []).join(", ") || "None"}
Languages: ${(profile.languages ?? []).join(", ") || "Not specified"}
Education: ${JSON.stringify(profile.education ?? [])}
Certifications: ${JSON.stringify(profile.certifications ?? [])}
Work History: ${JSON.stringify(profile.work_history ?? [])}
Availability: ${profile.availability || "unknown"}
Work Preference: ${profile.work_preference || "Not specified"}
Job Type Preference: ${(profile.job_type_preference ?? []).join(", ") || "Not specified"}
Salary Expectations: ${profile.salary_min ? `${profile.salary_min}–${profile.salary_max}` : "Not specified"}
Has CV: ${profile.cv_url ? "Yes" : "No"}
Has LinkedIn: ${profile.linkedin_url ? "Yes" : "No"}
Has Portfolio: ${profile.portfolio_url ? "Yes" : "No"}
Profile Completion: ${profile.profile_completion ?? 0}%
    `.trim();

    // Call AI — provider-agnostic
    const provider = Deno.env.get("AI_PROVIDER") ?? "anthropic";
    const apiKey = Deno.env.get("AI_API_KEY") ?? "";

    let aiResult: Record<string, unknown>;

    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 0.2,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: profileText },
          ],
        }),
      });
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content ?? "{}";
      aiResult = JSON.parse(content);
    } else {
      // Default: Anthropic Claude
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          temperature: 0.2,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: profileText }],
        }),
      });
      const json = await res.json();
      const content = json.content?.[0]?.text ?? "{}";
      aiResult = JSON.parse(content);
    }

    // Upsert score
    const scoreRow = {
      talent_id,
      overall_score: Number(aiResult.overall_score) || 0,
      experience_score: Number(aiResult.experience_score) || 0,
      skills_score: Number(aiResult.skills_score) || 0,
      completeness_score: Number(aiResult.completeness_score) || 0,
      education_score: Number(aiResult.education_score) || 0,
      availability_score: Number(aiResult.availability_score) || 0,
      summary: String(aiResult.summary ?? ""),
      strengths: Array.isArray(aiResult.strengths) ? aiResult.strengths : [],
      suggested_roles: Array.isArray(aiResult.suggested_roles) ? aiResult.suggested_roles : [],
      ai_tags: Array.isArray(aiResult.ai_tags) ? aiResult.ai_tags : [],
      scored_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: saved, error: upsertErr } = await supabaseAdmin
      .from("talent_profile_scores")
      .upsert(scoreRow, { onConflict: "talent_id" })
      .select()
      .single();

    if (upsertErr) throw upsertErr;

    return new Response(JSON.stringify({ success: true, score: saved }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("score-talent-profile error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
