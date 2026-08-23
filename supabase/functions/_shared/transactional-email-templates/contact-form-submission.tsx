import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  email?: string
  subject?: string
  message?: string
  source?: string
}

/** Internal alert: someone reached out through the site contact form. */
const Email = ({ name, email, subject, message, source }: Props) => (
  <Html>
    <Head />
    <Preview>{`New enquiry from ${name ?? 'a visitor'} — ${subject ?? ''}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>Nyzora — {source ?? 'contact form'}</Text>
        <Heading style={h1}>{subject ?? 'New enquiry'}</Heading>
        <Text style={row}><strong>From</strong> {name ?? '—'}</Text>
        <Text style={row}><strong>Email</strong> {email ?? '—'}</Text>
        <Hr style={hr} />
        <Text style={messageBox}>{message ?? ''}</Text>
        <Hr style={hr} />
        <Text style={muted}>Reply directly to {email ?? 'the sender'}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `New enquiry — ${d?.subject ?? 'Contact form'}`,
  displayName: 'Contact form submission (internal)',
  to: 'contact@nyzora.ai',
  previewData: {
    name: 'Aisha Rao',
    email: 'aisha@example.com',
    subject: 'Bulk order for a hotel lobby',
    message: 'Hi — we are furnishing a boutique hotel and want 12 matching pieces.',
    source: 'contact form',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { maxWidth: '520px', margin: '0 auto', padding: '24px' }
const eyebrow = { fontSize: '11px', letterSpacing: '.25em', textTransform: 'uppercase' as const, color: '#888888' }
const h1 = { fontSize: '22px', fontWeight: 600, margin: '8px 0 16px', color: '#111111' }
const row = { fontSize: '14px', color: '#333333', margin: '0 0 6px' }
const hr = { borderColor: '#eeeeee', margin: '20px 0' }
const messageBox = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#333333',
  whiteSpace: 'pre-wrap' as const,
}
const muted = { fontSize: '12px', color: '#999999' }
