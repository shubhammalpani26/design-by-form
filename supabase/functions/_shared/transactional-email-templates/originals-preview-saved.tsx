import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
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

interface Props {
  petName?: string
  previewUrl?: string
  link?: string
  fromPrice?: number
}

const clean = (v: unknown, max = 60) => {
  if (typeof v !== 'string') return ''
  const s = v.replace(/[<>\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim()
  return /[\p{L}\p{N}]/u.test(s) ? s.slice(0, max).trim() : ''
}
const safeUrl = (u: unknown, prefix: string) =>
  typeof u === 'string' && u.startsWith(prefix) ? u : ''

const Email = (props: Props) => {
  const name = clean(props.petName)
  const img = safeUrl(props.previewUrl, 'https://')
  const link = safeUrl(props.link, 'https://nyzora.ai/') || 'https://nyzora.ai/originals/pet-silhouette-keepsake'
  const from = typeof props.fromPrice === 'number' && props.fromPrice > 0 ? props.fromPrice : 59

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{name ? `Here's ${name}'s preview, saved for you.` : "Here's your preview, saved for you."}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>NYZORA</Text>
          <Heading style={h1}>{name ? `${name}'s preview` : 'Your preview'}</Heading>
          {img ? <Img src={img} alt={name ? `${name} sculpture preview` : 'Your sculpture preview'} style={hero} /> : null}
          <Text style={body}>
            Here it is, saved so you can come back to it whenever you like. The button below opens
            this exact preview again — sizes, colour and price included.
          </Text>
          <Section style={{ margin: '20px 0' }}>
            <Button href={link} style={button}>Open my preview</Button>
          </Section>
          <Text style={body}>
            From ${from} · free US shipping · ships in 7–8 business days. If the finished piece
            doesn't look like your pet, we remake it free.
          </Text>
          <Hr style={hr} />
          <Text style={muted}>
            You asked us to email this preview. We'll send one short reminder in 2 days, and that's
            it. Questions? Just reply or write to contact@nyzora.ai.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => {
    const name = clean(d?.petName)
    return name ? `${name}'s preview, saved for you` : 'Your Nyzora preview, saved for you'
  },
  displayName: 'Originals preview saved',
  previewData: {
    petName: 'Nyra',
    previewUrl: 'https://nyzora.ai/og-image.jpg',
    link: 'https://nyzora.ai/originals/pet-silhouette-keepsake?saved=example',
    fromPrice: 59,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { maxWidth: '520px', margin: '0 auto', padding: '24px' }
const eyebrow = { fontSize: '11px', letterSpacing: '.25em', textTransform: 'uppercase' as const, color: '#888888' }
const h1 = { fontSize: '24px', fontWeight: 600, margin: '8px 0 16px', color: '#111111' }
const hero = { width: '100%', borderRadius: '4px', marginBottom: '16px', border: '1px solid #eeeeee' }
const body = { lineHeight: '1.6', color: '#444444', fontSize: '15px' }
const button = {
  backgroundColor: '#111111',
  color: '#ffffff',
  padding: '12px 22px',
  fontSize: '13px',
  letterSpacing: '.12em',
  textTransform: 'uppercase' as const,
  textDecoration: 'none',
}
const hr = { borderColor: '#eeeeee', margin: '24px 0' }
const muted = { fontSize: '12px', color: '#999999', lineHeight: '1.5' }
