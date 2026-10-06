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
  partnerOrderId?: string
  productName?: string
  customerEmail?: string
  amountUsd?: number | string
  status?: string
  event?: string
  message?: string
}

/**
 * Internal alert. The manufacturing partner has told us (webhook or tracking
 * sync) that a piece was cancelled or failed on their side. The buyer still
 * sees their paid order as confirmed, so someone has to act immediately.
 */
const Email = ({
  orderId,
  groupId,
  partnerOrderId,
  productName,
  customerEmail,
  amountUsd,
  status,
  event,
  message,
}: Props) => (
  <Html>
    <Head />
    <Preview>
      Partner reported a paid piece as {status ?? 'cancelled'} — order {String(orderId ?? '').slice(0, 8)}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>Nyzora — internal alert</Text>
        <Heading style={h1}>
          {status === 'failed' ? 'Manufacturing failed' : 'Manufacturing cancelled'}
        </Heading>
        <Text style={body}>
          The manufacturing partner reported this paid piece as &ldquo;
          {status ?? 'cancelled'}&rdquo;. The buyer still sees their order as
          confirmed, so nothing is being made unless we act. Do not reply to the
          buyer or refund until you have confirmed what happened with the partner.
        </Text>
        <Hr style={hr} />
        <Text style={row}><strong>Order</strong> {orderId ?? '—'}</Text>
        {groupId ? <Text style={row}><strong>Group</strong> {groupId}</Text> : null}
        <Text style={row}><strong>Partner order</strong> {partnerOrderId ?? '—'}</Text>
        <Text style={row}><strong>Piece</strong> {productName ?? '—'}</Text>
        <Text style={row}><strong>Customer</strong> {customerEmail ?? '—'}</Text>
        <Text style={row}><strong>Order value</strong> ${amountUsd ?? '—'}</Text>
        {event ? <Text style={row}><strong>Partner event</strong> {event}</Text> : null}
        <Hr style={hr} />
        <Text style={messageBox}>{message ?? 'No reason was given by the partner.'}</Text>
        <Text style={muted}>
          Open Originals Ops in the admin panel for the full timeline, then ask the
          partner why and whether the piece can be restarted or replaced.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Partner reported order ${String(d?.orderId ?? '').slice(0, 8)} as ${String(
      d?.status ?? 'cancelled',
    )}`,
  displayName: 'Partner cancelled/failed order (internal alert)',
  to: 'contact@nyzora.ai',
  previewData: {
    orderId: 'bf67864f-cd56-4838-b15e-c1edc851a427',
    partnerOrderId: 'SLANT_1790860493759',
    productName: 'Pet Memorial Sculpture — Standard (140 mm)',
    customerEmail: 'buyer@example.com',
    amountUsd: 89,
    status: 'cancelled',
    event: 'order.cancelled',
    message: 'No reason was given by the partner.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { maxWidth: '520px', margin: '0 auto', padding: '24px' }
const eyebrow = { fontSize: '11px', letterSpacing: '.25em', textTransform: 'uppercase' as const, color: '#888888' }
const h1 = { fontSize: '22px', fontWeight: 600, margin: '8px 0 16px', color: '#111111' }
const body = { lineHeight: '1.6', color: '#444444', fontSize: '15px' }
const row = { fontSize: '14px', color: '#333333', margin: '0 0 6px' }
const hr = { borderColor: '#eeeeee', margin: '20px 0' }
const messageBox = {
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
