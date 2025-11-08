import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dimensions, category, productName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Calculate volume in cubic feet
    const width = parseFloat(dimensions.width) / 12; // inches to feet
    const depth = parseFloat(dimensions.depth) / 12;
    const height = parseFloat(dimensions.height) / 12;
    const volumeCubicFeet = width * depth * height;

    // Use AI to estimate weight based on product type and dimensions
    const prompt = `You are a furniture manufacturing expert. Calculate the weight in kg for a ${category} named "${productName}" with dimensions ${dimensions.width}"W x ${dimensions.depth}"D x ${dimensions.height}"H (volume: ${volumeCubicFeet.toFixed(2)} cubic feet).

The furniture is made from FRP (Fibre-Reinforced Polymer) with 75% PCR content, which is a premium sustainable material.

Consider:
- Typical FRP density: 1.5-2.0 g/cm³
- Structural requirements for the furniture type
- Wall thickness and internal structure
- Material distribution

Return ONLY a JSON object with this format:
{"weight": number, "reasoning": "brief explanation"}

Example: {"weight": 18.5, "reasoning": "Based on FRP density and structural needs for a chair"}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error('Failed to calculate weight');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    const weightData = JSON.parse(content);

    return new Response(
      JSON.stringify({
        weight: weightData.weight,
        reasoning: weightData.reasoning
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error calculating weight:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        weight: 15 // fallback weight
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
