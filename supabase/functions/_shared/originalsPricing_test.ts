import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { retailFor } from "./originalsPricing.ts";

// Owner decision 2026-10-25: pet sculptures sell at $59 / $89 / $139 whatever the factory quote says.
Deno.test("pet Petite stays $59 even when the factory quote is high", () => {
  assertEquals(retailFor("pet-silhouette-keepsake", "petite", 25.7), 59);
});

Deno.test("pet Standard stays $89 even when the factory quote is high", () => {
  assertEquals(retailFor("pet-silhouette-keepsake", "standard", 37), 89);
});

Deno.test("pet Statement stays $139 even when the factory quote is high", () => {
  assertEquals(retailFor("pet-silhouette-keepsake", "statement", 52.8), 139);
});
