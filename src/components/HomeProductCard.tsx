import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";
import { slugify } from "@/lib/slugify";
import { Shield } from "lucide-react";
import { getMakerForProduct } from "@/data/makers";

interface HomeProductCardProps {
  id: string;
  name: string;
  designer: string;
  designerId: string;
  price: number;
  weight: number;
  image: string;
  category?: string;
}

export const HomeProductCard = ({ id, name, designer, designerId, price, weight, image, category }: HomeProductCardProps) => {
  const { formatPrice } = useCurrency();
  const maker = getMakerForProduct(id, category);

  return (
    <Link to={`/product/${slugify(name)}`} className="group block">
      <Card className="overflow-hidden border-border hover:shadow-medium transition-all duration-300">
        <div className="aspect-square overflow-hidden bg-accent relative">
          <img
            src={image || "/placeholder.svg"}
            alt={name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg text-foreground mb-1">{name}</h3>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
            <span>
              by{" "}
              <span
                className="hover:text-primary transition-colors cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `/designer/${slugify(designer)}`;
                }}
              >
                {designer}
              </span>
            </span>
            <span
              className="inline-flex items-center gap-1 text-muted-foreground/60 hover:text-primary cursor-pointer transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/maker/${maker.slug}`;
              }}
            >
              <Shield className="h-3 w-3" />
              {maker.name}
            </span>
          </div>
          <p className="text-primary font-semibold">{formatPrice(price)}</p>
        </CardContent>
      </Card>
    </Link>
  );
};
