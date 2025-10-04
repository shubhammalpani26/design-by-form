import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface ProductCardProps {
  id: string;
  name: string;
  designer: string;
  designerId: string;
  price: number;
  image: string;
}

export const ProductCard = ({ id, name, designer, designerId, price, image }: ProductCardProps) => {
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
          <p className="text-primary font-semibold mt-2">${price.toLocaleString()}</p>
        </CardContent>
      </Card>
    </Link>
  );
};
