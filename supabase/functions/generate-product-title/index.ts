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
    const { category, materials, dimensions, prompt } = await req.json();
    
    console.log('Generating title for:', { category, materials, dimensions, prompt });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const titlePrompt = `Create a captivating, premium product title for a furniture piece with the following details:

Category: ${category}
Materials: ${materials || 'Premium materials'}
Dimensions: ${dimensions ? `${dimensions.width}W x ${dimensions.depth}D x ${dimensions.height}H inches` : 'Custom dimensions'}
Design Description: ${prompt || 'Modern furniture design'}

Requirements:
- Keep it short and memorable (3-6 words maximum)
- Make it sound premium, artistic, and unique
- Avoid generic terms like "Modern Chair" - be creative and evocative
- Focus on the distinctive aesthetic or form
- Examples of good titles: "Curve Flow Lounge", "Geometric Harmony Table", "Spiral Wave Bench"
- DO NOT include quotes, markdown, or extra formatting
- Return ONLY the title text, nothing else

The title should make people curious and intrigued.`;

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
            content: 'You are a creative furniture naming expert who creates memorable, premium product titles that capture the essence and aesthetic of unique furniture designs. Your titles are short, evocative, and make pieces sound like art.'
          },
          {
            role: 'user',
            content: titlePrompt
          }
        ],
        temperature: 0.9,
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
    let title = data.choices?.[0]?.message?.content;

    if (!title) {
      throw new Error('No title generated');
    }

    // Clean up the title - remove quotes, extra whitespace, markdown
    title = title.trim()
      .replace(/^["']|["']$/g, '') // Remove quotes from start/end
      .replace(/\*\*/g, '') // Remove markdown bold
      .replace(/\*/g, '') // Remove markdown italic
      .replace(/^#+\s*/g, '') // Remove markdown headers
      .trim();

    console.log('Generated title:', title);

    return new Response(
      JSON.stringify({ title }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating title:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate title',
        fallback: 'Artisan Design'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
