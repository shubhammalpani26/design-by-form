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

interface Item {
  productName?: string
  sizeLabel?: string
  amountUsd?: number | string
  previewImageUrl?: string
  quantity?: number | string
}

interface Props extends Item {
  orderId?: string
  /** Optional multi-item order. When absent, the top-level single-item props are used. */
  items?: Item[]
  /** Optional order total. Falls back to the sum of item amounts. */
  totalUsd?: number | string
}

const isHttp = (u?: string) => typeof u === 'string' && /^https?:\/\//i.test(u)

const money = (v: number | string | undefined) => {
  const n = typeof v === 'string' ? Number(v) : v
  if (n === undefined || n === null || Number.isNaN(n)) return ''
  return `$${n.toFixed(2).replace(/\.00$/, '')}`
}

const clean = (v: unknown, max = 120) =>
  typeof v === 'string' ? v.replace(/[\r\n]+/g, ' ').trim().slice(0, max) : ''

const MAX_ITEMS = 20
const FALLBACK_NAME = 'Your Nyzora piece'

export const normalizeItems = (props: Props): Item[] => {
  const list = Array.isArray(props.items) ? props.items.filter(Boolean) : []
  if (list.length) return list.slice(0, MAX_ITEMS)
  if (props.productName || props.sizeLabel || props.amountUsd || props.previewImageUrl) {
    return [
      {
        productName: props.productName,
        sizeLabel: props.sizeLabel,
        amountUsd: props.amountUsd,
        previewImageUrl: props.previewImageUrl,
        quantity: props.quantity,
      },
    ]
  }
  return [{ productName: FALLBACK_NAME }]
}

const itemTotal = (items: Item[]) =>
  items.reduce((sum, i) => {
    const amount = typeof i.amountUsd === 'string' ? Number(i.amountUsd) : i.amountUsd
    const qty = Number(i.quantity ?? 1)
    if (!amount || Number.isNaN(amount)) return sum
    return sum + amount * (Number.isNaN(qty) || qty < 1 ? 1 : qty)
  }, 0)

export const orderSubject = (data: Record<string, any> = {}) => {
  const items = normalizeItems(data as Props)
  const count = items.reduce((n, i) => n + Math.max(1, Number(i.quantity ?? 1) || 1), 0)
  if (count > 1) return `Your Nyzora order is confirmed — ${count} pieces`
  const name = clean(items[0]?.productName, 60)
  if (!name || name === FALLBACK_NAME) return 'Your Nyzora piece is confirmed'
  return `Your Nyzora ${name} is confirmed`
}

const ItemRow = ({ item, showImage }: { item: Item; showImage: boolean }) => {
  const name = clean(item.productName, 80) || 'Your Nyzora piece'
  const size = clean(item.sizeLabel, 60)
  const qty = Math.max(1, Number(item.quantity ?? 1) || 1)
  const price = money(item.amountUsd)
  return (
    <Section style={itemBox}>
      {showImage && isHttp(item.previewImageUrl) ? (
        <Img src={item.previewImageUrl} alt={name} style={hero} />
      ) : null}
      <Text style={itemTitle}>
        {name}
        {qty > 1 ? ` × ${qty}` : ''}
      </Text>
      {size ? <Text style={itemMeta}>{size}</Text> : null}
      {price ? <Text style={itemMeta}>{price}</Text> : null}
    </Section>
  )
}

const Email = (props: Props) => {
  const items = normalizeItems(props)
  const hidden = Array.isArray(props.items)
    ? Math.max(0, props.items.filter(Boolean).length - MAX_ITEMS)
    : 0
  const multi = items.length > 1
  const total = money(
    props.totalUsd ?? (hidden > 0 ? undefined : itemTotal(items) || undefined),
  )
  const orderId = clean(props.orderId, 64)

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {multi
          ? "Your order is confirmed — we're making your pieces now."
          : "Your piece is confirmed — we're making it now."}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>NYZORA</Text>
          <Heading style={h1}>
            {multi ? 'Your order is confirmed' : 'Your piece is confirmed'}
          </Heading>

          {items.map((item, i) => (
            <ItemRow key={i} item={item} showImage />
          ))}

          {hidden > 0 ? (
            <Text style={itemMeta}>+ {hidden} more item{hidden > 1 ? 's' : ''} in this order</Text>
          ) : null}

          {multi && total ? <Text style={totalLine}>Order total: {total}</Text> : null}

          <Section>
            <Text style={body}>
              We're making {multi ? 'them' : 'it'} now in our US workshop.{' '}
              {multi ? 'They ship' : 'It ships'} in 3–5 business days and you'll get
              tracking by email. If {multi ? "anything isn't" : "it isn't"} right, we
              remake it or refund you within 30 days.
            </Text>
          </Section>

          <Hr style={hr} />
          {orderId ? <Text style={muted}>Order ID: {orderId}</Text> : null}
          <Text style={muted}>
            Questions? Email us at contact@nyzora.ai and we'll help.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: orderSubject,
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
const itemBox = { borderTop: '1px solid #eeeeee', paddingTop: '16px', marginBottom: '8px' }
const itemTitle = { fontSize: '16px', fontWeight: 600, color: '#111111', margin: '0 0 4px' }
const itemMeta = { fontSize: '14px', color: '#666666', margin: '0 0 2px' }
const totalLine = { fontSize: '15px', fontWeight: 600, color: '#111111', borderTop: '1px solid #eeeeee', paddingTop: '12px' }
