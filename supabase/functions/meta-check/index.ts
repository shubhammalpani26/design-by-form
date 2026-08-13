import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const token = Deno.env.get('META_ACCESS_TOKEN') ?? ''
  const appId = Deno.env.get('META_APP_ID') ?? ''
  const appSecret = Deno.env.get('META_APP_SECRET') ?? ''
  const out: Record<string, unknown> = { hasToken: !!token, hasApp: !!appId && !!appSecret }
  try {
    const debug = await fetch(`https://graph.facebook.com/v18.0/debug_token?input_token=${token}&access_token=${appId}|${appSecret}`)
    out.debug = await debug.json()
    const pages = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=id,name,instagram_business_account{id,username}&access_token=${token}`)
    out.pages = await pages.json()
    const url = new URL(req.url)
    const dry = url.searchParams.get('dry_container')
    if (dry) {
      const ig = url.searchParams.get('ig') ?? '17841436891682401'
      const r = await fetch(`https://graph.facebook.com/v18.0/${ig}/media?image_url=${encodeURIComponent(dry)}&caption=${encodeURIComponent('test')}&access_token=${token}`, { method: 'POST' })
      out.container = await r.json()
    }
  } catch (e) { out.error = String(e) }
  return new Response(JSON.stringify(out, null, 2), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
