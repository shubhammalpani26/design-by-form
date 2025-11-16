import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Clock, XCircle, AlertCircle, Package, DollarSign, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  status: string;
  created_at: string;
  image_url: string;
  rejection_reason: string | null;
  base_price: number;
  designer_price: number;
  total_sales: number;
}

interface StatusStep {
  label: string;
  status: 'completed' | 'current' | 'pending' | 'rejected';
  icon: any;
  description: string;
}

const ProductStatusTracker = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

      const { data: productsData } = await supabase
        .from('designer_products')
        .select('*')
        .eq('designer_id', profile.id)
        .order('created_at', { ascending: false });

      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusSteps = (product: Product): StatusStep[] => {
    const steps: StatusStep[] = [
      {
        label: 'Submitted',
        status: 'completed',
        icon: Package,
        description: 'Your design has been submitted for review',
      },
      {
        label: 'Under Review',
        status: product.status === 'pending' ? 'current' : product.status === 'approved' ? 'completed' : 'rejected',
        icon: Clock,
        description: 'Our team is reviewing your design',
      },
    ];

    if (product.status === 'rejected') {
      steps.push({
        label: 'Rejected',
        status: 'rejected',
        icon: XCircle,
        description: product.rejection_reason || 'Your design needs modifications',
      });
    } else if (product.status === 'approved') {
      steps.push({
        label: 'Approved',
        status: 'completed',
        icon: CheckCircle2,
        description: 'Your design is approved and listed',
      });

      if (product.total_sales > 0) {
        steps.push({
          label: 'Sales Generated',
          status: 'completed',
          icon: DollarSign,
          description: `${product.total_sales} sale(s) generated`,
        });
      } else {
        steps.push({
          label: 'Awaiting Sales',
          status: 'current',
          icon: Truck,
          description: 'Your product is live and ready for orders',
        });
      }
    }

    return steps;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'approved':
        return 'bg-green-500';
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
          <p className="text-center text-muted-foreground">Loading...</p>
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
          <h1 className="text-4xl font-bold mb-2">Product Status Tracker</h1>
          <p className="text-muted-foreground">
            Track the approval workflow and sales performance of your designs
          </p>
        </div>

        {products.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground mb-4">No products yet</p>
              <Button asChild>
                <Link to="/design-studio">Submit Your First Design</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {products.map((product) => {
              const steps = getStatusSteps(product);
              return (
                <Card key={product.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <CardTitle className="text-xl mb-2">{product.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(product.status)}>
                              {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Submitted {new Date(product.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/product/${product.id}/edit`}>Edit</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      {/* Progress Line */}
                      <div className="absolute top-5 left-0 w-full h-0.5 bg-border" />
                      <div
                        className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
                        style={{
                          width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%`,
                        }}
                      />

                      {/* Steps */}
                      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4">
                        {steps.map((step, index) => {
                          const Icon = step.icon;
                          return (
                            <div key={index} className="flex flex-col items-center text-center">
                              <div
                                className={`
                                  w-10 h-10 rounded-full flex items-center justify-center mb-2 relative z-10
                                  ${step.status === 'completed' ? 'bg-primary text-primary-foreground' : ''}
                                  ${step.status === 'current' ? 'bg-primary/20 text-primary border-2 border-primary' : ''}
                                  ${step.status === 'pending' ? 'bg-muted text-muted-foreground' : ''}
                                  ${step.status === 'rejected' ? 'bg-destructive text-destructive-foreground' : ''}
                                `}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <p className="font-semibold text-sm mb-1">{step.label}</p>
                              <p className="text-xs text-muted-foreground">{step.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {product.status === 'rejected' && product.rejection_reason && (
                      <div className="mt-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                          <div>
                            <p className="font-semibold text-destructive mb-1">Action Required</p>
                            <p className="text-sm text-destructive">{product.rejection_reason}</p>
                            <Button variant="outline" size="sm" className="mt-3" asChild>
                              <Link to={`/product/${product.id}/edit`}>Resubmit Design</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {product.status === 'approved' && (
                      <div className="mt-6 grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Base Price</p>
                          <p className="text-lg font-bold">₹{product.base_price.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Your Price</p>
                          <p className="text-lg font-bold">₹{product.designer_price.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Sales</p>
                          <p className="text-lg font-bold">{product.total_sales}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductStatusTracker;
