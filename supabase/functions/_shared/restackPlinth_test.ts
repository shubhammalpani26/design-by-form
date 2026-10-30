import { assert, assertEquals } from "jsr:@std/assert@1";
import { parseStl, writeStl } from "./engraveStl.ts";
import { findStackedPlinth } from "./plinthProfile.ts";
import { restackFromStackedStl } from "./restackPlinth.ts";

type V3 = [number, number, number];
type Tri = [V3, V3, V3];

function box(cx: number, cy: number, z0: number, w: number, d: number, h: number): Tri[] {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - d / 2, y1 = cy + d / 2, z1 = z0 + h;
  const p = (x: number, y: number, z: number): V3 => [x, y, z];
  const q = (a: V3, b: V3, c: V3, e: V3): Tri[] => [[a, b, c], [a, c, e]];
  return [
    ...q(p(x0, y0, z0), p(x0, y1, z0), p(x1, y1, z0), p(x1, y0, z0)), // bottom
    ...q(p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1)), // top
    ...q(p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1)),
    ...q(p(x1, y0, z0), p(x1, y1, z0), p(x1, y1, z1), p(x1, y0, z1)),
    ...q(p(x1, y1, z0), p(x0, y1, z0), p(x0, y1, z1), p(x1, y1, z1)),
    ...q(p(x0, y1, z0), p(x0, y0, z0), p(x0, y0, z1), p(x0, y1, z1)),
  ];
}

/** A tapered "bust": stacked rings that narrow then widen, like a neck and head. */
function bust(z0: number, h: number): Tri[] {
  const tris: Tri[] = [];
  const steps = 40;
  const ring = 24;
  const radius = (t: number) => 30 - 14 * Math.sin(Math.PI * Math.min(t, 0.6) / 0.6) + 22 * Math.max(0, t - 0.6);
  const pts: V3[][] = [];
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const r = radius(t);
    pts.push(Array.from({ length: ring }, (_, k) => {
      const a = (2 * Math.PI * k) / ring;
      return [r * Math.cos(a), 0.8 * r * Math.sin(a), z0 + h * t] as V3;
    }));
  }
  for (let s = 0; s < steps; s++) {
    for (let k = 0; k < ring; k++) {
      const a = pts[s][k], b = pts[s][(k + 1) % ring], c = pts[s + 1][(k + 1) % ring], d = pts[s + 1][k];
      tris.push([a, b, c], [a, c, d]);
    }
  }
  const top = pts[steps], bottom = pts[0];
  const ct: V3 = [0, 0, z0 + h], cb: V3 = [0, 0, z0];
  for (let k = 0; k < ring; k++) {
    tris.push([ct, top[k], top[(k + 1) % ring]]);
    tris.push([cb, bottom[(k + 1) % ring], bottom[k]]);
  }
  return tris;
}

// Our base (wide, 25 mm) with the generator's own square plinth (18 mm) on top
// of it and the sculpture above — the two-base shape from the Hampton order.
function stackedPiece(): Uint8Array {
  return writeStl([
    ...box(0, 0, 0, 120, 116, 25),
    ...box(0, 0, 25, 100, 96, 18),
    ...bust(43, 150),
  ]);
}

Deno.test("fixture really has two stacked bases", () => {
  assert(findStackedPlinth(parseStl(stackedPiece())).stacked);
});

Deno.test("rebuild leaves exactly one base at the sold Statement size", () => {
  const rebuilt = restackFromStackedStl(stackedPiece(), 196);
  assert(rebuilt, "rebuild should succeed");
  assertEquals(findStackedPlinth(parseStl(rebuilt.stl)).stacked, false);
  const longest = Math.max(rebuilt.size.x, rebuilt.size.y, rebuilt.size.z);
  assert(Math.abs(longest - 196) <= 1.5, `longest edge ${longest} should be 196 mm`);
});

Deno.test("a file with a single base is left alone", () => {
  const single = writeStl([...box(0, 0, 0, 120, 116, 25), ...bust(25, 150)]);
  assertEquals(restackFromStackedStl(single, 196), null);
});
