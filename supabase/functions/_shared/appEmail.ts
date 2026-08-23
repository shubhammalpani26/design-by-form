import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendTemplateEmail } from './transactional-email-templates/send-email.ts'
import { TEMPLATES } from './transactional-email-templates/registry.ts'

export interface SendAppEmailOptions {
  templateData?: Record<string, any>
  idempotencyKey?: string
  replyTo?: string
}

export type SendAppEmailResult =
  | { sent: true }
  | { sent: false; reason: 'recipient_suppressed' }
  | { sent: false; reason: 'failed'; error: string }

function admin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

async function logSend(
  templateName: string,
  recipientEmail: string,
  status: 'sent' | 'suppressed' | 'failed',
  errorMessage?: string,
) {
  const { error } = await admin().from('email_send_log').insert({
    message_id: null,
    template_name: templateName,
    recipient_email: recipientEmail,
    status,
    error_message: errorMessage ?? null,
  })
  if (error) {
    console.error('Failed to write email_send_log', {
      code: error.code,
      message: error.message,
      templateName,
      status,
    })
  }
}

/**
 * Sends a registered app email through Lovable's managed email API and keeps
 * the project's own email_send_log history in sync. Never throws — callers get
 * a result object so a failed notification can't break the surrounding flow.
 */
export async function sendAppEmail(
  templateName: string,
  recipientEmail: string,
  options: SendAppEmailOptions = {},
): Promise<SendAppEmailResult> {
  const effectiveRecipient = TEMPLATES[templateName]?.to || recipientEmail

  try {
    const result = await sendTemplateEmail(templateName, recipientEmail, options)
    if (result.sent) {
      await logSend(templateName, effectiveRecipient, 'sent')
      return { sent: true }
    }
    await logSend(templateName, effectiveRecipient, 'suppressed')
    return { sent: false, reason: 'recipient_suppressed' }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('App email failed', { templateName, message })
    await logSend(templateName, effectiveRecipient, 'failed', message)
    return { sent: false, reason: 'failed', error: message }
  }
}
