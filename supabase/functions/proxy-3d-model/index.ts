import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get model URL from query parameter
    const url = new URL(req.url);
    const modelUrl = url.searchParams.get('url');

    if (!modelUrl) {
      throw new Error('Missing "url" query parameter');
    }

    console.log('🔄 Proxying 3D model from:', modelUrl);

    // Fetch the GLB file from the original URL
    const response = await fetch(modelUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`);
    }

    // Get the model data as arrayBuffer
    const modelData = await response.arrayBuffer();
    const modelSize = modelData.byteLength;
    console.log('✅ Successfully fetched model, size:', modelSize, 'bytes');

    // Return the GLB file directly with proper CORS headers
    return new Response(modelData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'model/gltf-binary',
        'Content-Length': modelSize.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });

  } catch (error) {
    console.error('❌ Error proxying 3D model:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: 'Failed to proxy 3D model'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
