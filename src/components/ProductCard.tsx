import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ARViewer } from "@/components/ARViewer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { useComparison } from "@/contexts/ComparisonContext";
import { Check } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface ProductCardProps {
  id: string;
  name: string;
  designer: string;
  designerId: string;
  price: number;
  weight: number;
  image: string;
}

export const ProductCard = ({ id, name, designer, designerId, price, weight, image }: ProductCardProps) => {
  const [showAR, setShowAR] = useState(false);
  const { addToComparison, removeFromComparison, isInComparison } = useComparison();
  const { formatPrice } = useCurrency();
  const inComparison = isInComparison(id);

  const toggleComparison = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inComparison) {
      removeFromComparison(id);
    } else {
      addToComparison(id);
    }
  };

  return (
    <>
      <div className="group relative">
        <Card className="overflow-hidden border-border hover:shadow-medium transition-all duration-300">
          <Link to={`/product/${id}`} className="block">
            <div className="aspect-square overflow-hidden bg-accent">
              <img
                src={image}
                alt={name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg text-foreground mb-1">{name}</h3>
              <p className="text-sm text-muted-foreground">
                by <Link
                  to={`/designer/${designerId}`}
                  className="hover:text-primary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {designer}
                </Link>
              </p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-primary font-semibold">{formatPrice(price)}</p>
                <p className="text-xs text-muted-foreground">{weight} kg</p>
              </div>
            </CardContent>
          </Link>
          
          {/* Action Buttons */}
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <Button
              size="icon"
              variant={inComparison ? "default" : "secondary"}
              className="backdrop-blur-sm shadow-lg h-9 w-9"
              onClick={toggleComparison}
              title={inComparison ? "Remove from comparison" : "Add to comparison"}
            >
              {inComparison ? (
                <Check className="h-4 w-4" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              )}
            </Button>
            
            <Button
              size="sm"
              variant="secondary"
              className="backdrop-blur-sm shadow-lg"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAR(true);
              }}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              AR View
            </Button>
          </div>
        </Card>
      </div>

      {/* AR View Dialog */}
      <Dialog open={showAR} onOpenChange={setShowAR}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{name} - AR Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full">
            <ARViewer 
              productName={name}
              imageUrl={image}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
