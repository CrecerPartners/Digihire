/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Link, Preview, Section, Text, Img,
} from 'npm:@react-email/components@0.0.22'

interface RequestCvEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  name?: string
  jobTitle: string
  company: string
  deadline: string
}

export const RequestCvEmail = ({
  siteName, siteUrl, name, jobTitle, company, deadline,
}: RequestCvEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Action needed: upload your CV for {jobTitle} at {company}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img
            src="https://yaojxewpkrjonrvqpsxi.supabase.co/storage/v1/object/public/logos/logo.png"
            width="140" height="auto" alt="Digihire Logo"
          />
        </Section>

        <Section style={alertBadge}>
          <Text style={alertIcon}>📄</Text>
        </Section>

        <Heading style={h1}>We need your CV</Heading>

        <Text style={text}>Hi {name || 'there'},</Text>
        <Text style={text}>
          Thanks for applying for <strong>{jobTitle}</strong> at <strong>{company}</strong>. The
          hiring team would like to review your CV / resume, but we don't have one on file for this
          application yet.
        </Text>

        <Section style={detailsBox}>
          <Text style={detailsLabel}>What to do</Text>
          <Text style={detailsItem}>Log in to your Digihire talent portal and upload your CV to this application.</Text>
          <Text style={detailsItem}><strong>Deadline:</strong> {deadline}</Text>
        </Section>

        <Text style={text}>
          Applications without a CV on file by the deadline may not be considered, so please upload
          yours as soon as possible.
        </Text>

        <Section style={ctaSection}>
          <Link style={ctaButton} href={`${siteUrl}/login`}>
            Upload My CV
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

export default RequestCvEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}
const container = {
  backgroundColor: '#ffffff', margin: '40px auto', padding: '40px 48px',
  borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', maxWidth: '560px',
}
const header = { marginBottom: '24px' }
const alertBadge = { textAlign: 'center' as const, marginBottom: '4px' }
const alertIcon = { fontSize: '44px', textAlign: 'center' as const, margin: '0' }
const h1 = { color: '#111827', fontSize: '26px', fontWeight: 'bold', textAlign: 'center' as const, margin: '0 0 20px' }
const text = { color: '#4b5563', fontSize: '15px', lineHeight: '24px', margin: '0 0 16px' }
const detailsBox = {
  backgroundColor: '#fff7ed', borderRadius: '10px', padding: '20px 24px',
  margin: '20px 0', border: '1px solid #fed7aa',
}
const detailsLabel = {
  color: '#9a3412', fontSize: '11px', fontWeight: 'bold',
  textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 12px',
}
const detailsItem = { color: '#7c2d12', fontSize: '14px', lineHeight: '20px', margin: '0 0 8px' }
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
