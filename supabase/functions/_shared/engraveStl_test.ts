import { assert, assertEquals } from "jsr:@std/assert@1";
import { engraveStl, parseStl, writeStl } from "./engraveStl.ts";

type V3 = [number, number, number];
type Tri = [V3, V3, V3];

function box(out: Tri[], min: V3, max: V3) {
  const [x0, y0, z0] = min;
  const [x1, y1, z1] = max;
  const p: V3[] = [
    [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
    [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
  ];
  for (const [a, b, c, d] of [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]) {
    out.push([p[a], p[b], p[c]], [p[a], p[c], p[d]]);
  }
}

Deno.test("normalizes a legacy Y-up model and puts lettering on the visible front", () => {
  const tris: Tri[] = [];
  box(tris, [-40, 0, -30], [40, 20, 30]);
  box(tris, [-22, 20, -12], [22, 90, 12]);
  const result = engraveStl(writeStl(tris), { heading: "MILO", footnote: "2014 - 2024" });
  assert(result.applied);
  assertEquals(result.face, "-y");
  assertEquals(result.orientationNormalized, true);
  assertEquals(result.placementVerified, true);
  assert((result.letteringBounds?.min[2] ?? 0) >= 0.5);
});

Deno.test("keeps an already Z-up model upright and verifies front placement", () => {
  const tris: Tri[] = [];
  box(tris, [-40, -30, 0], [40, 30, 20]);
  box(tris, [-22, -12, 20], [22, 12, 90]);
  const result = engraveStl(writeStl(tris), { heading: "PIP" });
  assert(result.applied);
  assertEquals(result.face, "-y");
  assertEquals(result.orientationNormalized, false);
  assertEquals(result.placementVerified, true);
  assert(parseStl(result.stl).length > tris.length);
});