import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyStatusRequest {
  productId: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { productId, status, rejectionReason }: NotifyStatusRequest = await req.json();
    console.log(`Notifying product ${productId} status: ${status}`);

    // Fetch product and designer details
    const { data: product, error: productError } = await supabase
      .from("designer_products")
      .select(`
        *,
        designer:designer_profiles(name, email)
      `)
      .eq("id", productId)
      .single();

    if (productError || !product) {
      console.error("Error fetching product:", productError);
      throw new Error("Product not found");
    }

    const designer = product.designer;
    if (!designer) {
      throw new Error("Designer not found");
    }

    // Get designer's user_id for notification
    const { data: designerProfile } = await supabase
      .from("designer_profiles")
      .select("user_id")
      .eq("id", product.designer_id)
      .single();

    let emailSubject = "";
    let emailHtml = "";
    let notificationTitle = "";
    let notificationMessage = "";
    let notificationType = "";

    if (status === "approved") {
      // Calculate markup percentage
      const markup = product.base_price > 0 
        ? Math.round(((product.designer_price - product.base_price) / product.base_price) * 100)
        : 0;
      const designerEarnings = Math.round((product.designer_price - product.base_price) * 0.7);

      notificationTitle = "Product Approved! 🎉";
      notificationMessage = `Your product "${product.name}" has been approved and is now live on the marketplace!`;
      notificationType = "product_approval";
      emailSubject = `🎉 Your Product "${product.name}" Has Been Approved!`;
      emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: #ffffff;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-top: none;
              }
              .product-card {
                background: #f9fafb;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .pricing-table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
              }
              .pricing-table td {
                padding: 10px;
                border-bottom: 1px solid #e5e7eb;
              }
              .pricing-table td:last-child {
                text-align: right;
                font-weight: 600;
              }
              .earnings-highlight {
                background: #ecfdf5;
                border: 1px solid #10b981;
                border-radius: 8px;
                padding: 15px;
                margin: 15px 0;
                text-align: center;
              }
              .button {
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                padding: 20px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎉 Congratulations!</h1>
            </div>
            <div class="content">
              <p>Hi ${designer.name},</p>
              
              <p>Great news! Your product has been approved and is now live on our marketplace!</p>
              
              <div class="product-card">
                <h2 style="margin-top: 0;">${product.name}</h2>
                <p><strong>Category:</strong> ${product.category}</p>
                
                <table class="pricing-table">
                  <tr>
                    <td>Manufacturing Base Price</td>
                    <td>₹${Number(product.base_price).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td>Selling Price</td>
                    <td>₹${Number(product.designer_price).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td>Your Markup</td>
                    <td>${markup}%</td>
                  </tr>
                </table>
                
                <div class="earnings-highlight">
                  <p style="margin: 0; color: #059669; font-size: 18px;">
                    <strong>Your Earnings Per Sale: ₹${designerEarnings.toLocaleString('en-IN')}</strong>
                  </p>
                  <p style="margin: 5px 0 0; color: #6b7280; font-size: 12px;">
                    (70% of markup on base manufacturing price)
                  </p>
                </div>
              </div>
              
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Your product is now visible to customers on the marketplace</li>
                <li>You'll receive email notifications when someone purchases your product</li>
                <li>Track your sales and earnings in your designer dashboard</li>
                <li>Use the Marketing Toolkit to promote your product</li>
              </ul>
              
              <center>
                <a href="https://formo.co.in/designer-dashboard" class="button">
                  View Dashboard
                </a>
              </center>
              
              <p>Need help? Check out our <a href="https://formo.co.in/creator-faq">Creator FAQ</a> or contact our support team.</p>
              
              <p>Happy selling!<br>The Formo Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Formo. All rights reserved.</p>
            </div>
          </body>
        </html>
      `;
    } else {
      notificationTitle = "Product Requires Revision";
      notificationMessage = `Your product "${product.name}" needs some changes before approval. Please review the feedback.`;
      notificationType = "product_rejection";
      emailSubject = `Product "${product.name}" Requires Revision`;
      emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: #ef4444;
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: #ffffff;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-top: none;
              }
              .product-card {
                background: #f9fafb;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .rejection-reason {
                background: #fef2f2;
                border-left: 4px solid #ef4444;
                padding: 15px;
                margin: 20px 0;
              }
              .button {
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                padding: 20px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Product Requires Revision</h1>
            </div>
            <div class="content">
              <p>Hi ${designer.name},</p>
              
              <p>Thank you for submitting your product. After review, we need you to make some revisions before we can approve it.</p>
              
              <div class="product-card">
                <h2 style="margin-top: 0;">${product.name}</h2>
                <p><strong>Category:</strong> ${product.category}</p>
              </div>
              
              <div class="rejection-reason">
                <h3 style="margin-top: 0; color: #ef4444;">Reason for Revision:</h3>
                <p>${rejectionReason || 'Please review the product guidelines and make necessary adjustments.'}</p>
              </div>
              
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Review the feedback provided above</li>
                <li>Make the necessary changes to your product</li>
                <li>Resubmit your product for review</li>
              </ul>
              
              <center>
                <a href="https://formo.co.in/product-edit/${productId}" class="button">
                  Edit & Resubmit Product
                </a>
              </center>
              
              <p>If you have any questions about this feedback, please don't hesitate to reach out to our support team.</p>
              
              <p>Best regards,<br>The Formo Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Formo. All rights reserved.</p>
            </div>
          </body>
        </html>
      `;
    }

    // Send in-app notification
    if (designerProfile?.user_id) {
      await supabase
        .from("notifications")
        .insert({
          user_id: designerProfile.user_id,
          title: notificationTitle,
          message: notificationMessage,
          type: notificationType,
          link: status === "rejected" ? `/product-edit/${productId}` : `/designer-dashboard`,
        });
    }

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Parametric Furniture <notifications@resend.dev>",
      to: [designer.email],
      subject: emailSubject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-product-status:", error);
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
