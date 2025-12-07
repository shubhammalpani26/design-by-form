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

    // Parse request body
    const { productId } = await req.json();
    
    if (!productId) {
      throw new Error('Product ID is required');
    }

    // Get product details before approving
    const { data: product, error: productError } = await supabase
      .from('designer_products')
      .select('*, designer_profiles(id, name)')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      throw new Error('Product not found');
    }

    // Approve product
    const { error: updateError } = await supabase
      .from('designer_products')
      .update({ status: 'approved' })
      .eq('id', productId);

    if (updateError) throw updateError;

    console.log(`Product ${productId} approved, creating community feed post...`);

    // Auto-publish to community feed when product is approved
    const { error: feedPostError } = await supabase
      .from('feed_posts')
      .insert({
        designer_id: product.designer_id,
        post_type: 'product_launch',
        title: `New Design: ${product.name}`,
        content: product.description || `Check out this new ${product.category} design!`,
        image_url: product.image_url,
        visibility: 'public',
        metadata: {
          product_id: productId,
          category: product.category,
          price: product.designer_price,
          auto_generated: true
        }
      });

    if (feedPostError) {
      console.error('Error creating feed post:', feedPostError);
      // Don't fail the approval if feed post fails
    } else {
      console.log(`Community feed post created for product ${productId}`);
    }

    // Send approval notification
    try {
      await supabase.functions.invoke('notify-product-status', {
        body: { productId, status: 'approved' }
      });
    } catch (notifyError) {
      console.error('Error sending notification:', notifyError);
      // Don't fail if notification fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Product approved and published to community feed',
        feedPostCreated: !feedPostError
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-approve-product:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
