import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";

interface HomeProductCardProps {
  id: string;
  name: string;
  designer: string;
  designerId: string;
  price: number;
  weight: number;
  image: string;
}

export const HomeProductCard = ({ id, name, designer, designerId, price, weight, image }: HomeProductCardProps) => {
  const { formatPrice } = useCurrency();

  return (
    <Link to={`/product/${id}`} className="group block">
      <Card className="overflow-hidden border-border hover:shadow-medium transition-all duration-300">
        <div className="aspect-square overflow-hidden bg-accent">
          <img
            src={image}
            alt={name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg text-foreground mb-1">{name}</h3>
          <p className="text-sm text-muted-foreground">
            by <span
              className="hover:text-primary transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/designer/${designerId}`;
              }}
            >
              {designer}
            </span>
          </p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-primary font-semibold">{formatPrice(price)}</p>
            <p className="text-xs text-muted-foreground">{weight} kg</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
