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
    const prompt = `You are a furniture manufacturing expert specializing in FRP (Fibre-Reinforced Polymer) furniture. 

Calculate the realistic weight in kg for a ${category} named "${productName}" with dimensions:
- Width: ${dimensions.width} inches
- Depth: ${dimensions.depth} inches  
- Height: ${dimensions.height} inches
- Volume: ${volumeCubicFeet.toFixed(2)} cubic feet

Material: FRP (Fibre-Reinforced Polymer) with 75% post-consumer recycled content
Typical FRP characteristics:
- Density: 1.5-2.0 g/cm³
- Strong but lightweight compared to solid materials
- Hollow/ribbed internal structure for furniture

Weight estimation guidelines by furniture type:
- Chairs: 15-35 kg depending on size and structure
- Tables: 25-60 kg depending on size
- Shelving/Storage: 20-45 kg
- Benches: 20-40 kg
- Stools: 8-15 kg

Consider:
1. Furniture type structural requirements
2. Size and volume
3. Typical wall thickness (3-8mm for FRP furniture)
4. Internal ribbing and support structures
5. FRP is lighter than solid wood but heavier than plastic

Return ONLY a JSON object: {"weight": number, "reasoning": "brief explanation"}
Be realistic - don't underestimate weight. Larger pieces should be heavier.`;

    console.log('Calculating weight for:', { category, productName, dimensions, volumeCubicFeet });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error('Failed to calculate weight');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    console.log('AI response content:', content);
    
    if (!content) {
      throw new Error('No response from AI');
    }

    // Extract JSON from the content (in case AI adds extra text)
    const jsonMatch = content.match(/\{[^}]+\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', content);
      throw new Error('Invalid AI response format');
    }

    const weightData = JSON.parse(jsonMatch[0]);
    console.log('Calculated weight:', weightData);

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
