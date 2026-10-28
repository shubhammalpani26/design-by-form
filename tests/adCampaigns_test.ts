import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  attributeSessions,
  campaignForPageView,
  META_OTHER,
} from "../supabase/functions/_shared/adCampaigns.ts";

const NOW = "2026-10-28T12:00:00Z";

Deno.test("holiday ad links (utm_campaign=holiday_gift) count as the holiday campaign", () => {
  assertEquals(campaignForPageView({ campaign: "holiday_gift", source: "meta", path: "/originals/pet-portrait-sculpture" }, NOW), "holiday_gift");
  // Older rows without a campaign field: utm_source=meta after launch = holiday.
  assertEquals(campaignForPageView({ source: "meta", path: "/originals/pet-portrait-sculpture" }, NOW), "holiday_gift");
  assertEquals(campaignForPageView({ source: "meta" }, "2026-10-20T00:00:00Z"), META_OTHER);
});

Deno.test("untagged Facebook/Instagram click landing on the keepsake page counts as the city campaign", () => {
  assertEquals(campaignForPageView({ campaign: "meta_untagged", landing: "/product/pet-silhouette-keepsake" }, NOW), "city_new_visitors");
  assertEquals(campaignForPageView({ source: "facebook", path: "/originals/pet-silhouette-keepsake" }, NOW), "city_new_visitors");
  assertEquals(campaignForPageView({ source: "ig", path: "/product/pet-silhouette-keepsake" }, NOW), "city_new_visitors");
  assertEquals(campaignForPageView({ source: "fb", path: "/originals/pet-silhouette-keepsake" }, NOW), "city_new_visitors");
  assertEquals(campaignForPageView({ source: "facebook", path: "/" }, NOW), META_OTHER);
});

Deno.test("campaign tags naming the campaign or its Meta id map to the right campaign", () => {
  assertEquals(campaignForPageView({ campaign: "120250213160950499", source: "ig" }, NOW), "city_new_visitors");
  assertEquals(campaignForPageView({ campaign: "Nyzora Originals — Pet Sculpture — US New Visitors (Austin, Denver, Portland)" }, NOW), "city_new_visitors");
  assertEquals(campaignForPageView({ campaign: "120250403223140499" }, NOW), "holiday_gift");
  assertEquals(campaignForPageView({ campaign: "spring_newsletter", source: "email" }, NOW), "spring_newsletter");
});

Deno.test("visitors from search or direct are not credited to any ad", () => {
  assertEquals(campaignForPageView({ source: "google.com", path: "/" }, NOW), null);
  assertEquals(campaignForPageView({ source: "direct", path: "/originals/pet-portrait-sculpture" }, NOW), null);
});

Deno.test("a later Facebook referrer page view does not override the campaign the visitor clicked", () => {
  const map = attributeSessions([
    { session_id: "s1", metadata: { source: "facebook", path: "/product/pet-silhouette-keepsake" }, created_at: NOW },
    { session_id: "s1", metadata: { source: "facebook.com", path: "/originals/pet-silhouette-keepsake" }, created_at: NOW },
    { session_id: "s2", metadata: { source: "direct", path: "/" }, created_at: NOW },
  ]);
  assertEquals(map.get("s1"), "city_new_visitors");
  assertEquals(map.has("s2"), false);
});
