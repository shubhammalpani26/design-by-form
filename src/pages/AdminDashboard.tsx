import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface PendingProduct {
  id: string;
  name: string;
  description: string;
  base_price: number;
  designer_price: number;
  image_url: string;
  created_at: string;
  designer: {
    name: string;
    email: string;
  };
}

interface PendingDesigner {
  id: string;
  name: string;
  email: string;
  portfolio_url: string;
  design_background: string;
  furniture_interests: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
  const [pendingDesigners, setPendingDesigners] = useState<PendingDesigner[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<PendingProduct | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (roles) {
        setIsAdmin(true);
        fetchPendingItems();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingItems = async () => {
    try {
      // Fetch pending products
      const { data: products } = await supabase
        .from('designer_products')
        .select(`
          *,
          designer:designer_profiles(name, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setPendingProducts(products || []);

      // Fetch pending designers
      const { data: designers } = await supabase
        .from('designer_profiles')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setPendingDesigners(designers || []);
    } catch (error) {
      console.error('Error fetching pending items:', error);
    }
  };

  const approveProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('designer_products')
        .update({ status: 'approved' })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: 'Product approved',
        description: 'The product is now live on the marketplace',
      });
      fetchPendingItems();
    } catch (error) {
      console.error('Error approving product:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve product',
        variant: 'destructive',
      });
    }
  };

  const rejectProduct = async () => {
    if (!selectedProduct) return;

    try {
      // Validate rejection reason
      const { rejectionReasonSchema } = await import('@/lib/validations');
      const validatedReason = rejectionReasonSchema.parse(rejectionReason);

      const { error } = await supabase
        .from('designer_products')
        .update({ 
          status: 'rejected',
          rejection_reason: validatedReason
        })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      toast({
        title: 'Product rejected',
        description: 'The designer has been notified',
      });
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedProduct(null);
      fetchPendingItems();
    } catch (error) {
      console.error('Error rejecting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject product',
        variant: 'destructive',
      });
    }
  };

  const approveDesigner = async (designerId: string) => {
    try {
      const { error } = await supabase
        .from('designer_profiles')
        .update({ status: 'approved' })
        .eq('id', designerId);

      if (error) throw error;

      // Assign designer role
      const { data: profile } = await supabase
        .from('designer_profiles')
        .select('user_id')
        .eq('id', designerId)
        .single();

      if (profile) {
        await supabase.from('user_roles').insert({
          user_id: profile.user_id,
          role: 'designer'
        });
      }

      toast({
        title: 'Designer approved',
        description: 'The designer can now start creating products',
      });
      fetchPendingItems();
    } catch (error) {
      console.error('Error approving designer:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve designer',
        variant: 'destructive',
      });
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-12">
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
              <p className="text-muted-foreground">You don't have permission to access this page.</p>
            </CardContent>
          </Card>
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
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Review and approve products and designers</p>
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList>
            <TabsTrigger value="products">
              Pending Products ({pendingProducts.length})
            </TabsTrigger>
            <TabsTrigger value="designers">
              Pending Designers ({pendingDesigners.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingProducts.map((product) => (
                <Card key={product.id}>
                  <div className="aspect-video overflow-hidden rounded-t-lg bg-accent">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-xl mb-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      by {product.designer.name} ({product.designer.email})
                    </p>
                    <p className="text-sm mb-4">{product.description}</p>
                    <div className="flex gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Base Price</p>
                        <p className="font-semibold">₹{product.base_price.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Designer Price</p>
                        <p className="font-semibold">₹{product.designer_price.toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                      Submitted: {new Date(product.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={() => approveProduct(product.id)} className="flex-1">
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowRejectDialog(true);
                        }}
                        className="flex-1"
                      >
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {pendingProducts.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No pending products to review</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="designers" className="mt-6">
            <div className="space-y-4">
              {pendingDesigners.map((designer) => (
                <Card key={designer.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-xl">{designer.name}</h3>
                        <p className="text-sm text-muted-foreground">{designer.email}</p>
                      </div>
                      <Badge>Pending</Badge>
                    </div>
                    {designer.portfolio_url && (
                      <p className="text-sm mb-2">
                        <span className="font-semibold">Portfolio:</span>{' '}
                        <a
                          href={designer.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {designer.portfolio_url}
                        </a>
                      </p>
                    )}
                    <p className="text-sm mb-2">
                      <span className="font-semibold">Background:</span> {designer.design_background}
                    </p>
                    <p className="text-sm mb-4">
                      <span className="font-semibold">Interests:</span> {designer.furniture_interests}
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Applied: {new Date(designer.created_at).toLocaleDateString()}
                    </p>
                    <Button onClick={() => approveDesigner(designer.id)}>
                      Approve Designer
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {pendingDesigners.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No pending designer applications</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Product</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this product. The designer will be notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={rejectProduct}>
              Reject Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default AdminDashboard;
