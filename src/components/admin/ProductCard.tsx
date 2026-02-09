import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Trash2, ExternalLink, Sparkles } from "lucide-react";

interface DesignerProfile {
  id: string;
  name: string;
  email: string;
  phone_number: string | null;
}

export interface Product {
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

interface ProductCardProps {
  product: Product;
  editingPrice: number;
  autoApplyMarkup: boolean;
  approvingId: string | null;
  onEditPrice: (productId: string, price: number) => void;
  onToggleAutoMarkup: (productId: string, checked: boolean) => void;
  onUpdateBasePrice: (productId: string, price: number) => void;
  onResetPrice: (productId: string, originalPrice: number) => void;
  onApprove: (productId: string) => void;
  onReject: (product: Product) => void;
  onDelete: (product: Product) => void;
  getPreviewSellingPrice: (product: Product, editPrice: number, autoMarkup: boolean) => number;
  getPreviewDesignerEarnings: (product: Product, editPrice: number, autoMarkup: boolean) => number;
}

export const ProductCard = React.memo(function ProductCard({
  product,
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
}: ProductCardProps) {
  const isPending = product.status === "pending";
  const priceChanged = editingPrice !== product.base_price;
  const previewSelling = getPreviewSellingPrice(product, editingPrice, autoApplyMarkup);
  const previewEarnings = getPreviewDesignerEarnings(product, editingPrice, autoApplyMarkup);
  const previewMarkup =
    editingPrice > 0
      ? Math.round(((previewSelling - editingPrice) / editingPrice) * 100)
      : 0;

  return (
    <Card className="overflow-hidden">
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
              product.status === "approved"
                ? "default"
                : product.status === "rejected"
                ? "destructive"
                : "secondary"
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
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {isPending ? (
          <div className="bg-accent/50 rounded-lg p-4 mb-4 border border-border">
            <h4 className="font-semibold text-sm mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">💰 Pricing</span>
              <label className="flex items-center gap-2 text-xs font-normal cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoApplyMarkup}
                  onChange={(e) =>
                    onToggleAutoMarkup(product.id, e.target.checked)
                  }
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
                  value={editingPrice}
                  onChange={(e) =>
                    onEditPrice(product.id, parseFloat(e.target.value) || 0)
                  }
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">
                  Selling Price
                </Label>
                <div
                  className={`bg-background rounded-md px-3 py-2 border mt-1 ${
                    priceChanged ? "border-primary ring-1 ring-primary" : ""
                  }`}
                >
                  <p
                    className={`font-mono font-semibold ${
                      priceChanged ? "text-primary" : ""
                    }`}
                  >
                    ₹{previewSelling.toLocaleString()}
                    {priceChanged && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (preview)
                      </span>
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
                  onClick={() => onUpdateBasePrice(product.id, editingPrice)}
                  size="sm"
                  className="flex-1"
                  variant="secondary"
                >
                  Update Price Only
                </Button>
                <Button
                  onClick={() => onResetPrice(product.id, product.base_price)}
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
              <span className="font-medium">
                ₹{product.designer_price.toLocaleString()}
              </span>
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
                onClick={() => onApprove(product.id)}
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
                onClick={() => onReject(product)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
          {product.status === "approved" && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1"
              onClick={() => window.open(`/product/${product.id}`, "_blank")}
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
            onClick={() => onDelete(product)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
