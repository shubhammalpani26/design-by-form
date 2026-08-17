import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { productId, paymentMethod, country } = await req.json();

    if (!productId) {
      throw new Error('Product ID is required');
    }

    // Check if designer profile exists
    const { data: designerProfile, error: profileError } = await supabase
      .from('designer_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !designerProfile) {
      throw new Error('Designer profile not found. Please complete onboarding first.');
    }

    // --- OWNERSHIP: the product must belong to this designer ---
    const { data: product, error: productLookupError } = await supabase
      .from('designer_products')
      .select('id, designer_id')
      .eq('id', productId)
      .maybeSingle();

    if (productLookupError) throw productLookupError;
    if (!product || product.designer_id !== designerProfile.id) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine listing fee based on country
    const isInternational = country && country !== 'IN';
    const listingFee = isInternational ? 15 : 1000; // $15 USD or Rs. 1,000
    const currency = isInternational ? 'USD' : 'INR';

    // --- FEE POLICY: no mock payments. Either the fee is server-side waived
    // (current launch policy) or a real, verified gateway charge is required. ---
    const { data: feePolicyRow } = await supabase
      .from('pricing_config')
      .select('config_value')
      .eq('config_key', 'fee_policy')
      .maybeSingle();
    const feePolicy = (feePolicyRow?.config_value ?? {}) as Record<string, unknown>;
    const listingFeeWaived = feePolicy.listing_fee_waived !== false; // default: waived

    if (!listingFeeWaived) {
      return new Response(
        JSON.stringify({
          error: 'Listing fee payment is not available yet. Please try again later.',
          code: 'PAYMENT_NOT_CONFIGURED',
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Listing fee waived (${currency} ${listingFee}) for product ${productId}`);

    // Create or update listing with fee paid
    const { data: listing, error: listingError } = await supabase
      .from('design_listings')
      .upsert({
        product_id: productId,
        listing_fee_paid: true,
        listing_fee_amount: 0, // waived — nothing was charged
      }, {
        onConflict: 'product_id'
      })
      .select()
      .single();

    if (listingError) {
      console.error('Listing error:', listingError);
      throw new Error('Failed to create listing');
    }

    // Update product status to approved (in production, this would be pending review)
    const { error: productError } = await supabase
      .from('designer_products')
      .update({ 
        status: 'pending', // Admin will review and approve
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (productError) {
      console.error('Product update error:', productError);
      throw new Error('Failed to update product');
    }

    return new Response(
      JSON.stringify({
        success: true,
        listing,
        waived: true,
        message: 'Listing fee is waived right now. Your design is now under review.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Listing fee error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
