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
  carrier?: string
  trackingNumbers?: string[] | string
  itemCount?: number | string
}

/** Buyer/partner strings land in copy — strip anything markup-shaped. */
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

const MAX_NUMBERS = 5

export const normalizeTracking = (v: Props['trackingNumbers']): string[] => {
  const list = Array.isArray(v) ? v : typeof v === 'string' ? [v] : []
  return list
    .map((n) => clean(n, 40).replace(/[^A-Za-z0-9-]/g, ''))
    .filter(Boolean)
    .slice(0, MAX_NUMBERS)
}

/**
 * Detects the carrier from a tracking number's format and returns its
 * official tracking page. Slant 3D ships from Boise, ID — almost always USPS —
 * so we link the buyer to the carrier's own page, not a third-party aggregator.
 * 17track is only the fallback for numbers we can't identify.
 */
export const detectCarrier = (
  raw: string,
): { name: string; url: string } => {
  const n = clean(raw, 40).replace(/\s+/g, '').toUpperCase()
  if (!n) return { name: '', url: '' }

  // USPS: 22-digit numbers starting with 9, or 20-digit starting with 94/93.
  if (/^9\d{20,21}$/.test(n) || /^(94|93)\d{18,19}$/.test(n)) {
    return {
      name: 'USPS',
      url: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}`,
    }
  }
  // UPS: 1Z prefix or pure digits with check, often 18 chars.
  if (/^1Z[0-9A-Z]{16}$/.test(n) || /^1Z/i.test(n)) {
    return {
      name: 'UPS',
      url: `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}&loc=en_US`,
    }
  }
  // FedEx: 12, 15, 20, or 22 digit pure numbers.
  if (/^\d{12}$|^\d{15}$|^\d{20}$|^\d{22}$/.test(n)) {
    return {
      name: 'FedEx',
      url: `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
    }
  }
  // DHL Express: 10-digit number.
  if (/^\d{10}$/.test(n)) {
    return {
      name: 'DHL',
      url: `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(n)}`,
    }
  }
  return {
    name: '',
    url: `https://t.17track.net/en#nums=${encodeURIComponent(n)}`,
  }
}

/** Link for the primary CTA — official carrier page when known, else 17track. */
const trackUrl = (n: string) => detectCarrier(n).url

export const shippedSubject = (data: Record<string, any> = {}) => {
  const name = clean(data?.productName, 60)
  return name ? `Your Nyzora ${name} has shipped` : 'Your Nyzora order has shipped'
}

const Email = (props: Props) => {
  const numbers = normalizeTracking(props.trackingNumbers)
  // Prefer the carrier the partner gave us; otherwise infer it from the number.
  const passedCarrier = clean(props.carrier, 40)
  const detected = numbers.length ? detectCarrier(numbers[0]) : { name: '', url: '' }
  const carrier = passedCarrier || detected.name
  const name = clean(props.productName, 80) || 'Your Nyzora piece'
  const size = clean(props.sizeLabel, 60)
  const orderId = clean(props.orderId, 64)
  const orderUrl = `https://nyzora.ai/orders${orderId ? `?order=${encodeURIComponent(orderId)}` : ''}`

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>It's on its way — here's your tracking.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>NYZORA</Text>
          <Heading style={h1}>It's on its way</Heading>

          <Text style={body}>
            {name}
            {size ? ` (${size})` : ''} has left our US workshop and is with the carrier now.
          </Text>

          <Section style={box}>
            {carrier ? <Text style={metaLabel}>Carrier: {carrier}</Text> : null}
            {numbers.length ? (
              numbers.map((n) => (
                <Text key={n} style={metaLabel}>
                  Tracking number: <span style={mono}>{n}</span>
                </Text>
              ))
            ) : (
              <Text style={metaLabel}>
                Tracking is being assigned — it will appear on your order page shortly.
              </Text>
            )}
          </Section>

          {numbers.length ? (
            <Section style={{ margin: '20px 0' }}>
              <Button href={trackUrl(numbers[0])} style={button}>
                Track your shipment
              </Button>
              {numbers.slice(1).map((n) => (
                <Text key={n} style={muted}>
                  Also tracking {n}: {trackUrl(n)}
                </Text>
              ))}
            </Section>
          ) : null}

          <Text style={body}>
            Tracking can take up to 24 hours to show its first scan. You can always see
            live status on your order page: {orderUrl}
          </Text>

          <Hr style={hr} />
          {orderId ? <Text style={muted}>Order ID: {orderId}</Text> : null}
          <Text style={muted}>
            Something not right? Send a new email to contact@nyzora.ai with your order ID
            and we'll take care of it.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: shippedSubject,
  displayName: 'Originals order shipped',
  previewData: {
    orderId: '8f2c1a90-1111-2222-3333-444455556666',
    productName: 'Pet Memorial Sculpture',
    sizeLabel: 'Petite — 120 mm',
    carrier: 'USPS',
    trackingNumbers: ['9400111899223197428490'],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { maxWidth: '520px', margin: '0 auto', padding: '24px' }
const eyebrow = { fontSize: '11px', letterSpacing: '.25em', textTransform: 'uppercase' as const, color: '#888888' }
const h1 = { fontSize: '24px', fontWeight: 600, margin: '8px 0 16px', color: '#111111' }
const body = { lineHeight: '1.6', color: '#444444', fontSize: '15px' }
const box = { borderTop: '1px solid #eeeeee', borderBottom: '1px solid #eeeeee', padding: '14px 0' }
const metaLabel = { fontSize: '14px', color: '#333333', margin: '0 0 6px' }
const mono = { fontFamily: 'Courier, monospace', color: '#111111' }
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
