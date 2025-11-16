import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyOrderRequest {
  orderId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { orderId }: NotifyOrderRequest = await req.json();
    console.log(`Processing order notification for order: ${orderId}`);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Error fetching order:", orderError);
      throw new Error("Order not found");
    }

    // Group order items by designer
    const designerOrders = new Map<string, any[]>();
    
    for (const item of order.order_items) {
      if (!item.designer_id) continue;
      
      if (!designerOrders.has(item.designer_id)) {
        designerOrders.set(item.designer_id, []);
      }
      designerOrders.get(item.designer_id)!.push(item);
    }

    console.log(`Notifying ${designerOrders.size} designers`);

    // Send email to each designer
    for (const [designerId, items] of designerOrders.entries()) {
      // Fetch designer details
      const { data: designer, error: designerError } = await supabase
        .from("designer_profiles")
        .select("name, email")
        .eq("id", designerId)
        .single();

      if (designerError || !designer) {
        console.error(`Error fetching designer ${designerId}:`, designerError);
        continue;
      }

      // Fetch product names for the items
      const productIds = items.map(item => item.product_id);
      const { data: products } = await supabase
        .from("designer_products")
        .select("id, name")
        .in("id", productIds);

      const productMap = new Map(products?.map(p => [p.id, p.name]) || []);

      // Calculate total earnings for this designer
      const totalEarnings = items.reduce((sum, item) => sum + Number(item.designer_earnings), 0);

      // Build items list HTML
      const itemsHtml = items.map(item => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            ${productMap.get(item.product_id) || 'Unknown Product'}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            ₹${Number(item.designer_earnings).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </td>
        </tr>
      `).join('');

      // Send email
      try {
        const emailResponse = await resend.emails.send({
          from: "Parametric Furniture <orders@resend.dev>",
          to: [designer.email],
          subject: `New Order Received - Order #${orderId.slice(0, 8)}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                    line-height: 1.6;
                    color: #333;
                  }
                  .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                  }
                  .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 8px 8px 0 0;
                    text-align: center;
                  }
                  .content {
                    background: white;
                    padding: 30px;
                    border: 1px solid #e5e7eb;
                    border-top: none;
                    border-radius: 0 0 8px 8px;
                  }
                  .order-info {
                    background: #f9fafb;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                  }
                  table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                  }
                  th {
                    background: #f3f4f6;
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                    border-bottom: 2px solid #e5e7eb;
                  }
                  .total {
                    background: #f0fdf4;
                    padding: 15px;
                    border-radius: 8px;
                    margin-top: 20px;
                    text-align: right;
                  }
                  .total-amount {
                    font-size: 24px;
                    font-weight: bold;
                    color: #16a34a;
                  }
                  .button {
                    display: inline-block;
                    padding: 12px 24px;
                    background: #667eea;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    margin-top: 20px;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0;">🎉 New Order Received!</h1>
                  </div>
                  
                  <div class="content">
                    <p>Hi ${designer.name},</p>
                    
                    <p>Great news! A customer has purchased ${items.length === 1 ? 'one of your products' : `${items.length} of your products`}.</p>
                    
                    <div class="order-info">
                      <strong>Order ID:</strong> #${orderId.slice(0, 8)}<br>
                      <strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString('en-IN', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    
                    <h3>Order Details</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th style="text-align: center;">Quantity</th>
                          <th style="text-align: right;">Your Earnings</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                    </table>
                    
                    <div class="total">
                      <div>Total Earnings from this Order:</div>
                      <div class="total-amount">₹${totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    </div>
                    
                    <p style="margin-top: 30px;">
                      Your earnings will be paid out according to your payment schedule. 
                      You can track all your earnings in your creator dashboard.
                    </p>
                    
                    <center>
                      <a href="${supabaseUrl.replace('supabase.co', 'lovable.app')}/creator-earnings" class="button">
                        View Earnings Dashboard
                      </a>
                    </center>
                    
                    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                      Keep up the great work! Every sale brings you closer to your goals.
                    </p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });

        console.log(`Email sent to ${designer.email}:`, emailResponse);
      } catch (emailError) {
        console.error(`Error sending email to ${designer.email}:`, emailError);
        // Continue processing other designers even if one fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notifications sent to ${designerOrders.size} designers` 
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
    console.error("Error in notify-designer-order function:", error);
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
