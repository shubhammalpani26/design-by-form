import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ORIGINALS_SKUS, type OriginalSku } from "@/data/originalsSkus";

type Props = { productId: string; giftSlug?: never } | { giftSlug: string; productId?: never };

/**
 * "You may also like": Lovable AI orders our US-made gift pieces for the page
 * being viewed. Only gift items are shown — never furniture.
 */
export const YouMayAlsoLike = (props: Props) => {
  const key = props.productId ?? props.giftSlug;
  const [items, setItems] = useState<OriginalSku[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    const exclude = props.giftSlug;
    const defaults = ORIGINALS_SKUS.filter((s) => s.slug !== exclude);
    supabase.functions
      .invoke("product-recommendations", {
        body: props.productId ? { productId: props.productId } : { giftSlug: props.giftSlug },
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        const slugs: string[] = !error && Array.isArray(data?.slugs) ? data.slugs : [];
        const picked = slugs
          .map((slug) => ORIGINALS_SKUS.find((s) => s.slug === slug))
          .filter((s): s is OriginalSku => Boolean(s) && s!.slug !== exclude);
        setItems(picked.length ? picked : defaults);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const count = props.giftSlug ? 3 : 4;

  return (
    <section aria-labelledby="you-may-also-like" className="container mx-auto px-4 pb-16 pt-4">
      <h2 id="you-may-also-like" className="text-xl md:text-2xl font-light tracking-tight">
        You may also like
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">Personalised gifts, made in the USA · free US shipping</p>
      <div className={`mt-5 grid grid-cols-2 gap-px border border-border bg-border ${count === 3 ? "md:grid-cols-3" : "md:grid-cols-4"}`}>
        {items === null
          ? Array.from({ length: count }).map((_, i) => (
              <div key={i} className="bg-background p-3">
                <Skeleton className="aspect-[4/5] w-full" />
                <Skeleton className="mt-3 h-4 w-3/4" />
                <Skeleton className="mt-2 h-3 w-1/3" />
              </div>
            ))
          : items.map((s) => (
              <Link
                key={s.slug}
                to={`/originals/${s.slug}`}
                className="group bg-background p-3 transition-colors hover:bg-muted/30"
              >
                <div className="aspect-[4/5] w-full overflow-hidden bg-muted/20">
                  <img
                    src={s.image}
                    alt={s.name}
                    loading="lazy"
                    decoding="async"
                    width={1024}
                    height={1280}
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-snug">{s.name}</p>
                <p className="mt-1 text-sm tabular-nums">
                  {s.sizes.length > 1 ? "From " : ""}${Math.min(...s.sizes.map((z) => z.price))}
                </p>
              </Link>
            ))}
      </div>
    </section>
  );
};
