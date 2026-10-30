/**
 * Cross-section measurements used to find (and police) the plinth of a
 * generated keepsake.
 *
 * Why this exists: the mesh generator often gives a bust its own square
 * plinth whose top is a soft fillet rather than a flat ledge. The older
 * detector only looked for a flat ledge, missed those plinths, and the
 * reinforcement step then slid a second block underneath — the Hampton order
 * (Oct 2026) reached the printer with two stacked plinths and two names.
 */

type V3 = [number, number, number];
type Tri = [V3, V3, V3];

export interface SectionSample {
  z: number;
  /** True enclosed area of the horizontal slice (mm²). */
  area: number;
  width: number;
  depth: number;
}

/**
 * Measures horizontal slices of a mesh in one pass over the triangles.
 * Area uses Green's theorem on segments oriented by each face's outward
 * normal, so no loop stitching is needed and cavities subtract correctly.
 */
export function sectionProfile(tris: Tri[], zs: number[]): SectionSample[] {
  const sorted = zs.map((z, i) => ({ z, i })).sort((a, b) => a.z - b.z);
  const area = new Float64Array(zs.length);
  const minX = new Float64Array(zs.length).fill(Infinity);
  const maxX = new Float64Array(zs.length).fill(-Infinity);
  const minY = new Float64Array(zs.length).fill(Infinity);
  const maxY = new Float64Array(zs.length).fill(-Infinity);

  for (const tri of tris) {
    const lo = Math.min(tri[0][2], tri[1][2], tri[2][2]);
    const hi = Math.max(tri[0][2], tri[1][2], tri[2][2]);
    if (!(hi > lo)) continue;
    // Binary search the first sample at or above this triangle's bottom.
    let a = 0, b = sorted.length;
    while (a < b) {
      const m = (a + b) >> 1;
      if (sorted[m].z < lo) a = m + 1;
      else b = m;
    }
    if (a >= sorted.length || sorted[a].z > hi) continue;
    const [p0, p1, p2] = tri;
    const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2];
    const vx = p2[0] - p0[0], vy = p2[1] - p0[1], vz = p2[2] - p0[2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    for (let k = a; k < sorted.length && sorted[k].z <= hi; k++) {
      const z = sorted[k].z;
      const pts: Array<[number, number]> = [];
      for (let e = 0; e < 3; e++) {
        const s = tri[e];
        const t = tri[(e + 1) % 3];
        const ds = s[2] - z;
        const dt = t[2] - z;
        if ((ds < 0 && dt >= 0) || (ds >= 0 && dt < 0)) {
          const f = ds / (ds - dt);
          pts.push([s[0] + (t[0] - s[0]) * f, s[1] + (t[1] - s[1]) * f]);
        }
      }
      if (pts.length !== 2) continue;
      let [p, q] = pts;
      const dx = q[0] - p[0];
      const dy = q[1] - p[1];
      // Counter-clockwise travel keeps the outward normal on the right.
      if (dy * nx - dx * ny < 0) [p, q] = [q, p];
      const idx = sorted[k].i;
      area[idx] += (p[0] * q[1] - q[0] * p[1]) / 2;
      for (const r of [p, q]) {
        if (r[0] < minX[idx]) minX[idx] = r[0];
        if (r[0] > maxX[idx]) maxX[idx] = r[0];
        if (r[1] < minY[idx]) minY[idx] = r[1];
        if (r[1] > maxY[idx]) maxY[idx] = r[1];
      }
    }
  }

  return zs.map((z, i) => ({
    z,
    area: Math.abs(area[i]),
    width: Number.isFinite(minX[i]) ? maxX[i] - minX[i] : 0,
    depth: Number.isFinite(minY[i]) ? maxY[i] - minY[i] : 0,
  }));
}

function boundsOf(tris: Tri[]) {
  const min: V3 = [Infinity, Infinity, Infinity];
  const max: V3 = [-Infinity, -Infinity, -Infinity];
  for (const tri of tris) for (const p of tri) for (let a = 0; a < 3; a++) {
    if (p[a] < min[a]) min[a] = p[a];
    if (p[a] > max[a]) max[a] = p[a];
  }
  return { min, max };
}

const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= Math.max(a, b) * tol;

/**
 * Finds a generated plinth by shape rather than by a flat top: a broad,
 * straight-sided block at the very bottom whose footprint stays constant and
 * then pulls in where the sculpture begins. Returns the height to cut at.
 */
export function prismaticPlinthTop(tris: Tri[], bounds = boundsOf(tris)): number | null {
  const height = bounds.max[2] - bounds.min[2];
  const footprint = (bounds.max[0] - bounds.min[0]) * (bounds.max[1] - bounds.min[1]);
  if (!(height > 0) || !(footprint > 0)) return null;
  const step = 0.005;
  const ratios = Array.from({ length: 90 }, (_, i) => 0.0025 + i * step); // up to ~45%
  const prof = sectionProfile(tris, ratios.map((r) => bounds.min[2] + height * r));

  // Reference block: the widest straight-sided slice in the bottom 8%
  // (skipping the very bottom, where a chamfer or rounded edge sits).
  let ref: SectionSample | null = null;
  let refIdx = -1;
  for (let i = 2; i < prof.length && ratios[i] <= 0.08; i++) {
    if (!ref || prof[i].area > ref.area) { ref = prof[i]; refIdx = i; }
  }
  if (!ref || !(ref.area > footprint * 0.2) || !(ref.width > 0) || !(ref.depth > 0)) return null;
  // A block fills most of its own bounding box (legs or a body do not).
  if (ref.area < ref.width * ref.depth * 0.7) return null;

  const inBlock = (s: SectionSample) =>
    s.area >= ref!.area * 0.9 && near(s.width, ref!.width, 0.04) && near(s.depth, ref!.depth, 0.04);

  // Walk up through the block; it ends at the first sustained pull-in.
  let top = -1;
  for (let i = refIdx; i < prof.length - 3; i++) {
    if (inBlock(prof[i])) continue;
    if (!inBlock(prof[i + 1]) && !inBlock(prof[i + 2])) { top = i; break; }
  }
  if (top < 0) return null;
  // Must be a real block: at least ~4% of the piece tall, ending below 40%.
  let bottom = refIdx;
  while (bottom > 0 && inBlock(prof[bottom - 1])) bottom--;
  if (ratios[top] - ratios[bottom] < 0.04 || ratios[top] > 0.4) return null;
  // And something must actually pull in above it (the sculpture).
  const above = prof.slice(top, top + 6);
  if (!above.some((s) => s.area < ref!.area * 0.8)) return null;
  return prof[top].z;
}

export interface StackedPlinthReport {
  stacked: boolean;
  baseTopZ?: number;
  secondBlock?: { fromZ: number; toZ: number; areaRatio: number };
}

/**
 * Final-file gate: after our base is in place, nothing else directly above it
 * may be another straight-sided block. Run on every finished print file so a
 * stacked plinth can never reach the partner, whatever produced it.
 */
export function findStackedPlinth(tris: Tri[]): StackedPlinthReport {
  const bounds = boundsOf(tris);
  const height = bounds.max[2] - bounds.min[2];
  if (!(height > 0)) return { stacked: false };
  const step = 0.004;
  const ratios = Array.from({ length: 125 }, (_, i) => 0.002 + i * step); // up to ~50%
  const prof = sectionProfile(tris, ratios.map((r) => bounds.min[2] + height * r));
  const base = prof[2];
  if (!(base.area > 0)) return { stacked: false };

  // End of our own base: the first slice clearly narrower than the bottom.
  let i = 3;
  while (i < prof.length && prof[i].area >= base.area * 0.9) i++;
  if (i >= prof.length) return { stacked: false };
  const baseTopZ = prof[i].z;

  // Look for a second block starting within the next 25% of the height:
  // a run whose footprint holds within ~2% and area within ~6%, at least
  // ~4% of the piece (and 6 mm) tall, and still a large share of the base.
  const limit = ratios[i] + 0.25;
  for (let s = i; s < prof.length && ratios[s] <= limit; s++) {
    const start = prof[s];
    if (!(start.area >= base.area * 0.4)) continue;
    if (start.area < start.width * start.depth * 0.7) continue;
    let e = s;
    while (
      e + 1 < prof.length &&
      near(prof[e + 1].width, start.width, 0.02) &&
      near(prof[e + 1].depth, start.depth, 0.02) &&
      near(prof[e + 1].area, start.area, 0.06)
    ) e++;
    const run = prof[e].z - start.z;
    if (run >= Math.max(6, height * 0.04)) {
      return {
        stacked: true,
        baseTopZ,
        secondBlock: {
          fromZ: Number(start.z.toFixed(2)),
          toZ: Number(prof[e].z.toFixed(2)),
          areaRatio: Number((start.area / base.area).toFixed(2)),
        },
      };
    }
  }
  return { stacked: false, baseTopZ };
}
