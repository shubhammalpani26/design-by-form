import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

type Stats = any;

const Stat = ({ label, value, hint }: { label: string; value: string | number; hint?: string }) => (
  <div className="border border-border p-4">
    <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="mt-1 text-2xl font-semibold text-foreground">{value}</div>
    {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h3>
    {children}
  </section>
);

export function AdminDashboard() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.functions.invoke("admin-dashboard-stats", { body: { days } });
    if (error || data?.error) setError(error?.message ?? data.error);
    else setData(data);
    setLoading(false);
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const money = (n: number, cur = "INR") =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n || 0);
  const ads = data?.ads;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {[1, 7, 30].map((d) => (
            <Button key={d} size="sm" variant={days === d ? "default" : "outline"} onClick={() => setDays(d)}>
              {d === 1 ? "Today" : `${d} days`}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {data?.generatedAt && (
            <span className="text-xs text-muted-foreground">Updated {new Date(data.generatedAt).toLocaleString()}</span>
          )}
          <Button size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {error && <div className="border border-destructive p-3 text-sm text-destructive">{error}</div>}
      {!data && loading && <div className="text-sm text-muted-foreground">Loading…</div>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Visitors" value={data.visitors} hint={`${data.pageViews} page views`} />
            <Stat label="Renders done" value={data.renders} hint={`${data.previewFailures} failed of ${data.previewAttempts} tries`} />
            <Stat label="Orders (paid)" value={data.orders.count} hint={`$${data.orders.revenue.toFixed(0)} revenue · tests excluded`} />
            <Stat label="Ad spend" value={ads?.totals ? money(ads.totals.spend, ads.currency) : "—"} hint={ads?.totals ? `${ads.totals.clicks} clicks` : undefined} />
          </div>

          <Section title="Pet page funnel (unique people)">
            <div className="border border-border">
              {data.funnel.map((f: any, i: number) => {
                const top = data.funnel[0].people || 1;
                return (
                  <div key={f.label} className="flex items-center justify-between border-b border-border px-4 py-2 text-sm last:border-b-0">
                    <span className="text-foreground">{i + 1}. {f.label}</span>
                    <span className="font-medium text-foreground">
                      {f.people} <span className="text-xs text-muted-foreground">({Math.round((f.people / top) * 100)}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="Ads (Meta)">
            {ads?.error ? (
              <div className="text-sm text-destructive">Couldn't load ads: {ads.error}</div>
            ) : ads ? (
              <>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Stat label="Campaign" value={ads.campaignStatus ?? "—"} hint={ads.dailyBudget ? `${money(ads.dailyBudget, ads.currency)}/day` : undefined} />
                  <Stat label="Balance due / left" value={money(ads.balance, ads.currency)} hint={ads.spendCapLeft != null ? `Spend cap left ${money(ads.spendCapLeft, ads.currency)}` : undefined} />
                  <Stat label="CTR · CPC" value={`${ads.totals.ctr.toFixed(2)}%`} hint={`${money(ads.totals.cpc, ads.currency)} per click`} />
                  <Stat label="Landed · Purchases" value={`${ads.totals.landings} · ${ads.totals.purchases}`} hint={`${ads.totals.impressions} impressions`} />
                </div>
                <div className="overflow-x-auto border border-border">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase text-muted-foreground">
                      <tr>{["Ad", "Spend", "Clicks", "CTR", "CPC", "Landed", "Buys"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {ads.rows.length === 0 && <tr><td colSpan={7} className="px-3 py-3 text-muted-foreground">No delivery in this period.</td></tr>}
                      {ads.rows.map((r: any) => (
                        <tr key={r.name} className="border-t border-border text-foreground">
                          <td className="px-3 py-2">{r.name}</td>
                          <td className="px-3 py-2">{money(r.spend, ads.currency)}</td>
                          <td className="px-3 py-2">{r.clicks}</td>
                          <td className="px-3 py-2">{r.ctr.toFixed(2)}%</td>
                          <td className="px-3 py-2">{money(r.cpc, ads.currency)}</td>
                          <td className="px-3 py-2">{r.landings}</td>
                          <td className="px-3 py-2">{r.purchases}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </Section>

          <div className="grid gap-8 md:grid-cols-2">
            <Section title="Top pages">
              {data.topPages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Page tracking just started — pages appear as people visit.</p>
              ) : (
                <div className="border border-border">
                  {data.topPages.map((p: any) => (
                    <div key={p.path} className="flex justify-between gap-2 border-b border-border px-3 py-2 text-sm last:border-b-0">
                      <span className="truncate text-foreground">{p.path}</span>
                      <span className="shrink-0 text-muted-foreground">{p.visitors} people · {p.views} views</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
            <Section title="Where visitors came from">
              <div className="border border-border">
                {data.sources.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">No data yet.</p>}
                {data.sources.map((s: any) => (
                  <div key={s.source} className="flex justify-between border-b border-border px-3 py-2 text-sm last:border-b-0">
                    <span className="text-foreground">{s.source}</span>
                    <span className="text-muted-foreground">{s.visitors}</span>
                  </div>
                ))}
              </div>
              <h4 className="pt-2 text-xs uppercase tracking-wider text-muted-foreground">Visitors per day</h4>
              <div className="border border-border">
                {data.daily.map((d: any) => (
                  <div key={d.date} className="flex justify-between border-b border-border px-3 py-2 text-sm last:border-b-0">
                    <span className="text-foreground">{d.date}</span>
                    <span className="text-muted-foreground">{d.visitors}</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <Section title="Recent paid orders">
            {data.orders.list.length === 0 ? (
              <p className="text-sm text-muted-foreground">No paid orders in this period.</p>
            ) : (
              <div className="border border-border">
                {data.orders.list.map((o: any) => (
                  <div key={o.id} className="flex flex-wrap justify-between gap-2 border-b border-border px-3 py-2 text-sm last:border-b-0">
                    <span className="text-foreground">{new Date(o.created_at).toLocaleString()} · {o.sku_slug} · {o.size_label}</span>
                    <span className="text-muted-foreground">${Number(o.amount_usd).toFixed(0)} · {o.production_status}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
}
