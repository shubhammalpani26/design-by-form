import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Trash2, ExternalLink, Sparkles } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  status: string;
  base_price: number;
  designer_price: number;
  created_at: string;
  image_url: string | null;
  designer_profiles: {
    name: string;
  };
}

export function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("designer_products")
        .select("*, designer_profiles(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
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

  const handleApprove = async (productId: string) => {
    setApprovingId(productId);
    try {
      // Use the edge function for proper approval with feed post creation
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

  const handleReject = async (productId: string) => {
    try {
      const { error } = await supabase
        .from("designer_products")
        .update({ status: 'rejected' })
        .eq("id", productId);

      if (error) throw error;

      toast({
        title: "Product Rejected",
        description: "The designer will be notified.",
      });

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

  const ProductList = ({ items }: { items: Product[] }) => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.length === 0 ? (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          No products in this category
        </div>
      ) : (
        items.map((product) => (
          <Card key={product.id} className="overflow-hidden">
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
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-1 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="capitalize">{product.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Price</span>
                  <span>₹{product.base_price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Selling Price</span>
                  <span className="font-medium">₹{product.designer_price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted</span>
                  <span>{new Date(product.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {product.status === 'pending' && (
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
                          Approve & Publish
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleReject(product.id)}
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
        {pendingCount > 0 && (
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {pendingCount} Pending Review
          </Badge>
        )}
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
    </div>
  );
}
