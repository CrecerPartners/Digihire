/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Html, Link, Preview, Section, Text, Img,
} from 'npm:@react-email/components@0.0.22'

interface TalentWelcomeEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  name?: string
  module?: string
}

const MODULE_COPY: Record<string, { subtitle: string; body: string; cta: string }> = {
  voltsquad: {
    subtitle: "You're now on your way to earning with leading brands.",
    body: "Log in to browse active brand campaigns and start earning commissions when people buy or sign up through you.",
    cta: "Go to VoltSquad Dashboard",
  },
  gigs: {
    subtitle: "You've applied for short-term gig and field roles.",
    body: "Our team will review your application and match you with available roles based on your location and skills. Keep an eye on your inbox for updates.",
    cta: "Log In to Your Dashboard",
  },
  events: {
    subtitle: "You're registered for Digihire events.",
    body: "Log in to view upcoming events, register for sessions, and get notified when new brand activations and workshops are announced.",
    cta: "View Upcoming Events",
  },
}

const DEFAULT_COPY = {
  subtitle: "You're now part of the Digihire Talent Pool.",
  body: "Verify your email, then log in and complete your profile so brands can discover you for full-time, part-time, contract, and gig roles.",
  cta: "Log In & Complete Profile",
}

export const TalentWelcomeEmail = ({
  siteName, siteUrl, name, module,
}: TalentWelcomeEmailProps) => {
  const copy = (module && MODULE_COPY[module]) || DEFAULT_COPY
  const isTalentPool = !module || module === 'talent_pool'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Welcome to Digihire — your account is ready</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src="https://yaojxewpkrjonrvqpsxi.supabase.co/storage/v1/object/public/logos/logo.png"
              width="140" height="auto" alt="Digihire Logo"
            />
          </Section>

          <Section style={heroBanner}>
            <Text style={waveEmoji}>👋</Text>
            <Text style={bannerHeadline}>Welcome to Digihire</Text>
            <Text style={bannerSubtitle}>{copy.subtitle}</Text>
          </Section>

          <Text style={text}>Hi {name || 'there'},</Text>
          <Text style={text}>{copy.body}</Text>

          {isTalentPool && (
            <Section style={stepsBox}>
              <Text style={stepsLabel}>Your next steps</Text>
              <Text style={stepItem}>1. Check your inbox and verify your email</Text>
              <Text style={stepItem}>2. Log in to the Digihire portal</Text>
              <Text style={stepItem}>3. Complete your profile — add your CV, bio, skills, and experience</Text>
              <Text style={stepItem}>4. Start receiving role matches from brands hiring on Digihire</Text>
            </Section>
          )}

          <Section style={ctaSection}>
            <Link style={ctaButton} href={`${siteUrl}/login`}>
              {copy.cta}
            </Link>
          </Section>

          <Section style={whatsappSection}>
            <Text style={whatsappHeadline}>Stay ahead of new opportunities</Text>
            <Text style={whatsappText}>
              Follow the{' '}
              <Link href="https://whatsapp.com/channel/0029VbDD4jyLNSaBGzovxp3R" style={whatsappLink}>
                DIGIHIRE Jobs &amp; Gigs WhatsApp channel
              </Link>
              {' '}to get regular updates on new jobs, gigs, and campaign opportunities directly on WhatsApp.
            </Text>
          </Section>

          <Section style={footerSection}>
            <Text style={footerText}>© 2026 {siteName}. All rights reserved.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default TalentWelcomeEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}
const container = {
  backgroundColor: '#ffffff', margin: '40px auto', padding: '40px 48px',
  borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', maxWidth: '560px',
}
const header = { marginBottom: '24px' }
const heroBanner = {
  background: 'linear-gradient(135deg, #00d2ff 0%, #0078ff 50%, #a06dee 100%)',
  borderRadius: '12px', padding: '28px 24px', marginBottom: '28px', textAlign: 'center' as const,
}
const waveEmoji = { fontSize: '40px', margin: '0 0 10px', textAlign: 'center' as const }
const bannerHeadline = {
  color: '#ffffff', fontSize: '26px', fontWeight: 'bold', margin: '0 0 8px', textAlign: 'center' as const,
}
const bannerSubtitle = {
  color: 'rgba(255,255,255,0.9)', fontSize: '14px', lineHeight: '22px', margin: '0', textAlign: 'center' as const,
}
const text = { color: '#4b5563', fontSize: '15px', lineHeight: '24px', margin: '0 0 16px' }
const stepsBox = {
  backgroundColor: '#f9fafb', borderRadius: '10px', padding: '20px 24px',
  margin: '20px 0', border: '1px solid #e5e7eb',
}
const stepsLabel = {
  color: '#6b7280', fontSize: '11px', fontWeight: 'bold',
  textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 12px',
}
const stepItem = { color: '#374151', fontSize: '14px', lineHeight: '24px', margin: '0 0 6px' }
const ctaSection = { textAlign: 'center' as const, margin: '24px 0' }
const ctaButton = {
  background: 'linear-gradient(135deg, #00d2ff 0%, #0078ff 50%, #a06dee 100%)',
  color: '#ffffff', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none',
  padding: '12px 28px', borderRadius: '8px', display: 'inline-block',
}
const whatsappSection = {
  backgroundColor: '#dcfce7', borderRadius: '10px', padding: '20px 24px',
  margin: '20px 0', border: '1px solid #bbf7d0',
}
const whatsappHeadline = {
  color: '#166534', fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px', textAlign: 'center' as const,
}
const whatsappText = { color: '#166534', fontSize: '13px', lineHeight: '22px', margin: '0', textAlign: 'center' as const }
const whatsappLink = { color: '#15803d', fontWeight: 'bold', textDecoration: 'underline' }
const footerSection = { borderTop: '1px solid #e5e7eb', paddingTop: '24px', marginTop: '32px' }
const footerText = { color: '#9ca3af', fontSize: '12px', textAlign: 'center' as const, margin: '0' }
