import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  taskId: z.string().trim().min(1).max(200).regex(/^[a-zA-Z0-9_\-]+$/),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData = await req.json();
    const validationResult = requestSchema.safeParse(rawData);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid task ID" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { taskId } = validationResult.data;

    const MESHY_API_KEY = Deno.env.get('MESHY_API_KEY');
    
    if (!MESHY_API_KEY) {
      return new Response(
        JSON.stringify({ error: "3D generation not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const statusResponse = await fetch(`https://api.meshy.ai/openapi/v1/image-to-3d/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${MESHY_API_KEY}`,
      },
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error('Meshy API error:', statusResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to check 3D status" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const statusData = await statusResponse.json();
    console.log("Meshy status for task", taskId, ":", statusData.status);

    return new Response(
      JSON.stringify({
        status: statusData.status,
        modelUrl: statusData.model_urls?.glb,
        progress: statusData.progress,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking 3D status:', error);
    return new Response(
      JSON.stringify({ error: "Failed to check status" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
