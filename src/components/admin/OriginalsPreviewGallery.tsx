import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, RefreshCw, Images, Trash2, Box } from "lucide-react";
import { ModelViewer3D } from "@/components/ModelViewer3D";

interface PreviewPersonalization {
  colorLabel?: string;
  heading?: string;
  footnote?: string;
  tweak?: string;
  [key: string]: unknown;
}

interface PreviewRow {
  id: string;
  sku_slug: string;
  source_image_url: string | null;
  preview_image_url: string | null;
  personalization: PreviewPersonalization | null;
  user_id: string | null;
  ip_hash: string | null;
  print_file_url: string | null;
  model_status: string | null;
  created_at: string;
}

interface OrderInfo {
  id: string;
  created_at: string;
  customer_email: string | null;
  user_id: string | null;
  amount_usd: number;
  size_label: string | null;
  status: string;
  production_status: string;
  shipping_address: any;
  print_file_url: string | null;
  engraved_text: string | null;
  partner_order_id: string | null;
  promo_code: string | null;
  discount_usd: number | null;
  partnerTotal: number | null;
  partnerPrint: number | null;
  partnerShip: number | null;
}

interface GalleryItem extends PreviewRow {
  signedSourceUrl: string | null;
  orders: OrderInfo[];
}

const fmtAddress = (a: any) => {
  if (!a) return null;
  const ad = a.address ?? a;
  return [a.name, ad.line1, ad.line2, [ad.city, ad.state, ad.postal_code].filter(Boolean).join(" "), ad.country, a.phone]
    .filter(Boolean)
    .join(", ");
};

const PAGE_SIZE = 24;

/**
 * Admin-only review of real customer uploads next to the render each produced.
 * Source photos live in the private originals-uploads bucket; admins read them
 * through short-lived signed URLs (RLS: admins can view originals uploads).
 */
export function OriginalsPreviewGallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [ordersOnly, setOrdersOnly] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modelView, setModelView] = useState<{ url: string; name: string; label: string } | null>(null);

  /**
   * Removes a preview and its files everywhere: the uploaded photo, the
   * render, and the database rows. Server-side function enforces admin-only.
   */
  const deletePreview = async (item: GalleryItem) => {
    const label = item.personalization?.heading || item.sku_slug;
    if (!window.confirm(`Delete this preview (${label})? The customer's photo and its render are removed permanently.`)) return;
    setDeletingId(item.id);
    setError(null);
    const { error: dError } = await supabase.rpc("admin_delete_originals_preview", {
      p_preview_id: item.id,
    });
    if (dError) {
      setError(`Couldn't delete: ${dError.message}`);
    } else {
      setItems((prev) => prev.filter((p) => p.id !== item.id));
    }
    setDeletingId(null);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: qError } = await supabase
      .from("originals_previews")
      .select("id, sku_slug, source_image_url, preview_image_url, personalization, user_id, ip_hash, print_file_url, model_status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (qError) {
      setError(qError.message);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as PreviewRow[];

    // Sign each private source photo (1 hour expiry, batch in parallel).
    const signed = await Promise.all(
      rows.map(async (row) => {
        if (!row.source_image_url) return { ...row, signedSourceUrl: null };
        const { data: s } = await supabase.storage
          .from("originals-uploads")
          .createSignedUrl(row.source_image_url, 3600);
        return { ...row, signedSourceUrl: s?.signedUrl ?? null };
      }),
    );
    // Attach any orders placed from each preview, plus what the partner billed.
    const ids = rows.map((r) => r.id);
    const { data: ord } = ids.length
      ? await supabase
          .from("originals_orders")
          .select("id, preview_id, created_at, customer_email, user_id, amount_usd, size_label, status, production_status, shipping_address, print_file_url, engraved_text, partner_order_id, promo_code, discount_usd")
          .in("preview_id", ids)
      : { data: [] as any[] };
    const orderIds = (ord ?? []).map((o: any) => o.id);
    const { data: ev } = orderIds.length
      ? await supabase
          .from("partner_order_events")
          .select("originals_order_id, details")
          .in("originals_order_id", orderIds)
          .eq("event", "order_processed")
      : { data: [] as any[] };
    const cost = new Map<string, any>();
    (ev ?? []).forEach((e: any) => cost.set(e.originals_order_id, e.details));
    const byPreview = new Map<string, OrderInfo[]>();
    (ord ?? []).forEach((o: any) => {
      const c = cost.get(o.id) ?? {};
      const info: OrderInfo = {
        ...o,
        partnerTotal: c.total ?? null,
        partnerPrint: c.printingCost ?? null,
        partnerShip: c.deliveryCost ?? null,
      };
      byPreview.set(o.preview_id, [...(byPreview.get(o.preview_id) ?? []), info]);
    });
    setItems(signed.map((r) => ({ ...r, orders: byPreview.get(r.id) ?? [] })));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = ordersOnly ? items.filter((i) => i.orders.length > 0) : items;
  const visible = showAll ? filtered : filtered.slice(0, PAGE_SIZE);
  const visitorKey = (i: GalleryItem) => i.user_id ?? i.ip_hash ?? "unknown";
  const distinctVisitors = new Set(items.map(visitorKey)).size;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Images className="h-4 w-4" /> Everything
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Every real upload next to the render it produced — {items.length} previews from{" "}
              {distinctVisitors} visitor{distinctVisitors === 1 ? "" : "s"}. Private; only admins
              can see this.
            </p>
          </div>
          <div className="flex gap-2">
          <Button variant={ordersOnly ? "default" : "outline"} size="sm" onClick={() => setOrdersOnly((v) => !v)}>
            {ordersOnly ? "Showing orders only" : "Orders only"}
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">Couldn't load previews: {error}</p>}
        {!error && !loading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">No customer previews yet.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((item) => (
            <div key={item.id} className="rounded-md border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="text-xs">
                  {item.sku_slug}
                </Badge>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    title="Delete this preview, its photo and its render"
                    disabled={deletingId === item.id}
                    onClick={() => deletePreview(item)}
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                    Their photo
                  </p>
                  {item.signedSourceUrl ? (
                    <a href={item.signedSourceUrl} target="_blank" rel="noreferrer">
                      <img
                        src={item.signedSourceUrl}
                        alt="Customer upload"
                        className="aspect-square w-full rounded object-contain bg-muted"
                        loading="lazy"
                      />
                    </a>
                  ) : (
                    <div className="aspect-square w-full rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      No photo
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                    Render
                  </p>
                  {item.preview_image_url ? (
                    <a href={item.preview_image_url} target="_blank" rel="noreferrer">
                      <img
                        src={item.preview_image_url}
                        alt="Generated render"
                        className="aspect-square w-full rounded object-contain bg-muted"
                        loading="lazy"
                      />
                    </a>
                  ) : (
                    <div className="aspect-square w-full rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      No render
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                <span>Visitor {(visitorKey(item) ?? "").slice(0, 8)} · {item.user_id ? "signed in" : "guest"}</span>
                {item.personalization?.colorLabel && (
                  <span className="font-medium text-foreground">Colour: {item.personalization.colorLabel}</span>
                )}
                {(item.personalization?.heading || item.personalization?.footnote) && (
                  <span>
                    Lettering: {item.personalization.heading || "—"}
                    {item.personalization.footnote ? ` · ${item.personalization.footnote}` : ""}
                  </span>
                )}
              </div>
              {item.orders.map((o) => (
                <div key={o.id} className="rounded border border-foreground/30 p-2 text-xs space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-semibold text-foreground">ORDER · ${Number(o.amount_usd).toFixed(0)} · {o.size_label}</span>
                    <Badge variant="secondary" className="text-[10px]">{o.status} · {o.production_status}</Badge>
                  </div>
                  <div className="text-muted-foreground">{new Date(o.created_at).toLocaleString()} · #{o.id.slice(0, 8)}</div>
                  <div><span className="text-muted-foreground">Email:</span> {o.customer_email ?? "—"} {o.user_id ? "(account)" : "(guest)"}</div>
                  <div><span className="text-muted-foreground">Ship to:</span> {fmtAddress(o.shipping_address) ?? "—"}</div>
                  <div>
                    <span className="text-muted-foreground">Slant 3D cost:</span>{" "}
                    {o.partnerTotal != null ? `$${o.partnerTotal.toFixed(2)} (print $${o.partnerPrint?.toFixed(2)} + ship $${o.partnerShip?.toFixed(2)})` : "not charged yet"}
                    {o.partnerTotal != null && (
                      <span className="text-muted-foreground"> · margin ${(Number(o.amount_usd) - o.partnerTotal).toFixed(2)}</span>
                    )}
                  </div>
                  {o.promo_code && <div><span className="text-muted-foreground">Promo:</span> {o.promo_code} (−${Number(o.discount_usd ?? 0).toFixed(2)})</div>}
                  <div><span className="text-muted-foreground">Lettering in file:</span> {o.engraved_text ?? "none yet"}</div>
                  {o.partner_order_id && <div className="text-muted-foreground">Slant order {o.partner_order_id}</div>}
                  {o.print_file_url && (
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setModelView({ url: o.print_file_url!, name: o.engraved_text || item.sku_slug, label: "Production 3D (with lettering)" })}>
                        <Box className="mr-1 h-3.5 w-3.5" /> View production 3D (with lettering)
                      </Button>
                      <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                        <a href={o.print_file_url} download>STL</a>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {item.print_file_url ? (
                <div className="space-y-2">
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setModelView({ url: item.print_file_url!, name: item.personalization?.heading || item.sku_slug, label: "Preview 3D (no lettering)" })}>
                      <Box className="mr-1 h-3.5 w-3.5" /> View preview 3D (no lettering)
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                      <a href={item.print_file_url} download>Download STL</a>
                    </Button>
                  </div>
                </div>
              ) : item.model_status ? (
                <p className="text-[10px] text-muted-foreground">3D model: {item.model_status}</p>
              ) : null}
            </div>
          ))}
        </div>
        {!showAll && filtered.length > PAGE_SIZE && (
          <div className="pt-4 text-center">
            <Button variant="outline" size="sm" onClick={() => setShowAll(true)}>
              Show all {filtered.length}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
