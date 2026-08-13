import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, Clock, Truck, Factory, ShieldCheck } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

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
  }, [orderId, groupId]);

  const paid = order && order.status !== "pending" && order.status !== "cancelled";
  const pieceCount = items.reduce((n, i) => n + (i.quantity || 1), 0) || 1;

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
            {paid ? "Your piece is confirmed" : "Finishing up your payment…"}
          </h1>

          {order.previewImageUrl && (
            <img
              src={order.previewImageUrl}
              alt="Your personalized piece"
              className="mt-6 w-full border border-foreground/10 object-contain"
            />
          )}

          <div className="mt-6 space-y-1 text-sm">
            <p className="tabular-nums">{order.sizeLabel} — ${order.amountUsd}</p>
            <p className="text-muted-foreground">Order {order.id.slice(0, 8)}</p>
            {order.emailMasked && (
              <p className="text-muted-foreground">Confirmation sent to {order.emailMasked}</p>
            )}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 border-t border-foreground/10 pt-6 text-sm text-muted-foreground sm:grid-cols-3">
            <div className="flex items-center gap-2"><Factory className="h-4 w-4" /> Made in the USA</div>
            <div className="flex items-center gap-2"><Truck className="h-4 w-4" /> Ships in 3–5 days</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> 30-day remake or refund</div>
          </div>

          <Link to="/" className="mt-8 inline-block text-sm underline">Back to Nyzora</Link>
        </>
      )}
    </main>
  );
}
