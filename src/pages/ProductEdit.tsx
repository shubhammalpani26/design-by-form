import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Trash2, Upload } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ProductData {
  name: string;
  description: string;
  category: string;
  designer_price: number;
  base_price: number;
  image_url: string;
  status: string;
  rejection_reason: string | null;
}

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('designer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast({
          title: 'Access denied',
          description: 'Designer profile not found',
          variant: 'destructive',
        });
        navigate('/designer-dashboard');
        return;
      }

      const { data: productData, error } = await supabase
        .from('designer_products')
        .select('*')
        .eq('id', id)
        .eq('designer_id', profile.id)
        .single();

      if (error || !productData) {
        toast({
          title: 'Error',
          description: 'Product not found or access denied',
          variant: 'destructive',
        });
        navigate('/designer-dashboard');
        return;
      }

      setProduct(productData);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: 'Error',
        description: 'Failed to load product',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!product) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('designer_products')
        .update({
          name: product.name,
          description: product.description,
          category: product.category,
          designer_price: product.designer_price,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
      navigate('/designer-dashboard');
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error',
        description: 'Failed to update product',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResubmit = async () => {
    if (!product) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('designer_products')
        .update({
          status: 'pending',
          rejection_reason: null,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Product resubmitted for review',
      });
      navigate('/designer-dashboard');
    } catch (error) {
      console.error('Error resubmitting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to resubmit product',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('designer_products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
      navigate('/designer-dashboard');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-12">
          <p className="text-center text-muted-foreground">Loading product...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-12">
        <Button
          variant="ghost"
          onClick={() => navigate('/designer-dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Edit Product</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {product.status === 'rejected' && product.rejection_reason && (
              <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
                <h3 className="font-semibold text-destructive mb-2">Rejection Reason:</h3>
                <p className="text-sm">{product.rejection_reason}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={product.name}
                  onChange={(e) => setProduct({ ...product, name: e.target.value })}
                  disabled={product.status === 'approved'}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={product.description || ''}
                  onChange={(e) => setProduct({ ...product, description: e.target.value })}
                  disabled={product.status === 'approved'}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={product.category}
                  onValueChange={(value) => setProduct({ ...product, category: value })}
                  disabled={product.status === 'approved'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chairs">Chairs</SelectItem>
                    <SelectItem value="tables">Tables</SelectItem>
                    <SelectItem value="storage">Storage</SelectItem>
                    <SelectItem value="lighting">Lighting</SelectItem>
                    <SelectItem value="decor">Decor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="designer_price">Your Price (₹)</Label>
                <Input
                  id="designer_price"
                  type="number"
                  value={product.designer_price}
                  onChange={(e) => setProduct({ ...product, designer_price: parseFloat(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Base price: ₹{product.base_price.toLocaleString('en-IN')}
                </p>
              </div>

              {product.image_url && (
                <div>
                  <Label>Product Image</Label>
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full max-w-md rounded-lg border mt-2"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              {product.status === 'rejected' && (
                <Button
                  onClick={handleResubmit}
                  disabled={isSaving}
                >
                  Resubmit for Review
                </Button>
              )}

              {product.status !== 'approved' && (
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Product
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your product.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {product.status === 'approved' && (
              <p className="text-sm text-muted-foreground">
                Note: Approved products cannot be edited. Please contact support if you need to make changes.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ProductEdit;
