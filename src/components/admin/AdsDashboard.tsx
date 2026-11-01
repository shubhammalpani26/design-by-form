import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, ExternalLink, OctagonAlert, RefreshCw } from "lucide-react";

/**
 * Admin "Ads" tab: one Refresh pulls everything about the Facebook/Instagram
 * ads live (read-only) — money left, what needs attention, where people drop
 * off between the ad and payment, each ad, who saw them, day by day, tracking.
 */

type Data = any;

const STATUS: Record<string, string> = {
  ACTIVE: "Running", PAUSED: "Paused", CAMPAIGN_PAUSED: "Campaign paused", ADSET_PAUSED: "Ad set paused",
  DISAPPROVED: "Rejected", PENDING_REVIEW: "In review", IN_PROCESS: "In review", WITH_ISSUES: "Problem",
};
const TRACKED = [
  ["PageView", "Page visits"], ["ViewContent", "Product views"], ["CustomizeProduct", "Previews made"],
  ["InitiateCheckout", "Checkouts started"], ["Purchase", "Purchases"],
] as const;

const Stat = ({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) => (
  <div className="border border-border p-3 sm:p-4">
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">{value}</div>
    {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
  </div>
);

const Section = ({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h3>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
    {children}
  </section>
);

const Bar = ({ value, tone = "primary" }: { value: number; tone?: "primary" | "warning" | "muted" }) => (
  <div className="h-2 w-full bg-muted">
    <div
      className={tone === "warning" ? "h-2 bg-warning" : tone === "muted" ? "h-2 bg-muted-foreground" : "h-2 bg-primary"}
      style={{ width: `${Math.max(value > 0 ? 2 : 0, Math.min(100, value))}%` }}
    />
  </div>
);

const shortDate = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

export function AdsDashboard() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.functions.invoke("admin-ads-stats", { body: { days } });
    if (error || data?.error) setError(error?.message ?? data.error);
    else setData(data);
    setLoading(false);
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const sym = data?.symbol ?? "₹";
  const m = (n: number | null | undefined) => (n == null ? "—" : `${sym}${Math.round(n).toLocaleString("en-US")}`);
  const usd = (n: number | null | undefined) => (n == null ? "—" : `$${Math.round(n).toLocaleString("en-US")}`);
  const n = (v: number) => Math.round(v).toLocaleString("en-US");

  const funnel: any[] = data?.funnel ?? [];
  const clicks = funnel[1]?.people || 1;
  const dropIndex = data?.drop ? data.drop.index + 2 : -1;
  const maxDaySpend = Math.max(1, ...((data?.daily ?? []).map((d: any) => d.spend)));
  const bestAd = (data?.ads ?? [])
    .filter((a: any) => a.purchases > 0 || a.checkouts > 0)
    .sort((a: any, b: any) => b.purchases - a.purchases || b.checkouts - a.checkouts)[0]?.id;

  return (
    <div className="space-y-8">
      {/* Controls */}
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
            <span className="text-xs text-muted-foreground">
              Updated {new Date(data.generatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </span>
          )}
          <Button size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {error && <div className="border border-destructive p-3 text-sm text-destructive">{error}</div>}
      {!data && loading && <div className="text-sm text-muted-foreground">Pulling the latest from Meta and the site…</div>}

      {data && (
        <div className={`space-y-8 transition-opacity ${loading ? "opacity-60" : ""}`}>
          <p className="text-xs text-muted-foreground">
            {shortDate(data.window.since)}
            {data.window.since !== data.window.until && ` – ${shortDate(data.window.until)}`} · India time (the ad account's
            clock) · today's numbers are still coming in
          </p>

          {data.errors?.length > 0 && (
            <div className="border border-warning p-3 text-xs text-foreground">
              Some Meta numbers couldn't be loaded, so parts below may be blank: {data.errors.join(" · ")}
            </div>
          )}

          {/* Right now */}
          <Section title="Right now">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Stat
                label="Ads running"
                value={data.account.activeAds}
                hint={data.account.activeCampaigns.length ? data.account.activeCampaigns.join(", ") : "Nothing is running"}
              />
              <Stat label="Daily budget" value={m(data.account.dailyBudget)} hint="Meta averages this; some days spend more" />
              <Stat
                label="Can still spend"
                value={m(data.account.capLeft)}
                hint={data.account.daysLeft != null ? `About ${Math.floor(data.account.daysLeft)} days at this budget` : "No spending limit set"}
              />
              <Stat label="Prepaid balance" value={m(data.account.prepaid)} hint="Money loaded in Meta" />
            </div>
          </Section>

          {/* Results */}
          <Section title="Results">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Stat label="Spent" value={m(data.totals.spend)} hint={data.money.spendUsd != null ? `≈ ${usd(data.money.spendUsd)}` : undefined} />
              <Stat
                label="Sales"
                value={data.money.paidOrders}
                hint={`${usd(data.money.revenueUsd)} paid orders · Meta credits ${data.totals.purchases} to ads`}
              />
              <Stat
                label="Ad cost per sale"
                value={data.totals.costPerSale != null ? m(data.totals.costPerSale) : "No sales yet"}
                hint={data.totals.costPerSale != null && data.money.spendUsd != null && data.totals.purchases
                  ? `≈ ${usd(data.money.spendUsd / data.totals.purchases)} per sale`
                  : undefined}
              />
              <Stat
                label="Ad cost per preview"
                value={data.totals.costPerPreview != null ? m(data.totals.costPerPreview) : "—"}
                hint={`${data.site.preview} ad visitors saw their sculpture`}
              />
            </div>
          </Section>

          {/* Attention */}
          <Section title="What needs attention">
            {data.alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing stands out right now.</p>
            ) : (
              <div className="space-y-2">
                {data.alerts.map((a: any, i: number) => {
                  const Icon = a.level === "bad" ? OctagonAlert : a.level === "warn" ? AlertTriangle : CheckCircle2;
                  const tone = a.level === "bad" ? "border-l-destructive text-destructive" : a.level === "warn" ? "border-l-warning text-warning" : "border-l-success text-success";
                  return (
                    <div key={i} className={`flex gap-3 border border-l-4 border-border p-3 ${tone.split(" ")[0]}`}>
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone.split(" ")[1]}`} />
                      <div>
                        <div className="text-sm font-medium text-foreground">{a.title}</div>
                        <div className="text-xs text-muted-foreground">{a.detail}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Funnel */}
          <Section
            title="From ad to payment"
            note="The first three steps and 'Paid' are Meta's counts; the middle steps are what ad visitors did on the site."
          >
            <div className="border border-border">
              {funnel.map((f, i) => {
                const prev = i > 0 ? funnel[i - 1].people : 0;
                const rate = i > 0 && prev > 0 ? Math.round((f.people / prev) * 100) : null;
                const isDrop = i === dropIndex;
                return (
                  <div key={f.label} className={`space-y-1.5 border-b border-border px-3 py-2.5 last:border-b-0 ${isDrop ? "bg-accent" : ""}`}>
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="text-foreground">
                        {f.label}
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">{f.source === "meta" ? "Meta" : "Site"}</span>
                        {isDrop && <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-warning">Biggest drop</span>}
                      </span>
                      <span className="shrink-0 font-semibold text-foreground">
                        {n(f.people)}
                        {rate != null && <span className="ml-1.5 text-xs font-normal text-muted-foreground">{rate}% of above</span>}
                      </span>
                    </div>
                    {i > 0 && <Bar value={(f.people / clicks) * 100} tone={isDrop ? "warning" : "primary"} />}
                  </div>
                );
              })}
            </div>
            {data.campaigns.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Site visits from ads by campaign: {data.campaigns.map((c: any) => `${c.label} ${c.visitors}`).join(" · ")}. The site
                counts every visit, so it can be higher than Meta's page loads.
              </p>
            )}
          </Section>

          {/* Each ad */}
          <Section title="Each ad" note="Running ads first, then any that spent in this period.">
            {data.ads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No ads ran in this period.</p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {data.ads.map((a: any) => (
                  <div key={a.id} className={`border p-3 ${a.problem ? "border-destructive" : "border-border"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">{a.name}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{a.campaign}</div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {a.id === bestAd && (
                          <span className="border border-success px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-success">Best</span>
                        )}
                        <span className={`border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${a.active ? "border-foreground text-foreground" : "border-border text-muted-foreground"}`}>
                          {STATUS[a.status] ?? a.status}
                        </span>
                      </div>
                    </div>
                    {a.problem && <p className="mt-2 text-xs text-destructive">{a.problem}</p>}
                    <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                      {[
                        ["Spent", m(a.spend)],
                        ["Site clicks", n(a.linkClicks)],
                        ["Click rate", `${a.ctr.toFixed(1)}%`],
                        ["Per click", m(a.cpc)],
                        ["Pages loaded", n(a.landed)],
                        ["Checkouts", n(a.checkouts)],
                        ["Sales", n(a.purchases)],
                        ["Watched fully", a.fullWatchRate != null ? `${a.fullWatchRate.toFixed(0)}%` : "—"],
                      ].map(([k, v]) => (
                        <div key={k as string}>
                          <div className="text-sm font-semibold text-foreground">{v}</div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Audience */}
          <Section title="Who saw the ads" note="Share of spend, with site clicks and checkouts from each group.">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Age", data.ageBands],
                ["Gender", data.genderBands],
                ["Top states", data.stateBands],
              ].map(([title, rows]: any) => (
                <div key={title} className="border border-border p-3">
                  <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">{title}</div>
                  {rows.length === 0 && <p className="text-xs text-muted-foreground">No data.</p>}
                  <div className="space-y-2">
                    {rows.map((b: any) => {
                      const skew = b.share >= 0.4 && b.checkouts + b.purchases === 0 && title !== "Gender";
                      return (
                        <div key={b.key} className="space-y-1">
                          <div className="flex justify-between gap-2 text-xs">
                            <span className="capitalize text-foreground">{b.key}</span>
                            <span className="text-muted-foreground">
                              {Math.round(b.share * 100)}% · {b.clicks} clicks{b.checkouts ? ` · ${b.checkouts} checkout` : ""}
                            </span>
                          </div>
                          <Bar value={b.share * 100} tone={skew ? "warning" : "primary"} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Daily */}
          {data.daily.length > 1 && (
            <Section title="Day by day">
              <div className="border border-border">
                {[...data.daily].reverse().map((d: any) => (
                  <div key={d.date} className="space-y-1 border-b border-border px-3 py-2 last:border-b-0">
                    <div className="flex justify-between gap-2 text-xs">
                      <span className="font-medium text-foreground">{shortDate(d.date)}</span>
                      <span className="text-muted-foreground">
                        {m(d.spend)} · {d.linkClicks} clicks · {d.landed} loaded
                        {d.checkouts ? ` · ${d.checkouts} checkout` : ""}
                        {d.purchases ? ` · ${d.purchases} sale` : ""}
                      </span>
                    </div>
                    <Bar value={(d.spend / maxDaySpend) * 100} tone={d.purchases ? "primary" : "muted"} />
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Tracking */}
          <Section title="Tracking — last 24 hours" note="What Meta received from the site. Purchases only appear here after someone pays.">
            {data.tracking ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {TRACKED.map(([k, label]) => (
                  <Stat key={k} label={label} value={n(data.tracking[k] ?? 0)} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Couldn't read tracking from Meta.</p>
            )}
          </Section>

          <a
            href="https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=2036145687783794"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-4"
          >
            Open Meta Ads Manager <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}
