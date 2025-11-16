import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShareButton } from '@/components/ShareButton';

interface ProductShareCardProps {
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  designerName: string;
  category: string;
}

export const ProductShareCard = ({
  productId,
  productName,
  productImage,
  productPrice,
  designerName,
  category,
}: ProductShareCardProps) => {
  const shareUrl = `${window.location.origin}/product/${productId}`;

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-accent flex-shrink-0">
            <img
              src={productImage}
              alt={productName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg mb-1 truncate">{productName}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              by {designerName}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{category}</Badge>
              <span className="font-bold text-primary">₹{productPrice.toLocaleString()}</span>
            </div>
          </div>
          <ShareButton
            url={shareUrl}
            title={`${productName} on Forma`}
            description={`Check out ${productName} by ${designerName}. Premium sustainable furniture design.`}
          />
        </div>
      </CardContent>
    </Card>
  );
};
