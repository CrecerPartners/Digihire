/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Img,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  token: string
  userModule?: string
  userService?: string
}

const MODULE_COPY: Record<string, { title: string; body: string; next: string }> = {
  talent_pool: {
    title: 'Welcome to the Digihire Talent Pool',
    body: "You've taken the first step toward getting discovered by leading brands. Verify your email to complete your profile and start receiving opportunities.",
    next: 'Once verified, complete your profile and upload your CV so brands can find you.',
  },
  voltsquad: {
    title: "You're in — VoltSquad awaits",
    body: 'Your VoltSquad journey starts now. Verify your email to access active brand campaigns, start selling, and earn commissions.',
    next: 'After verification, browse open campaigns and join the ones that match your goals.',
  },
  gigs: {
    title: 'Your Gigs application was received',
    body: "We received your application for short-term gig roles — merchandising, field marketing, in-store promotions, and more. Verify your email to complete your sign-up.",
    next: "Our team will match you with available roles that fit your location and skills.",
  },
  events: {
    title: "You're registered — events details coming soon",
    body: 'Thanks for signing up for Digihire events. Verify your email to confirm your registration.',
    next: "You'll receive details about upcoming events, brand activations, and networking sessions.",
  },
}

const SERVICE_COPY: Record<string, { title: string; body: string; next: string }> = {
  voltsquad: {
    title: 'Your VoltSquad campaign request was received',
    body: "We've received your request to launch a campaign on VoltSquad. Verify your email to complete your brand account setup.",
    next: 'Our team will be in touch within 48 hours to activate your campaign.',
  },
  'recruitment-fulltime': {
    title: 'Your full-time hiring request was received',
    body: "Thanks for reaching out about hiring full-time sales talent. Verify your email to access your brand dashboard.",
    next: 'Our recruitment team will review your requirements and reach out shortly.',
  },
  'recruitment-parttime': {
    title: 'Your part-time / contract hiring request was received',
    body: "Thanks for signing up to hire part-time or contract sales talent. Verify your email to complete your account.",
    next: 'Our team will match you with available talent that fits your requirements.',
  },
  merchandisers: {
    title: 'Your request for field staff was received',
    body: "We've received your request for merchandisers and short-term field staff. Verify your email to complete your brand account.",
    next: 'Our staffing team will be in touch to confirm availability and deployment details.',
  },
  activations: {
    title: 'Your activation request was received',
    body: 'Thanks for signing up for field marketing and activations. Verify your email to access your brand dashboard.',
    next: 'Our activations team will reach out to discuss your brief and timeline.',
  },
  recruitment: {
    title: 'Your hiring request was received',
    body: "We've received your request to hire sales professionals. Verify your email to complete your account.",
    next: 'Our recruitment team will review your requirements and reach out shortly.',
  },
}

const DEFAULT_COPY = {
  title: 'Welcome to Digihire',
  body: "We're excited to have you on board. Verify your email to complete your account setup and get started.",
  next: 'Once verified, you can access your dashboard and explore everything Digihire has to offer.',
}

function getCopy(userModule?: string, userService?: string) {
  if (userModule && MODULE_COPY[userModule]) return MODULE_COPY[userModule]
  if (userService && SERVICE_COPY[userService]) return SERVICE_COPY[userService]
  return DEFAULT_COPY
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  token,
  userModule,
  userService,
}: SignupEmailProps) => {
  const copy = getCopy(userModule, userService)
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your Digihire verification code: {token}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src="https://yaojxewpkrjonrvqpsxi.supabase.co/storage/v1/object/public/logos/logo.png"
              width="140"
              height="auto"
              alt="Digihire Logo"
            />
          </Section>

          <Heading style={h1}>{copy.title}</Heading>

          <Text style={text}>{copy.body}</Text>

          <Section style={codeBlock}>
            <Text style={codeTitle}>Your Verification Code</Text>
            <Text style={codeValue}>{token}</Text>
          </Section>

          <Text style={text}>
            Copy and paste this code into the verification screen to confirm your email and complete your sign-up.
          </Text>

          <Text style={nextSteps}>{copy.next}</Text>

          <Text style={footerNote}>
            This code will expire in 10 minutes. If you didn't request this email, you can safely ignore it.
          </Text>

          <Section style={footerSection}>
            <Text style={footerText}>
              © 2026 Digihire. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default SignupEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '40px 48px',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  maxWidth: '560px',
}

const header = {
  marginBottom: '32px',
}

const h1 = {
  color: '#111827',
  fontSize: '28px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0 0 24px',
}

const text = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
}

const codeBlock = {
  backgroundColor: '#00d2ff',
  background: 'linear-gradient(135deg, #00d2ff 0%, #0078ff 50%, #a06dee 100%)',
  borderRadius: '12px',
  padding: '32px 20px',
  margin: '24px 0',
}

const codeTitle = {
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '14px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 12px',
}

const codeValue = {
  color: '#ffffff',
  fontSize: '42px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  letterSpacing: '8px',
  margin: '0',
}

const nextSteps = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '22px',
  textAlign: 'center' as const,
  margin: '0 0 20px',
  fontStyle: 'italic' as const,
}

const footerNote = {
  color: '#9ca3af',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '24px 0 0',
}

const footerSection = {
  borderTop: '1px solid #e5e7eb',
  paddingTop: '24px',
  marginTop: '32px',
}

const footerText = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '0',
}
