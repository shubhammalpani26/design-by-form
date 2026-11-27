import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { flattenPlinthShoulder } from "./flattenPlinth.ts";

function stl(tris: number[][][]): Uint8Array {
  const b = new Uint8Array(84 + tris.length * 50);
  const v = new DataView(b.buffer);
  v.setUint32(80, tris.length, true);
  tris.forEach((t, i) => t.forEach((p, k) => p.forEach((c, a) => v.setFloat32(84 + i * 50 + 12 + k * 12 + a * 4, c, true))));
  return b;
}
const r = (x: number, y: number, z: number) => [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]];

Deno.test("a vertex 0.3 mm proud of the shoulder is snapped back onto it", () => {
  const [b0, b1, b2, b3] = r(40, 40, 0), [m0, m1, m2, m3] = r(40, 40, 28), [t0, t1, t2, t3] = r(37, 37, 37);
  const bump = [0, -38.5 - 0.3, 32.5]; // on-plane y at z=32.5 is -38.5
  const s = stl([[b0, b2, b1], [b0, b3, b2], [t0, t1, t2], [t0, t2, t3], [m0, m1, bump], [m1, t1, bump], [t1, t0, bump], [t0, m0, bump], [m1, m2, t2]]);
  const { stl: out, moved } = flattenPlinthShoulder(s);
  assert(moved >= 1);
  const y = new DataView(out.buffer).getFloat32(84 + 4 * 50 + 12 + 2 * 12 + 4, true);
  assert(Math.abs(y + 38.5) < 0.01);
  assertEquals(out.slice(0, 80), s.slice(0, 80));
});

Deno.test("files without a stepped shoulder are untouched", () => {
  const [b0, b1, b2, b3] = r(40, 40, 0);
  const s = stl([[b0, b2, b1], [b0, b3, b2]]);
  assertEquals(flattenPlinthShoulder(s).moved, 0);
});
