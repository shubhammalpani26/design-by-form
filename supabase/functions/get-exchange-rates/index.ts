import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  targetCurrency: z.string().trim().min(3).max(3).regex(/^[A-Z]{3}$/),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const rawData = await req.json();
    const validationResult = requestSchema.safeParse(rawData);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid currency code. Must be 3 uppercase letters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { targetCurrency } = validationResult.data;
    const baseCurrency = 'INR';

    console.log('Fetching exchange rate for:', targetCurrency);

    const { data: cachedRate, error: cacheError } = await supabase
      .from('currency_rates')
      .select('*')
      .eq('base_currency', baseCurrency)
      .eq('target_currency', targetCurrency)
      .single();

    if (cachedRate && !cacheError) {
      const lastUpdated = new Date(cachedRate.last_updated);
      const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);

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
      JSON.stringify({ error: 'Failed to fetch exchange rate' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
