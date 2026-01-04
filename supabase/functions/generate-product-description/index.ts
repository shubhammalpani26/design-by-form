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
    const body = await req.json();
    const { productName, category, materials, dimensions, type, prompt: customPrompt } = body;
    
    console.log('Request type:', type, 'Category:', category);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let prompt: string;
    let systemContent: string;

    // Handle surprise prompt generation
    if (type === 'surprise_prompt') {
      systemContent = 'You are an expert furniture designer and structural engineer who creates unique, unexpected design concepts that are BOTH visually striking AND structurally sound. You understand physics, load-bearing requirements, and real-world manufacturing constraints. Your designs are imaginative but always practical and stable.';
      
      prompt = `Generate a unique, creative design prompt for a ${category || 'furniture'} piece that is 3D printable AND structurally sound.

STRUCTURAL INTEGRITY REQUIREMENTS (CRITICAL):
- Must be SELF-SUPPORTING: The design must stand on its own without tipping over
- Proper CENTER OF GRAVITY: Weight distribution must be balanced and realistic
- STABLE BASE: All furniture needs adequate ground contact and support points
- LOAD-BEARING CAPABLE: Chairs/benches must support human weight (80-120kg), tables must hold objects
- NO FRAGILE CANTILEVERS: Avoid extreme overhangs or thin unsupported extensions that would snap
- REALISTIC PROPORTIONS: Wall thickness minimum 8-15mm for structural parts, proper joint design
- PHYSICS-COMPLIANT: No designs that would collapse, tip over, or break under normal use

MATERIAL CONSTRAINTS:
- SINGLE MATERIAL: Resin reinforced with composite fiber (strong but has limits)
- SINGLE COLOR/FINISH: One color per design (matte charcoal, glossy pearl, metallic bronze, terracotta, etc.)
- UPHOLSTERY OPTIONAL: Cushions or fabric accents allowed as secondary elements

DESIGN FOCUS:
- Be creative with FORM while respecting structural limits
- Reference nature's load-bearing structures: tree trunks, bones, shells, coral
- Sculptural AND functional - beauty through strength
- Thick, solid bases with elegant upper forms work well

FORMAT:
- 2-3 sentences maximum
- Return ONLY the design prompt, no explanations
- Specify color/finish clearly

GOOD Examples (structurally sound):
- "A sculptural dining chair with a wide tripod base and flowing organic backrest inspired by whale vertebrae, in matte charcoal finish with a fitted leather seat cushion"
- "A side table with a sturdy mushroom-shaped pedestal base and organic rippled top edge, in glossy obsidian black"
- "A bench with thick, arched supports resembling ancient Roman aqueducts, featuring a gently curved seating surface in warm terracotta matte"

BAD Examples (would fail structurally):
- Thin spindle legs supporting heavy tops
- Extreme cantilevered seats with no counterbalance
- Tall narrow designs with tiny bases

Now generate a completely unique, structurally sound ${category || 'furniture'} design prompt:`;
    } else {
      // Standard product description generation
      systemContent = 'You are a luxury furniture copywriter who creates compelling, story-driven product descriptions that evoke emotion and desire. Your writing is elegant, sophisticated, and makes every piece sound like a masterpiece.';
      
      prompt = `Create a premium, captivating product description for a furniture piece with the following details:

Product Name: ${productName}
Category: ${category}
Materials: ${materials || 'Premium materials'}
Dimensions: ${dimensions ? `${dimensions.width}W x ${dimensions.depth}D x ${dimensions.height}H cm` : 'Custom dimensions'}

Requirements:
- Write a compelling story-like description (150-200 words)
- Emphasize craftsmanship, luxury, and unique design elements
- Use evocative, premium language that appeals to high-end buyers
- Highlight how this piece transforms living spaces
- Focus on the emotional connection and lifestyle enhancement
- Make it sound exclusive and aspirational
- Do NOT use markdown or special formatting
- Write in a flowing, narrative style

The description should make potential buyers feel they're investing in art, not just furniture.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemContent
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content;

    if (!description) {
      throw new Error('No description generated');
    }

    console.log('Generated description:', description);

    return new Response(
      JSON.stringify({ description }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating description:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate description',
        fallback: 'A stunning piece that combines form and function, crafted with meticulous attention to detail. This design brings sophistication and elegance to any space, transforming ordinary rooms into extraordinary living environments.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
