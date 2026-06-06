/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Link, Preview, Section, Text, Img,
} from 'npm:@react-email/components@0.0.22'

interface ProfileCompleteEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  name?: string
}

export const ProfileCompleteEmail = ({
  siteName, siteUrl, name,
}: ProfileCompleteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Digihire profile is 100% complete — brands can now discover you</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img
            src="https://yaojxewpkrjonrvqpsxi.supabase.co/storage/v1/object/public/logos/logo.png"
            width="140" height="auto" alt="Digihire Logo"
          />
        </Section>

        <Section style={heroBanner}>
          <Text style={trophyIcon}>🏆</Text>
          <Text style={bannerHeadline}>Profile Complete!</Text>
          <Text style={bannerSubtitle}>You're now fully visible to hiring brands on Digihire</Text>
        </Section>

        <Text style={text}>Hi {name || 'there'},</Text>
        <Text style={text}>
          Congratulations — your Digihire profile is now <strong>100% complete</strong>. Brands
          hiring on the platform can now discover your profile and consider you for open roles.
        </Text>

        <Section style={highlightBox}>
          <Text style={highlightText}>
            You're now in the running for matching roles. Expect direct outreach from brands
            whose requirements align with your skills and experience.
          </Text>
        </Section>

        <Section style={ctaSection}>
          <Link style={ctaButton} href={`${siteUrl}/talent/jobs`}>
            Browse Open Roles
          </Link>
        </Section>

        <Section style={whatsappSection}>
          <Text style={whatsappHeadline}>Be first to hear about new opportunities</Text>
          <Text style={whatsappText}>
            Follow the{' '}
            <Link href="https://whatsapp.com/channel/0029VbDD4jyLNSaBGzovxp3R" style={whatsappLink}>
              DIGIHIRE Jobs &amp; Gigs WhatsApp channel
            </Link>
            {' '}to get regular updates on new jobs and gigs directly on WhatsApp.
          </Text>
        </Section>

        <Section style={footerSection}>
          <Text style={footerText}>© 2026 {siteName}. All rights reserved.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ProfileCompleteEmail

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
const trophyIcon = { fontSize: '44px', margin: '0 0 8px', textAlign: 'center' as const }
const bannerHeadline = {
  color: '#ffffff', fontSize: '26px', fontWeight: 'bold', margin: '0 0 6px', textAlign: 'center' as const,
}
const bannerSubtitle = {
  color: 'rgba(255,255,255,0.9)', fontSize: '14px', lineHeight: '22px', margin: '0', textAlign: 'center' as const,
}
const text = { color: '#4b5563', fontSize: '15px', lineHeight: '24px', margin: '0 0 16px' }
const highlightBox = {
  backgroundColor: '#f0fdf4', borderRadius: '10px', padding: '20px 24px',
  margin: '20px 0', border: '1px solid #bbf7d0',
}
const highlightText = {
  color: '#166534', fontSize: '14px', lineHeight: '22px', margin: '0', textAlign: 'center' as const,
}
const ctaSection = { textAlign: 'center' as const, margin: '24px 0' }
const ctaButton = {
  backgroundColor: '#0078ff', color: '#ffffff', fontSize: '14px', fontWeight: 'bold',
  textDecoration: 'none', padding: '12px 28px', borderRadius: '8px', display: 'inline-block',
}
const whatsappSection = {
  backgroundColor: '#dcfce7', borderRadius: '10px', padding: '18px 20px',
  margin: '20px 0', border: '1px solid #bbf7d0',
}
const whatsappHeadline = {
  color: '#166534', fontSize: '13px', fontWeight: 'bold', margin: '0 0 6px', textAlign: 'center' as const,
}
const whatsappText = { color: '#166534', fontSize: '13px', lineHeight: '22px', margin: '0', textAlign: 'center' as const }
const whatsappLink = { color: '#15803d', fontWeight: 'bold', textDecoration: 'underline' }
const footerSection = { borderTop: '1px solid #e5e7eb', paddingTop: '24px', marginTop: '32px' }
const footerText = { color: '#9ca3af', fontSize: '12px', textAlign: 'center' as const, margin: '0' }
