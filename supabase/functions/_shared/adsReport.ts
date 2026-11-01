/**
 * Pure helpers for the admin "Ads" tab: the reporting window (Meta reports in
 * the ad account's India time), action picking, the drop-off finder and the
 * plain-language "what needs attention" list. No I/O, so it is unit-tested.
 */

export type Alert = { level: "bad" | "warn" | "good"; title: string; detail: string };
export type MetaAction = { action_type: string; value: string | number };

/** Calendar days in India time (the ad account's zone): `days` days ending today. */
export function istWindow(days: number, now: Date = new Date()) {
  const ist = new Date(now.getTime() + 330 * 60_000);
  const until = ist.toISOString().slice(0, 10);
  const since = new Date(ist.getTime() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
  const sinceUtc = new Date(`${since}T00:00:00+05:30`).toISOString();
  return { since, until, sinceUtc };
}

/** First matching action type's count (Meta repeats one event under several names; never sum them). */
export function act(actions: MetaAction[] | undefined | null, ...types: string[]): number {
  for (const t of types) {
    const hit = (actions ?? []).find((a) => a.action_type === t);
    if (hit) return Number(hit.value) || 0;
  }
  return 0;
}
export const purchasesOf = (a?: MetaAction[] | null) => act(a, "offsite_conversion.fb_pixel_purchase", "purchase");
export const checkoutsOf = (a?: MetaAction[] | null) =>
  act(a, "offsite_conversion.fb_pixel_initiate_checkout", "initiate_checkout");
export const landedOf = (a?: MetaAction[] | null) => act(a, "landing_page_view");

export type Step = { label: string; people: number };

/**
 * The step where the largest share of people stop. Only steps whose previous
 * step had at least `minPrev` people count, so 1-of-2 noise is not "the" leak.
 */
export function biggestDrop(steps: Step[], minPrev = 3) {
  let worst: { from: string; to: string; rate: number; lost: number; index: number } | null = null;
  for (let i = 1; i < steps.length; i++) {
    const prev = steps[i - 1].people;
    if (prev < minPrev) continue;
    const rate = Math.min(1, steps[i].people / prev);
    if (!worst || rate < worst.rate) {
      worst = { from: steps[i - 1].label, to: steps[i].label, rate, lost: Math.max(0, prev - steps[i].people), index: i };
    }
  }
  return worst;
}

export type BandRow = { key: string; spend: number; clicks: number; checkouts: number; purchases: number };

/** Group breakdown rows (e.g. age+gender) into one band per key, with spend share. */
export function bands(rows: BandRow[]) {
  const m = new Map<string, BandRow>();
  for (const r of rows) {
    const b = m.get(r.key) ?? { key: r.key, spend: 0, clicks: 0, checkouts: 0, purchases: 0 };
    b.spend += r.spend; b.clicks += r.clicks; b.checkouts += r.checkouts; b.purchases += r.purchases;
    m.set(r.key, b);
  }
  const total = [...m.values()].reduce((s, b) => s + b.spend, 0);
  return [...m.values()].map((b) => ({ ...b, share: total ? b.spend / total : 0 }));
}

export type AlertInput = {
  currencySymbol: string;
  accountActive: boolean;
  activeAds: number;
  dailyBudget: number;
  capLeft: number | null;
  prepaid: number | null;
  adIssues: { name: string; reason: string }[];
  pixelPageViews24h: number | null;
  spend: number;
  metaPurchases: number;
  paidOrders: number;
  adPreviews: number;
  adCheckouts: number;
  adPayments: number;
  drop: { from: string; to: string; rate: number; lost: number } | null;
  ageBands: { key: string; share: number; checkouts: number; purchases: number }[];
  stateBands: { key: string; share: number }[];
  ads: { name: string; active: boolean; impressions: number; linkClicks: number }[];
};

const fmt = (sym: string, n: number) => `${sym}${Math.round(n).toLocaleString("en-US")}`;
const pct = (r: number) => `${Math.round(r * 100)}%`;

export function buildAlerts(i: AlertInput): Alert[] {
  const out: Alert[] = [];
  const m = (n: number) => fmt(i.currencySymbol, n);

  if (!i.accountActive) out.push({ level: "bad", title: "Ad account isn't active", detail: "Meta reports the account as not active, so nothing can run. Open Meta Ads Manager to see why." });
  if (i.activeAds === 0) out.push({ level: "warn", title: "No ads are running", detail: "Every ad is paused or stopped, so no new people are seeing Nyzora." });

  if (i.capLeft != null && i.activeAds > 0) {
    if (i.capLeft <= 0) out.push({ level: "bad", title: "Spending limit reached — ads have stopped", detail: "Raise the account spending limit in Meta to keep the ads running." });
    else if (i.dailyBudget > 0) {
      const days = i.capLeft / i.dailyBudget;
      if (days < 1) out.push({ level: "bad", title: "Ads stop within a day", detail: `Only ${m(i.capLeft)} left before the spending limit, at ${m(i.dailyBudget)} a day.` });
      else if (days < 3) out.push({ level: "warn", title: `Ads stop in about ${Math.floor(days)} day${Math.floor(days) === 1 ? "" : "s"}`, detail: `${m(i.capLeft)} left before the spending limit, at ${m(i.dailyBudget)} a day.` });
    }
  }
  if (i.prepaid != null && i.activeAds > 0 && i.dailyBudget > 0 && i.prepaid < i.dailyBudget * 2) {
    out.push({ level: "warn", title: "Prepaid balance is low", detail: `${m(i.prepaid)} left — under two days of spend. Add funds in Meta so ads don't pause.` });
  }
  for (const a of i.adIssues) out.push({ level: "bad", title: `"${a.name}" has a problem`, detail: a.reason });
  if (i.pixelPageViews24h === 0 && i.activeAds > 0) {
    out.push({ level: "bad", title: "Meta hasn't seen any site visits in 24 hours", detail: "Ads are running but the tracking code reported nothing. Sales may not be credited to ads." });
  }

  if (i.adPreviews > 0 && i.paidOrders === 0) {
    out.push({
      level: "warn",
      title: `${i.adPreviews} ${i.adPreviews === 1 ? "person" : "people"} from ads saw their preview — nobody paid`,
      detail: i.adCheckouts === 0
        ? "Nobody clicked checkout after seeing their sculpture, so the size/price screen is where they leave."
        : `${i.adCheckouts} clicked checkout and ${i.adPayments} reached the payment step.`,
    });
  }
  if (i.drop && i.drop.lost > 0) {
    out.push({ level: "warn", title: `Biggest drop: ${i.drop.from} → ${i.drop.to}`, detail: `Only ${pct(i.drop.rate)} go on (${i.drop.lost} people stop here).` });
  }

  const skew = i.ageBands.filter((b) => b.share >= 0.4 && b.checkouts + b.purchases === 0).sort((a, b) => b.share - a.share)[0];
  if (skew) out.push({ level: "warn", title: `${pct(skew.share)} of spend went to ages ${skew.key}`, detail: "That age group has no checkouts in this period." });
  const st = [...i.stateBands].sort((a, b) => b.share - a.share)[0];
  if (st && st.share >= 0.4) out.push({ level: "warn", title: `${pct(st.share)} of spend went to ${st.key}`, detail: "One state is taking most of the budget." });

  for (const a of i.ads) {
    if (!a.active || a.impressions < 500) continue;
    const ctr = a.linkClicks / a.impressions;
    if (ctr < 0.006) out.push({ level: "warn", title: `Few people tap "${a.name}"`, detail: `${a.linkClicks} site clicks from ${a.impressions.toLocaleString("en-US")} views (${(ctr * 100).toFixed(1)}%). The opening seconds may not be grabbing attention.` });
  }

  if (i.metaPurchases > 0) {
    out.push({ level: "good", title: `Meta credits ${i.metaPurchases} sale${i.metaPurchases === 1 ? "" : "s"} to the ads`, detail: `About ${m(i.spend / i.metaPurchases)} of ad spend per sale in this period.` });
  } else if (i.spend > 0 && i.paidOrders === 0) {
    out.push({ level: "warn", title: `${m(i.spend)} spent, no sales in this period`, detail: "Check the drop-off below to see where people stop." });
  }

  const rank = { bad: 0, warn: 1, good: 2 } as const;
  return out.sort((a, b) => rank[a.level] - rank[b.level]);
}
