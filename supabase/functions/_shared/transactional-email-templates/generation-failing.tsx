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
  windowMinutes?: number | string
  starts?: number | string
  errors?: number | string
  successes?: number | string
  note?: string
}

/**
 * Internal alert. Visitor preview generations are failing in bulk — usually
 * exhausted AI credits or a model outage — so ad traffic is hitting a broken
 * experience. Sent at most once every 6 hours while the problem persists.
 */
const Email = ({ windowMinutes, starts, errors, successes, note }: Props) => (
  <Html>
    <Head />
    <Preview>Pet preview generation is failing for visitors</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>Nyzora — internal alert</Text>
        <Heading style={h1}>Preview generation is failing</Heading>
        <Text style={body}>
          Visitors are uploading pet photos but the AI render is failing almost
          every time. The most common cause is exhausted AI credits — top up the
          workspace balance and generation recovers immediately.
        </Text>
        <Hr style={hr} />
        <Text style={row}><strong>Window</strong> last {windowMinutes ?? 60} minutes</Text>
        <Text style={row}><strong>Attempts</strong> {starts ?? '—'}</Text>
        <Text style={row}><strong>Failed</strong> {errors ?? '—'}</Text>
        <Text style={row}><strong>Succeeded</strong> {successes ?? '—'}</Text>
        <Hr style={hr} />
        {note ? <Text style={reasonBox}>{note}</Text> : null}
        <Text style={muted}>
          Until this is fixed, paid ad clicks land on a broken experience. Check
          the workspace credit balance first, then the AI gateway status.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template: TemplateEntry = {
  component: Email,
  subject: () => 'Alert — pet preview generation is failing',
  displayName: 'Generation failing (internal alert)',
  to: 'contact@nyzora.ai',
  previewData: { windowMinutes: 60, starts: 12, errors: 11, successes: 1 },
}

const main = { backgroundColor: '#f6f6f4', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '32px 28px', maxWidth: '560px' }
const eyebrow = { color: '#8a8a85', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' as const }
const h1 = { color: '#141412', fontSize: '22px', fontWeight: 600, margin: '8px 0 16px' }
const body = { color: '#3c3c38', fontSize: '14px', lineHeight: '22px' }
const row = { color: '#3c3c38', fontSize: '14px', margin: '4px 0' }
const hr = { borderColor: '#e6e6e1', margin: '20px 0' }
const reasonBox = { backgroundColor: '#fafaf8', border: '1px solid #e6e6e1', borderRadius: '6px', color: '#3c3c38', fontSize: '13px', lineHeight: '20px', padding: '12px 14px' }
const muted = { color: '#8a8a85', fontSize: '12px', lineHeight: '18px', marginTop: '16px' }
