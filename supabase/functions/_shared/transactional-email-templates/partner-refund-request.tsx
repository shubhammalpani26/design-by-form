import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Hr, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  cancelledOrderId?: string
  replacementOrderId?: string
  chargedTotal?: string
  printingCost?: string
  deliveryCost?: string
  placedAt?: string
  cancelledAt?: string
  requesterEmail?: string
}

const Email = ({
  cancelledOrderId = 'SLANT_1788296455408',
  replacementOrderId = 'SLANT_1788296956668',
  chargedTotal = '$113.97',
  printingCost = '$108.04',
  deliveryCost = '$5.93',
  placedAt = '2026-09-01 21:00 UTC',
  cancelledAt = '2026-09-01 21:08 UTC',
  requesterEmail = 'shubham.malpani@cyanique.com',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Refund request for cancelled order {cancelledOrderId} ({chargedTotal})</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Refund request — cancelled order {cancelledOrderId}</Heading>
        <Text style={text}>Hi Slant 3D support,</Text>
        <Text style={text}>
          We are an API partner (owner ID: <strong>nyzora-originals</strong>). An order placed through
          the v2 API was cancelled within minutes of being processed, and we'd like written confirmation
          of the refund.
        </Text>
        <Text style={text}><strong>Order details</strong></Text>
        <Text style={text}>
          • Order ID: {cancelledOrderId}
          <br />
          • Placed / processed via API: {placedAt} (billed at processing)
          <br />
          • Charged: {chargedTotal} total ({printingCost} printing + {deliveryCost} delivery)
          <br />
          • Cancelled via API (DELETE /orders/{cancelledOrderId}): {cancelledAt}
          <br />
          • Status at cancellation: no printer assigned, production had not started
          <br />
          • Reason for cancellation: the order was submitted with a single filament due to a bug on our
          side; it was immediately re-placed as {replacementOrderId} with the correct per-item filaments.
        </Text>
        <Text style={text}>
          <strong>Our request</strong>
          <br />
          1. Please confirm the {chargedTotal} charge for {cancelledOrderId} will be refunded in full.
          <br />
          2. Please confirm the expected timeline and method for the refund (original payment method vs
          account credit).
          <br />
          3. If a refund requires any action on our side, please let us know exactly what is needed.
        </Text>
        <Text style={text}>
          The replacement order {replacementOrderId} should remain in production and is unaffected by
          this request.
        </Text>
        <Hr style={hr} />
        <Text style={muted}>
          Shubham Malpani — Nyzora
          <br />
          Reply to: {requesterEmail}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Refund request — cancelled order SLANT_1788296455408 ($113.97)',
  displayName: 'Partner refund request',
  to: 'support@slant3d.com',
  previewData: {},
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '20px', fontWeight: '600' as const }
const text = { fontSize: '14px', lineHeight: '22px', color: '#111111' }
const muted = { fontSize: '12px', lineHeight: '18px', color: '#666666' }
const hr = { margin: '20px 0' }
