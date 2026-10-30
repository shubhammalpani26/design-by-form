/**
 * Rebuilds a finished print file that carries two plinths when the original
 * generator mesh is no longer available (generator tasks expire after a few
 * weeks). Our own base is cut away at the top of the bottom block, the
 * remaining sculpture — still sitting on the generator's plinth — goes back
 * through the same base-replacement step used for fresh meshes, and the result
 * is fitted to the sold size again.
 */
import {
  fitStlToLongestEdge,
  HEFT_SIZE_RESERVE_MM,
  parseStl,
  reinforceKeepsakeStl,
  writeStl,
} from "./engraveStl.ts";
import { findStackedPlinth } from "./plinthProfile.ts";

type V3 = [number, number, number];
type Tri = [V3, V3, V3];

export interface RestackResult {
  stl: Uint8Array;
  size: { x: number; y: number; z: number };
  cutAtMm: number;
}

/** Keeps only the part of the mesh above `z`, splitting triangles that cross it. */
function clipAbove(tris: Tri[], z: number): Tri[] {
  const out: Tri[] = [];
  const lerp = (a: V3, b: V3): V3 => {
    const t = (z - a[2]) / (b[2] - a[2]);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, z];
  };
  for (const tri of tris) {
    const above = tri.filter((p) => p[2] >= z);
    if (above.length === 3) {
      out.push(tri);
      continue;
    }
    if (above.length === 0) continue;
    // Preserve winding by walking the triangle's edges in order.
    const poly: V3[] = [];
    for (let i = 0; i < 3; i++) {
      const a = tri[i];
      const b = tri[(i + 1) % 3];
      const aIn = a[2] >= z;
      const bIn = b[2] >= z;
      if (aIn) poly.push(a);
      if (aIn !== bIn) poly.push(lerp(a, b));
    }
    for (let i = 1; i + 1 < poly.length; i++) out.push([poly[0], poly[i], poly[i + 1]]);
  }
  return out;
}

/**
 * Returns a single-plinth rebuild, or null when the file has no stacked
 * plinth or the rebuild still is not a clean single-base piece.
 */
export function restackFromStackedStl(bytes: Uint8Array, targetMaxMm: number): RestackResult | null {
  const tris = parseStl(bytes) as Tri[];
  const report = findStackedPlinth(tris);
  if (!report.stacked || typeof report.baseTopZ !== "number") return null;
  // A hair above our base's top so none of its top face survives.
  const cutAtMm = report.baseTopZ + 0.2;
  const sculpture = clipAbove(tris, cutAtMm);
  if (sculpture.length < 100) return null;

  // Same order as a fresh mesh: leave headroom for the new base, replace the
  // generator's plinth with ours, then bring the piece back to the sold size.
  const headroom = fitStlToLongestEdge(writeStl(sculpture), Math.max(1, targetMaxMm - HEFT_SIZE_RESERVE_MM));
  const reinforced = reinforceKeepsakeStl(headroom.stl, targetMaxMm);
  if (!reinforced.applied) return null;
  const fitted = fitStlToLongestEdge(reinforced.stl, targetMaxMm);

  if (findStackedPlinth(parseStl(fitted.stl)).stacked) return null;
  return { stl: fitted.stl, size: fitted.size, cutAtMm };
}
