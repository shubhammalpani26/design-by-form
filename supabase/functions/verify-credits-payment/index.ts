import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, packageType, credits } = await req.json();

    // Verify signature
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    
    const expectedSignature = createHmac("sha256", razorpayKeySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error('Signature verification failed');
      return new Response(
        JSON.stringify({ error: 'Payment verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get pricing config
    const { data: pricingData } = await supabase
      .from('pricing_config')
      .select('config_value')
      .eq('config_key', 'credit_packages')
      .single();

    const packages = pricingData?.config_value as any;
    const selectedPackage = packages?.[packageType];

    if (!selectedPackage) {
      return new Response(
        JSON.stringify({ error: 'Invalid package type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add credits to user account
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!userCredits) {
      await supabase.from('user_credits').insert({
        user_id: user.id,
        balance: selectedPackage.credits,
        free_credits_reset_at: new Date(new Date().setMonth(new Date().getMonth() + 1))
      });
    } else {
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
      metadata: { 
        package: packageType, 
        price: selectedPackage.price,
        razorpay_order_id,
        razorpay_payment_id,
      }
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
    console.error('Error in verify-credits-payment function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
