import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const priceUpdateSchema = z.object({
  productId: z.string().uuid(),
  basePrice: z.number().positive().max(1000000)
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify admin role server-side
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const { productId, basePrice } = priceUpdateSchema.parse(body);

    // Fetch current product to calculate markup percentage
    const { data: product, error: fetchError } = await supabase
      .from('designer_products')
      .select('base_price, designer_price')
      .eq('id', productId)
      .single();

    if (fetchError || !product) {
      throw new Error('Product not found');
    }

    // Calculate the original markup percentage
    const originalMarkup = product.base_price > 0 
      ? (product.designer_price - product.base_price) / product.base_price 
      : 0.5; // Default to 50% if base was 0

    // Apply same markup percentage to new base price
    const newDesignerPrice = Math.round(basePrice * (1 + originalMarkup));

    console.log(`Price update: base ${product.base_price} → ${basePrice}, markup ${(originalMarkup * 100).toFixed(1)}%, designer ${product.designer_price} → ${newDesignerPrice}`);

    // Update both base price and designer price
    const { error: updateError } = await supabase
      .from('designer_products')
      .update({ 
        base_price: basePrice,
        designer_price: newDesignerPrice,
        original_designer_price: newDesignerPrice
      })
      .eq('id', productId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Price updated successfully',
        basePrice,
        designerPrice: newDesignerPrice,
        markupPercentage: Math.round(originalMarkup * 100)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-update-price:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
