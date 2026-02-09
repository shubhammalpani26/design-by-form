import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Trash2, ExternalLink, Sparkles } from "lucide-react";

interface DesignerProfile {
  id: string;
  name: string;
  email: string;
  phone_number: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  status: string;
  base_price: number;
  designer_price: number;
  designer_id: string;
  created_at: string;
  image_url: string | null;
  designer_profiles: DesignerProfile;
}

export function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<{ [key: string]: number }>({});
  const [autoApplyMarkup, setAutoApplyMarkup] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Use SECURITY DEFINER RPC — checks admin once, bypasses per-row RLS
      const { data, error } = await supabase.rpc("admin_get_all_products");

      if (error) throw error;

      const merged: Product[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        status: p.status,
        base_price: Number(p.base_price),
        designer_price: Number(p.designer_price),
        designer_id: p.designer_id,
        created_at: p.created_at,
        image_url: p.image_url,
        designer_profiles: {
          id: p.designer_id,
          name: p.designer_name || "Unknown",
          email: p.designer_email || "",
          phone_number: p.designer_phone || null,
        },
      }));

      setProducts(merged);
      
      // Initialize editing prices and auto-apply toggle
      const priceMap: { [key: string]: number } = {};
      const autoApplyMap: { [key: string]: boolean } = {};
      merged.forEach(p => {
        priceMap[p.id] = p.base_price;
        autoApplyMap[p.id] = true;
      });
      setEditingPrice(priceMap);
      setAutoApplyMarkup(autoApplyMap);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      const { error } = await supabase
        .from("designer_products")
        .delete()
        .eq("id", selectedProduct.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });

      fetchProducts();
      setShowDeleteDialog(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const updateBasePrice = async (productId: string, newPrice: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-price', {
        body: { productId, basePrice: newPrice }
      });

      if (error) throw error;

      // Refresh to get updated designer price
      fetchProducts();

      toast({
        title: 'Price updated',
        description: `Manufacturing: ₹${newPrice.toLocaleString()}, Selling: ₹${data.designerPrice?.toLocaleString()}`,
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

  // Calculate live preview of selling price based on edited manufacturing cost
  const getPreviewSellingPrice = (product: Product) => {
    const currentEditPrice = editingPrice[product.id] ?? product.base_price;
    
    if (!autoApplyMarkup[product.id]) {
      return product.designer_price;
    }
    
    // Calculate original markup percentage
    const originalMarkup = product.base_price > 0 
      ? ((product.designer_price - product.base_price) / product.base_price) 
      : 0.5; // Default 50% markup if base is 0
    
    // Apply same markup to new base price
    return Math.round(currentEditPrice * (1 + originalMarkup));
  };

  const getPreviewDesignerEarnings = (product: Product) => {
    const previewSelling = getPreviewSellingPrice(product);
    const currentEditPrice = editingPrice[product.id] ?? product.base_price;
    const markup = previewSelling - currentEditPrice;
    return Math.round(markup * 0.7); // 70% of markup
  };

  const handleApprove = async (productId: string) => {
    setApprovingId(productId);
    try {
      // First update price if changed
      const product = products.find(p => p.id === productId);
      if (product && editingPrice[productId] !== product.base_price) {
        await updateBasePrice(productId, editingPrice[productId]);
      }

      // Then approve
      const { data, error } = await supabase.functions.invoke('admin-approve-product', {
        body: { productId }
      });

      if (error) throw error;

      toast({
        title: "Design Approved & Published!",
        description: "The design is now live on the marketplace and community feed.",
      });

      fetchProducts();
    } catch (error) {
      console.error("Error approving product:", error);
      toast({
        title: "Error",
        description: "Failed to approve product",
        variant: "destructive",
      });
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedProduct) return;

    try {
      const { error } = await supabase.functions.invoke('admin-reject-product', {
        body: { 
          productId: selectedProduct.id, 
          rejectionReason: rejectionReason 
        }
      });

      if (error) throw error;

      toast({
        title: "Product Rejected",
        description: "The designer will be notified with feedback.",
      });

      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Error rejecting product:", error);
      toast({
        title: "Error",
        description: "Failed to reject product",
        variant: "destructive",
      });
    }
  };

  const filterByStatus = (status?: string) => {
    if (!status) return products;
    return products.filter(p => p.status === status);
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const isPending = product.status === 'pending';
    const priceChanged = editingPrice[product.id] !== product.base_price;
    const previewSelling = getPreviewSellingPrice(product);
    const previewEarnings = getPreviewDesignerEarnings(product);
    const currentEditPrice = editingPrice[product.id] ?? product.base_price;
    const previewMarkup = currentEditPrice > 0 
      ? Math.round(((previewSelling - currentEditPrice) / currentEditPrice) * 100)
      : 0;

    return (
      <Card className="overflow-hidden">
        {/* Product Image */}
        {product.image_url && (
          <div className="aspect-square relative bg-muted">
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <Badge 
              className="absolute top-2 right-2"
              variant={
                product.status === 'approved' ? 'default' :
                product.status === 'rejected' ? 'destructive' :
                'secondary'
              }
            >
              {product.status}
            </Badge>
          </div>
        )}
        
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{product.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                by {product.designer_profiles?.name}
              </p>
              {isPending && product.designer_profiles?.email && (
                <p className="text-xs text-muted-foreground">
                  {product.designer_profiles.email}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {product.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
          )}

          {/* Pricing Section - Enhanced for pending products */}
          {isPending ? (
            <div className="bg-accent/50 rounded-lg p-4 mb-4 border border-border">
              <h4 className="font-semibold text-sm mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">💰 Pricing</span>
                <label className="flex items-center gap-2 text-xs font-normal cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={autoApplyMarkup[product.id] ?? true}
                    onChange={(e) => setAutoApplyMarkup({
                      ...autoApplyMarkup,
                      [product.id]: e.target.checked
                    })}
                    className="rounded"
                  />
                  Auto-apply markup
                </label>
              </h4>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <Label className="text-xs font-medium">Manufacturing (₹)</Label>
                  <Input
                    type="number"
                    value={currentEditPrice}
                    onChange={(e) => setEditingPrice({
                      ...editingPrice,
                      [product.id]: parseFloat(e.target.value) || 0
                    })}
                    className="mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Selling Price</Label>
                  <div className={`bg-background rounded-md px-3 py-2 border mt-1 ${priceChanged ? 'border-primary ring-1 ring-primary' : ''}`}>
                    <p className={`font-mono font-semibold ${priceChanged ? 'text-primary' : ''}`}>
                      ₹{previewSelling.toLocaleString()}
                      {priceChanged && (
                        <span className="text-xs text-muted-foreground ml-1">(preview)</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 flex-wrap">
                <span>Markup:</span>
                <Badge variant={priceChanged ? "default" : "secondary"}>
                  {previewMarkup}%
                </Badge>
                <span className="text-green-600 dark:text-green-400">
                  → Designer earns ₹{previewEarnings.toLocaleString()}
                </span>
              </div>
              
              {priceChanged && (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => updateBasePrice(product.id, editingPrice[product.id])}
                    size="sm"
                    className="flex-1"
                    variant="secondary"
                  >
                    Update Price Only
                  </Button>
                  <Button
                    onClick={() => setEditingPrice({
                      ...editingPrice,
                      [product.id]: product.base_price
                    })}
                    size="sm"
                    variant="ghost"
                  >
                    Reset
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="capitalize">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Manufacturing</span>
                <span>₹{product.base_price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Selling Price</span>
                <span className="font-medium">₹{product.designer_price.toLocaleString()}</span>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground mb-3">
            Submitted: {new Date(product.created_at).toLocaleDateString()}
          </p>
          
          <div className="flex gap-2 flex-wrap">
            {isPending && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => handleApprove(product.id)}
                  disabled={approvingId === product.id}
                >
                  {approvingId === product.id ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setSelectedProduct(product);
                    setShowRejectDialog(true);
                  }}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}
            {product.status === 'approved' && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1"
                onClick={() => window.open(`/product/${product.id}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                View Live
              </Button>
            )}
            <Link to={`/admin/products/${product.id}/edit`}>
              <Button variant="ghost" size="sm">
                ✏️
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedProduct(product);
                setShowDeleteDialog(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ProductList = ({ items }: { items: Product[] }) => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.length === 0 ? (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          No products in this category
        </div>
      ) : (
        items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))
      )}
    </div>
  );

  if (loading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  const pendingCount = filterByStatus('pending').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Design Review</h2>
          <p className="text-muted-foreground">
            Approve designs to publish them to the marketplace and community feed
          </p>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {pendingCount} Pending Review
            </Badge>
          )}
          <Link to="/admin/payouts">
            <Button variant="outline">Manage Payouts</Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending Review
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved ({filterByStatus('approved').length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({filterByStatus('rejected').length})</TabsTrigger>
          <TabsTrigger value="all">All ({products.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <ProductList items={filterByStatus('pending')} />
        </TabsContent>
        <TabsContent value="approved" className="mt-6">
          <ProductList items={filterByStatus('approved')} />
        </TabsContent>
        <TabsContent value="rejected" className="mt-6">
          <ProductList items={filterByStatus('rejected')} />
        </TabsContent>
        <TabsContent value="all" className="mt-6">
          <ProductList items={products} />
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{selectedProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog with Reason */}
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
              onClick={handleReject}
              disabled={rejectionReason.length < 10}
            >
              Reject Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
