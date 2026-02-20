import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Whitelist of allowed domains for proxying
const ALLOWED_DOMAINS = [
  'assets.meshy.ai',
  'api.meshy.ai',
  'meshy.ai',
  'rdcfakdhgndnhgzfkuvw.supabase.co',
];

function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return ALLOWED_DOMAINS.some(domain => url.hostname === domain || url.hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const modelUrl = url.searchParams.get('url');

    if (!modelUrl) {
      throw new Error('Missing "url" query parameter');
    }

    if (!isAllowedUrl(modelUrl)) {
      return new Response(
        JSON.stringify({ error: 'URL domain not allowed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔄 Proxying 3D model from:', modelUrl);

    const response = await fetch(modelUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`);
    }

    const modelData = await response.arrayBuffer();
    const modelSize = modelData.byteLength;
    console.log('✅ Successfully fetched model, size:', modelSize, 'bytes');

    return new Response(modelData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'model/gltf-binary',
        'Content-Length': modelSize.toString(),
        'Cache-Control': 'public, max-age=31536000',
      },
    });

  } catch (error) {
    console.error('❌ Error proxying 3D model:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to proxy 3D model'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
