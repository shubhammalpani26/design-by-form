import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, angle, productName } = await req.json();
    
    if (!imageUrl || !angle || !productName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: imageUrl, angle, productName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has enough credits (1 credit per angle)
    const { data: creditData, error: creditError } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (creditError) {
      console.error('Credit check error:', creditError);
      return new Response(
        JSON.stringify({ error: 'Failed to check credits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!creditData || creditData.balance < 1) {
      return new Response(
        JSON.stringify({ error: 'Insufficient credits. Each angle generation costs 1 credit.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert relative URLs to absolute URLs
    let absoluteImageUrl = imageUrl;
    if (imageUrl.startsWith('/')) {
      const origin = req.headers.get('origin') || 'https://7728ba6f-7c17-4bf3-91a9-5fbb21536aa3.lovableproject.com';
      absoluteImageUrl = `${origin}${imageUrl}`;
    }
    
    console.log('Image URL conversion:', { original: imageUrl, absolute: absoluteImageUrl });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use specialized prompt for lifestyle images, generic for other angles
    let prompt: string;
    
    if (angle.toLowerCase() === 'lifestyle') {
      prompt = `Create a wide-angle, ultra-realistic lifestyle interior photograph featuring the given furniture product as the natural focal element.

The product must be placed in a spatially appropriate, well-designed interior that logically suits its function and scale, without over-staging. The room should feel architecturally resolved, calm, and premium.

Show the FULL room with generous negative space, using correct real-world proportions and believable spatial depth. The product should feel designed for the space — not added later.

Lighting: Soft natural daylight combined with subtle ambient interior lighting, realistic shadows, gentle highlights, no harsh contrast.

Camera & Composition: Eye-level camera, wide-angle lens (24–28mm look), true perspective with no distortion, editorial interior photography framing.

Interior Language: Contemporary, warm minimal, softly futuristic, materials such as textured plaster, microcement, stone, wood, linen, neutral earthy palette with refined tonal variation.

Styling Rules: Minimal, intentional, and restrained. Only elements that support scale and realism. No clutter, no over-decoration, no visual noise.

Realism Constraints: Photographic depth of field, natural imperfections, accurate material behavior and reflections, cinematic but believable.

Strictly avoid: Collages, split frames, floating objects, CGI or render-like appearance, people, text, logos, branding, over-saturated colors, exaggerated decor, incorrect scale or forced staging.

Final Output: A calm, timeless, magazine-quality interior photograph that feels naturally lived-in yet refined, website-ready, premium, and fully realistic.

Product: ${productName}`;
    } else {
      prompt = `Professional product photography of ${productName}, ${angle.toLowerCase()}, studio lighting, white background, high resolution, commercial quality`;
    }
    
    console.log('Generating angle view:', { angle, productName, isLifestyle: angle.toLowerCase() === 'lifestyle' });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: absoluteImageUrl } }
            ]
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Insufficient credits. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to generate image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const generatedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImageUrl) {
      console.error('No image URL in response:', data);
      return new Response(
        JSON.stringify({ error: 'No image generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deduct 1 credit after successful generation
    const { error: deductError } = await supabase
      .from('user_credits')
      .update({ 
        balance: creditData.balance - 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (deductError) {
      console.error('Failed to deduct credit:', deductError);
      // Don't fail the request, just log the error
    }

    // Log the transaction
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        type: 'debit',
        amount: 1,
        description: `Generated ${angle} angle view`,
        metadata: { angle, productName }
      });

    console.log('Successfully generated angle view and deducted 1 credit');

    return new Response(
      JSON.stringify({ imageUrl: generatedImageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-angle-view:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
