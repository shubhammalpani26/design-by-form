import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Loader2, Package, Truck, CheckCircle2, Factory, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ORIGINALS_SKUS } from "@/data/originalsSkus";

interface OrderRow {
  id: string;
  group_id: string | null;
  created_at: string;
  status: string;
  production_status: string | null;
  sku_slug: string;
  size_label: string | null;
  amount_usd: number;
  quantity: number;
  preview_image_url: string | null;
  tracking_numbers: string[] | null;
  partner_order_id?: string | null;
}

const SKU_NAMES: Record<string, string> = {
  "pet-silhouette-keepsake": "Pet Sculpture Piece",
  "nursery-name-date": "Baby Name & Date Piece",
  "wedding-coordinates": "Wedding Coordinates Piece",
};

/** Catalogue photography, used when an order has no personalised render saved. */
const SKU_IMAGES: Record<string, string> = Object.fromEntries(
  ORIGINALS_SKUS.map((s) => [s.slug, s.image]),
);

const STAGES = [
  { key: "paid", label: "Order confirmed", icon: CheckCircle2 },
  { key: "in_production", label: "In production", icon: Factory },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Package },
] as const;

function stageIndex(status: string, production: string | null, partnerOrderId?: string | null) {
  if (production === "delivered") return 3;
  if (production === "shipped") return 2;
  if (production === "in_production" || production === "awaiting_shipment") return 1;
  // A partner order exists (or we marked it fulfilled) → it's being made.
  if (partnerOrderId || status === "fulfilled") return 1;
  return status === "pending" ? -1 : 0;
}

function trackingUrl(number: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(number)}`;
}

/** Groups rows by checkout group so a multi-piece order reads as one order. */
function groupOrders(rows: OrderRow[]) {
  const map = new Map<string, OrderRow[]>();
  for (const r of rows) {
    const key = r.group_id ?? r.id;
    map.set(key, [...(map.get(key) ?? []), r]);
  }
  return Array.from(map.entries());
}

export default function MyOrders() {
  const [params] = useSearchParams();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [lookupId, setLookupId] = useState(params.get("order") ?? "");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setSignedIn(Boolean(user));
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("originals_orders")
        .select(
          "id, group_id, created_at, status, production_status, sku_slug, size_label, amount_usd, quantity, preview_image_url, tracking_numbers, partner_order_id",
        )
        .neq("status", "pending")
        .order("created_at", { ascending: false });
      setRows((data as OrderRow[]) ?? []);
      setLoading(false);
      // Refresh partner tracking in the background so the page is never stale.
      supabase.functions.invoke("originals-tracking-sync", { body: {} }).catch(() => {});
    })();
  }, []);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    const id = lookupId.trim();
    if (!id) return;
    const { data } = await supabase.functions.invoke("originals-order-status", {
      body: { orderId: id },
    });
    if (!data?.order) {
      setLookupError("We couldn't find that order id. Check the confirmation email.");
      return;
    }
    window.location.href = `/originals/checkout/return?order=${id}`;
  };

  const groups = groupOrders(rows);

  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <SEOHead title="Your orders — Nyzora" description="Track your Nyzora pieces from production to delivery." noIndex />
      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Nyzora</p>
      <h1 className="mt-3 text-3xl font-light tracking-tight">Your orders</h1>

      {loading && (
        <div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your orders…
        </div>
      )}

      {!loading && signedIn && groups.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          No orders yet.{" "}
          <Link to="/" className="underline">
            Make your first piece
          </Link>
          .
        </p>
      )}

      {!loading && groups.map(([key, items]) => {
        const first = items[0];
        const idx = stageIndex(first.status, first.production_status, first.partner_order_id);
        const total = items.reduce((s, i) => s + Number(i.amount_usd ?? 0), 0);
        const tracking = Array.from(new Set(items.flatMap((i) => i.tracking_numbers ?? [])));
        return (
          <section key={key} className="mt-8 border border-foreground/10">
            <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-foreground/10 p-4">
              <div>
                <p className="text-sm">Order {first.id.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(first.created_at).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <p className="text-sm tabular-nums">${total}</p>
            </header>

            <div className="divide-y divide-foreground/10">
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-3 p-4">
                  <img
                    src={it.preview_image_url || SKU_IMAGES[it.sku_slug]}
                    alt={`${SKU_NAMES[it.sku_slug] ?? "Nyzora piece"} — ${it.size_label ?? "your order"}`}
                    loading="lazy"
                    className="h-16 w-16 shrink-0 border border-foreground/10 bg-muted object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = SKU_IMAGES[it.sku_slug] ?? "";
                    }}
                  />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate">{SKU_NAMES[it.sku_slug] ?? "Nyzora piece"}</p>
                    <p className="text-xs text-muted-foreground">
                      {it.size_label}
                      {it.quantity > 1 ? ` · ×${it.quantity}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-2 border-t border-foreground/10 p-4">
              {STAGES.map((stage, i) => {
                const Icon = stage.icon;
                const done = i <= idx;
                return (
                  <div key={stage.key} className={done ? "" : "opacity-35"}>
                    <Icon className="h-4 w-4" />
                    <p className="mt-2 text-[11px] leading-tight">{stage.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-foreground/10 p-4 text-sm">
              {tracking.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tracking</p>
                  {tracking.map((t) => (
                    <div key={t} className="flex items-center gap-3">
                      <a href={trackingUrl(t)} target="_blank" rel="noreferrer" className="underline tabular-nums">
                        {t}
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(t);
                          toast({ title: "Tracking number copied" });
                        }}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Copy tracking number"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {idx >= 1
                    ? "In production now — your tracking number appears here the moment it ships."
                    : "Confirmed. Production starts within a day, then 5–7 days to your door."}
                </p>
              )}
            </div>

            <div className="border-t border-foreground/10 p-4">
              <button
                type="button"
                onClick={() => openInvoice(first)}
                disabled={invoiceBusy === first.id}
                className="inline-flex items-center gap-2 border border-foreground/20 px-4 py-2 text-xs uppercase tracking-[0.2em] hover:bg-foreground hover:text-background disabled:opacity-50"
              >
                {invoiceBusy === first.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                Invoice
              </button>
            </div>

          </section>
        );
      })}

      {!loading && (
        <section className="mt-12 border-t border-foreground/10 pt-8">
          <h2 className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Ordered as a guest?
          </h2>
          <form onSubmit={lookup} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              placeholder="Paste your order id from the confirmation email"
              className="flex-1 border border-foreground/20 bg-transparent px-3 py-2 text-sm"
            />
            <button type="submit" className="border border-foreground px-5 py-2 text-sm">
              Track order
            </button>
          </form>
          {lookupError && <p className="mt-3 text-sm text-destructive">{lookupError}</p>}
        </section>
      )}
    </main>
  );
}
