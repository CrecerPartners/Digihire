
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SITE_NAME = "Digihire"
const SENDER_EMAIL = "Digihire <hello@digihire.io>"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Verify your Digihire account',
  invite: "You're invited to join Digihire",
  magiclink: 'Your Digihire login code',
  recovery: 'Reset your Digihire password',
  email_change: 'Confirm your new email — Digihire',
  reauthentication: 'Your Digihire verification code',
}

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    // Supabase Auth Hook sends 'action' (signup, recovery, etc.)
    // Note: compatible with both 'action' and 'action_type' for flexibility
    const type = payload.action || payload.data?.action_type
    
    console.log(`Processing ${type} email for ${payload.email || payload.data?.email}`)

    const EmailTemplate = EMAIL_TEMPLATES[type]
    if (!EmailTemplate) {
      throw new Error(`Unknown email type: ${type}`)
    }

    // Extract module/service from user metadata for per-path email copy
    const userMeta = payload.user_metadata || payload.data?.user_metadata || {}
    const activeModules: string[] = userMeta.active_modules || []
    const userModule = activeModules[0]
    const userService = userModule // brands use active_modules as service key too

    const templateProps = {
      siteName: SITE_NAME,
      siteUrl: "https://digihire.io",
      recipient: payload.email || payload.data?.email,
      token: payload.token || payload.data?.token,
      url: payload.url || payload.data?.url,
      newEmail: payload.new_email || payload.data?.new_email,
      userModule,
      userService,
    }

    const html = await renderAsync(React.createElement(EmailTemplate, templateProps))

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: [templateProps.recipient],
        subject: EMAIL_SUBJECTS[type] || 'Volt Notification',
        html: html,
      }),
    })

    const resData = await res.json()

    if (!res.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(resData)}`)
    }

    return new Response(JSON.stringify(resData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in auth-email-hook:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
