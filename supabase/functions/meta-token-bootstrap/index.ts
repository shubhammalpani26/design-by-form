import { createClient } from 'npm:@supabase/supabase-js@2'

const ADMIN_IDS = ['819ef7c5-0488-4e9f-9345-d262e136d036', '057f6b9e-6888-4efa-9855-b842fa8ff67e']

Deno.serve(async () => {
  const appId = Deno.env.get('META_APP_ID')!
  const appSecret = Deno.env.get('META_APP_SECRET')!
  const token = Deno.env.get('META_ACCESS_TOKEN')!
  const r = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${token}`)
  const j = await r.json()
  if (!j.access_token) return new Response(JSON.stringify({ ok: false, error: j.error ?? j }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  const expires_at = new Date(Date.now() + (j.expires_in ?? 5184000) * 1000).toISOString()
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const results: unknown[] = []
  for (const id of ADMIN_IDS) {
    const { data: existing } = await sb.from('user_connector_tokens').select('meta_defaults').eq('user_id', id).maybeSingle()
    const meta_defaults = { ...((existing?.meta_defaults as Record<string, unknown>) ?? {}), ig_user_id: '17841436891682401', ig_username: 'nyzora.ai', page_id: '1087872784403919', meta_token: { access_token: j.access_token, token_type: j.token_type ?? 'bearer', expires_at } }
    const { error } = await sb.from('user_connector_tokens').upsert({ user_id: id, meta_defaults }, { onConflict: 'user_id' })
    results.push({ id, error: error?.message ?? null })
  }
  return new Response(JSON.stringify({ ok: true, expires_at, results }), { headers: { 'Content-Type': 'application/json' } })
})
