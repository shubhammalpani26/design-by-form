import { assert, assertEquals } from "jsr:@std/assert@1";
import { engraveStl, parseStl, reinforceKeepsakeStl, writeStl } from "./engraveStl.ts";

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

Deno.test("never approves lettering on the floor or a side face", () => {
  const tris: Tri[] = [];
  box(tris, [-40, -30, 0], [40, 30, 20]);
  box(tris, [-20, -12, 20], [20, 12, 80]);
  const result = engraveStl(writeStl(tris), { heading: "TOBY" });
  assert(result.applied);
  assertEquals(result.face, "-y");
  assertEquals(result.placementVerified, true);
  const output = parseStl(result.stl);
  const floorZ = Math.min(...output.flatMap((tri) => tri.map((point) => point[2])));
  assert((result.letteringBounds?.min[2] ?? floorZ) >= floorZ + 0.5);
  assert((result.letteringBounds?.min[1] ?? 0) < -30);
});

Deno.test("enlarges the original plinth before quoting without adding a second shell", () => {
  const tris: Tri[] = [];
  box(tris, [-30, -24, 0], [30, 24, 14]);
  box(tris, [-18, -12, 14], [18, 12, 100]);
  const first = reinforceKeepsakeStl(writeStl(tris));
  assert(first.applied);
  assert(first.baseHeightMm >= 16);
  assert(first.volumeAddedCm3 > 0);
  assert(first.size.z > 100);
  assertEquals(parseStl(first.stl).length, tris.length);

  const second = reinforceKeepsakeStl(first.stl);
  assertEquals(second.applied, false);
  assertEquals(second.reason, "already_reinforced");
  assertEquals(parseStl(second.stl).length, parseStl(first.stl).length);
});

Deno.test("reinforced base keeps the final piece inside its sold size", () => {
  const tris: Tri[] = [];
  box(tris, [-30, -24, 0], [30, 24, 16]);
  box(tris, [-18, -12, 16], [18, 12, 120]);
  const result = reinforceKeepsakeStl(writeStl(tris), 120);
  assert(result.applied);
  assert(Math.max(result.size.x, result.size.y, result.size.z) <= 120);
});

Deno.test("uses the reinforced front face for long two-line lettering", () => {
  const tris: Tri[] = [];
  box(tris, [-24, -18, 0], [24, 18, 14]);
  box(tris, [-14, -10, 14], [14, 10, 70]);
  const result = engraveStl(writeStl(tris), {
    heading: "BARTHOLOMEW REX",
    footnote: "2012 - 2026",
  });
  assert(result.applied);
  assertEquals(result.heftBaseApplied, true);
  assert((result.heftBaseHeightMm ?? 0) >= 16);
  assertEquals(result.face, "-y");
  assertEquals(result.placementVerified, true);
  assertEquals(result.addedPlinth, false);
});

Deno.test("an engraved final file retains the reinforced-base marker", () => {
  const tris: Tri[] = [];
  box(tris, [-30, -24, 0], [30, 24, 14]);
  box(tris, [-18, -12, 14], [18, 12, 90]);
  const engraved = engraveStl(writeStl(tris), { heading: "MILO" });
  assert(engraved.applied);
  const reinforcedAgain = reinforceKeepsakeStl(engraved.stl);
  assertEquals(reinforcedAgain.applied, false);
  assertEquals(reinforcedAgain.reason, "already_reinforced");
});