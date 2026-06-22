import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import * as React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { RequestCvEmail } from "../_shared/email-templates/request-cv.tsx";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_NAME = "Digihire";
const SITE_URL = "https://digihire.io";
const SENDER_EMAIL = "Digihire <hello@digihire.io>";
const REQUEST_WINDOW_DAYS = 3;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JobApplicationRow {
  id: string;
  full_name: string | null;
  email: string | null;
  cv_url: string | null;
  job_id: string;
  job_listings: { title: string; company_name: string; brand_id: string } | null;
}

function isAdmin(user: { app_metadata?: Record<string, unknown> }): boolean {
  const meta = user.app_metadata || {};
  return meta.role === "admin" || meta.account_type === "admin";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { applicationId } = await req.json();
    if (!applicationId || typeof applicationId !== "string") {
      return new Response(JSON.stringify({ error: "applicationId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: application, error: appError } = await supabaseAdmin
      .from("job_applications")
      .select("id, full_name, email, cv_url, job_id, job_listings(title, company_name, brand_id)")
      .eq("id", applicationId)
      .maybeSingle() as { data: JobApplicationRow | null; error: unknown };

    if (appError || !application) {
      return new Response(JSON.stringify({ error: "Application not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const job = application.job_listings;
    const isOwningBrand = !!job && job.brand_id === user.id;
    if (!isAdmin(user) && !isOwningBrand) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (application.cv_url) {
      return new Response(JSON.stringify({ error: "Applicant already has a CV on file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!application.email) {
      return new Response(JSON.stringify({ error: "Applicant has no email on file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const deadlineDate = new Date(Date.now() + REQUEST_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const deadline = deadlineDate.toLocaleDateString("en-NG", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    if (RESEND_API_KEY) {
      const html = await renderAsync(
        React.createElement(RequestCvEmail, {
          siteName: SITE_NAME,
          siteUrl: SITE_URL,
          recipient: application.email,
          name: application.full_name || undefined,
          jobTitle: job?.title || "the role",
          company: job?.company_name || "the employer",
          deadline,
        })
      );

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: SENDER_EMAIL,
          to: [application.email],
          subject: `Action needed: upload your CV for ${job?.title || "your application"} — Digihire`,
          html,
        }),
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(`Resend API error: ${JSON.stringify(resData)}`);
      }
    } else {
      console.warn("RESEND_API_KEY not set — CV request email not sent");
    }

    const { error: updateError } = await supabaseAdmin
      .from("job_applications")
      .update({ cv_requested_at: new Date().toISOString() })
      .eq("id", applicationId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, deadline }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in request-cv function:", error instanceof Error ? error.message : error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
