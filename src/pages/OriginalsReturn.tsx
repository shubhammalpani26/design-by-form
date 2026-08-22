import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, Clock, Truck, Factory, ShieldCheck } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { originalsCart } from "@/lib/originalsCart";
import { trackPurchaseConversion } from "@/lib/googleAds";
import { trackPurchase } from "@/lib/metaPixel";


interface OrderView {
  id: string;
  status: string;
  sizeLabel: string | null;
  amountUsd: number;
  previewImageUrl: string | null;
  emailMasked: string | null;
}

interface OrderItem {
  id: string;
  skuSlug: string;
  sizeLabel: string | null;
  amountUsd: number;
  quantity: number;
  previewImageUrl: string | null;
}

const SKU_NAMES: Record<string, string> = {
  "pet-silhouette-keepsake": "Pet Sculpture Piece",
  "nursery-name-date": "Baby Name & Date Piece",
  "wedding-coordinates": "Wedding Coordinates Piece",
};

export default function OriginalsReturn() {
  const [params] = useSearchParams();
  const orderId = params.get("order");
  const groupId = params.get("group");
  const provider = params.get("provider");
  const [order, setOrder] = useState<OrderView | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stop = false;
    let tries = 0;

    const poll = async () => {
      if (!orderId && !groupId) {
        setLoading(false);
        return;
      }
      // Cashfree redirects back before its webhook lands — confirm with the
      // gateway directly so the buyer never sees a stale "pending".
      if (provider === "cashfree" && groupId && tries === 0) {
        await supabase.functions.invoke("cashfree-verify", { body: { groupId } });
        if (stop) return;
      }
      const { data } = await supabase.functions.invoke("originals-order-status", {
        body: groupId ? { groupId } : { orderId },
      });
      if (stop) return;
      if (data?.order) setOrder(data.order);
      if (Array.isArray(data?.items)) setItems(data.items);
      setLoading(false);
      tries += 1;
      // The webhook flips the order to "paid" a beat after Stripe redirects back.
      if ((!data?.order || data.order.status === "pending") && tries < 10) {
        setTimeout(poll, 1500);
      }
    };

    poll();
    return () => {
      stop = true;
    };
  }, [orderId, groupId, provider]);

  const paid = order && order.status !== "pending" && order.status !== "cancelled";
  const pieceCount = items.reduce((n, i) => n + (i.quantity || 1), 0) || 1;

  // Payment went through — the basket is now an order, so empty it.
  useEffect(() => {
    if (paid) originalsCart.clear();
  }, [paid]);

  // Report the sale to Google Ads and Meta exactly once per confirmed order.
  useEffect(() => {
    if (!paid || !order) return;
    const key = `nyzora_ads_conv_${order.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    const total = items.length
      ? items.reduce((sum, i) => sum + i.amountUsd * (i.quantity || 1), 0)
      : order.amountUsd;
    trackPurchaseConversion(order.id, total);
    trackPurchase(order.id, total, items.length ? items.map((i) => i.skuSlug) : [order.skuSlug ?? "originals"]);
  }, [paid, order, items]);

  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <SEOHead
        title="Order confirmed — Nyzora"
        description="Your personalized piece is confirmed and heading into production."
        noIndex
      />
      <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">Nyzora</p>

      {loading && !order && (
        <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Confirming your order…
        </div>
      )}

      {!loading && !order && (
        <>
          <h1 className="mt-3 text-2xl font-light tracking-tight">We couldn't find that order</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            If you were charged, your confirmation email has everything. Reply to it and we'll sort it out.
          </p>
          <Link to="/" className="mt-6 inline-block text-sm underline">Back to Nyzora</Link>
        </>
      )}

      {order && (
        <>
          <h1 className="mt-3 flex items-center gap-2 text-2xl font-light tracking-tight">
            {paid ? <CheckCircle2 className="h-6 w-6" /> : <Clock className="h-5 w-5 animate-pulse" />}
            {paid
              ? pieceCount > 1
                ? `Your ${pieceCount} pieces are confirmed`
                : "Your piece is confirmed"
              : "Finishing up your payment…"}
          </h1>

          {items.length <= 1 && order.previewImageUrl && (
            <img
              src={order.previewImageUrl}
              alt="Your personalized piece"
              className="mt-6 w-full border border-foreground/10 object-contain"
            />
          )}

          {items.length > 1 && (
            <div className="mt-6 divide-y divide-foreground/10 border border-foreground/10">
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-3 p-3">
                  {it.previewImageUrl && (
                    <img
                      src={it.previewImageUrl}
                      alt=""
                      className="h-16 w-16 border border-foreground/10 object-contain"
                    />
                  )}
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate">{SKU_NAMES[it.skuSlug] ?? "Nyzora piece"}</p>
                    <p className="text-xs text-muted-foreground">
                      {it.sizeLabel}
                      {it.quantity > 1 ? ` · ×${it.quantity}` : ""}
                    </p>
                  </div>
                  <p className="text-sm tabular-nums">${it.amountUsd}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 space-y-1 text-sm">
            <p className="tabular-nums">
              {items.length > 1 ? `Total — $${order.amountUsd}` : `${order.sizeLabel} — $${order.amountUsd}`}
            </p>
            <p className="text-muted-foreground">Order {order.id.slice(0, 8)}</p>
            {order.emailMasked && (
              <p className="text-muted-foreground">Confirmation sent to {order.emailMasked}</p>
            )}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 border-t border-foreground/10 pt-6 text-sm text-muted-foreground sm:grid-cols-3">
            <div className="flex items-center gap-2"><Factory className="h-4 w-4" /> Made in the USA</div>
            <div className="flex items-center gap-2"><Truck className="h-4 w-4" /> Ships in 3–5 days</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Remake if it's not right</div>
          </div>

          <div className="mt-6 border-t border-foreground/10 pt-6 text-xs leading-relaxed text-muted-foreground">
            Your piece is made to order and is already heading into production, so it can't be cancelled or
            returned for a change of mind. If it arrives damaged or defective we refund you in full, and if it
            doesn't match the render you approved we remake it free.
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-5 text-sm">
            <Link to="/orders" className="border border-foreground px-5 py-2">Track this order</Link>
            <Link to="/" className="underline">Back to Nyzora</Link>
          </div>
        </>
      )}
    </main>
  );
}
