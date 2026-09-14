import * as React from 'npm:react@18.3.1'
import {
  Body,
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

interface Piece {
  name?: string
  size?: string
  filament?: string
  quantity?: number
}

interface Props {
  partnerOrderId?: string
  pieces?: Piece[]
  pieceCount?: number
  printingCost?: number | string
  deliveryCost?: number | string
  total?: number | string
  customerEmail?: string
  groupId?: string
  placedAt?: string
}

const money = (v: number | string | undefined) => {
  const n = Number(v)
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : '—'
}

const Email = ({
  partnerOrderId,
  pieces = [],
  pieceCount,
  printingCost,
  deliveryCost,
  total,
  customerEmail,
  groupId,
  placedAt,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      {`Manufacturing charged ${money(total)} — partner order ${partnerOrderId ?? 'pending'}`}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Sent to manufacturing</Heading>
        <Text style={lead}>
          A print order was submitted to the US production partner and the card on file
          was charged at processing.
        </Text>

        <Section style={box}>
          <Text style={row}>Partner order: <strong>{partnerOrderId ?? '—'}</strong></Text>
          <Text style={row}>Pieces: <strong>{pieceCount ?? pieces.length ?? '—'}</strong></Text>
          <Text style={row}>Printing: <strong>{money(printingCost)}</strong></Text>
          <Text style={row}>Delivery: <strong>{money(deliveryCost)}</strong></Text>
          <Text style={totalRow}>Charged: <strong>{money(total)}</strong></Text>
        </Section>

        {pieces.length > 0 && (
          <Section>
            <Text style={label}>Pieces in this batch</Text>
            {pieces.map((p, i) => (
              <Text key={i} style={row}>
                {[p.name, p.size, p.filament, p.quantity ? `x${p.quantity}` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            ))}
          </Section>
        )}

        <Hr style={hr} />
        <Text style={meta}>
          {customerEmail ? `Buyer: ${customerEmail}` : 'Buyer: —'}
          {groupId ? ` · Group: ${groupId}` : ''}
          {placedAt ? ` · ${placedAt}` : ''}
        </Text>
        <Text style={meta}>Full history lives in Originals Ops in the admin panel.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Manufacturing charged ${money(data?.total)} — ${data?.pieceCount ?? data?.pieces?.length ?? 0} piece(s)`,
  displayName: 'Manufacturing order placed',
  to: 'contact@nyzora.ai',
  previewData: {
    partnerOrderId: 'SLANT_1788296956668',
    pieceCount: 2,
    pieces: [
      { name: 'MILO / 2012–2024', size: 'Standard', filament: 'PLA BLACK', quantity: 1 },
      { name: 'KIWI', size: 'Petite', filament: 'PLA GREY', quantity: 1 },
    ],
    printingCost: 32.4,
    deliveryCost: 6.6,
    total: 39,
    customerEmail: 'buyer@example.com',
    groupId: 'a1b2c3d4',
    placedAt: '14 Sep 2026, 20:15 UTC',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { padding: '28px 24px', maxWidth: '560px' }
const h1 = { fontSize: '20px', letterSpacing: '-0.01em', margin: '0 0 8px', color: '#111111' }
const lead = { fontSize: '14px', lineHeight: '22px', color: '#444444', margin: '0 0 16px' }
const box = { border: '1px solid #e5e5e5', padding: '14px 16px', margin: '0 0 16px' }
const row = { fontSize: '13px', lineHeight: '20px', color: '#333333', margin: '0 0 4px' }
const totalRow = { ...row, fontSize: '15px', color: '#111111', marginTop: '8px' }
const label = {
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: '#888888',
  margin: '0 0 6px',
}
const hr = { borderColor: '#e5e5e5', margin: '20px 0' }
const meta = { fontSize: '12px', lineHeight: '18px', color: '#777777', margin: '0 0 4px' }
