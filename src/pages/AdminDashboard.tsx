import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    phone_number: string;
  };
}

const AdminDashboard = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<PendingProduct | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [editingPrice, setEditingPrice] = useState<{ [key: string]: number }>({});
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
          designer:designer_profiles(name, email, phone_number)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setPendingProducts(products || []);
      
      // Initialize editing prices
      const priceMap: { [key: string]: number } = {};
      products?.forEach(p => {
        priceMap[p.id] = p.base_price;
      });
      setEditingPrice(priceMap);
    } catch (error) {
      console.error('Error fetching pending items:', error);
    }
  };
  
  const updateBasePrice = async (productId: string, newPrice: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-price', {
        body: { productId, basePrice: newPrice }
      });

      if (error) throw error;

      // Refresh to get updated designer price
      fetchPendingItems();

      toast({
        title: 'Price updated',
        description: `Base: ₹${newPrice.toLocaleString()}, Designer: ₹${data.designerPrice?.toLocaleString()} (${data.markupPercentage}% markup maintained)`,
      });
    } catch (error) {
      console.error('Error updating price:', error);
      toast({
        title: 'Error',
        description: 'Failed to update price',
        variant: 'destructive',
      });
    }
  };

  const approveProduct = async (productId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-approve-product', {
        body: { productId }
      });

      if (error) throw error;

      toast({
        title: 'Product approved',
        description: 'The product has been approved and designer notified',
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
      const { data, error } = await supabase.functions.invoke('admin-reject-product', {
        body: { 
          productId: selectedProduct.id, 
          rejectionReason: rejectionReason 
        }
      });

      if (error) throw error;

      toast({
        title: 'Product rejected',
        description: 'The product has been rejected and designer notified',
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Review and approve pending products</p>
          </div>
          <Link to="/admin/payouts">
            <Button variant="outline">Manage Payouts</Button>
          </Link>
        </div>

        <div className="mt-6">
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
                    <p className="text-sm text-muted-foreground mb-2">
                      by {product.designer.name}
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Email: {product.designer.email}
                    </p>
                    {product.designer.phone_number && (
                      <p className="text-sm text-muted-foreground mb-4">
                        Phone: {product.designer.phone_number}
                      </p>
                    )}
                    <p className="text-sm mb-4">{product.description}</p>
                    <div className="space-y-4 mb-4">
                      <div>
                        <Label htmlFor={`base-price-${product.id}`}>Manufacturing Price (₹)</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id={`base-price-${product.id}`}
                            type="number"
                            value={editingPrice[product.id] || product.base_price}
                            onChange={(e) => setEditingPrice({
                              ...editingPrice,
                              [product.id]: parseFloat(e.target.value) || 0
                            })}
                            onBlur={() => updateBasePrice(product.id, editingPrice[product.id])}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Designer Price</p>
                        <p className="font-semibold">₹{product.designer_price.toLocaleString()}</p>
                      </div>
                      <div>
                        <Link to={`/admin/products/${product.id}/edit`}>
                          <Button variant="outline" size="sm" className="w-full">
                            Edit Product Details
                          </Button>
                        </Link>
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
          </div>
      </main>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Product</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting "{selectedProduct?.name}". The designer will be notified with this feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Rejection Reason *</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Explain why this product is being rejected and what the designer can improve..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
            {rejectionReason.length < 10 && (
              <p className="text-xs text-muted-foreground">
                Please provide a detailed reason (at least 10 characters)
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={rejectProduct}
              disabled={rejectionReason.length < 10}
            >
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
