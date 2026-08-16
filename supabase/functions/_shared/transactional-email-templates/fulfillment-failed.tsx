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
  amountUsd?: number | string
  stage?: string
  error?: string
}

/**
 * Internal alert. A buyer has paid but the piece never reached the print
 * partner, so someone has to act before the customer notices the silence.
 */
const Email = ({ orderId, groupId, customerEmail, pieces, amountUsd, stage, error }: Props) => (
  <Html>
    <Head />
    <Preview>Fulfillment failed for order {String(orderId ?? '').slice(0, 8)}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>Nyzora — internal alert</Text>
        <Heading style={h1}>Fulfillment failed</Heading>
        <Text style={body}>
          A paid order did not reach the manufacturing partner. The buyer still sees
          &ldquo;order confirmed&rdquo;, so this needs a look before it turns into a delay.
        </Text>
        <Hr style={hr} />
        <Text style={row}><strong>Order</strong> {orderId ?? '—'}</Text>
        {groupId ? <Text style={row}><strong>Group</strong> {groupId}</Text> : null}
        <Text style={row}><strong>Customer</strong> {customerEmail ?? '—'}</Text>
        <Text style={row}><strong>Pieces</strong> {pieces ?? '—'}</Text>
        <Text style={row}><strong>Order value</strong> ${amountUsd ?? '—'}</Text>
        <Text style={row}><strong>Stage</strong> {stage ?? 'fulfillment'}</Text>
        <Hr style={hr} />
        <Text style={errorBox}>{error ?? 'Unknown error'}</Text>
        <Text style={muted}>
          Fix the cause, then re-run fulfillment for this order from the admin panel.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Fulfillment failed — order ${String(d?.orderId ?? '').slice(0, 8)}`,
  displayName: 'Fulfillment failed (internal alert)',
  to: 'contact@nyzora.ai',
  previewData: {
    orderId: '1857aa00-42bb-4f56-8f14-d561277229de',
    customerEmail: 'buyer@example.com',
    pieces: 1,
    amountUsd: 60,
    stage: 'partner order',
    error: 'US manufacturing partner request failed (500): Your card does not support this type of purchase.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { maxWidth: '520px', margin: '0 auto', padding: '24px' }
const eyebrow = { fontSize: '11px', letterSpacing: '.25em', textTransform: 'uppercase' as const, color: '#888888' }
const h1 = { fontSize: '22px', fontWeight: 600, margin: '8px 0 16px', color: '#111111' }
const body = { lineHeight: '1.6', color: '#444444', fontSize: '15px' }
const row = { fontSize: '14px', color: '#333333', margin: '0 0 6px' }
const hr = { borderColor: '#eeeeee', margin: '20px 0' }
const errorBox = {
  fontSize: '13px',
  lineHeight: '1.5',
  color: '#8a1c1c',
  background: '#fdf2f2',
  border: '1px solid #f3d6d6',
  borderRadius: '4px',
  padding: '12px',
  whiteSpace: 'pre-wrap' as const,
}
const muted = { fontSize: '12px', color: '#999999' }
