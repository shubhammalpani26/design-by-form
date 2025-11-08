import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

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

    const { targetCurrency } = await req.json();
    const baseCurrency = 'INR';

    console.log('Fetching exchange rate for:', targetCurrency);

    // Check if we have a recent cached rate (less than 24 hours old)
    const { data: cachedRate, error: cacheError } = await supabase
      .from('currency_rates')
      .select('*')
      .eq('base_currency', baseCurrency)
      .eq('target_currency', targetCurrency)
      .single();

    if (cachedRate && !cacheError) {
      const lastUpdated = new Date(cachedRate.last_updated);
      const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);

      // Use cached rate if less than 24 hours old
      if (hoursSinceUpdate < 24) {
        console.log('Using cached rate:', cachedRate.rate);
        return new Response(
          JSON.stringify({ 
            rate: Number(cachedRate.rate),
            fromCache: true 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch fresh rate from free API
    console.log('Fetching fresh rate from API...');
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data = await response.json();
    const rate = data.rates[targetCurrency];

    if (!rate) {
      throw new Error(`Rate not found for ${targetCurrency}`);
    }

    // Update cache
    await supabase
      .from('currency_rates')
      .upsert({
        base_currency: baseCurrency,
        target_currency: targetCurrency,
        rate: rate,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'base_currency,target_currency'
      });

    console.log('Updated cached rate:', rate);

    return new Response(
      JSON.stringify({ 
        rate: Number(rate),
        fromCache: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-exchange-rates:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});