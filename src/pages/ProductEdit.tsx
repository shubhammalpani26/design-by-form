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
import { ArrowLeft, Trash2, Wand2, Loader2, RefreshCcw, Check, X } from 'lucide-react';
import { PriceCalculator } from '@/components/PriceCalculator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { SEOHead } from "@/components/SEOHead";

interface ProductData {
  name: string;
  description: string;
  category: string;
  designer_price: number;
  base_price: number;
  image_url: string;
  status: string;
  rejection_reason: string | null;
  weight: number | null;
  dimensions: any;
  materials_description: string | null;
}

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiPreview, setAiPreview] = useState<string | null>(null);
  const [genTextBusy, setGenTextBusy] = useState<'title' | 'description' | null>(null);

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
      const wasApproved = product.status === 'approved';
      const newStatus = wasApproved ? 'pending' : product.status;
      const { error } = await supabase
        .from('designer_products')
        .update({
          name: product.name,
          description: product.description,
          category: product.category,
          designer_price: product.designer_price,
          weight: product.weight,
          dimensions: product.dimensions,
          materials_description: product.materials_description,
          image_url: product.image_url,
          status: newStatus,
          rejection_reason: wasApproved ? null : product.rejection_reason,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: wasApproved ? 'Sent for admin review' : 'Product updated',
        description: wasApproved
          ? 'Your edits have been submitted. The listing is hidden until an admin re-approves it.'
          : 'Product updated successfully',
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

  const handleAiEditImage = async () => {
    if (!product || !aiPrompt.trim()) return;
    setAiBusy(true);
    setAiPreview(null);
    try {
      const { data, error } = await supabase.functions.invoke('edit-design', {
        body: {
          baseImageUrl: product.image_url,
          editPrompt: aiPrompt.trim(),
          category: product.category,
          mode: 'product',
        },
      });
      if (error) throw error;
      if (!data?.imageUrl) throw new Error('No image returned');
      setAiPreview(data.imageUrl);
    } catch (e: any) {
      console.error('AI edit failed', e);
      toast({
        title: 'AI edit failed',
        description: e?.message ?? 'Please try a different prompt',
        variant: 'destructive',
      });
    } finally {
      setAiBusy(false);
    }
  };

  const acceptAiImage = () => {
    if (!aiPreview || !product) return;
    setProduct({ ...product, image_url: aiPreview });
    setAiPreview(null);
    setAiPrompt('');
    toast({ title: 'Image updated', description: 'Click "Save Changes" to submit for admin review.' });
  };

  const regenerateTitle = async () => {
    if (!product) return;
    setGenTextBusy('title');
    try {
      const { data, error } = await supabase.functions.invoke('generate-product-title', {
        body: {
          category: product.category,
          materials: product.materials_description,
          dimensions: product.dimensions,
          prompt: product.description,
        },
      });
      if (error) throw error;
      const t = (data?.title ?? '').toString().trim();
      if (t) setProduct({ ...product, name: t });
    } catch (e: any) {
      toast({ title: 'Failed to regenerate title', description: e?.message, variant: 'destructive' });
    } finally {
      setGenTextBusy(null);
    }
  };

  const regenerateDescription = async () => {
    if (!product) return;
    setGenTextBusy('description');
    try {
      const { data, error } = await supabase.functions.invoke('generate-product-description', {
        body: {
          productName: product.name,
          category: product.category,
          materials: product.materials_description,
          dimensions: product.dimensions,
        },
      });
      if (error) throw error;
      const d = (data?.description ?? '').toString().trim();
      if (d) setProduct({ ...product, description: d });
    } catch (e: any) {
      toast({ title: 'Failed to regenerate description', description: e?.message, variant: 'destructive' });
    } finally {
      setGenTextBusy(null);
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
      <SEOHead title={"Edit Product"} description={"Private page on Nyzora."} noIndex />
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
            {product.status === 'approved' && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-lg p-4 text-sm">
                <p className="font-semibold mb-1">Editing a live product</p>
                <p className="text-muted-foreground">
                  Any change you save will hide this listing from shoppers and send it back to admin review. It returns to the marketplace once re-approved.
                </p>
              </div>
            )}
            {product.status === 'rejected' && product.rejection_reason && (
              <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
                <h3 className="font-semibold text-destructive mb-2">Rejection Reason:</h3>
                <p className="text-sm">{product.rejection_reason}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="name">Product Name</Label>
                  <Button type="button" size="sm" variant="ghost" onClick={regenerateTitle} disabled={genTextBusy === 'title'}>
                    {genTextBusy === 'title' ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Wand2 className="h-3 w-3 mr-1" />}
                    AI suggest
                  </Button>
                </div>
                <Input
                  id="name"
                  value={product.name}
                  onChange={(e) => setProduct({ ...product, name: e.target.value })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description</Label>
                  <Button type="button" size="sm" variant="ghost" onClick={regenerateDescription} disabled={genTextBusy === 'description'}>
                    {genTextBusy === 'description' ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Wand2 className="h-3 w-3 mr-1" />}
                    AI rewrite
                  </Button>
                </div>
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

              <div>
                <Label htmlFor="materials">Materials</Label>
                <Textarea
                  id="materials"
                  value={product.materials_description || ''}
                  onChange={(e) => setProduct({ ...product, materials_description: e.target.value })}
                  rows={2}
                  placeholder="e.g. Solid walnut frame with brushed brass accents"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['width', 'depth', 'height'] as const).map((dim) => (
                  <div key={dim}>
                    <Label htmlFor={dim} className="capitalize">{dim} (cm)</Label>
                    <Input
                      id={dim}
                      type="number"
                      step="0.1"
                      value={product.dimensions?.[dim] ?? ''}
                      onChange={(e) =>
                        setProduct({
                          ...product,
                          dimensions: {
                            ...(product.dimensions ?? {}),
                            [dim]: e.target.value === '' ? null : parseFloat(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>

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

              <PriceCalculator
                basePrice={product.base_price}
                designerPrice={product.designer_price}
                onPriceChange={(newPrice) => setProduct({ ...product, designer_price: newPrice })}
              />

              {product.image_url && (
                <div className="space-y-3">
                  <Label>Product Image</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Current</p>
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full rounded-lg border object-contain bg-muted/30"
                      />
                    </div>
                    {aiPreview && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">AI preview</p>
                        <img src={aiPreview} alt="AI preview" className="w-full rounded-lg border object-contain bg-muted/30" />
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" type="button" onClick={acceptAiImage}>
                            <Check className="h-4 w-4 mr-1" /> Use this
                          </Button>
                          <Button size="sm" type="button" variant="outline" onClick={() => setAiPreview(null)}>
                            <X className="h-4 w-4 mr-1" /> Discard
                          </Button>
                          <Button size="sm" type="button" variant="ghost" onClick={handleAiEditImage} disabled={aiBusy}>
                            <RefreshCcw className="h-4 w-4 mr-1" /> Retry
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
                    <div className="flex items-center gap-2">
                      <Wand2 className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold">Edit image with AI</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Describe a tweak (e.g. "make the legs taller", "switch upholstery to bouclé", "darken the wood to walnut").
                    </p>
                    <Textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      rows={2}
                      placeholder="What should change?"
                      disabled={aiBusy}
                    />
                    <Button type="button" onClick={handleAiEditImage} disabled={aiBusy || !aiPrompt.trim()}>
                      {aiBusy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Wand2 className="h-4 w-4 mr-1" />}
                      {aiBusy ? 'Generating…' : 'Generate edit'}
                    </Button>
                  </div>
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

              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : product.status === 'approved' ? 'Save & Send for Review' : 'Save Changes'}
              </Button>

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
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ProductEdit;
