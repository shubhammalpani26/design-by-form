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
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { planType, billingCycle } = await req.json();

    // Define plan pricing and limits (amounts in paise, 1 INR = 100 paise)
    // null for listings means unlimited
    const planConfig = {
      creator: {
        monthly: { amount: 299900, listings: 5, models: 5 }, // ₹2,999/month
        yearly: { amount: 2999000, listings: 5, models: 5 }  // ₹29,990/year
      },
      pro: {
        monthly: { amount: 999900, listings: null, models: 20 }, // ₹9,999/month, unlimited listings
        yearly: { amount: 9999000, listings: null, models: 20 }  // ₹99,990/year, unlimited listings
      }
    };

    const config = planConfig[planType as keyof typeof planConfig]?.[billingCycle as keyof typeof planConfig.creator];
    if (!config) {
      throw new Error('Invalid plan configuration');
    }

    // Create Razorpay order (for one-time payment)
    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: config.amount,
        currency: 'INR',
        receipt: `receipt_${planType}_${Date.now()}`,
        notes: {
          user_id: user.id,
          plan_type: planType,
          billing_cycle: billingCycle
        }
      }),
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.text();
      console.error('Razorpay error:', error);
      throw new Error('Failed to create Razorpay order');
    }

    const razorpayOrder = await orderResponse.json();

    // Calculate period dates
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    if (billingCycle === 'monthly') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    } else {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    }

    // Create or update subscription in database
    const { data: subscription, error: dbError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        plan_type: planType,
        status: 'pending',
        razorpay_subscription_id: razorpayOrder.id,
        billing_cycle: billingCycle,
        current_period_start: currentPeriodStart.toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        listings_limit: config.listings,
        three_d_models_limit: config.models,
        listings_used: 0,
        three_d_models_used: 0,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    // Create transaction record
    await supabase
      .from('subscription_transactions')
      .insert({
        user_id: user.id,
        subscription_id: subscription.id,
        amount: config.amount / 100,
        currency: 'INR',
        status: 'pending',
        razorpay_order_id: razorpayOrder.id,
      });

    return new Response(
      JSON.stringify({
        orderId: razorpayOrder.id,
        razorpayKeyId,
        amount: config.amount,
        currency: 'INR',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-razorpay-subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});