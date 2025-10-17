import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema
const checkPlagiarismSchema = z.object({
  imageUrl: z.string().trim().url().max(2000),
  productId: z.string().uuid().optional(),
});

// Simple perceptual hash function (basic implementation)
function simpleImageHash(imageUrl: string): string {
  // In production, you would use a proper perceptual hashing library
  // For now, we'll create a hash based on the URL itself
  // This is a placeholder - in reality, you'd analyze the actual image pixels
  const hash = btoa(imageUrl).substring(0, 32);
  return hash;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const requestData = await req.json();
    
    // Validate input
    const validatedData = checkPlagiarismSchema.parse(requestData);
    const { imageUrl, productId } = validatedData;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate hash for the image
    const imageHash = simpleImageHash(imageUrl);

    // Check if similar hash exists
    const { data: existingHashes, error: searchError } = await supabaseClient
      .from('design_hashes')
      .select('product_id, image_hash')
      .neq('product_id', productId || '')
      .limit(100);

    if (searchError) {
      throw searchError;
    }

    // Simple similarity check (in production, use proper perceptual hash comparison)
    const similarDesigns = existingHashes?.filter(existing => {
      // Calculate simple similarity (Hamming distance)
      let differences = 0;
      for (let i = 0; i < Math.min(imageHash.length, existing.image_hash.length); i++) {
        if (imageHash[i] !== existing.image_hash[i]) {
          differences++;
        }
      }
      const similarity = 1 - (differences / imageHash.length);
      return similarity > 0.85; // 85% similarity threshold
    }) || [];

    const isPlagiarism = similarDesigns.length > 0;

    // If unique and productId provided, store the hash
    if (!isPlagiarism && productId) {
      await supabaseClient
        .from('design_hashes')
        .upsert({
          product_id: productId,
          image_hash: imageHash,
        });
    }

    return new Response(
      JSON.stringify({
        isPlagiarism,
        similarCount: similarDesigns.length,
        imageHash,
        message: isPlagiarism 
          ? `This design appears similar to ${similarDesigns.length} existing design(s).` 
          : 'Design appears to be unique.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking plagiarism:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
