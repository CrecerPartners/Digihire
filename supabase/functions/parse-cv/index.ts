import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ROLE_OPTIONS = ['B2B Sales', 'Tech Sales', 'SaaS Sales', 'SDR', 'BDR', 'Account Executive', 'Business Development', 'Sales Ops', 'Merchandiser', 'Field Sales', 'Closer'];
const INDUSTRY_OPTIONS = ['Tech', 'Fintech', 'SaaS', 'Healthtech', 'Financial Services', 'Telecoms', 'Retail', 'FMCG'];

const MAX_CV_TEXT = 12000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require an authenticated user — CV parsing burns AI credits, so it must not be public.
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

    const body = await req.json() as { cvText?: string };
    const cvText = (body.cvText ?? "").trim();

    if (!cvText) {
      return new Response(JSON.stringify({ error: "cvText is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("AI_API_KEY") ?? Deno.env.get("OPENAI_API_KEY") ?? "";
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "CV parsing is not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Extract profile information from the CV text below. Return ONLY a valid JSON object with these exact keys (use null for missing fields, empty arrays for missing lists):

{
  "full_name": string or null,
  "phone": string or null,
  "city": string or null,
  "state": string or null,
  "country": string or null,
  "bio": "2-3 sentence professional summary" or null,
  "experience_years": number or null,
  "skills": string[],
  "languages": string[],
  "work_history_summary": "chronological work history as plain text (Company, role, dates each on a new line)" or null,
  "education_summary": "education background as plain text" or null,
  "linkedin_url": string or null,
  "role_interests": subset of ${JSON.stringify(ROLE_OPTIONS)} that match their roles,
  "industry_experience": subset of ${JSON.stringify(INDUSTRY_OPTIONS)} that match their background
}

CV TEXT:
${cvText.slice(0, MAX_CV_TEXT)}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 1500,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are a CV/resume parser. Extract structured information and return only valid JSON.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const message = (errBody as { error?: { message?: string } }).error?.message || `CV parsing failed (${res.status})`;
      return new Response(JSON.stringify({ error: message }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await res.json() as { choices?: { message?: { content?: string } }[] };
    const content = result.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as Record<string, unknown>;

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
