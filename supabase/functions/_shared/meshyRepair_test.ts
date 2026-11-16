import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { repairMatchesShape, withHeaderOf } from "./meshyRepair.ts";
import { fuseLettering } from "./fuseLettering.ts";
import { countOpenEdges, stlBulk } from "./meshCheck.ts";

type V = [number, number, number];
function stl(tris: V[][], header = ""): Uint8Array {
  const buf = new ArrayBuffer(84 + tris.length * 50);
  const out = new Uint8Array(buf);
  out.set(new TextEncoder().encode(header).slice(0, 80), 0);
  const v = new DataView(buf);
  v.setUint32(80, tris.length, true);
  let p = 84;
  for (const t of tris) {
    p += 12;
    for (const pt of t) for (const n of pt) { v.setFloat32(p, n, true); p += 4; }
    p += 2;
  }
  return out;
}
function box(min: V, max: V): V[][] {
  const [x0, y0, z0] = min, [x1, y1, z1] = max;
  const P: V[] = [[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
  const F = [[0,3,2],[0,2,1],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]];
  return F.map((f) => f.map((i) => P[i]) as V[]);
}

const body = box([-20, -10, 0], [20, 10, 20]);

Deno.test("a repair that only closes a hole is kept", () => {
  const holed = stl(body.slice(0, 10));
  const closed = stl(body);
  assert(repairMatchesShape(holed, closed).ok);
});

Deno.test("a repair that moves the surface is rejected", () => {
  const moved = stl(box([-20, -10, 0], [20, 10, 19.8]));
  const r = repairMatchesShape(stl(body), moved);
  assertEquals(r.ok, false);
});

Deno.test("a repair that changes the size by more than 0.5 mm is rejected", () => {
  const bigger = stl(box([-20, -10, 0], [20, 10, 21]));
  assertEquals(repairMatchesShape(stl(body), bigger).ok, false);
});

Deno.test("our header is restored after an outside repair", () => {
  const ours = stl(body, "Nyzora integrated plinth v8");
  const theirs = stl(body, "meshy");
  const fixed = withHeaderOf(theirs, ours);
  assertEquals(new TextDecoder().decode(fixed.slice(0, 27)), "Nyzora integrated plinth v8");
});

Deno.test("overlapping letter studs fuse into one closed solid without losing the body", async () => {
  // Three overlapping studs proud of the -Y front wall, embedded 1 mm.
  const studs = [
    ...box([-5, -10.8, 5], [-3, -9, 7]),
    ...box([-4, -10.8, 5], [-2, -9, 7]),
    ...box([-3, -10.8, 5], [-1, -9, 7]),
  ];
  const lettered = stl([...body, ...studs], "Nyzora integrated plinth v8 | lettered v4");
  assert(countOpenEdges(lettered) > 0, "unfused studs share edges with nothing — not a single shell");
  const fused = await fuseLettering(lettered, body.length, "-y");
  assert(fused, "fusion succeeded");
  assertEquals(countOpenEdges(fused.stl), 0);
  assert(fused.fusedVolumeCm3 >= fused.bodyVolumeCm3);
  // body 40×20×20 = 16 cm³, plus 4×2×0.8 mm³ of proud lettering
  assert(Math.abs(fused.fusedVolumeCm3 - 16.0064) < 0.001);
  assertEquals(stlBulk(fused.stl).size.map((n) => Number(n.toFixed(2))), [40, 20.8, 20]);
});

Deno.test("lettering on any face other than the front is never fused", async () => {
  const lettered = stl([...body, ...box([-5, -10.8, 5], [-3, -9, 7])]);
  assertEquals(await fuseLettering(lettered, body.length, "+x"), null);
});
