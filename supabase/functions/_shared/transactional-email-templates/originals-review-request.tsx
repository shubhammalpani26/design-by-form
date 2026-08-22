import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  orderId?: string
  productName?: string
  sizeLabel?: string
}

const clean = (v: unknown, max = 120) => {
  if (typeof v !== 'string') return ''
  const stripped = v
    .replace(/<[^>]*>/g, ' ')
    .replace(/[<>]/g, ' ')
    .replace(/&(?:[a-z]+|#\d+);/gi, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
  if (!/[\p{L}\p{N}]/u.test(stripped)) return ''
  return stripped.slice(0, max).trim()
}

export const reviewSubject = (data: Record<string, any> = {}) => {
  const name = clean(data?.productName, 60)
  return name ? `How did your ${name} turn out?` : 'How did your Nyzora piece turn out?'
}

const Email = (props: Props) => {
  const name = clean(props.productName, 80) || 'your Nyzora piece'
  const size = clean(props.sizeLabel, 60)
  const orderId = clean(props.orderId, 64)
  const reviewUrl = `https://nyzora.ai/reviews${orderId ? `?order=${encodeURIComponent(orderId)}` : ''}`

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Would you share a photo of it in your home?</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>NYZORA</Text>
          <Heading style={h1}>How did it turn out?</Heading>

          <Text style={body}>
            {name}
            {size ? ` (${size})` : ''} was delivered. Every piece we make is one of one, so
            the only way anyone else sees what they actually look like is if you show them.
          </Text>

          <Text style={body}>
            If you have a minute, leave a short review — and if you can, add a photo or a
            short video of it on your shelf. It takes about 60 seconds and it genuinely
            helps the next person decide.
          </Text>

          <Section style={{ margin: '20px 0' }}>
            <Button href={reviewUrl} style={button}>
              Share your review
            </Button>
          </Section>

          <Hr style={hr} />
          {orderId ? <Text style={muted}>Order ID: {orderId}</Text> : null}
          <Text style={muted}>
            Not happy with it? Reply-worthy problems get fixed — email contact@nyzora.ai
            with your order ID and a photo, and we'll remake it.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: reviewSubject,
  displayName: 'Originals review request',
  previewData: {
    orderId: '8f2c1a90-1111-2222-3333-444455556666',
    productName: 'Pet Memorial Sculpture',
    sizeLabel: 'Petite — 120 mm',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { maxWidth: '520px', margin: '0 auto', padding: '24px' }
const eyebrow = { fontSize: '11px', letterSpacing: '.25em', textTransform: 'uppercase' as const, color: '#888888' }
const h1 = { fontSize: '24px', fontWeight: 600, margin: '8px 0 16px', color: '#111111' }
const body = { lineHeight: '1.6', color: '#444444', fontSize: '15px' }
const button = {
  backgroundColor: '#111111',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 600,
  padding: '12px 20px',
  borderRadius: '4px',
  textDecoration: 'none',
  display: 'inline-block',
}
const hr = { borderColor: '#eeeeee', margin: '24px 0' }
const muted = { fontSize: '12px', color: '#999999' }
