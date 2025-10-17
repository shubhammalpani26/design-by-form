import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  status: string;
  base_price: number;
  designer_price: number;
  total_sales: number;
  created_at: string;
  image_url: string;
  rejection_reason: string | null;
}

interface Sale {
  id: string;
  sale_date: string;
  sale_price: number;
  commission_amount: number;
  designer_earnings: number;
  product: {
    name: string;
  };
}

const DesignerDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [earnings, setEarnings] = useState({ total: 0, pending: 0, paid: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch designer profile
      const { data: profile } = await supabase
        .from('designer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast({
          title: 'Not a designer',
          description: 'Please sign up as a designer first',
          variant: 'destructive',
        });
        return;
      }

      // Fetch products
      const { data: productsData } = await supabase
        .from('designer_products')
        .select('*')
        .eq('designer_id', profile.id)
        .order('created_at', { ascending: false });

      setProducts(productsData || []);

      // Fetch sales
      const { data: salesData } = await supabase
        .from('product_sales')
        .select(`
          *,
          product:designer_products(name)
        `)
        .eq('designer_id', profile.id)
        .order('sale_date', { ascending: false })
        .limit(10);

      setSales(salesData || []);

      // Calculate earnings
      const totalEarnings = salesData?.reduce((sum, sale) => sum + Number(sale.designer_earnings), 0) || 0;
      setEarnings({
        total: totalEarnings,
        pending: totalEarnings * 0.3, // Simulated pending
        paid: totalEarnings * 0.7, // Simulated paid
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'rejected':
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
          <p className="text-center text-muted-foreground">Loading dashboard...</p>
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
          <h1 className="text-4xl font-bold mb-2">Designer Dashboard</h1>
          <p className="text-muted-foreground">Manage your products and track your earnings</p>
        </div>

        {/* Earnings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">₹{earnings.total.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">₹{earnings.pending.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">₹{earnings.paid.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList>
            <TabsTrigger value="products">My Products ({products.length})</TabsTrigger>
            <TabsTrigger value="sales">Recent Sales ({sales.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Your Products</h2>
              <Link to="/design-studio">
                <Button>Create New Design</Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id}>
                  <div className="aspect-square overflow-hidden rounded-t-lg bg-accent">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <Badge className={getStatusColor(product.status)}>
                        {product.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Base: ₹{product.base_price.toLocaleString()} | Your Price: ₹{product.designer_price.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Total Sales: {product.total_sales}
                    </p>
                    {product.rejection_reason && (
                      <p className="text-sm text-red-600 mt-2">
                        Rejection Reason: {product.rejection_reason}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(product.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {products.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground mb-4">You haven't created any products yet</p>
                  <Link to="/design-studio">
                    <Button>Create Your First Design</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sales" className="mt-6">
            <h2 className="text-2xl font-bold mb-6">Recent Sales</h2>
            
            <div className="space-y-4">
              {sales.map((sale) => (
                <Card key={sale.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{sale.product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(sale.sale_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          +₹{sale.designer_earnings.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Sale: ₹{sale.sale_price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {sales.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No sales yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default DesignerDashboard;
