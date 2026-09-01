import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Trash2, ChevronDown, ChevronRight } from "lucide-react";

interface OriginalsOrder {
  id: string;
  group_id: string | null;
  sku_slug: string;
  size_label: string | null;
  quantity: number;
  status: string;
  production_status: string;
  partner_order_id: string | null;
  tracking_numbers: string[] | null;
  carrier: string | null;
  customer_email: string | null;
  amount_usd: number;
  fulfillment_error: string | null;
  created_at: string;
  personalization: unknown;
  engraved_text: string | null;
  engraved_at: string | null;
}


interface PartnerEvent {
  id: string;
  originals_order_id: string | null;
  partner_order_id: string | null;
  source: string;
  stage: string;
  event: string;
  status: string | null;
  message: string | null;
  details: unknown;
  occurred_at: string;
}

const tone: Record<string, string> = {
  delivered: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  shipped: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  in_production: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  failed: "bg-destructive/10 text-destructive border-destructive/30",
  needs_file: "bg-destructive/10 text-destructive border-destructive/30",
  unpaid: "bg-muted text-muted-foreground border-foreground/20",
};

const UNPAID = ["pending", "failed", "cancelled"];

/** Never show a production stage for money that never landed. */
const displayStatus = (o: OriginalsOrder) =>
  UNPAID.includes(o.status)
    ? { key: "unpaid", label: o.status === "pending" ? "Not paid — never ordered" : `Not paid (${o.status})` }
    : { key: o.production_status, label: o.production_status.replace(/_/g, " ") };

const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

const pretty = (s: string) => s.replace(/_/g, " ");

/**
 * Mirrors the engraver's own text normalisation so the dashboard compares
 * like with like — anything else would report false mismatches.
 */
const normalizeEngraving = (input: string) =>
  input
    .toUpperCase()
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/[^A-Z0-9 .,'&\-/#()!?:+]/g, "")
    .trim();

/** The lettering the buyer paid for, or "" when the piece isn't personalised. */
const wantedEngraving = (p: unknown): string => {
  const o = (p ?? {}) as Record<string, unknown>;
  const heading = normalizeEngraving(String(o.heading ?? o.name ?? ""));
  const footnote = normalizeEngraving(String(o.footnote ?? o.dates ?? ""));
  return [heading, footnote].filter(Boolean).join(" / ");
};

type EngravingState = "none" | "engraved" | "blocked";

/**
 * The fulfilment gate refuses to ship a personalised piece without a matching
 * engraving record — silently. This makes that gate visible.
 */
const engravingState = (o: OriginalsOrder): EngravingState => {
  if (UNPAID.includes(o.status)) return "none";
  const wanted = wantedEngraving(o.personalization);
  if (!wanted) return "none";
  return o.engraved_at && normalizeEngraving(o.engraved_text ?? "") === wanted
    ? "engraved"
    : "blocked";
};




/** Internal fulfillment console for Nyzora Originals — admins only. */
export function OriginalsFulfillmentManagement() {
  const [orders, setOrders] = useState<OriginalsOrder[]>([]);
  const [events, setEvents] = useState<PartnerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const load = useCallback(async () => {
    const [ordersRes, eventsRes] = await Promise.all([
      supabase
        .from("originals_orders")
        .select(
          "id, group_id, sku_slug, size_label, quantity, status, production_status, partner_order_id, tracking_numbers, carrier, customer_email, amount_usd, fulfillment_error, created_at, personalization, engraved_text, engraved_at",
        )
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("partner_order_events")
        .select(
          "id, originals_order_id, partner_order_id, source, stage, event, status, message, details, occurred_at",
        )
        .order("occurred_at", { ascending: false })
        .limit(500),
    ]);

    if (ordersRes.error) console.error(ordersRes.error);
    if (eventsRes.error) console.error(eventsRes.error);
    // Abandoned carts and failed payments never reach the partner — keep them
    // visible but plainly marked, and always below the real orders.
    const all = (ordersRes.data as OriginalsOrder[]) ?? [];
    setOrders(
      [...all].sort(
        (a, b) => Number(UNPAID.includes(a.status)) - Number(UNPAID.includes(b.status)),
      ),
    );

    setEvents((eventsRes.data as PartnerEvent[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const eventsByOrder = useMemo(() => {
    const map = new Map<string, PartnerEvent[]>();
    for (const e of events) {
      const key = e.originals_order_id ?? `partner:${e.partner_order_id}`;
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [events]);

  /** Personalised orders that shipped (or will ship) with real lettering. */
  const engraving = useMemo(() => {
    const states = orders.map(engravingState);
    const total = states.filter((s) => s !== "none").length;
    const engraved = states.filter((s) => s === "engraved").length;
    return { total, engraved, blocked: total - engraved };
  }, [orders]);

  const unmatched = useMemo(

    // Our own webhook connectivity pings aren't real fulfilment events.
    () =>
      events.filter(
        (e) => !e.originals_order_id && e.partner_order_id !== "NYZORA_VERIFY_TEST",
      ),
    [events],
  );

  const runSync = async () => {
    setBusy("sync");
    const { error } = await supabase.functions.invoke("originals-tracking-sync", { body: {} });
    setBusy(null);
    if (error) {
      toast({ title: "Sync failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Synced", description: "Pulled the latest partner status." });
    load();
  };

  /**
   * The partner stops at "shipped" — carriers confirm delivery, so we stamp it.
   * Marking delivered manually also fires the review-request email by asking
   * tracking-sync to process this order group (it sends the email once, when
   * review_requested_at is still null).
   */
  const markDelivered = async (order: OriginalsOrder) => {
    setBusy(order.id);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("originals_orders")
      .update({ production_status: "delivered", delivered_at: now, updated_at: now })
      .eq("id", order.id);
    if (error) {
      setBusy(null);
      toast({ title: "Couldn't update", description: error.message, variant: "destructive" });
      return;
    }
    // Trigger the review-request email for this group (safe to call as admin).
    // Only claim the email went out when the sync actually sent one.
    let emailNote = " — review email not sent (no order group).";
    if (order.group_id) {
      const { data, error: syncError } = await supabase.functions.invoke("originals-tracking-sync", {
        body: { group_id: order.group_id },
      });
      const sent = (data as { reviewsRequested?: number } | null)?.reviewsRequested ?? 0;
      emailNote = syncError
        ? ` — review email could not be sent (${syncError.message}).`
        : sent > 0
        ? " — review email sent."
        : " — review email was already sent earlier.";
    }
    setBusy(null);
    toast({ title: "Marked delivered", description: `#${order.id.slice(0, 8)} is now delivered${emailNote}` });
    load();
  };

  const sweepDrafts = async () => {
    setBusy("drafts");
    const { data, error } = await supabase.functions.invoke("partner-draft-cleanup", { body: {} });
    setBusy(null);
    if (error) {
      toast({ title: "Cleanup failed", description: error.message, variant: "destructive" });
      return;
    }
    const res = data as { drafts?: number; released?: number; failed?: unknown[] };
    toast({
      title: "Draft cleanup done",
      description: `${res?.released ?? 0} of ${res?.drafts ?? 0} drafts released${
        res?.failed?.length ? `, ${res.failed.length} failed` : ""
      }.`,
    });
    load();
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading orders…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Originals Fulfillment</h2>
          <p className="text-sm text-muted-foreground">
            Internal partner timeline — never shown to customers.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={runSync} disabled={busy !== null}>
            {busy === "sync" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Sync partner status
          </Button>
          <Button variant="outline" size="sm" onClick={sweepDrafts} disabled={busy !== null}>
            {busy === "drafts" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Clean up drafts
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Engraving success rate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-2xl font-bold">
              {engraving.total ? Math.round((engraving.engraved / engraving.total) * 100) : 100}%
            </span>
            <span className="text-muted-foreground">
              {engraving.engraved} of {engraving.total} paid personalised pieces carry real lettering
            </span>
            {engraving.blocked > 0 && (
              <Badge variant="outline" className={tone.failed}>
                {engraving.blocked} blocked — won't ship
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Fulfillment refuses to send a personalised piece without a matching engraving record.
            Anything counted as blocked is sitting still and needs a look.
          </p>
        </CardContent>
      </Card>

      {orders.map((order) => {
        const list = eventsByOrder.get(order.id) ?? [];
        const expanded = open[order.id] ?? false;
        const badge = displayStatus(order);
        const engraved = engravingState(order);

        return (
          <Card key={order.id} className={badge.key === "unpaid" ? "opacity-70" : ""}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">
                    {order.sku_slug} · {order.size_label ?? "—"} × {order.quantity}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    #{order.id.slice(0, 8)} · {order.customer_email ?? "no email"} · {when(order.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={tone[badge.key] ?? ""}>
                    {badge.label}
                  </Badge>
                  {engraved !== "none" && (
                    <Badge
                      variant="outline"
                      className={engraved === "engraved" ? tone.delivered : tone.failed}
                    >
                      {engraved === "engraved"
                        ? `Engraved: ${order.engraved_text}`
                        : "Engraving missing — blocked"}
                    </Badge>
                  )}


                  <Badge variant="secondary">${Number(order.amount_usd).toFixed(2)}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid gap-1 text-muted-foreground sm:grid-cols-2">
                <div>Partner order: {order.partner_order_id ?? "—"}</div>
                <div>
                  Tracking:{" "}
                  {order.tracking_numbers?.length
                    ? `${order.carrier ?? ""} ${order.tracking_numbers.join(", ")}`
                    : "—"}
                </div>
              </div>
              {order.fulfillment_error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-destructive">
                  {order.fulfillment_error}
                </div>
              )}

              {badge.key === "shipped" && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy !== null}
                  onClick={() => markDelivered(order)}
                >
                  {busy === order.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Mark delivered
                </Button>
              )}


              <Button
                variant="ghost"
                size="sm"
                className="px-0"
                onClick={() => setOpen((o) => ({ ...o, [order.id]: !expanded }))}
              >
                {expanded ? <ChevronDown className="mr-1 h-4 w-4" /> : <ChevronRight className="mr-1 h-4 w-4" />}
                Timeline ({list.length})
              </Button>

              {expanded && (
                <ol className="space-y-3 border-l pl-4">
                  {list.length === 0 && (
                    <li className="text-muted-foreground">No partner events recorded yet.</li>
                  )}
                  {list.map((e) => (
                    <li key={e.id} className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-foreground/40" />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{pretty(e.event)}</span>
                        <Badge variant="outline" className="text-[10px]">{e.stage}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{pretty(e.source)}</Badge>
                        <span className="text-xs text-muted-foreground">{when(e.occurred_at)}</span>
                      </div>
                      {e.message && <p className="text-xs text-muted-foreground">{e.message}</p>}
                      {e.details && Object.keys(e.details as object).length > 0 && (
                        <pre className="mt-1 max-h-40 overflow-auto rounded-md bg-muted p-2 text-[10px] leading-tight">
                          {JSON.stringify(e.details, null, 2)}
                        </pre>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        );
      })}

      {unmatched.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unmatched partner events ({unmatched.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {unmatched.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{pretty(e.event)}</span>
                <span className="text-xs text-muted-foreground">
                  {e.partner_order_id ?? "no partner id"} · {when(e.occurred_at)}
                </span>
                {e.message && <span className="text-xs text-muted-foreground">{e.message}</span>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
