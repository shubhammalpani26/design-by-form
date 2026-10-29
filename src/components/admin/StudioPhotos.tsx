import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Trash2, Wand2, Square, ShoppingBag } from "lucide-react";

type Row = {
  id: string;
  name: string;
  image_url: string | null;
  studio_image_url: string | null;
  studio_image_error: string | null;
  shopify_product_id: string | null;
  studio_shopify_media_id: string | null;
};

async function callStudio(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("admin-product-studio-photo", { body });
  if (error) {
    let payload: any = null;
    try {
      payload = await (error as any).context?.json?.();
    } catch { /* ignore */ }
    return { ok: false, stop: payload?.stop ?? false, error: payload?.error ?? error.message, ...payload };
  }
  return data as any;
}

/** Admin: clean studio photos for catalog products (shown first on product pages and at checkout). */
export function StudioPhotos() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [batch, setBatch] = useState<null | "photos" | "checkout">(null);
  const [batchNote, setBatchNote] = useState("");
  const stopRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("designer_products")
      .select("id, name, image_url, studio_image_url, studio_image_error, shopify_product_id, studio_shopify_media_id")
      .eq("status", "approved")
      .order("created_at", { ascending: true });
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const done = rows.filter((r) => r.studio_image_url).length;
  const needCheckout = rows.filter((r) => r.studio_image_url && r.shopify_product_id && !r.studio_shopify_media_id);

  const runPhotos = async () => {
    stopRef.current = false;
    setBatch("photos");
    let made = 0;
    try {
      while (!stopRef.current) {
        setBatchNote(`Making photo ${made + 1}…`);
        const res = await callStudio({ action: "next" });
        if (res?.done) break;
        if (res?.stop) {
          toast({ title: "Paused", description: res.error ?? "AI is unavailable right now.", variant: "destructive" });
          break;
        }
        if (res?.ok) made++;
        else if (res?.error) toast({ title: res?.name ?? "Skipped one", description: res.error, variant: "destructive" });
        if (!res?.ok && !res?.productId) break; // unknown failure: don't loop forever
        await load();
      }
    } finally {
      setBatch(null);
      setBatchNote("");
      await load();
      if (made) toast({ title: `Made ${made} studio photo${made === 1 ? "" : "s"}` });
    }
  };

  const runCheckout = async () => {
    stopRef.current = false;
    setBatch("checkout");
    let sent = 0;
    try {
      for (const r of needCheckout) {
        if (stopRef.current) break;
        setBatchNote(`Sending ${sent + 1} of ${needCheckout.length}…`);
        const res = await callStudio({ action: "shopify", productId: r.id });
        if (!res?.ok) {
          toast({ title: "Checkout photos stopped", description: res?.error ?? "The store didn't accept it.", variant: "destructive" });
          break;
        }
        sent++;
      }
    } finally {
      setBatch(null);
      setBatchNote("");
      await load();
      if (sent) toast({ title: `Updated ${sent} checkout photo${sent === 1 ? "" : "s"}` });
    }
  };

  const one = async (id: string, action: "generate" | "remove") => {
    setBusyId(id);
    const res = await callStudio({ action, productId: id });
    setBusyId(null);
    if (!res?.ok) toast({ title: "Didn't work", description: res?.error ?? "Try again.", variant: "destructive" });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Studio photos</h2>
          <p className="text-sm text-muted-foreground">
            A clean studio shot made from each product's own photo. It shows first on the product page and at checkout;
            the original stays in the gallery. {done} of {rows.length} done.
          </p>
          {batchNote && <p className="mt-1 text-sm">{batchNote}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {batch ? (
            <Button variant="outline" onClick={() => (stopRef.current = true)}>
              <Square className="mr-2 h-4 w-4" /> Stop after this one
            </Button>
          ) : (
            <>
              <Button onClick={runPhotos} disabled={loading || done === rows.length}>
                <Wand2 className="mr-2 h-4 w-4" /> Make missing photos
              </Button>
              {needCheckout.length > 0 && (
                <Button variant="outline" onClick={runCheckout}>
                  <ShoppingBag className="mr-2 h-4 w-4" /> Send {needCheckout.length} to checkout
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <div key={r.id} className="border border-border p-3">
              <div className="grid grid-cols-2 gap-2">
                <figure>
                  <div className="aspect-square bg-muted">
                    {r.image_url && <img src={r.image_url} alt="" className="h-full w-full object-contain" loading="lazy" />}
                  </div>
                  <figcaption className="mt-1 text-xs text-muted-foreground">Original</figcaption>
                </figure>
                <figure>
                  <div className="flex aspect-square items-center justify-center bg-muted">
                    {busyId === r.id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : r.studio_image_url ? (
                      <img src={r.studio_image_url} alt="" className="h-full w-full object-contain" loading="lazy" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Not made yet</span>
                    )}
                  </div>
                  <figcaption className="mt-1 text-xs text-muted-foreground">Studio</figcaption>
                </figure>
              </div>
              <div className="mt-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  {r.studio_image_url && r.shopify_product_id && (
                    <Badge variant={r.studio_shopify_media_id ? "secondary" : "outline"} className="mt-1 text-[10px]">
                      {r.studio_shopify_media_id ? "At checkout" : "Not at checkout yet"}
                    </Badge>
                  )}
                  {r.studio_image_error && !r.studio_image_error.startsWith("Checkout image") && (
                    <p className="mt-1 text-xs text-destructive">{r.studio_image_error}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="icon" variant="ghost" title="Make again" disabled={!!batch || busyId === r.id} onClick={() => one(r.id, "generate")}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  {r.studio_image_url && (
                    <Button size="icon" variant="ghost" title="Remove studio photo" disabled={!!batch || busyId === r.id} onClick={() => one(r.id, "remove")}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
