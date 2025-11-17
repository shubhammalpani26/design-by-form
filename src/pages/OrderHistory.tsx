import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Package, TrendingUp, DollarSign, ShoppingBag, Download, FileText } from 'lucide-react';
import { downloadInvoice } from '@/lib/invoiceGenerator';

interface Order {
  id: string;
  status: string;
  total_amount: number;
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  invoice_number: string;
  invoice_date: string;
  created_at: string;
  shipping_address: any;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  designer_earnings: number;
  created_at: string;
  product: {
    name: string;
    image_url: string;
  };
  order: Order;
}

interface Analytics {
  totalOrders: number;
  totalEarnings: number;
  averageOrderValue: number;
  totalProductsSold: number;
  topProduct: {
    name: string;
    sales: number;
  } | null;
}

const OrderHistory = () => {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [isDesigner, setIsDesigner] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalOrders: 0,
    totalEarnings: 0,
    averageOrderValue: 0,
    totalProductsSold: 0,
    topProduct: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Not authenticated',
          description: 'Please log in to view your order history',
          variant: 'destructive',
        });
        return;
      }

      // Check if user is a designer
      const { data: profile } = await supabase
        .from('designer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        // Designer view - show earnings from products
        setIsDesigner(true);

        // Fetch order items with product and order details
        const { data: items, error } = await supabase
          .from('order_items')
          .select(`
            *,
            product:designer_products(name, image_url),
            order:orders(*)
          `)
          .eq('designer_id', profile.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setOrderItems(items || []);

        // Calculate analytics
        if (items && items.length > 0) {
          const totalEarnings = items.reduce((sum, item) => sum + Number(item.designer_earnings), 0);
          const uniqueOrders = new Set(items.map(item => item.order_id));
          const totalProductsSold = items.reduce((sum, item) => sum + item.quantity, 0);
          
          // Calculate product sales
          const productSales = items.reduce((acc, item) => {
            const productName = item.product?.name || 'Unknown';
            acc[productName] = (acc[productName] || 0) + item.quantity;
            return acc;
          }, {} as Record<string, number>);

          const topProductEntry = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0];

          setAnalytics({
            totalOrders: uniqueOrders.size,
            totalEarnings,
            averageOrderValue: totalEarnings / uniqueOrders.size,
            totalProductsSold,
            topProduct: topProductEntry ? { name: topProductEntry[0], sales: topProductEntry[1] } : null,
          });
        }
      } else {
        // Customer view - show their orders
        setIsDesigner(false);
        
        const { data: orders, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCustomerOrders(orders || []);
      }
    } catch (error) {
      console.error('Error fetching order history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load order history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadInvoice = async (orderId: string, invoiceNumber: string) => {
    setIsDownloading(orderId);
    try {
      await downloadInvoice(orderId, invoiceNumber);
      toast({
        title: 'Invoice downloaded',
        description: 'Your invoice has been opened in a new window',
      });
    } catch (error: any) {
      toast({
        title: 'Download failed',
        description: error.message || 'Failed to download invoice',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'processing':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-12">
          <p className="text-center text-muted-foreground">Loading order history...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {isDesigner ? 'Order History & Analytics' : 'My Orders'}
          </h1>
          <p className="text-muted-foreground">
            {isDesigner 
              ? 'Track your sales performance and order details'
              : 'View your order history and download invoices'
            }
          </p>
        </div>

        {isDesigner ? (
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="orders">Orders ({orderItems.length})</TabsTrigger>
            </TabsList>

          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">Orders containing your products</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPrice(analytics.totalEarnings)}</div>
                  <p className="text-xs text-muted-foreground">Lifetime earnings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPrice(analytics.averageOrderValue)}
                  </div>
                  <p className="text-xs text-muted-foreground">Per order</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Products Sold</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalProductsSold}</div>
                  <p className="text-xs text-muted-foreground">Total units</p>
                </CardContent>
              </Card>
            </div>

            {analytics.topProduct && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Product</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{analytics.topProduct.name}</p>
                      <p className="text-muted-foreground">
                        {analytics.topProduct.sales} units sold
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      #{1}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            {orderItems.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">No orders yet</p>
                  <p className="text-sm text-muted-foreground">
                    Your order history will appear here once customers purchase your products
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <img
                          src={item.product?.image_url || '/placeholder.svg'}
                          alt={item.product?.name || 'Product'}
                          className="w-24 h-24 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {item.product?.name || 'Product'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Order #{item.order_id.slice(0, 8)}
                              </p>
                            </div>
                            <Badge className={getStatusColor(item.order.status)}>
                              {item.order.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Quantity</p>
                              <p className="font-semibold">{item.quantity}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Sale Price</p>
                              <p className="font-semibold">{formatPrice(item.price)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Your Earnings</p>
                              <p className="font-semibold text-green-600">
                                {formatPrice(item.designer_earnings)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Order Date</p>
                              <p className="font-semibold text-sm">
                                {new Date(item.order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        ) : (
          // Customer Orders View
          <div className="space-y-4">
            {customerOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">No orders yet</p>
                  <p className="text-sm text-muted-foreground">
                    Your orders will appear here once you make a purchase
                  </p>
                </CardContent>
              </Card>
            ) : (
              customerOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">
                          Order #{order.invoice_number || order.id.slice(0, 8)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Subtotal</p>
                        <p className="font-semibold">{formatPrice(order.subtotal)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {order.igst_amount > 0 ? 'IGST @ 18%' : 'CGST+SGST @ 18%'}
                        </p>
                        <p className="font-semibold">
                          {formatPrice(order.igst_amount > 0 ? order.igst_amount : order.cgst_amount + order.sgst_amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                        <p className="font-bold text-lg">{formatPrice(order.total_amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Invoice</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadInvoice(order.id, order.invoice_number)}
                          disabled={isDownloading === order.id}
                          className="mt-1"
                        >
                          {isDownloading === order.id ? (
                            <>
                              <FileText className="h-4 w-4 mr-1 animate-pulse" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {order.shipping_address && (
                      <div className="text-sm">
                        <p className="font-medium mb-1">Shipping Address:</p>
                        <p className="text-muted-foreground">
                          {order.shipping_address.name}<br />
                          {order.shipping_address.address}, {order.shipping_address.city}<br />
                          {order.shipping_address.state} - {order.shipping_address.zipCode}<br />
                          Phone: {order.shipping_address.phone}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OrderHistory;
