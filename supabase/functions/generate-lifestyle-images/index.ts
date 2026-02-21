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
    const { productId, productName } = await req.json();

    if (!productId || !productName) {
      return new Response(
        JSON.stringify({ error: 'Missing productId or productName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get product image
    const { data: product, error: productError } = await supabase
      .from('designer_products')
      .select('image_url')
      .eq('id', productId)
      .single();

    if (productError || !product?.image_url) {
      return new Response(
        JSON.stringify({ error: 'Product not found or has no image' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let imageUrl = product.image_url;

    // If the image is base64, upload to storage first
    if (imageUrl.startsWith('data:image/')) {
      console.log('Uploading base64 image to storage...');
      const match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!match) {
        return new Response(
          JSON.stringify({ error: 'Invalid base64 image format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
      const base64Data = match[2];
      
      // Decode base64 using built-in atob
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const filePath = `products/${productId}/main.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, bytes, {
          contentType: `image/${match[1]}`,
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return new Response(
          JSON.stringify({ error: 'Failed to upload image' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
      
      imageUrl = urlData.publicUrl;
      console.log('Uploaded image, public URL:', imageUrl);

      // Update the product with the storage URL
      await supabase
        .from('designer_products')
        .update({ image_url: imageUrl })
        .eq('id', productId);
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate 3 lifestyle images
    const lifestylePrompts = [
      `Create a wide-angle, ultra-realistic lifestyle interior photograph featuring ${productName} as the natural focal element. Contemporary living room, soft natural daylight, warm minimal aesthetic, textured plaster walls, neutral earthy palette. Wide-angle lens, editorial interior photography. No text, logos, people.`,
      `Create an ultra-realistic lifestyle photograph of ${productName} in a modern bedroom or reading nook. Soft morning light, organic materials like wood and linen, muted earth tones. Wide shot, professional interior photography. No text, logos, people.`,
      `Create a cinematic interior photograph featuring ${productName} in a sophisticated open-plan living space. Late afternoon golden light, contemporary architecture with large windows. Wide-angle editorial photography, calm and premium. No text, logos, people.`,
    ];

    const angleViews: { angle: string; url: string }[] = [];
    const labels = ['Living Room Setting', 'Bedroom / Reading Nook', 'Open Plan Space'];

    for (let i = 0; i < lifestylePrompts.length; i++) {
      console.log(`Generating lifestyle image ${i + 1}/3...`);

      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: lifestylePrompts[i] },
                { type: 'image_url', image_url: { url: imageUrl } }
              ]
            }],
            modalities: ['image', 'text']
          }),
        });

        if (!response.ok) {
          console.error(`Lifestyle ${i + 1} failed:`, response.status);
          continue;
        }

        const data = await response.json();
        const generatedUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (generatedUrl) {
          // Upload generated image to storage
          const imgMatch = generatedUrl.match(/^data:image\/(\w+);base64,(.+)$/);
          if (imgMatch) {
            const ext = imgMatch[1] === 'jpeg' ? 'jpg' : imgMatch[1];
            const binaryStr = atob(imgMatch[2]);
            const imgBytes = new Uint8Array(binaryStr.length);
            for (let j = 0; j < binaryStr.length; j++) {
              imgBytes[j] = binaryStr.charCodeAt(j);
            }
            const lifestylePath = `products/${productId}/lifestyle-${i + 1}.${ext}`;

            const { error: uploadErr } = await supabase.storage
              .from('product-images')
              .upload(lifestylePath, imgBytes, {
                contentType: `image/${imgMatch[1]}`,
                upsert: true,
              });

            if (!uploadErr) {
              const { data: pubUrl } = supabase.storage
                .from('product-images')
                .getPublicUrl(lifestylePath);
              
              angleViews.push({ angle: labels[i], url: pubUrl.publicUrl });
              console.log(`Lifestyle ${i + 1} uploaded successfully`);
            }
          }
        }
      } catch (err) {
        console.error(`Error generating lifestyle ${i + 1}:`, err);
      }
    }

    if (angleViews.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate any lifestyle images' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the product with the lifestyle images
    await supabase
      .from('designer_products')
      .update({ angle_views: angleViews })
      .eq('id', productId);

    return new Response(
      JSON.stringify({ success: true, angleViews }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
