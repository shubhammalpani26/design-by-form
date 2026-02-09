import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard, Product } from "@/components/admin/ProductCard";

export function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<Record<string, number>>({});
  const [autoApplyMarkup, setAutoApplyMarkup] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const hasShownError = useRef(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.rpc("admin_get_all_products");

      if (error) throw error;

      hasShownError.current = false; // Reset on success

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

      const priceMap: Record<string, number> = {};
      const autoApplyMap: Record<string, boolean> = {};
      merged.forEach((p) => {
        priceMap[p.id] = p.base_price;
        autoApplyMap[p.id] = true;
      });
      setEditingPrice(priceMap);
      setAutoApplyMarkup(autoApplyMap);
    } catch (error) {
      console.error("Error fetching products:", error);
      // Only show toast once to avoid spam
      if (!hasShownError.current) {
        hasShownError.current = true;
        toast({
          title: "Error",
          description: "Failed to load products. Please refresh the page.",
          variant: "destructive",
        });
      }
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
      toast({ title: "Success", description: "Product deleted successfully" });
      fetchProducts();
      setShowDeleteDialog(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({ title: "Error", description: "Failed to delete product", variant: "destructive" });
    }
  };

  const updateBasePrice = async (productId: string, newPrice: number) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-update-price", {
        body: { productId, basePrice: newPrice },
      });
      if (error) throw error;
      fetchProducts();
      toast({
        title: "Price updated",
        description: `Manufacturing: ₹${newPrice.toLocaleString()}, Selling: ₹${data.designerPrice?.toLocaleString()}`,
      });
    } catch (error) {
      console.error("Error updating price:", error);
      toast({ title: "Error", description: "Failed to update price", variant: "destructive" });
    }
  };

  // Pure calculation functions — stable references via useCallback
  const getPreviewSellingPrice = useCallback(
    (product: Product, editPrice: number, autoMarkup: boolean) => {
      if (!autoMarkup) return product.designer_price;
      const originalMarkup =
        product.base_price > 0
          ? (product.designer_price - product.base_price) / product.base_price
          : 0.5;
      return Math.round(editPrice * (1 + originalMarkup));
    },
    []
  );

  const getPreviewDesignerEarnings = useCallback(
    (product: Product, editPrice: number, autoMarkup: boolean) => {
      const previewSelling = getPreviewSellingPrice(product, editPrice, autoMarkup);
      const markup = previewSelling - editPrice;
      return Math.round(markup * 0.7);
    },
    [getPreviewSellingPrice]
  );

  const handleApprove = useCallback(
    async (productId: string) => {
      setApprovingId(productId);
      try {
        const product = products.find((p) => p.id === productId);
        if (product && editingPrice[productId] !== product.base_price) {
          await updateBasePrice(productId, editingPrice[productId]);
        }
        const { error } = await supabase.functions.invoke("admin-approve-product", {
          body: { productId },
        });
        if (error) throw error;
        toast({
          title: "Design Approved & Published!",
          description: "The design is now live on the marketplace and community feed.",
        });
        fetchProducts();
      } catch (error) {
        console.error("Error approving product:", error);
        toast({ title: "Error", description: "Failed to approve product", variant: "destructive" });
      } finally {
        setApprovingId(null);
      }
    },
    [products, editingPrice]
  );

  const handleReject = async () => {
    if (!selectedProduct) return;
    try {
      const { error } = await supabase.functions.invoke("admin-reject-product", {
        body: { productId: selectedProduct.id, rejectionReason },
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
      toast({ title: "Error", description: "Failed to reject product", variant: "destructive" });
    }
  };

  // Stable handlers for ProductCard — use functional state updates to avoid re-creating objects
  const handleEditPrice = useCallback((productId: string, price: number) => {
    setEditingPrice((prev) => ({ ...prev, [productId]: price }));
  }, []);

  const handleToggleAutoMarkup = useCallback((productId: string, checked: boolean) => {
    setAutoApplyMarkup((prev) => ({ ...prev, [productId]: checked }));
  }, []);

  const handleResetPrice = useCallback((productId: string, originalPrice: number) => {
    setEditingPrice((prev) => ({ ...prev, [productId]: originalPrice }));
  }, []);

  const handleRejectClick = useCallback((product: Product) => {
    setSelectedProduct(product);
    setShowRejectDialog(true);
  }, []);

  const handleDeleteClick = useCallback((product: Product) => {
    setSelectedProduct(product);
    setShowDeleteDialog(true);
  }, []);

  const filterByStatus = (status?: string) => {
    if (!status) return products;
    return products.filter((p) => p.status === status);
  };

  if (loading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  const pendingCount = filterByStatus("pending").length;

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
              <Badge variant="destructive" className="ml-1">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({filterByStatus("approved").length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({filterByStatus("rejected").length})
          </TabsTrigger>
          <TabsTrigger value="all">All ({products.length})</TabsTrigger>
        </TabsList>

        {["pending", "approved", "rejected"].map((status) => (
          <TabsContent key={status} value={status} className="mt-6">
            <ProductList
              items={filterByStatus(status)}
              editingPrice={editingPrice}
              autoApplyMarkup={autoApplyMarkup}
              approvingId={approvingId}
              onEditPrice={handleEditPrice}
              onToggleAutoMarkup={handleToggleAutoMarkup}
              onUpdateBasePrice={updateBasePrice}
              onResetPrice={handleResetPrice}
              onApprove={handleApprove}
              onReject={handleRejectClick}
              onDelete={handleDeleteClick}
              getPreviewSellingPrice={getPreviewSellingPrice}
              getPreviewDesignerEarnings={getPreviewDesignerEarnings}
            />
          </TabsContent>
        ))}
        <TabsContent value="all" className="mt-6">
          <ProductList
            items={products}
            editingPrice={editingPrice}
            autoApplyMarkup={autoApplyMarkup}
            approvingId={approvingId}
            onEditPrice={handleEditPrice}
            onToggleAutoMarkup={handleToggleAutoMarkup}
            onUpdateBasePrice={updateBasePrice}
            onResetPrice={handleResetPrice}
            onApprove={handleApprove}
            onReject={handleRejectClick}
            onDelete={handleDeleteClick}
            getPreviewSellingPrice={getPreviewSellingPrice}
            getPreviewDesignerEarnings={getPreviewDesignerEarnings}
          />
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{selectedProduct?.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Product</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting "{selectedProduct?.name}". The designer will be
              notified with this feedback.
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

// Extracted outside to avoid re-creation on every render
function ProductList({
  items,
  editingPrice,
  autoApplyMarkup,
  approvingId,
  onEditPrice,
  onToggleAutoMarkup,
  onUpdateBasePrice,
  onResetPrice,
  onApprove,
  onReject,
  onDelete,
  getPreviewSellingPrice,
  getPreviewDesignerEarnings,
}: {
  items: Product[];
  editingPrice: Record<string, number>;
  autoApplyMarkup: Record<string, boolean>;
  approvingId: string | null;
  onEditPrice: (id: string, price: number) => void;
  onToggleAutoMarkup: (id: string, checked: boolean) => void;
  onUpdateBasePrice: (id: string, price: number) => void;
  onResetPrice: (id: string, price: number) => void;
  onApprove: (id: string) => void;
  onReject: (product: Product) => void;
  onDelete: (product: Product) => void;
  getPreviewSellingPrice: (product: Product, editPrice: number, autoMarkup: boolean) => number;
  getPreviewDesignerEarnings: (product: Product, editPrice: number, autoMarkup: boolean) => number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.length === 0 ? (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          No products in this category
        </div>
      ) : (
        items.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            editingPrice={editingPrice[product.id] ?? product.base_price}
            autoApplyMarkup={autoApplyMarkup[product.id] ?? true}
            approvingId={approvingId}
            onEditPrice={onEditPrice}
            onToggleAutoMarkup={onToggleAutoMarkup}
            onUpdateBasePrice={onUpdateBasePrice}
            onResetPrice={onResetPrice}
            onApprove={onApprove}
            onReject={onReject}
            onDelete={onDelete}
            getPreviewSellingPrice={getPreviewSellingPrice}
            getPreviewDesignerEarnings={getPreviewDesignerEarnings}
          />
        ))
      )}
    </div>
  );
}
