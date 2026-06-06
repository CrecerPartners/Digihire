import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { JobApplicationEmail } from '../_shared/email-templates/job-application.tsx'
import { ProfileCompleteEmail } from '../_shared/email-templates/profile-complete.tsx'
import { TalentWelcomeEmail } from '../_shared/email-templates/talent-welcome.tsx'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SITE_NAME = "Digihire"
const SITE_URL = "https://digihire.io"
const SENDER_EMAIL = "Digihire <hello@digihire.io>"

const ALLOWED_MODULES = new Set(['talent_pool', 'voltsquad', 'gigs', 'events'])

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type EmailComponent = React.ComponentType<Record<string, unknown>>

const EMAIL_CONFIG: Record<string, { subject: string; Component: EmailComponent }> = {
  job_application: {
    subject: 'Your application has been submitted — Digihire',
    Component: JobApplicationEmail as EmailComponent,
  },
  profile_complete: {
    subject: 'Profile complete! Brands can now discover you — Digihire',
    Component: ProfileCompleteEmail as EmailComponent,
  },
  talent_welcome: {
    subject: 'Welcome to Digihire 👋',
    Component: TalentWelcomeEmail as EmailComponent,
  },
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Require authenticated user — reject anonymous calls
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Derive recipient from the authenticated user — never trust client-supplied `to`
    const to = user.email
    if (!to) {
      return new Response(JSON.stringify({ error: 'Authenticated user has no email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Derive display name from verified user metadata — not from request body
    const name: string =
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      ''

    const body = await req.json()
    const { type, data } = body

    if (!type) {
      return new Response(JSON.stringify({ error: 'type is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const config = EMAIL_CONFIG[type]
    if (!config) {
      return new Response(JSON.stringify({ error: `Unknown email type: ${type}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Build template props — whitelist permitted data fields per email type
    let templateData: Record<string, unknown> = { name }
    if (type === 'talent_welcome') {
      const module = typeof data?.module === 'string' && ALLOWED_MODULES.has(data.module)
        ? data.module
        : 'talent_pool'
      templateData = { name, module }
    } else if (type === 'job_application') {
      templateData = {
        name,
        jobTitle: typeof data?.jobTitle === 'string' ? data.jobTitle.slice(0, 200) : '',
        company: typeof data?.company === 'string' ? data.company.slice(0, 200) : '',
        appliedAt: typeof data?.appliedAt === 'string' ? data.appliedAt.slice(0, 50) : undefined,
      }
    }

    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set — email not sent for type:', type)
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const html = await renderAsync(
      React.createElement(config.Component, {
        siteName: SITE_NAME,
        siteUrl: SITE_URL,
        recipient: to,
        ...templateData,
      })
    )

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: SENDER_EMAIL, to: [to], subject: config.subject, html }),
    })

    const resData = await res.json()
    if (!res.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(resData)}`)
    }

    return new Response(JSON.stringify({ success: true, id: resData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in send-transactional-email:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
