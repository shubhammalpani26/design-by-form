import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  orderId?: string
  sizeLabel?: string
  amountUsd?: number | string
  previewImageUrl?: string
  productName?: string
}

const Email = ({
  orderId = '',
  sizeLabel = '',
  amountUsd = '',
  previewImageUrl = '',
  productName = 'Your Nyzora piece',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your piece is confirmed — we're making it now.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>NYZORA</Text>
        <Heading style={h1}>Your piece is confirmed</Heading>
        {previewImageUrl ? (
          <Img src={previewImageUrl} alt={productName} style={hero} />
        ) : null}
        <Section>
          <Text style={body}>
            {productName}
            {sizeLabel ? ` — ${sizeLabel}` : ''}
            {amountUsd ? ` · $${amountUsd}` : ''}
          </Text>
          <Text style={body}>
            We're making it now in our US workshop. It ships in 3–5 business days and
            you'll get tracking by email. If it isn't right, we remake it or refund you
            within 30 days.
          </Text>
        </Section>
        <Hr style={hr} />
        <Text style={muted}>
          {orderId ? `Order ID: ${String(orderId)}` : ''}
        </Text>
        <Text style={muted}>Questions? Just reply to this email.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Your Nyzora piece is confirmed',
  displayName: 'Originals order confirmation',
  previewData: {
    orderId: '8f2c1a90-1111-2222-3333-444455556666',
    sizeLabel: 'Statement — 196 mm',
    amountUsd: 139,
    productName: 'Pet Sculpture Piece',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { maxWidth: '520px', margin: '0 auto', padding: '24px' }
const eyebrow = { fontSize: '11px', letterSpacing: '.25em', textTransform: 'uppercase' as const, color: '#888888' }
const h1 = { fontSize: '24px', fontWeight: 600, margin: '8px 0 16px', color: '#111111' }
const hero = { width: '100%', borderRadius: '4px', marginBottom: '16px' }
const body = { lineHeight: '1.6', color: '#444444', fontSize: '15px' }
const hr = { borderColor: '#eeeeee', margin: '24px 0' }
const muted = { fontSize: '12px', color: '#999999' }
