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
import { ArrowLeft } from 'lucide-react';

interface ProductData {
  name: string;
  description: string;
  category: string;
  designer_price: number;
  base_price: number;
  image_url: string;
  status: string;
  weight: number | null;
  dimensions: any;
  available_finishes: any;
  available_sizes: any;
  lead_time_days: number | null;
}

const AdminProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);

  useEffect(() => {
    checkAdminAndFetchProduct();
  }, [id]);

  const checkAdminAndFetchProduct = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!roles) {
        toast({
          title: 'Access denied',
          description: 'Admin privileges required',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);

      const { data: productData, error } = await supabase
        .from('designer_products')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !productData) {
        toast({
          title: 'Error',
          description: 'Product not found',
          variant: 'destructive',
        });
        navigate('/admin-dashboard');
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
          base_price: product.base_price,
          weight: product.weight,
          lead_time_days: product.lead_time_days,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
      navigate('/admin-dashboard');
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

  if (!isAdmin || !product) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-12">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin-dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Edit Product (Admin)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={product.name}
                  onChange={(e) => setProduct({ ...product, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={product.description || ''}
                  onChange={(e) => setProduct({ ...product, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={product.category}
                  onValueChange={(value) => setProduct({ ...product, category: value })}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={product.weight || ''}
                    onChange={(e) => setProduct({ ...product, weight: parseFloat(e.target.value) || null })}
                  />
                </div>

                <div>
                  <Label htmlFor="lead_time_days">Lead Time (days)</Label>
                  <Input
                    id="lead_time_days"
                    type="number"
                    value={product.lead_time_days || ''}
                    onChange={(e) => setProduct({ ...product, lead_time_days: parseInt(e.target.value) || null })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="base_price">Manufacturing Price (₹)</Label>
                  <Input
                    id="base_price"
                    type="number"
                    value={product.base_price}
                    onChange={(e) => setProduct({ ...product, base_price: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="designer_price">Designer Price (₹)</Label>
                  <Input
                    id="designer_price"
                    type="number"
                    value={product.designer_price}
                    onChange={(e) => setProduct({ ...product, designer_price: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={product.status}
                  onValueChange={(value) => setProduct({ ...product, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
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
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/admin-dashboard')}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AdminProductEdit;
