import { supabase } from "@/integrations/supabase/client";

export interface InvoiceData {
  order: any;
  items: any[];
  company: any;
}

export const generateInvoicePDF = async (orderId: string): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('generate-invoice', {
    body: { orderId }
  });

  if (error) throw error;
  
  return data.invoice;
};

export const downloadInvoice = async (orderId: string, invoiceNumber: string) => {
  try {
    const invoiceHtml = await generateInvoicePDF(orderId);
    
    // Create a new window with the invoice
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Please allow popups to download invoice');
    }
    
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
    };
    
    return true;
  } catch (error) {
    console.error('Error downloading invoice:', error);
    throw error;
  }
};
