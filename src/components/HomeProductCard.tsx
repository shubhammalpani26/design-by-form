import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";
import { slugify } from "@/lib/slugify";
import { Shield } from "lucide-react";
import { getDefaultMaker } from "@/data/makers";

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
  const maker = getDefaultMaker();

  return (
    <Link to={`/product/${slugify(name)}`} className="group block">
      <Card className="overflow-hidden border-border hover:shadow-medium transition-all duration-300">
        <div className="aspect-square overflow-hidden bg-accent relative">
          <img
            src={image && image.length < 50000 ? image : "/placeholder.svg"}
            alt={name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Exclusive Badge */}
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/90 backdrop-blur-sm text-[9px] font-semibold uppercase tracking-wider text-foreground/80 border border-border/40">
            Exclusively on Nyzora
          </span>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg text-foreground mb-1">{name}</h3>
          <p className="text-sm text-muted-foreground">
            by <span
              className="hover:text-primary transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/designer/${slugify(designer)}`;
              }}
            >
              {designer}
            </span>
          </p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-primary font-semibold">{formatPrice(price)}</p>
            <span
              className="inline-flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary cursor-pointer transition-colors"
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
        </CardContent>
      </Card>
    </Link>
  );
};
