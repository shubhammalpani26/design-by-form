import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { packageType } = await req.json();

    // Get pricing config
    const { data: pricingData } = await supabase
      .from('pricing_config')
      .select('config_value')
      .eq('config_key', 'credit_packages')
      .single();

    if (!pricingData) {
      return new Response(
        JSON.stringify({ error: 'Pricing configuration not found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const packages = pricingData.config_value as any;
    const selectedPackage = packages[packageType];

    if (!selectedPackage) {
      return new Response(
        JSON.stringify({ error: 'Invalid package type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For now, we'll simulate a purchase
    // In production, this would integrate with Stripe
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!userCredits) {
      // Create credits record
      await supabase.from('user_credits').insert({
        user_id: user.id,
        balance: selectedPackage.credits,
        free_credits_reset_at: new Date(new Date().setMonth(new Date().getMonth() + 1))
      });
    } else {
      // Add credits
      await supabase
        .from('user_credits')
        .update({ balance: userCredits.balance + selectedPackage.credits })
        .eq('user_id', user.id);
    }

    // Log transaction
    await supabase.from('credit_transactions').insert({
      user_id: user.id,
      amount: selectedPackage.credits,
      type: 'purchase',
      description: `Purchased ${packageType} package`,
      metadata: { package: packageType, price: selectedPackage.price }
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        credits: selectedPackage.credits,
        newBalance: (userCredits?.balance || 0) + selectedPackage.credits
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in purchase-credits function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
