import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Hr, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Item { orderId: string; customerEmail?: string | null; product?: string | null; days: number; problem: string; partnerOrderId?: string | null }
interface Props { items?: Item[]; date?: string }

/** Internal daily digest: paid pieces that have not moved on schedule. */
const Email = ({ items = [], date }: Props) => (
  <Html>
    <Head />
    <Preview>{`${items.length} paid order(s) need attention`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>Nyzora — daily order check {date ?? ''}</Text>
        <Heading style={h1}>{items.length} order{items.length === 1 ? '' : 's'} off schedule</Heading>
        <Text style={body}>These paid pieces have not moved the way they should. Customers were promised delivery in 7–8 business days.</Text>
        {items.map((i) => (
          <React.Fragment key={i.orderId}>
            <Hr style={hr} />
            <Text style={row}><strong>{i.orderId.slice(0, 8)}</strong> · {i.product ?? 'Piece'} · {i.days} day{i.days === 1 ? '' : 's'} since order</Text>
            <Text style={row}>{i.customerEmail ?? '—'}{i.partnerOrderId ? ` · ${i.partnerOrderId}` : ''}</Text>
            <Text style={problem}>{i.problem}</Text>
          </React.Fragment>
        ))}
        <Hr style={hr} />
        <Text style={muted}>Open Everything in the admin panel to act. Nothing has been sent, cancelled or charged automatically.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Daily order check — ${(d?.items ?? []).length} need attention`,
  displayName: 'Daily order check (internal alert)',
  to: 'contact@nyzora.ai',
  previewData: {
    date: '2026-10-07',
    items: [{ orderId: 'bf67864f-cd56-4838-b15e-c1edc851a427', customerEmail: 'buyer@example.com', product: 'Pet Memorial Sculpture — Standard', days: 6, problem: 'Manufacturer cancelled this paid piece and it has not been re-placed.', partnerOrderId: 'SLANT_1790860493759' }],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '24px' }
const eyebrow = { fontSize: '11px', letterSpacing: '.25em', textTransform: 'uppercase' as const, color: '#888888' }
const h1 = { fontSize: '22px', fontWeight: 600, margin: '8px 0 16px', color: '#111111' }
const body = { lineHeight: '1.6', color: '#444444', fontSize: '15px' }
const row = { fontSize: '14px', color: '#333333', margin: '0 0 4px' }
const problem = { fontSize: '13px', color: '#7a5b00', background: '#fdf8ec', border: '1px solid #efe3c0', borderRadius: '4px', padding: '10px', margin: '6px 0 0' }
const hr = { borderColor: '#eeeeee', margin: '16px 0' }
const muted = { fontSize: '12px', color: '#999999' }
