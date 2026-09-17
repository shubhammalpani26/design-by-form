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
  orderId?: string
  groupId?: string
  customerEmail?: string
  pieces?: number | string
  reason?: string
}

/**
 * Internal alert. The generator's printability report flagged a messy mesh,
 * so the order was parked in the review queue instead of going straight to
 * the print partner. Nothing is charged until someone approves it.
 */
const Email = ({ orderId, groupId, customerEmail, pieces, reason }: Props) => (
  <Html>
    <Head />
    <Preview>Order {String(orderId ?? '').slice(0, 8)} needs your eyes before manufacturing</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>Nyzora — internal alert</Text>
        <Heading style={h1}>Held for your review</Heading>
        <Text style={body}>
          An order&rsquo;s printability report flagged possible mesh issues, so it
          was paused instead of going to the manufacturing partner. Nothing has
          been sent or charged.
        </Text>
        <Hr style={hr} />
        <Text style={row}><strong>Order</strong> {orderId ?? '—'}</Text>
        {groupId ? <Text style={row}><strong>Group</strong> {groupId}</Text> : null}
        <Text style={row}><strong>Customer</strong> {customerEmail ?? '—'}</Text>
        <Text style={row}><strong>Pieces</strong> {pieces ?? '—'}</Text>
        <Hr style={hr} />
        <Text style={reasonBox}>{reason ?? 'Printability report flagged issues'}</Text>
        <Text style={muted}>
          Open Originals Ops in the admin panel, download the STL and check it in a
          viewer, then approve to send it to manufacturing.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Needs your review — order ${String(d?.orderId ?? '').slice(0, 8)}`,
  displayName: 'Order held for review (internal alert)',
  to: 'contact@nyzora.ai',
  previewData: {
    orderId: '4a2300dc-6655-4699-9036-784cd47716dd',
    customerEmail: 'buyer@example.com',
    pieces: 1,
    reason: 'Printability report flags 12 holes, 340 bad edges',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { maxWidth: '520px', margin: '0 auto', padding: '24px' }
const eyebrow = { fontSize: '11px', letterSpacing: '.25em', textTransform: 'uppercase' as const, color: '#888888' }
const h1 = { fontSize: '22px', fontWeight: 600, margin: '8px 0 16px', color: '#111111' }
const body = { lineHeight: '1.6', color: '#444444', fontSize: '15px' }
const row = { fontSize: '14px', color: '#333333', margin: '0 0 6px' }
const hr = { borderColor: '#eeeeee', margin: '20px 0' }
const reasonBox = {
  fontSize: '13px',
  lineHeight: '1.5',
  color: '#7a5b00',
  background: '#fdf8ec',
  border: '1px solid #efe3c0',
  borderRadius: '4px',
  padding: '12px',
  whiteSpace: 'pre-wrap' as const,
}
const muted = { fontSize: '12px', color: '#999999' }
