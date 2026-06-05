import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  profile: {
    full_name?: string;
    bio?: string;
    skills?: string[];
    work_history?: unknown[];
  };
}

interface TailorResult {
  cover_note: string;
  suggestions: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated talent user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json() as TailorRequest;
    const { job, profile } = body;

    if (!job?.title) {
      return new Response(JSON.stringify({ error: "job.title is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("AI_API_KEY") ?? Deno.env.get("OPENAI_API_KEY") ?? "";

    if (!apiKey) {
      // Graceful fallback when no AI key is configured
      const fallback: TailorResult = {
        cover_note: `Dear Hiring Team at ${job.company},\n\nI am writing to express my strong interest in the ${job.title} position. With my background in ${job.category} and my core skills including ${profile.skills?.slice(0, 4).join(", ") || "communication, client relations"}, I am confident that I can add immediate value to your organization.\n\nI look forward to discussing how my experience matches your current goals.\n\nBest regards,\n${profile.full_name || "Candidate"}`,
        suggestions: [
          `Highlight experience related to "${job.category}" in the summary of your profile.`,
          `Include matching skills: ${job.skills?.slice(0, 3).join(", ") || "sales, negotiation"} in your profile settings.`,
          `In your introduction, outline your achievements working in ${job.work_mode || "hybrid"} environments.`,
        ],
      };
      return new Response(JSON.stringify(fallback), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Job Title: ${job.title}
Company: ${job.company}
Category: ${job.category}
Description: ${job.description ?? "Not provided"}
Requirements: ${job.requirements ?? "Not provided"}
Job Skills: ${job.skills?.join(", ") ?? "Not specified"}

Candidate Profile:
Name: ${profile.full_name ?? "Candidate"}
Bio: ${profile.bio ?? "No bio provided"}
Skills: ${profile.skills?.join(", ") ?? "No skills listed"}
Work History: ${JSON.stringify(profile.work_history ?? [])}

Return a valid JSON object with these exact keys:
{
  "cover_note": "A tailored 2-3 paragraph cover note (max 300 words) aligning the candidate's skills to this specific role.",
  "suggestions": [
    "Specific tip 1 (e.g. Highlight X skill or experience)",
    "Specific tip 2",
    "Specific tip 3"
  ]
}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are an AI career assistant. Compare the job requirements with the candidate profile, generate a highly professional tailored cover letter, and return 3 key suggestions to optimize their profile for this specific role. Return ONLY a JSON object.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("OpenAI error:", res.status, errText);
      throw new Error("AI service returned an error");
    }

    const data = await res.json();
    const result = JSON.parse(data.choices[0].message.content) as TailorResult;

    return new Response(
      JSON.stringify({
        cover_note: result.cover_note ?? "",
        suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("tailor-cv error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
