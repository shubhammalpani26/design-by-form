import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Product {
  id: string;
  name: string;
  category: string;
  status: string;
  base_price: number;
  designer_price: number;
  created_at: string;
  designer_profiles: {
    name: string;
  };
}

export function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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

  const handleUpdateStatus = async (productId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("designer_products")
        .update({ status: newStatus })
        .eq("id", productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Product ${newStatus} successfully`,
      });

      fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive",
      });
    }
  };

  const filterByStatus = (status?: string) => {
    if (!status) return products;
    return products.filter(p => p.status === status);
  };

  const ProductList = ({ items }: { items: Product[] }) => (
    <div className="grid gap-4">
      {items.map((product) => (
        <Card key={product.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{product.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  by {product.designer_profiles?.name}
                </p>
              </div>
              <Badge variant={
                product.status === 'approved' ? 'default' :
                product.status === 'rejected' ? 'destructive' :
                'secondary'
              }>
                {product.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm mb-4">
              <div><span className="font-medium">Category:</span> {product.category}</div>
              <div><span className="font-medium">Base Price:</span> ₹{product.base_price}</div>
              <div><span className="font-medium">Designer Price:</span> ₹{product.designer_price}</div>
              <div><span className="font-medium">Created:</span> {new Date(product.created_at).toLocaleDateString()}</div>
            </div>
            
            <div className="flex gap-2">
              {product.status !== 'approved' && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleUpdateStatus(product.id, 'approved')}
                >
                  Approve
                </Button>
              )}
              {product.status !== 'rejected' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleUpdateStatus(product.id, 'rejected')}
                >
                  Reject
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedProduct(product);
                  setShowDeleteDialog(true);
                }}
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Products</h2>
        <Badge variant="secondary">{products.length} Total</Badge>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({products.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({filterByStatus('pending').length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({filterByStatus('approved').length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({filterByStatus('rejected').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <ProductList items={products} />
        </TabsContent>
        <TabsContent value="pending" className="mt-6">
          <ProductList items={filterByStatus('pending')} />
        </TabsContent>
        <TabsContent value="approved" className="mt-6">
          <ProductList items={filterByStatus('approved')} />
        </TabsContent>
        <TabsContent value="rejected" className="mt-6">
          <ProductList items={filterByStatus('rejected')} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
