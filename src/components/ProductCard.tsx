import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

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
  return (
    <Link to={`/product/${id}`} className="group">
      <Card className="overflow-hidden border-border hover:shadow-medium transition-all duration-300">
        <div className="aspect-square overflow-hidden bg-accent">
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg text-foreground mb-1">{name}</h3>
          <Link
            to={`/designer/${designerId}`}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            by {designer}
          </Link>
          <div className="flex items-center justify-between mt-2">
            <p className="text-primary font-semibold">₹{price.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{weight} kg</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
