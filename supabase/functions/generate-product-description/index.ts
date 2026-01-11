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
      systemContent = 'You are a visionary furniture designer who creates unexpected, never-before-seen design concepts. Each design must be unique, surprising, and completely different from anything you\'ve suggested before. You have expertise in structural engineering and understand 3D printing constraints.';
      
      // Expanded color palette for variety
      const colorPalettes = [
        // Earthy & Warm
        'matte terracotta', 'burnt sienna', 'warm clay', 'desert sand', 'rustic ochre',
        // Cool & Modern
        'arctic white', 'glacier blue', 'storm grey', 'slate', 'cool concrete',
        // Bold & Dramatic
        'obsidian black', 'deep burgundy', 'midnight navy', 'forest green', 'aubergine purple',
        // Metallics
        'brushed gold', 'rose gold', 'antique brass', 'weathered copper', 'pewter silver',
        // Nature-Inspired
        'moss green', 'driftwood grey', 'coral pink', 'sage', 'sandstone beige',
        // Contemporary
        'blush pink', 'dusty lavender', 'eucalyptus green', 'warm taupe', 'cream ivory'
      ];
      
      // Design inspiration themes for variety
      const designThemes = [
        'ancient architecture (Gothic arches, Roman columns, Egyptian geometry)',
        'marine life (coral formations, shells, whale bones, jellyfish)',
        'geological formations (crystals, cave formations, erosion patterns)',
        'botanical structures (seed pods, tree roots, mushroom caps, fern fronds)',
        'wind and water erosion (sand dunes, river stones, wind-carved rock)',
        'microscopic structures (diatoms, pollen, cellular patterns)',
        'cultural motifs (Japanese wabi-sabi, Scandinavian minimalism, African patterns)',
        'aerospace engineering (aerodynamic curves, structural ribbing)',
        'musical instruments (curved forms, resonance chambers, flowing lines)',
        'origami and paper folding (angular planes, folded surfaces)'
      ];
      
      // Random selections to inject variety
      const randomColors = colorPalettes.sort(() => Math.random() - 0.5).slice(0, 8).join(', ');
      const randomTheme = designThemes[Math.floor(Math.random() * designThemes.length)];
      const randomSeed = Math.floor(Math.random() * 10000);
      
      prompt = `VARIATION SEED: ${randomSeed}

Generate a COMPLETELY UNIQUE and SURPRISING design prompt for a ${category || 'furniture'} piece.

CRITICAL: Your response must be DIFFERENT from common designs. Avoid these overused concepts:
- Generic "organic flowing" shapes without specific inspiration
- Simple geometric patterns
- Standard furniture silhouettes with minor modifications
- Bronze or metallic bronze finish (use other colors!)

STRUCTURAL REQUIREMENTS (non-negotiable):
- Self-supporting with proper center of gravity
- Stable base with adequate ground contact
- Load-bearing capable (chairs: 120kg, tables: hold objects)
- No fragile cantilevers or thin unsupported extensions
- Minimum 8-15mm wall thickness for structural parts

MATERIAL: Single resin/composite material, single color finish
UPHOLSTERY: Optional cushions or fabric accents allowed

TODAY'S INSPIRATION THEME: ${randomTheme}
Draw unexpected connections between this theme and furniture design.

COLOR OPTIONS (pick ONE that's unexpected for furniture):
${randomColors}

FORMAT:
- 2-3 sentences ONLY
- Return ONLY the design prompt, no explanations or preamble
- Be SPECIFIC about the unique structural feature
- Name the EXACT color/finish

EXAMPLES OF GOOD VARIETY:
- "A console table inspired by Gothic cathedral flying buttresses, with three dramatically arched supports meeting at a floating top surface, in matte midnight navy"
- "A lounge chair mimicking an unfurling fern frond, with the backrest spiraling outward from a solid weighted base, finished in dusty sage green with cream linen cushioning"
- "A side table inspired by balancing river stones, featuring three interlocking rounded forms that create a stable tripod, in weathered copper finish"
- "A dining chair drawing from origami aesthetics, with angular folded planes forming seat and back from a single continuous surface, in arctic white matte"

Now create something COMPLETELY DIFFERENT and unexpected for a ${category || 'furniture'}:`;
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
        temperature: type === 'surprise_prompt' ? 0.95 : 0.8,
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
