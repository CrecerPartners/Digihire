/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Link, Preview, Section, Text, Img,
} from 'npm:@react-email/components@0.0.22'

interface JobApplicationEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  name?: string
  jobTitle: string
  company: string
  appliedAt?: string
}

export const JobApplicationEmail = ({
  siteName, siteUrl, name, jobTitle, company, appliedAt,
}: JobApplicationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Application submitted for {jobTitle} at {company}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img
            src="https://yaojxewpkrjonrvqpsxi.supabase.co/storage/v1/object/public/logos/logo.png"
            width="140" height="auto" alt="Digihire Logo"
          />
        </Section>

        <Section style={confirmBadge}>
          <Text style={confirmIcon}>✓</Text>
        </Section>

        <Heading style={h1}>Application Received</Heading>

        <Text style={text}>Hi {name || 'there'},</Text>
        <Text style={text}>
          Your application for <strong>{jobTitle}</strong> at <strong>{company}</strong> has been
          successfully submitted. The hiring team will review it and reach out if there's a match.
        </Text>

        <Section style={detailsBox}>
          <Text style={detailsLabel}>Application Summary</Text>
          <Text style={detailsItem}><strong>Role:</strong> {jobTitle}</Text>
          <Text style={detailsItem}><strong>Company:</strong> {company}</Text>
          {appliedAt && <Text style={detailsItem}><strong>Submitted:</strong> {appliedAt}</Text>}
        </Section>

        <Text style={text}>
          While you wait, make sure your profile is 100% complete to improve your chances of
          being shortlisted by brands.
        </Text>

        <Section style={ctaSection}>
          <Link style={ctaButton} href={`${siteUrl}/talent/jobs`}>
            View My Applications
          </Link>
        </Section>

        <Section style={whatsappSection}>
          <Text style={whatsappHeadline}>Stay ahead of new opportunities</Text>
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

export default JobApplicationEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}
const container = {
  backgroundColor: '#ffffff', margin: '40px auto', padding: '40px 48px',
  borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', maxWidth: '560px',
}
const header = { marginBottom: '24px' }
const confirmBadge = { textAlign: 'center' as const, marginBottom: '4px' }
const confirmIcon = { fontSize: '44px', color: '#10b981', textAlign: 'center' as const, margin: '0' }
const h1 = { color: '#111827', fontSize: '26px', fontWeight: 'bold', textAlign: 'center' as const, margin: '0 0 20px' }
const text = { color: '#4b5563', fontSize: '15px', lineHeight: '24px', margin: '0 0 16px' }
const detailsBox = {
  backgroundColor: '#f9fafb', borderRadius: '10px', padding: '20px 24px',
  margin: '20px 0', border: '1px solid #e5e7eb',
}
const detailsLabel = {
  color: '#6b7280', fontSize: '11px', fontWeight: 'bold',
  textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 12px',
}
const detailsItem = { color: '#374151', fontSize: '14px', lineHeight: '20px', margin: '0 0 8px' }
const ctaSection = { textAlign: 'center' as const, margin: '24px 0' }
const ctaButton = {
  background: 'linear-gradient(135deg, #00d2ff 0%, #0078ff 50%, #a06dee 100%)',
  color: '#ffffff', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none',
  padding: '12px 28px', borderRadius: '8px', display: 'inline-block',
}
const whatsappSection = {
  backgroundColor: '#dcfce7', borderRadius: '10px', padding: '18px 20px',
  margin: '20px 0', border: '1px solid #bbf7d0',
}
const whatsappHeadline = {
  color: '#166534', fontSize: '13px', fontWeight: 'bold',
  margin: '0 0 6px', textAlign: 'center' as const,
}
const whatsappText = { color: '#166534', fontSize: '13px', lineHeight: '22px', margin: '0', textAlign: 'center' as const }
const whatsappLink = { color: '#15803d', fontWeight: 'bold', textDecoration: 'underline' }
const footerSection = { borderTop: '1px solid #e5e7eb', paddingTop: '24px', marginTop: '32px' }
const footerText = { color: '#9ca3af', fontSize: '12px', textAlign: 'center' as const, margin: '0' }
