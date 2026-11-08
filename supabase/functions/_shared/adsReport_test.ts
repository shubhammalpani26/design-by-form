import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { act, bands, biggestDrop, buildAlerts, istWindow, purchasesOf, type AlertInput } from "./adsReport.ts";

const base: AlertInput = {
  currencySymbol: "₹", accountActive: true, activeAds: 5, dailyBudget: 3000, capLeft: 50000, prepaid: 20000,
  adIssues: [], pixelPageViews24h: 600, spend: 10000, metaPurchases: 0, paidOrders: 0,
  adPreviews: 0, adCheckouts: 0, adPayments: 0, drop: null, ageBands: [], stateBands: [], ads: [],
};
const titles = (i: Partial<AlertInput>) => buildAlerts({ ...base, ...i }).map((a) => a.title);

Deno.test("window is India-time calendar days ending today", () => {
  // 17:30 UTC on Nov 1 is already Nov 2 in India.
  const w = istWindow(7, new Date("2026-11-01T19:00:00Z"));
  assertEquals(w.until, "2026-11-02");
  assertEquals(w.since, "2026-10-27");
  assertEquals(w.sinceUtc, "2026-10-26T18:30:00.000Z");
  assertEquals(istWindow(1, new Date("2026-11-01T10:00:00Z")).since, "2026-11-01");
});

Deno.test("purchase count uses one action type, never the sum of duplicates", () => {
  const a = [{ action_type: "purchase", value: "1" }, { action_type: "offsite_conversion.fb_pixel_purchase", value: "1" }, { action_type: "omni_purchase", value: "1" }];
  assertEquals(purchasesOf(a), 1);
  assertEquals(act([], "x"), 0);
});

Deno.test("biggest drop ignores steps with too few people", () => {
  const d = biggestDrop([
    { label: "Landed", people: 100 }, { label: "Photo", people: 40 }, { label: "Preview", people: 33 },
    { label: "Size", people: 10 }, { label: "Checkout", people: 6 }, { label: "Payment", people: 2 }, { label: "Paid", people: 0 },
  ]);
  // Preview→Size keeps 30%: worse than Landed→Photo (40%) and Checkout→Payment (33%);
  // Payment→Paid is ignored because only 2 people reached payment.
  assertEquals([d?.from, d?.to, d?.lost], ["Preview", "Size", 23]);
});

Deno.test("biggest drop picks the lowest pass-through rate", () => {
  const d = biggestDrop([{ label: "A", people: 100 }, { label: "B", people: 50 }, { label: "C", people: 10 }]);
  assertEquals([d?.from, d?.to, d?.lost], ["B", "C", 40]);
});

Deno.test("spending limit under one day of budget is urgent; under three is a warning", () => {
  assertEquals(buildAlerts({ ...base, capLeft: 2000 })[0].title, "Ads stop within a day");
  assertEquals(titles({ capLeft: 7000 }).includes("Ads stop in about 2 days"), true);
  assertEquals(titles({ capLeft: 0 })[0], "Spending limit reached — ads have stopped");
  assertEquals(titles({ capLeft: 50000 }).some((t) => t.startsWith("Ads stop")), false);
});

Deno.test("what happens after the preview is always summarised once 3+ people saw one", () => {
  const none = buildAlerts({ ...base, adPreviews: 22, adCheckouts: 0 }).find((x) => x.title.includes("saw their preview"));
  assertEquals(none?.title, "0 of 22 ad visitors who saw their preview paid");
  assertEquals(none?.detail.includes("Nobody clicked checkout"), true);
  const one = buildAlerts({ ...base, adPreviews: 22, adCheckouts: 3, adPayments: 1, paidOrders: 1 }).find((x) => x.title.includes("saw their preview"));
  assertEquals(one?.title, "1 of 22 ad visitors who saw their preview paid");
  assertEquals(one?.level, "warn");
  assertEquals(one?.detail, "After the preview: 3 clicked checkout, 1 reached the payment step.");
  assertEquals(titles({ adPreviews: 2 }).some((t) => t.includes("saw their preview")), false);
});

Deno.test("40%+ of spend on one age band with no checkouts is flagged", () => {
  const ages = bands([
    { key: "55-64", spend: 450, clicks: 5, checkouts: 0, purchases: 0 },
    { key: "35-44", spend: 300, clicks: 5, checkouts: 1, purchases: 0 },
    { key: "55-64", spend: 50, clicks: 0, checkouts: 0, purchases: 0 },
    { key: "25-34", spend: 200, clicks: 3, checkouts: 0, purchases: 0 },
  ]);
  assertEquals(titles({ ageBands: ages }).includes("50% of spend went to ages 55-64"), true);
  const fine = bands([{ key: "55-64", spend: 390, clicks: 1, checkouts: 0, purchases: 0 }, { key: "35-44", spend: 610, clicks: 1, checkouts: 1, purchases: 0 }]);
  assertEquals(titles({ ageBands: fine }).some((t) => t.includes("55-64")), false);
});

Deno.test("55+ together taking 40%+ of spend with no checkouts is flagged", () => {
  const ages = bands([
    { key: "55-64", spend: 310, clicks: 5, checkouts: 0, purchases: 0 },
    { key: "65+", spend: 240, clicks: 2, checkouts: 0, purchases: 0 },
    { key: "35-44", spend: 450, clicks: 5, checkouts: 2, purchases: 1 },
  ]);
  assertEquals(titles({ ageBands: ages }).includes("55% of spend went to people 55 and over"), true);
});

Deno.test("an active ad with 500+ views and under 0.6% site clicks is flagged; small ones are not", () => {
  assertEquals(titles({ ads: [{ name: "Daisy", active: true, impressions: 1000, linkClicks: 4 }] }).includes('Few people tap "Daisy"'), true);
  assertEquals(titles({ ads: [{ name: "Milo", active: true, impressions: 91, linkClicks: 0 }] }).length, titles({}).length);
});

Deno.test("cost per sale uses Meta-credited purchases; problems sort before good news", () => {
  const a = buildAlerts({ ...base, metaPurchases: 2, spend: 9000, pixelPageViews24h: 0 });
  assertEquals(a[0].level, "bad");
  assertEquals(a.at(-1)?.detail, "About ₹4,500 of ad spend per sale in this period.");
});
