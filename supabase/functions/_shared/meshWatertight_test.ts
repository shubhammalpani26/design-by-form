import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { analyseStl, countOpenEdges, crackReport, repairKeepsBulk, repairStl, stlBulk } from "./meshCheck.ts";

type V = [number, number, number];
function stl(tris: V[][]): Uint8Array {
  const buf = new ArrayBuffer(84 + tris.length * 50);
  const v = new DataView(buf);
  v.setUint32(80, tris.length, true);
  let p = 84;
  for (const t of tris) {
    p += 12;
    for (const pt of t) for (const n of pt) { v.setFloat32(p, n, true); p += 4; }
    p += 2;
  }
  return new Uint8Array(buf);
}
// 20 mm cube, outward winding.
const s = 20;
const P: V[] = [[0,0,0],[s,0,0],[s,s,0],[0,s,0],[0,0,s],[s,0,s],[s,s,s],[0,s,s]];
const faces = [[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]];
const cube = faces.map((f) => f.map((i) => P[i]) as V[]);

Deno.test("a single missing face blocks the file (no small-hole allowance)", () => {
  const holed = stl(cube.slice(0, 11));
  assertEquals(countOpenEdges(holed), 3);
  const r = analyseStl(holed);
  assertEquals(r.printable, false);
});

Deno.test("repair caps a hole so the file becomes fully closed", () => {
  const holed = stl(cube.slice(0, 10)); // whole top-left side square missing
  const { stl: fixed, summary } = repairStl(holed);
  assertEquals(summary.holesFilled, 1);
  assertEquals(countOpenEdges(fixed), 0);
});

Deno.test("a closed solid has zero open edges", () => {
  assertEquals(countOpenEdges(stl(cube)), 0);
});

Deno.test("a real gap (20 mm missing face) holds the order", () => {
  assertEquals(crackReport(stl(cube.slice(0, 11))).hold, true);
});

Deno.test("a hairline crack (0.2 mm wide seam) in a detailed mesh does not hold", () => {
  // Lift one top triangle 0.2 mm so a thin seam opens along its three edges.
  const lifted = cube.map((t, i) => i === 2 ? t.map(([x, y, z]) => [x, y, z + 0.2] as V) : t);
  const tris: V[][] = [...lifted];
  for (let i = 0; i < 400; i++) {
    const x = 100 + i * 2;
    const a: V = [x, 0, 0], b: V = [x + 1, 0, 0], c: V = [x, 1, 0], d: V = [x, 0, 1];
    tris.push([a, c, b], [a, b, d], [a, d, c], [b, c, d]);
  }
  const r = crackReport(stl(tris));
  assertEquals(r.openEdges > 0, true);
  assertEquals(r.hold, false);
});

Deno.test("a closed solid never holds", () => {
  assertEquals(crackReport(stl(cube)).hold, false);
});

Deno.test("cube bulk is 8 cm³ at 20 mm", () => {
  const b = stlBulk(stl(cube));
  assertEquals(Math.round(b.volumeCm3 * 100) / 100, 8);
});

Deno.test("a repair that shrinks the piece is refused, an equal one kept", () => {
  const smaller = cube.map((t) => t.map(([x, y, z]) => [x * 0.95, y * 0.95, z * 0.95] as V));
  assertEquals(repairKeepsBulk(stl(cube), stl(smaller)), false);
  assertEquals(repairKeepsBulk(stl(cube), stl(cube)), true);
});
