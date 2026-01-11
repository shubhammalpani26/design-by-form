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
      systemContent = 'You are a wildly creative furniture designer with expertise in 3D printing and structural engineering. Generate completely unexpected, never-before-seen designs. Be random, surprising, and inventive with colors, finishes, and inspirations. Every response must be different.';
      
      const randomSeed = Math.floor(Math.random() * 100000);
      
      prompt = `SEED: ${randomSeed}

Generate a COMPLETELY RANDOM and UNIQUE design prompt for a ${category || 'furniture'} piece.

BE UNPREDICTABLE - choose ANY inspiration, ANY color, ANY finish. Surprise me with something I've never seen!

MANUFACTURING CONSTRAINTS (must follow for 3D printability):
- Single material: resin/composite (3D printed with hand-finishing)
- Single color OR single finish (no multi-color patterns)
- Self-supporting structure with stable base
- Proper center of gravity for the category
- Load-bearing requirements: chairs 120kg, tables hold objects, benches seat multiple people
- No fragile cantilevers or thin unsupported extensions
- Minimum 8-15mm wall thickness for structural parts
- Optional: fabric cushions or upholstery accents allowed

FORMAT:
- 2-3 sentences ONLY
- Be SPECIFIC about the unique form/structure
- Name ONE color or finish (your random choice!)
- Return ONLY the design prompt, nothing else`;
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
        temperature: type === 'surprise_prompt' ? 0.98 : 0.8,
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