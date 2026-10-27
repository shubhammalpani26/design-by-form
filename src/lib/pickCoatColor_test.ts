// Run: deno test src/lib/pickCoatColor_test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { pickCoatColor } from "./pickCoatColor.ts";

function pixels(parts: Array<[number, [number, number, number]]>): number[] {
  const out: number[] = [];
  for (const [count, [r, g, b]] of parts) for (let i = 0; i < count; i++) out.push(r, g, b, 255);
  return out;
}

Deno.test("golden dog lying on a lawn defaults to Sand, not grey", () => {
  // Golden coat, darker coat in shade, and plenty of green grass behind.
  const data = pixels([[900, [205, 150, 90]], [400, [140, 95, 55]], [1500, [95, 120, 60]], [300, [120, 120, 115]]]);
  assertEquals(pickCoatColor(data), "sand");
});

Deno.test("white dog photographed in shade defaults to Bone White", () => {
  const data = pixels([[900, [245, 243, 238]], [1200, [170, 168, 165]], [300, [40, 40, 40]]]);
  assertEquals(pickCoatColor(data), "bone");
});

Deno.test("black cat defaults to Charcoal", () => {
  const data = pixels([[2000, [25, 24, 26]], [400, [150, 140, 130]]]);
  assertEquals(pickCoatColor(data), "charcoal");
});

Deno.test("pink tongue and blanket alone never pick Blush", () => {
  const data = pixels([[1300, [210, 155, 95]], [900, [240, 170, 165]]]);
  assertEquals(pickCoatColor(data), "sand");
});
