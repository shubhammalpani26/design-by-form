import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, category, description, dimensions } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Calculate volume for reference
    const volume = (dimensions.width * dimensions.depth * dimensions.height) / 1000000; // cubic meters
    
    const prompt = `You are a luxury furniture pricing expert. Calculate an appropriate designer price for this 3D-printed, single-material, organically-shaped furniture piece.

Product: ${productName}
Category: ${category}
Description: ${description}
Dimensions: ${dimensions.width}cm W × ${dimensions.depth}cm D × ${dimensions.height}cm H
Volume: ${volume.toFixed(2)} cubic meters
Material: 100% PCR (Post-Consumer Recycled) plastic, 3D printed in one piece

Pricing considerations:
- This is a luxury, designer piece with organic flowing forms
- Single-material 3D printing is high-end manufacturing
- On-demand, sustainable production
- Unique parametric designs
- Small batch/custom production

Return ONLY a JSON object with this structure (no markdown, no explanation):
{
  "designer_price": <number>,
  "base_price": <number>,
  "reasoning": "<brief explanation of pricing>"
}

Designer price should be 1.8-2.5x the base manufacturing cost. Think high-end design gallery pricing.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }
    
    const pricing = JSON.parse(jsonMatch[0]);
    
    console.log(`Pricing calculated for ${productName}:`, pricing);

    return new Response(
      JSON.stringify(pricing),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in recalculate-pricing:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
