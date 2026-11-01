import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Skeleton } from "@/components/ui/skeleton";
import { slugify } from "@/lib/slugify";

interface RecCard {
  id: string;
  slug: string | null;
  name: string;
  category: string;
  price: number;
  image: string;
  creator: string | null;
}

/** AI-picked related pieces from the live catalog, shown under a product. */
export const YouMayAlsoLike = ({ productId }: { productId: string }) => {
  const { formatPrice } = useCurrency();
  const [items, setItems] = useState<RecCard[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    supabase.functions
      .invoke("product-recommendations", { body: { productId } })
      .then(({ data, error }) => {
        if (cancelled) return;
        setItems(error || !Array.isArray(data?.products) ? [] : (data.products as RecCard[]));
      });
    return () => { cancelled = true; };
  }, [productId]);

  if (items && items.length === 0) return null;

  return (
    <section aria-labelledby="you-may-also-like" className="container mx-auto px-4 md:px-8 pb-16 pt-4">
      <h2 id="you-may-also-like" className="text-xl md:text-2xl font-light tracking-tight">
        You may also like
      </h2>
      <div className="mt-5 grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-4">
        {items === null
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-background p-3">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="mt-3 h-4 w-3/4" />
                <Skeleton className="mt-2 h-3 w-1/3" />
              </div>
            ))
          : items.map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.slug || slugify(p.name)}`}
                className="group bg-background p-3 transition-colors hover:bg-muted/30"
              >
                <div className="aspect-square w-full overflow-hidden bg-muted/20">
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-snug">{p.name}</p>
                {p.creator && (
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">by {p.creator}</p>
                )}
                <p className="mt-1 text-sm tabular-nums">{formatPrice(p.price)}</p>
              </Link>
            ))}
      </div>
    </section>
  );
};
