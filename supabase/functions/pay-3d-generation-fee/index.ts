import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { productId, paymentMethod, country } = await req.json();
    console.log('Processing 3D generation fee payment:', { productId, paymentMethod, country, userId: user.id });

    // Verify the user is the designer of this product
    const { data: designerProfile, error: profileError } = await supabase
      .from('designer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !designerProfile) {
      console.error('Designer profile not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'Designer profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate fee based on country
    const isIndia = country === 'IN';
    const fee = isIndia ? 750 : 15;
    const currency = isIndia ? 'INR' : 'USD';

    // --- OWNERSHIP: the product must belong to this designer ---
    const { data: product, error: productLookupError } = await supabase
      .from('designer_products')
      .select('id, designer_id')
      .eq('id', productId)
      .maybeSingle();

    if (productLookupError || !product || product.designer_id !== designerProfile.id) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- FEE POLICY: no mock payments. Either the fee is server-side waived,
    // or a verified gateway charge is required (not enabled yet). ---
    const { data: feePolicyRow } = await supabase
      .from('pricing_config')
      .select('config_value')
      .eq('config_key', 'fee_policy')
      .maybeSingle();
    const feePolicy = (feePolicyRow?.config_value ?? {}) as Record<string, unknown>;
    const threeDFeeWaived = feePolicy.three_d_fee_waived !== false; // default: waived

    if (!threeDFeeWaived) {
      return new Response(
        JSON.stringify({
          error: '3D generation fee payment is not available yet. Please try again later.',
          code: 'PAYMENT_NOT_CONFIGURED',
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`3D generation fee waived (${currency} ${fee}) for product ${productId}`);

    // Update the design_listings table
    const { data: listing, error: listingError } = await supabase
      .from('design_listings')
      .update({
        three_d_fee_paid: true,
        three_d_fee_amount: 0, // waived — nothing was charged
        updated_at: new Date().toISOString(),
      })
      .eq('product_id', productId)
      .select()
      .single();

    if (listingError) {
      console.error('Failed to update listing:', listingError);
      return new Response(
        JSON.stringify({ error: 'Failed to update listing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('3D generation fee payment successful:', listing);

    return new Response(
      JSON.stringify({
        success: true,
        waived: true,
        message: '3D generation enabled (fee waived). You can now generate 3D models for this design.',
        listing,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing 3D generation fee:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
