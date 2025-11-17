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

    const { orderId } = await req.json();

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // Fetch order items with product details
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        product:designer_products(name, category)
      `)
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    // Fetch company config
    const { data: companyConfig, error: configError } = await supabase
      .from('company_config')
      .select('*')
      .limit(1)
      .single();

    if (configError) throw configError;

    // Generate HTML invoice
    const invoiceHtml = generateInvoiceHTML(order, orderItems, companyConfig);

    return new Response(
      JSON.stringify({ 
        success: true, 
        invoice: invoiceHtml,
        invoiceNumber: order.invoice_number,
        invoiceDate: order.invoice_date
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateInvoiceHTML(order: any, items: any[], company: any) {
  const invoiceDate = new Date(order.invoice_date).toLocaleDateString('en-IN');
  const isIGST = order.customer_state && order.customer_state !== company.state;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .invoice-header { text-align: center; margin-bottom: 30px; }
    .company-name { font-size: 24px; font-weight: bold; }
    .invoice-title { font-size: 18px; margin: 10px 0; }
    .info-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .info-box { width: 48%; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .text-right { text-align: right; }
    .total-section { margin-top: 20px; }
    .grand-total { font-weight: bold; font-size: 16px; }
  </style>
</head>
<body>
  <div class="invoice-header">
    <div class="company-name">${company.trade_name || company.legal_name}</div>
    <div>${company.legal_name}</div>
    <div>${company.address}, ${company.city}, ${company.state} - ${company.pincode}</div>
    <div>GSTIN: ${company.gstin}</div>
    <div>Email: ${company.email} | Phone: ${company.phone}</div>
    <div class="invoice-title">TAX INVOICE</div>
  </div>

  <div class="info-section">
    <div class="info-box">
      <strong>Invoice Details:</strong><br>
      Invoice No: ${order.invoice_number}<br>
      Invoice Date: ${invoiceDate}<br>
      Order ID: ${order.id.substring(0, 8)}
    </div>
    <div class="info-box">
      <strong>Bill To:</strong><br>
      ${order.shipping_address?.name || 'Customer'}<br>
      ${order.shipping_address?.address || ''}<br>
      ${order.shipping_address?.city || ''}, ${order.shipping_address?.state || ''}<br>
      ${order.customer_gstin ? `GSTIN: ${order.customer_gstin}` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>S.No</th>
        <th>Product Description</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>Taxable Value</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.product?.name || 'Product'} (${item.product?.category || ''})</td>
          <td>${item.quantity}</td>
          <td class="text-right">₹${(item.price / item.quantity).toFixed(2)}</td>
          <td class="text-right">₹${item.price.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="total-section">
    <table style="width: 50%; margin-left: auto;">
      <tr>
        <td><strong>Subtotal</strong></td>
        <td class="text-right">₹${order.subtotal.toFixed(2)}</td>
      </tr>
      ${isIGST ? `
        <tr>
          <td>IGST @ ${order.gst_rate}%</td>
          <td class="text-right">₹${order.igst_amount.toFixed(2)}</td>
        </tr>
      ` : `
        <tr>
          <td>CGST @ ${(order.gst_rate / 2)}%</td>
          <td class="text-right">₹${order.cgst_amount.toFixed(2)}</td>
        </tr>
        <tr>
          <td>SGST @ ${(order.gst_rate / 2)}%</td>
          <td class="text-right">₹${order.sgst_amount.toFixed(2)}</td>
        </tr>
      `}
      <tr class="grand-total">
        <td><strong>Grand Total</strong></td>
        <td class="text-right">₹${order.total_amount.toFixed(2)}</td>
      </tr>
    </table>
  </div>

  <div style="margin-top: 40px; text-align: center; font-size: 12px;">
    <p>This is a computer-generated invoice and does not require a signature.</p>
  </div>
</body>
</html>
  `;
}
