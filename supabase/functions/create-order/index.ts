import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateOrderRequest {
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
  };
  paymentMethod: string;
  paymentId?: string;
  customerGSTIN?: string;
  customerState: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the user from the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { shippingAddress, paymentMethod, paymentId, customerGSTIN, customerState }: CreateOrderRequest = await req.json();
    console.log(`Processing order for user: ${user.id}`);

    // Fetch company config for GST calculation
    const { data: companyConfig, error: configError } = await supabase
      .from('company_config')
      .select('*')
      .limit(1)
      .single();

    if (configError) {
      console.error('Company config error:', configError);
      throw new Error('Company configuration not found');
    }

    // Fetch user's cart
    const { data: cartItems, error: cartError } = await supabase
      .from("cart")
      .select(`
        *,
        designer_products:product_id (
          id,
          name,
          designer_id,
          designer_price,
          base_price,
          designer_profiles!inner(id, name)
        )
      `)
      .eq("user_id", user.id);

    if (cartError || !cartItems || cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    // Calculate subtotal (before GST) and commission
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of cartItems) {
      const product = item.designer_products;
      const itemTotal = Number(product.designer_price) * item.quantity;
      subtotal += itemTotal;

      // Calculate commission (7% of sale)
      const commissionRate = 0.07;
      const commissionAmount = itemTotal * commissionRate;
      const designerEarnings = itemTotal - commissionAmount;

      orderItemsData.push({
        product_id: product.id,
        designer_id: product.designer_id,
        quantity: item.quantity,
        price: Number(product.designer_price),
        designer_price: Number(product.designer_price),
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        designer_earnings: designerEarnings,
        customizations: item.customizations || {}
      });
    }

    // Calculate GST
    const GST_RATE = 18; // 18% GST for furniture
    const isIGST = customerState !== companyConfig.state;
    
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isIGST) {
      // Inter-state: IGST
      igstAmount = (subtotal * GST_RATE) / 100;
    } else {
      // Intra-state: CGST + SGST
      cgstAmount = (subtotal * GST_RATE / 2) / 100;
      sgstAmount = (subtotal * GST_RATE / 2) / 100;
    }

    const totalAmount = subtotal + cgstAmount + sgstAmount + igstAmount;

    console.log('GST Calculation:', { subtotal, cgstAmount, sgstAmount, igstAmount, totalAmount, isIGST });

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total_amount: totalAmount,
        subtotal: subtotal,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        igst_amount: igstAmount,
        gst_rate: GST_RATE,
        customer_gstin: customerGSTIN,
        customer_state: customerState,
        shipping_address: shippingAddress,
        payment_details: {
          method: paymentMethod,
          payment_id: paymentId,
          paid_at: new Date().toISOString()
        },
        status: "pending"
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Error creating order:", orderError);
      throw new Error("Failed to create order");
    }

    console.log(`Order created: ${order.id}`);

    // Create order items
    const orderItemsWithOrderId = orderItemsData.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsWithOrderId);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      throw new Error("Failed to create order items");
    }

    // Create designer earnings records
    const earningsData = orderItemsData.map(item => ({
      designer_id: item.designer_id,
      product_id: item.product_id,
      order_id: order.id,
      sale_amount: item.price * item.quantity,
      royalty_percentage: 7,
      royalty_amount: item.commission_amount,
      commission_amount: item.commission_amount,
      status: "pending"
    }));

    const { error: earningsError } = await supabase
      .from("designer_earnings")
      .insert(earningsData);

    if (earningsError) {
      console.error("Error recording earnings:", earningsError);
    }

    // Update product sales counts
    for (const item of orderItemsData) {
      // Fetch current sales
      const { data: product } = await supabase
        .from("designer_products")
        .select("total_sales")
        .eq("id", item.product_id)
        .single();
      
      if (product) {
        const { error: updateError } = await supabase
          .from("designer_products")
          .update({ total_sales: (product.total_sales || 0) + item.quantity })
          .eq("id", item.product_id);
        
        if (updateError) {
          console.error("Error updating sales count:", updateError);
        }
      }
    }

    // Clear the cart
    const { error: clearCartError } = await supabase
      .from("cart")
      .delete()
      .eq("user_id", user.id);

    if (clearCartError) {
      console.error("Error clearing cart:", clearCartError);
    }

    // Notify designers (async, don't wait for it)
    supabase.functions.invoke("notify-designer-order", {
      body: { orderId: order.id }
    }).catch(err => console.error("Error notifying designers:", err));

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId: order.id,
        message: "Order created successfully"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in create-order function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
