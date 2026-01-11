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
    
    const prompt = `You are a premium furniture pricing analyst for handcrafted designer pieces. Calculate a manufacturing base price for this designer furniture piece.

Product: ${productName}
Category: ${category}
Description: ${description}
Dimensions: ${dimensions.width}cm W × ${dimensions.depth}cm D × ${dimensions.height}cm H
Volume: ${volume.toFixed(2)} cubic meters
Material: Resin reinforced with composite fibre, hybrid fabrication with hand-finishing

This is PREMIUM DESIGNER FURNITURE - handcrafted, unique pieces using advanced 3D printing and artisan finishing.

Pricing guidelines by category (in INR):
- Decor items (vases, bowls, planters): ₹10,000-₹30,000
- Lighting (lamps, pendants): ₹15,000-₹75,000
- Chairs: ₹45,000-₹90,000
- Tables (side tables to dining): ₹30,000-₹150,000
- Benches: ₹80,000-₹220,000
- Storage (shelves, cabinets): ₹40,000-₹150,000
- Installations: ₹150,000-₹500,000+

Consider:
- Premium artisan craftsmanship
- Unique, non-mass-produced pieces
- Volume-based scaling within category ranges
- Complexity of design from description

Return ONLY a JSON object with this structure (no markdown, no explanation):
{
  "designer_price": <number>,
  "base_price": <number>,
  "reasoning": "<brief explanation of pricing>"
}

Designer price should be approximately 1.25-1.5x the base manufacturing cost.`;

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
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
