import { assertEquals } from "jsr:@std/assert@1";
import { fallbackPicks, isFresh, resolvePicks, type CatalogItem } from "./productRecs.ts";

const item = (id: string, category: string, designerId = "d1"): CatalogItem => ({
  id, name: id, category, description: null, price: 100, designerId,
});

const catalog = [
  item("chair-a", "chairs", "d1"),
  item("lamp-a", "lighting", "d2"),
  item("chair-b", "chairs", "d2"),
  item("table-a", "tables", "d3"),
  item("chair-c", "chairs", "d1"),
  item("vase-a", "decor", "d4"),
];
const current = { id: "chair-a", category: "chairs", designerId: "d1" };

Deno.test("shows exactly 4 recommendations", () => {
  assertEquals(resolvePicks([2, 3, 4, 6, 5], catalog, current).length, 4);
});

Deno.test("never recommends the product being viewed", () => {
  const ids = resolvePicks([1, 1, 2], catalog, current);
  assertEquals(ids.includes("chair-a"), false);
});

Deno.test("ignores made-up or repeated picks and fills the gaps", () => {
  assertEquals(resolvePicks([99, 0, 2, 2], catalog, current), ["lamp-a", "chair-b", "chair-c", "table-a"]);
});

Deno.test("fallback prefers the same category, other creators first", () => {
  assertEquals(fallbackPicks(catalog, current, 3), ["chair-b", "chair-c", "lamp-a"]);
});

Deno.test("AI picks refresh weekly, fallbacks daily", () => {
  const now = new Date("2026-11-10T00:00:00Z");
  assertEquals(isFresh(new Date("2026-11-04T00:00:00Z"), "ai", now), true);
  assertEquals(isFresh(new Date("2026-11-02T23:00:00Z"), "ai", now), false);
  assertEquals(isFresh(new Date("2026-11-09T12:00:00Z"), "fallback", now), true);
  assertEquals(isFresh(new Date("2026-11-08T23:00:00Z"), "fallback", now), false);
});
