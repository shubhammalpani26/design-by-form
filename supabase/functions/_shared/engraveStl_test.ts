import { assert, assertEquals } from "jsr:@std/assert@1";
import { engraveStl, fitStlToLongestEdge, parseStl, reinforceKeepsakeStl, writeStl } from "./engraveStl.ts";

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
  const frontY = Math.min(...output.flatMap((tri) => tri.map((point) => point[1])));
  assert((result.letteringBounds?.min[1] ?? 0) <= frontY + 0.01);
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
  // The generated plinth is discarded and replaced by a rectangular slab.
  assert(parseStl(first.stl).length > 0);

  const second = reinforceKeepsakeStl(first.stl);
  assertEquals(second.applied, false);
  assertEquals(second.reason, "already_reinforced");
  assertEquals(parseStl(second.stl).length, parseStl(first.stl).length);
});

Deno.test("removes an ornate round pedestal before adding the rectangular plinth", () => {
  const tris: Tri[] = [];
  // Wide foot, tapered pedestal, narrow neck, then a broad chest.
  box(tris, [-28, -28, 0], [28, 28, 8]);
  box(tris, [-20, -20, 8], [20, 20, 22]);
  box(tris, [-13, -13, 22], [13, 13, 35]);
  box(tris, [-38, -32, 39], [38, 32, 110]);
  const result = reinforceKeepsakeStl(writeStl(tris));
  assert(result.applied);
  const output = parseStl(result.stl);
  const slabTop = result.baseHeightMm;
  const pedestalBand = output.flatMap((tri) => tri).filter((point) =>
    point[2] > slabTop + 2 && point[2] < slabTop + 20 && Math.abs(point[0]) <= 20 && Math.abs(point[1]) <= 20
  );
  assertEquals(pedestalBand.length, 0);
});

Deno.test("never cuts the legs off a standing animal", () => {
  const tris: Tri[] = [];
  // Four slim legs under a broad body: the same narrow-then-wide silhouette as
  // a pedestal, but nothing below the legs is wider than the legs themselves.
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const x = sx * 18;
      const y = sy * 10;
      box(tris, [x - 4, y - 4, 0], [x + 4, y + 4, 38]);
    }
  }
  box(tris, [-26, -14, 38], [26, 14, 110]);
  const result = reinforceKeepsakeStl(writeStl(tris));
  assert(result.applied);
  const output = parseStl(result.stl);
  const slabTop = result.baseHeightMm;
  // The legs must survive: geometry still exists between the slab and the body.
  const legBand = output.flatMap((tri) => tri).filter((point) =>
    point[2] > slabTop + 5 && point[2] < slabTop + 30
  );
  assert(legBand.length > 0, "legs were removed");
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

Deno.test("engraving an unreinforced file keeps the piece inside its sold size", () => {
  const tris: Tri[] = [];
  box(tris, [-30, -24, 0], [30, 24, 16]);
  box(tris, [-18, -12, 16], [18, 12, 130]);
  const result = engraveStl(writeStl(tris), { heading: "NYRA", maxDimensionMm: 140 });
  assert(result.applied);
  assertEquals(result.placementVerified, true);
  const out = parseStl(result.stl);
  const zs = out.flatMap((tri) => tri.map((p) => p[2]));
  const xs = out.flatMap((tri) => tri.map((p) => p[0]));
  const ys = out.flatMap((tri) => tri.map((p) => p[1]));
  const longest = Math.max(
    Math.max(...zs) - Math.min(...zs),
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys),
  );
  assert(longest <= 141, `longest edge ${longest}`);
});

Deno.test("lettering stays on the enlarged plinth, not on the sculpture", () => {
  const tris: Tri[] = [];
  box(tris, [-30, -24, 0], [30, 24, 14]);
  box(tris, [-18, -12, 14], [18, 12, 110]);
  const result = engraveStl(writeStl(tris), { heading: "MILO", footnote: "2012 - 2024" });
  assert(result.applied);
  const plinthTop = result.heftBaseHeightMm ?? 0;
  assert(plinthTop >= 22, `plinth ${plinthTop}`);
  assert((result.letteringBounds?.max[2] ?? 0) <= plinthTop + 1.5);
  assert((result.letteringBounds?.min[2] ?? 0) >= 0.5);
});
Deno.test("an already-lettered file is never lettered a second time", () => {
  const tris: Tri[] = [];
  box(tris, [-30, -24, 0], [30, 24, 14]);
  box(tris, [-18, -12, 14], [18, 12, 110]);
  const first = engraveStl(writeStl(tris), { heading: "MILO", footnote: "2012 - 2024" });
  assert(first.applied);
  const second = engraveStl(first.stl, { heading: "MILO", footnote: "2012 - 2024" });
  assertEquals(second.applied, false);
  assertEquals(second.reason, "already_lettered");
  assertEquals(parseStl(second.stl).length, parseStl(first.stl).length);
});

Deno.test("fitStlToLongestEdge scales an undersized file back up to the sold size", () => {
  const tris: Tri[] = [];
  box(tris, [-15, -12, 0], [15, 12, 8]);
  box(tris, [-9, -6, 8], [9, 6, 45]);
  const shrunk = writeStl(tris);
  const fitted = fitStlToLongestEdge(shrunk, 120);
  const parsed = parseStl(fitted.stl);
  const xs = parsed.flat().map((p) => p[0]);
  const ys = parsed.flat().map((p) => p[1]);
  const zs = parsed.flat().map((p) => p[2]);
  const longest = Math.max(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys),
    Math.max(...zs) - Math.min(...zs),
  );
  if (Math.abs(longest - 120) > 0.5) throw new Error(`expected 120mm, got ${longest}`);
});
