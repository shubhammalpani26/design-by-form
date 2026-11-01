import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { ORIGINALS_SKUS } from "@/data/originalsSkus";

interface SavedPreview {
  id: string;
  skuSlug: string;
  imageUrl: string;
  name: string | null;
  colorLabel: string | null;
  createdAt: string;
  ordered: boolean;
}

const SKU_NAME: Record<string, string> = Object.fromEntries(ORIGINALS_SKUS.map((s) => [s.slug, s.name]));

/** Every preview a signed-in shopper has made, on any device. */
export default function MyPreviews() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [previews, setPreviews] = useState<SavedPreview[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSignedIn(Boolean(session));
      if (!session) { setLoading(false); return; }
      const { data, error: fnError } = await supabase.functions.invoke("originals-my-previews", { body: { action: "list" } });
      if (fnError || !Array.isArray(data?.previews)) setError("We couldn't load your previews. Please try again.");
      else setPreviews(data.previews as SavedPreview[]);
      setLoading(false);
    })();
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-5 py-16">
      <SEOHead title="Your previews — Nyzora" description="Every piece you've previewed, saved to your account." noIndex />
      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Nyzora</p>
      <h1 className="mt-3 text-3xl font-light tracking-tight">Your previews</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Every preview you make while signed in is saved here, on any phone or computer.
      </p>

      {loading && (
        <div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your previews…
        </div>
      )}

      {!loading && !signedIn && (
        <div className="mt-8 border border-border p-5">
          <p className="text-sm">Sign in to see the previews saved to your account.</p>
          <Button asChild className="mt-4 rounded-none">
            <Link to="/auth?returnTo=/my-previews">Sign in</Link>
          </Button>
        </div>
      )}

      {!loading && error && <p className="mt-8 text-sm text-destructive">{error}</p>}

      {!loading && signedIn && !error && previews.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          No previews yet.{" "}
          <Link to="/originals/pet-silhouette-keepsake" className="underline">Make one from a photo</Link> — it's free.
        </p>
      )}

      {previews.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-3">
          {previews.map((p) => (
            <Link
              key={p.id}
              to={`/originals/${p.skuSlug}?preview=${p.id}`}
              className="group bg-background p-3 transition-colors hover:bg-muted/30"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-muted/20">
                <img src={p.imageUrl} alt={p.name ? `${p.name} preview` : "Your preview"} loading="lazy" decoding="async"
                  className="h-full w-full object-contain" />
                {p.ordered && (
                  <span className="absolute left-2 top-2 border border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-[0.15em]">
                    Ordered
                  </span>
                )}
              </div>
              <p className="mt-3 truncate text-sm">{p.name || SKU_NAME[p.skuSlug] || "Your piece"}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {[p.colorLabel, new Date(p.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })]
                  .filter(Boolean).join(" · ")}
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.15em] text-muted-foreground group-hover:text-foreground">
                Open preview →
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
