import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { retailFor, secondCopyUsd } from "./originalsPricing.ts";

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

// Owner decision 2026-11-22: second identical copy is 35% off — $39 / $58 / $90.
Deno.test("second copy of a Petite costs $39", () => {
  assertEquals(secondCopyUsd(59), 39);
});

Deno.test("second copy of a Standard costs $58", () => {
  assertEquals(secondCopyUsd(89), 58);
});

Deno.test("second copy of a Statement costs $90", () => {
  assertEquals(secondCopyUsd(139), 90);
});
