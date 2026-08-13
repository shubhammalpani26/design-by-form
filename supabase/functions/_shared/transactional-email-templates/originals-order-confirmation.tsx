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
  skuSlug?: string
}

interface Props extends Item {
  orderId?: string
  /** Optional multi-item order. When absent, the top-level single-item props are used. */
  items?: Item[]
  /** Optional order total. Falls back to the sum of item amounts. */
  totalUsd?: number | string
}

const isHttp = (u?: string) => typeof u === 'string' && /^https?:\/\//i.test(u)

const CATALOG_BASE =
  'https://rdcfakdhgndnhgzfkuvw.supabase.co/storage/v1/object/public/product-images/originals/catalog'

/** Catalog fallback so a line without a custom render never shows an empty slot. */
const CATALOG_IMAGE: Record<string, string> = {
  'pet-silhouette-keepsake': `${CATALOG_BASE}/pet-silhouette-keepsake.jpg`,
  'nursery-name-date': `${CATALOG_BASE}/nursery-name-date.jpg`,
  'wedding-coordinates': `${CATALOG_BASE}/wedding-coordinates.jpg`,
}

const itemImage = (item: Item) =>
  isHttp(item.previewImageUrl)
    ? (item.previewImageUrl as string)
    : (item.skuSlug && CATALOG_IMAGE[item.skuSlug]) || null

/**
 * Email clients proxy images and choke on multi-MB PNGs, so serve every preview
 * through the storage image transformer at a sane width.
 */
const emailImage = (u: string, width: number) => {
  const resized = u.includes('/storage/v1/object/public/')
    ? u.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
    : u
  if (resized === u) return u
  return `${resized}${resized.includes('?') ? '&' : '?'}width=${width}&quality=75&resize=contain`
}

const money = (v: number | string | undefined) => {
  const n = typeof v === 'string' ? Number(v) : v
  if (n === undefined || n === null || Number.isNaN(n)) return ''
  return `$${n.toFixed(2).replace(/\.00$/, '')}`
}

/**
 * Buyer-supplied strings land in subject lines and body copy. Strip anything
 * markup-shaped rather than escaping it — an escaped `<script>` is safe but
 * reads as a broken, alarming email.
 */
const clean = (v: unknown, max = 120) => {
  if (typeof v !== 'string') return ''
  const stripped = v
    .replace(/<[^>]*>/g, ' ')
    .replace(/[<>]/g, ' ')
    .replace(/&(?:[a-z]+|#\d+);/gi, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
  // Nothing human-readable left (e.g. the input was pure markup) — drop it.
  if (!/[\p{L}\p{N}]/u.test(stripped)) return ''
  return stripped.slice(0, max).trim()
}

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
        skuSlug: props.skuSlug,
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

const ItemRow = ({ item, layout }: { item: Item; layout: 'single' | 'multi' }) => {
  const name = clean(item.productName, 80) || FALLBACK_NAME
  const size = clean(item.sizeLabel, 60)
  const qty = Math.max(1, Number(item.quantity ?? 1) || 1)
  const price = money(item.amountUsd)
  const raw = itemImage(item)
  const src = raw ? emailImage(raw, layout === 'single' ? 900 : 320) : null
  return (
    <Section style={itemBox}>
      {src ? (
        <Img
          src={src}
          alt={name}
          width={layout === 'single' ? 472 : 120}
          style={layout === 'single' ? hero : thumb}
        />
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
            <ItemRow key={i} item={item} layout={multi ? 'multi' : 'single'} />
          ))}

          {hidden > 0 ? (
            <Text style={itemMeta}>+ {hidden} more item{hidden > 1 ? 's' : ''} in this order</Text>
          ) : null}

          {multi && total ? <Text style={totalLine}>Order total: {total}</Text> : null}

          <Section>
            <Text style={body}>
              We're making {multi ? 'them' : 'it'} now in our US workshop.{' '}
              {multi ? 'They ship' : 'It ships'} in 3–5 business days and you'll get
              tracking by email. If {multi ? 'anything arrives' : 'it arrives'} damaged
              or defective we refund you in full, and if {multi ? "anything doesn't" : "it doesn't"}{' '}
              match the render you approved we remake it free. Because {multi ? 'these are' : 'this is'}{' '}
              made to order, {multi ? 'they' : 'it'} can't be cancelled or returned for a change of mind.
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
const thumb = {
  width: '120px',
  maxWidth: '120px',
  borderRadius: '4px',
  marginBottom: '10px',
  border: '1px solid #eeeeee',
}
const body = { lineHeight: '1.6', color: '#444444', fontSize: '15px' }
const hr = { borderColor: '#eeeeee', margin: '24px 0' }
const muted = { fontSize: '12px', color: '#999999' }
const itemBox = { borderTop: '1px solid #eeeeee', paddingTop: '16px', marginBottom: '8px' }
const itemTitle = { fontSize: '16px', fontWeight: 600, color: '#111111', margin: '0 0 4px' }
const itemMeta = { fontSize: '14px', color: '#666666', margin: '0 0 2px' }
const totalLine = { fontSize: '15px', fontWeight: 600, color: '#111111', borderTop: '1px solid #eeeeee', paddingTop: '12px' }
