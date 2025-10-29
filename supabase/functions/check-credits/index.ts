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

    const { action, creditsNeeded = 1 } = await req.json();

    // Get user credits
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('balance, free_credits_reset_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (creditsError) {
      console.error('Error fetching credits:', creditsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch credits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no credits record exists, create one
    if (!userCredits) {
      const { data: newCredits, error: insertError } = await supabase
        .from('user_credits')
        .insert({
          user_id: user.id,
          balance: 10,
          free_credits_reset_at: new Date(new Date().setMonth(new Date().getMonth() + 1))
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating credits:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create credits' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          hasCredits: true, 
          balance: 10,
          creditsNeeded 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if credits need to be reset
    const resetDate = new Date(userCredits.free_credits_reset_at);
    if (resetDate <= new Date()) {
      // Reset monthly credits
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({
          balance: userCredits.balance + 10,
          free_credits_reset_at: new Date(new Date().setMonth(new Date().getMonth() + 1))
        })
        .eq('user_id', user.id);

      if (!updateError) {
        await supabase.from('credit_transactions').insert({
          user_id: user.id,
          amount: 10,
          type: 'monthly_reset',
          description: 'Monthly free credits reset'
        });
        
        userCredits.balance += 10;
      }
    }

    if (action === 'check') {
      return new Response(
        JSON.stringify({ 
          hasCredits: userCredits.balance >= creditsNeeded,
          balance: userCredits.balance,
          creditsNeeded
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'deduct') {
      if (userCredits.balance < creditsNeeded) {
        return new Response(
          JSON.stringify({ 
            error: 'Insufficient credits',
            balance: userCredits.balance,
            creditsNeeded
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Deduct credits
      const { error: deductError } = await supabase
        .from('user_credits')
        .update({ balance: userCredits.balance - creditsNeeded })
        .eq('user_id', user.id);

      if (deductError) {
        console.error('Error deducting credits:', deductError);
        return new Response(
          JSON.stringify({ error: 'Failed to deduct credits' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log transaction
      await supabase.from('credit_transactions').insert({
        user_id: user.id,
        amount: -creditsNeeded,
        type: 'usage',
        description: 'AI design generation'
      });

      // Log analytics
      await supabase.from('usage_analytics').insert({
        user_id: user.id,
        action_type: 'ai_generation'
      });

      return new Response(
        JSON.stringify({ 
          success: true,
          balance: userCredits.balance - creditsNeeded
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-credits function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
