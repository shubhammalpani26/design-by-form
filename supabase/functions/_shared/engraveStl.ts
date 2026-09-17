/**
 * Cuts the buyer's personalisation into a print file as real geometry.
 *
 * The 3D generator flattens any lettering that only exists in the 2D render,
 * which is how a piece can reach the printer with a blank plinth. This module
 * adds physical raised lettering to the finished mesh: strokes are extruded
 * into prisms that sit proud of the plinth's front face, so the slicer prints
 * text that cannot be smoothed away.
 *
 * Raised (not recessed) lettering is used on purpose — additive prisms need no
 * boolean solver, always stay watertight-enough for slicing, and read better
 * on a 0.4 mm FDM nozzle.
 */
import { ADVANCE, glyph, normalizeEngravingText, SPACE_ADVANCE, textWidth } from "./strokeFont.ts";

export interface EngraveOptions {
  /** Large line, e.g. the pet's name. */
  heading?: string | null;
  /** Small second line, e.g. dates. */
  footnote?: string | null;
  /**
   * Longest edge the buyer paid for (mm). The enlarged plinth grows both
   * upward and outward, so an unreinforced source file must be clamped back
   * to the sold size before lettering is measured against the front face.
   */
  maxDimensionMm?: number;
}

export interface EngraveResult {
  stl: Uint8Array;
  applied: boolean;
  text: string;
  /** Face the text was placed on, for diagnostics. */
  face?: "+x" | "-x" | "+y" | "-y";
  capHeightMm?: number;
  reason?: string;
  /** True when a nameplate base had to be added to carry the lettering. */
  addedPlinth?: boolean;
  /** Triangles added by the lettering — proof the text is real geometry. */
  triangleDelta?: number;
  /** How far the letters stand off the face (mm). */
  reliefMm?: number;
  /** Printed stroke thickness of the lettering (mm). */
  strokeMm?: number;
  /** True only when the lettering is proven above the floor on the visible front. */
  placementVerified?: boolean;
  /** Coordinate-system correction applied to an older cached print file. */
  orientationNormalized?: boolean;
  /** Bounds of lettering geometry in manufacturing coordinates. */
  letteringBounds?: { min: V3; max: V3 };
  /** True when the keepsake's original plinth was enlarged. */
  heftBaseApplied?: boolean;
  /** Added plinth height available for front-face lettering. */
  heftBaseHeightMm?: number;
  /** Estimated geometric volume added by the heft treatment. */
  heftVolumeAddedCm3?: number;
}



type V3 = [number, number, number];
type Tri = [V3, V3, V3];

/** FDM-safe engraving parameters (mm). */
const PROUD_MM = 0.8; // subtle raised finish, matching the customer render
const EMBED_MM = 1.0; // deep overlap proves every stroke is fused into the face
const STROKE_MIN_MM = 0.9; // >= 2 x nozzle width — the thinnest wall we trust
const STROKE_MAX_MM = 1.6;
const STROKE_RATIO = 0.2; // stroke thickness as a share of cap height
const MIN_CAP_MM = 3.5; // below this, text is unreadable when printed
const MAX_CAP_MM = 12.0;
const HEFT_HEADER = "Nyzora rectangular plinth v7";
/**
 * Marks a file whose lettering is already cut in. Re-lettering such a file is
 * how a piece ended up with a second, mirrored set of glyphs on another face,
 * so it is refused outright.
 */
const LETTERED_HEADER = `${HEFT_HEADER} | lettered v4`;
const HEFT_TARGET_INCREASE = 1.0;
const HEFT_MIN_HEIGHT_MM = 22;
const HEFT_MAX_HEIGHT_MM = 32;
const HEFT_OVERLAP_MM = 1.2;
/** How much wider the plinth footprint grows — adds mass and lettering space. */
const HEFT_FOOTPRINT_SCALE = 1.25;
/** Space reserved before reinforcement so the final piece keeps its sold size. */
export const HEFT_SIZE_RESERVE_MM = HEFT_MAX_HEIGHT_MM - HEFT_OVERLAP_MM;

const strokeFor = (cap: number) =>
  Math.min(STROKE_MAX_MM, Math.max(STROKE_MIN_MM, cap * STROKE_RATIO));


/** Reads the `vertex x y z` triples of an ASCII STL. */
function parseAsciiStl(bytes: Uint8Array): Tri[] {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const verts: V3[] = [];
  const re = /vertex\s+(-?[\d.eE+]+)\s+(-?[\d.eE+]+)\s+(-?[\d.eE+]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    verts.push([Number(m[1]), Number(m[2]), Number(m[3])]);
  }
  const tris: Tri[] = [];
  for (let i = 0; i + 2 < verts.length; i += 3) {
    tris.push([verts[i], verts[i + 1], verts[i + 2]]);
  }
  if (!tris.length) throw new Error("Only STL print files can be engraved");
  return tris;
}

export function parseStl(bytes: Uint8Array): Tri[] {
  if (bytes.byteLength < 84) throw new Error("Print file is too small to be an STL");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint32(80, true);
  // Anything that isn't an exact binary STL is retried as ASCII rather than
  // failing the whole order — both encodings are legitimate print files.
  if (84 + count * 50 !== bytes.byteLength) return parseAsciiStl(bytes);
  const tris: Tri[] = [];
  let p = 84;
  for (let i = 0; i < count; i++) {
    p += 12; // stored normal — recomputed on write
    const v: V3[] = [];
    for (let k = 0; k < 3; k++) {
      v.push([view.getFloat32(p, true), view.getFloat32(p + 4, true), view.getFloat32(p + 8, true)]);
      p += 12;
    }
    p += 2;
    tris.push(v as Tri);
  }
  return tris;
}


export function writeStl(tris: Tri[], headerText = "Nyzora print file"): Uint8Array {
  const buffer = new ArrayBuffer(84 + tris.length * 50);
  const view = new DataView(buffer);
  new Uint8Array(buffer, 0, 80).set(new TextEncoder().encode(headerText).subarray(0, 80));
  view.setUint32(80, tris.length, true);
  let p = 84;
  for (const [a, b, c] of tris) {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const len = Math.hypot(n[0], n[1], n[2]) || 1;
    n = [n[0] / len, n[1] / len, n[2] / len];
    for (const val of [...n, ...a, ...b, ...c]) {
      view.setFloat32(p, val, true);
      p += 4;
    }
    view.setUint16(p, 0, true);
    p += 2;
  }
  return new Uint8Array(buffer);
}

function triNormal(t: Tri): V3 {
  const [a, b, c] = t;
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const len = Math.hypot(n[0], n[1], n[2]) || 1;
  return [n[0] / len, n[1] / len, n[2] / len];
}

function triArea(t: Tri): number {
  const [a, b, c] = t;
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  return Math.hypot(n[0], n[1], n[2]) / 2;
}

const FACES = [
  { key: "-y" as const, dir: [0, -1, 0] as V3 },
  { key: "+y" as const, dir: [0, 1, 0] as V3 },
  { key: "-x" as const, dir: [-1, 0, 0] as V3 },
  { key: "+x" as const, dir: [1, 0, 0] as V3 },
];

/** Adds one axis-aligned box (8 corners -> 12 triangles). */
function box(out: Tri[], min: V3, max: V3) {
  const [x0, y0, z0] = min;
  const [x1, y1, z1] = max;
  const p: V3[] = [
    [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
    [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
  ];
  const quads: Array<[number, number, number, number]> = [
    [0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7],
  ];
  for (const [a, b, c, d] of quads) {
    out.push([p[a], p[b], p[c]]);
    out.push([p[a], p[c], p[d]]);
  }
}

/**
 * Extrudes a stroke segment as a prism on the chosen face.
 * `u` runs horizontally across the face, `w` is vertical (world Z).
 *
 * Every stud is anchored to the surface directly beneath it (`planeAt`). A
 * single flat plane taken from the most protruding contour leaves the letters
 * hanging in mid-air on a rounded, tapered plinth.
 */
function strokePrism(
  out: Tri[],
  axis: "x" | "y",
  outward: number,
  planeAt: (u: number, w: number) => number | null,
  u0: number,
  w0: number,
  u1: number,
  w1: number,
  strokeMm: number,
): { studs: number; missed: number } {
  const dx = u1 - u0;
  const dz = w1 - w0;
  const len = Math.hypot(dx, dz);
  if (len < 1e-6) return { studs: 0, missed: 0 };
  const steps = Math.max(1, Math.ceil(len / (strokeMm * 0.6)));
  const half = strokeMm / 2;

  let studs = 0;
  let missed = 0;
  // A stroke is stamped as a chain of overlapping square studs; the slicer
  // unions them into one clean, continuous letter stroke.
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = u0 + dx * t;
    const w = w0 + dz * t;
    studs += 1;
    const facePlane = planeAt(u, w);
    if (facePlane === null) {
      missed += 1;
      continue;
    }
    const near = facePlane - outward * EMBED_MM;
    const far = facePlane + outward * PROUD_MM;
    const nMin = Math.min(near, far);
    const nMax = Math.max(near, far);
    const min: V3 = axis === "y"
      ? [u - half, nMin, w - half]
      : [nMin, u - half, w - half];
    const max: V3 = axis === "y"
      ? [u + half, nMax, w + half]
      : [nMax, u + half, w + half];
    box(out, min, max);
  }
  return { studs, missed };
}

interface SurfaceSampler {
  /** Depth of the face's surface at (u, w), or null where there is no wall. */
  sample(u: number, w: number): number | null;
  uMin: number;
  uMax: number;
  wMin: number;
  wMax: number;
}

/**
 * Builds a depth map of the chosen face so lettering can follow the real,
 * curved wall of the plinth instead of one extreme plane.
 */
function makeSurfaceSampler(tris: Tri[], axis: "x" | "y", outward: number): SurfaceSampler {
  const flat = tris.map((tri) =>
    tri.map(([x, y, z]) => {
      const a = axis === "x" ? x : y;
      const u = axis === "x" ? y : x;
      return [u, z, a] as V3;
    }) as Tri
  );
  let uMin = Infinity, uMax = -Infinity, wMin = Infinity, wMax = -Infinity;
  for (const tri of flat) {
    for (const [u, w] of tri) {
      if (u < uMin) uMin = u;
      if (u > uMax) uMax = u;
      if (w < wMin) wMin = w;
      if (w > wMax) wMax = w;
    }
  }
  const cells = 128;
  const du = (uMax - uMin) / cells || 1;
  const buckets: number[][] = Array.from({ length: cells + 1 }, () => []);
  flat.forEach((tri, index) => {
    const lo = Math.max(0, Math.floor((Math.min(tri[0][0], tri[1][0], tri[2][0]) - uMin) / du));
    const hi = Math.min(cells, Math.floor((Math.max(tri[0][0], tri[1][0], tri[2][0]) - uMin) / du));
    for (let c = lo; c <= hi; c++) buckets[c].push(index);
  });

  const at = (u: number, w: number): number | null => {
    const cell = Math.min(cells, Math.max(0, Math.floor((u - uMin) / du)));
    let best: number | null = null;
    for (const index of buckets[cell]) {
      const [A, B, C] = flat[index];
      const denom = (B[1] - C[1]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[1] - C[1]);
      if (Math.abs(denom) < 1e-9) continue;
      const l1 = ((B[1] - C[1]) * (u - C[0]) + (C[0] - B[0]) * (w - C[1])) / denom;
      const l2 = ((C[1] - A[1]) * (u - C[0]) + (A[0] - C[0]) * (w - C[1])) / denom;
      const l3 = 1 - l1 - l2;
      if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
      const depth = l1 * A[2] + l2 * B[2] + l3 * C[2];
      if (best === null || (outward > 0 ? depth > best : depth < best)) best = depth;
    }
    return best;
  };

  const sample = (u: number, w: number): number | null => {
    const direct = at(u, w);
    if (direct !== null) return direct;
    // A hair of slack keeps a stroke anchored when it lands between facets.
    for (const r of [0.4, 0.8, 1.5]) {
      for (const [ou, ow] of [[r, 0], [-r, 0], [0, r], [0, -r]]) {
        const near = at(u + ou, w + ow);
        if (near !== null) return near;
      }
    }
    return null;
  };

  return { sample, uMin, uMax, wMin, wMax };
}

/**
 * Picks the largest patch of the face that is continuous and nearly flat, so
 * the whole name sits on real wall rather than spilling past a curved edge.
 */
function chooseLetteringRegion(
  s: SurfaceSampler,
): { uMin: number; uMax: number; wMin: number; wMax: number } | null {
  const NW = 48;
  const NU = 96;
  const dw = (s.wMax - s.wMin) / NW;
  const du = (s.uMax - s.uMin) / NU;
  if (!(dw > 0) || !(du > 0)) return null;

  const rows: Array<{ w: number; lo: number; hi: number }> = [];
  for (let j = 1; j < NW; j++) {
    const w = s.wMin + dw * j;
    let runLo: number | null = null;
    let runHi = 0;
    let bestLo: number | null = null;
    let bestHi = 0;
    for (let i = 0; i <= NU; i++) {
      const u = s.uMin + du * i;
      const hit = i < NU ? s.sample(u, w) !== null : false;
      if (hit) {
        if (runLo === null) runLo = u;
        runHi = u;
      } else if (runLo !== null) {
        if (bestLo === null || runHi - runLo > bestHi - bestLo) {
          bestLo = runLo;
          bestHi = runHi;
        }
        runLo = null;
      }
    }
    if (bestLo !== null && bestHi - bestLo > 0) rows.push({ w, lo: bestLo, hi: bestHi });
  }
  if (!rows.length) return null;

  const widest = Math.max(...rows.map((r) => r.hi - r.lo));
  let group: Array<{ w: number; lo: number; hi: number }> = [];
  let current: Array<{ w: number; lo: number; hi: number }> = [];
  for (const row of rows) {
    if (row.hi - row.lo >= widest * 0.55) current.push(row);
    else {
      if (current.length > group.length) group = current;
      current = [];
    }
  }
  if (current.length > group.length) group = current;
  if (group.length < 3) return null;

  const uLo = Math.max(...group.map((r) => r.lo));
  const uHi = Math.min(...group.map((r) => r.hi));
  if (!(uHi - uLo > 0)) return null;

  // Trim where the wall curves away, so no glyph is left standing off the
  // surface it is meant to be fused to.
  const midW = group[Math.floor(group.length / 2)].w;
  const centreU = (uLo + uHi) / 2;
  const centreDepth = s.sample(centreU, midW);
  if (centreDepth === null) return null;
  const FLAT_TOLERANCE_MM = 3;
  const walk = (dir: 1 | -1) => {
    let edge = centreU;
    for (let u = centreU; dir > 0 ? u <= uHi : u >= uLo; u += dir * du) {
      const depth = s.sample(u, midW);
      if (depth === null || Math.abs(depth - centreDepth) > FLAT_TOLERANCE_MM) break;
      edge = u;
    }
    return edge;
  };

  return {
    uMin: walk(-1),
    uMax: walk(1),
    wMin: group[0].w,
    wMax: group[group.length - 1].w,
  };
}

type Attempt =
  | {
      ok: true;
      tris: Tri[];
      face: "+x" | "-x" | "+y" | "-y";
      cap: number;
      letteringBounds: { min: V3; max: V3 };
      floorZ: number;
    }
  | { ok: false; reason: string };

function boundsOf(tris: Tri[]): { min: V3; max: V3 } {
  const min: V3 = [Infinity, Infinity, Infinity];
  const max: V3 = [-Infinity, -Infinity, -Infinity];
  for (const tri of tris) {
    for (const point of tri) {
      for (let axis = 0; axis < 3; axis++) {
        min[axis] = Math.min(min[axis], point[axis]);
        max[axis] = Math.max(max[axis], point[axis]);
      }
    }
  }
  return { min, max };
}

function hasStlHeader(bytes: Uint8Array, expected: string): boolean {
  if (bytes.byteLength < 80) return false;
  return new TextDecoder().decode(bytes.subarray(0, 80)).replace(/\0/g, "").trim().startsWith(expected);
}

function signedVolumeMm3(tris: Tri[]): number {
  let volume = 0;
  for (const [a, b, c] of tris) {
    volume +=
      (a[0] * (b[1] * c[2] - b[2] * c[1]) -
        a[1] * (b[0] * c[2] - b[2] * c[0]) +
        a[2] * (b[0] * c[1] - b[1] * c[0])) /
      6;
  }
  return Math.abs(volume);
}

export interface HeftBaseResult {
  stl: Uint8Array;
  applied: boolean;
  baseHeightMm: number;
  volumeAddedCm3: number;
  size: { x: number; y: number; z: number };
  reason?: "already_reinforced" | "degenerate_mesh" | "no_existing_plinth";
}

interface ReinforcedTris {
  tris: Tri[];
  applied: boolean;
  baseHeightMm: number;
  volumeAddedCm3: number;
  size: { x: number; y: number; z: number };
}

/**
 * Finds the broad horizontal shoulder where the generated plinth meets the
 * sculpture. We enlarge only the geometry below this plane, preserving the
 * original rounded/tapered plinth instead of attaching another slab.
 */
function existingPlinthTop(tris: Tri[], bounds: { min: V3; max: V3 }): number | null {
  const height = bounds.max[2] - bounds.min[2];
  const footprint = (bounds.max[0] - bounds.min[0]) * (bounds.max[1] - bounds.min[1]);
  if (!(height > 0) || !(footprint > 0)) return null;

  const candidates = new Map<number, number>();
  const minCandidate = bounds.min[2] + Math.max(3, height * 0.025);
  const maxCandidate = bounds.min[2] + height * 0.38;
  for (const tri of tris) {
    const normal = triNormal(tri);
    if (Math.abs(normal[2]) < 0.9) continue;
    const z = (tri[0][2] + tri[1][2] + tri[2][2]) / 3;
    if (z < minCandidate || z > maxCandidate) continue;
    const key = Math.round(z * 2) / 2;
    candidates.set(key, (candidates.get(key) ?? 0) + triArea(tri));
  }

  // First find a narrow neck followed by the sustained widening of the chest.
  // Ornate generated pedestals often have several horizontal rings, so their
  // top cannot be identified reliably from horizontal area alone.
  const sectionArea = (z: number): number => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const tri of tris) {
      for (let i = 0; i < 3; i++) {
        const a = tri[i];
        const b = tri[(i + 1) % 3];
        const da = a[2] - z;
        const db = b[2] - z;
        if (Math.abs(da) < 1e-6) {
          minX = Math.min(minX, a[0]); maxX = Math.max(maxX, a[0]);
          minY = Math.min(minY, a[1]); maxY = Math.max(maxY, a[1]);
        }
        if (da * db < 0) {
          const t = (z - a[2]) / (b[2] - a[2]);
          const x = a[0] + (b[0] - a[0]) * t;
          const y = a[1] + (b[1] - a[1]) * t;
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
      }
    }
    return Number.isFinite(minX) ? (maxX - minX) * (maxY - minY) : 0;
  };

  const sections = Array.from({ length: 29 }, (_, i) => {
    const ratio = 0.08 + i * 0.01;
    const z = bounds.min[2] + height * ratio;
    return { z, area: sectionArea(z) };
  });
  let neck: { z: number; area: number } | null = null;
  for (let i = 2; i < sections.length - 7; i++) {
    const here = sections[i];
    if (!(here.area > footprint * 0.015)) continue;
    const localMinimum = here.area <= sections[i - 1].area && here.area <= sections[i + 1].area;
    const later = sections.slice(i + 3, i + 8);
    const widened = later.filter((sample) => sample.area >= here.area * 1.65).length >= 3;
    // A pedestal is always broader than the neck it supports. A standing
    // animal's legs make the same narrow-then-wide silhouette, but stay narrow
    // all the way down — never mistake those for a pedestal and cut them off.
    const below = sections.filter((sample) => sample.z < here.z - 1e-6);
    const widestBelow = below.reduce((max, sample) => Math.max(max, sample.area), 0);
    const pedestalBelow = widestBelow >= here.area * 1.4;
    if (localMinimum && widened && pedestalBelow && (!neck || here.z > neck.z)) neck = here;
  }
  if (neck) return neck.z;

  // Simple slab models do not have a neck-and-chest silhouette. For those,
  // take the highest qualifying horizontal plane.
  let best: { z: number; area: number } | null = null;
  for (const [z, area] of candidates) {
    if (area < footprint * 0.06) continue;
    if (!best || z > best.z) best = { z, area };
  }
  return best?.z ?? null;

}

/**
 * Replaces the generated piece's own plinth with a true rectangular slab.
 *
 * The mesh generator invents whatever base the photo suggests — usually round
 * and tapered, which leaves no flat wall to letter (strokes ended up hanging
 * in front of the piece). We cut everything below the plinth shoulder away and
 * build a deterministic box: flat front face, square corners, predictable
 * height. The sculpture above is only translated up.
 */
function reinforceTris(tris: Tri[]): ReinforcedTris {
  const bounds = boundsOf(tris);
  const width = bounds.max[0] - bounds.min[0];
  const depth = bounds.max[1] - bounds.min[1];
  const height = bounds.max[2] - bounds.min[2];
  if (!(width > 0) || !(depth > 0) || !(height > 0)) {
    return { tris, applied: false, baseHeightMm: 0, volumeAddedCm3: 0, size: { x: width, y: depth, z: height } };
  }

  // Where the generated plinth ends and the sculpture begins. When the
  // generator produced no plinth at all we simply slab underneath the piece.
  const detected = existingPlinthTop(tris, bounds);
  const cutZ = detected !== null && detected > bounds.min[2] ? detected : bounds.min[2];

  const currentVolume = signedVolumeMm3(tris);
  const targetExtra = currentVolume * HEFT_TARGET_INCREASE;
  const targetHeight = targetExtra > 0 ? targetExtra / (width * depth) : 0;
  const addedHeight = Math.min(HEFT_MAX_HEIGHT_MM, Math.max(HEFT_MIN_HEIGHT_MM, targetHeight));

  // Keep only the sculpture; clip crossing triangles at the cut plane instead
  // of retaining their below-plane vertices (which leaves pedestal fragments).
  const kept: Tri[] = [];
  for (const tri of tris) {
    let polygon: V3[] = tri;
    const clipped: V3[] = [];
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % polygon.length];
      const aInside = a[2] >= cutZ;
      const bInside = b[2] >= cutZ;
      if (aInside) clipped.push(a);
      if (aInside !== bInside) {
        const t = (cutZ - a[2]) / (b[2] - a[2]);
        clipped.push([
          a[0] + (b[0] - a[0]) * t,
          a[1] + (b[1] - a[1]) * t,
          cutZ,
        ]);
      }
    }
    polygon = clipped;
    for (let i = 1; i + 1 < polygon.length; i++) kept.push([polygon[0], polygon[i], polygon[i + 1]]);
  }
  if (!kept.length) {
    return { tris, applied: false, baseHeightMm: 0, volumeAddedCm3: 0, size: { x: width, y: depth, z: height } };
  }

  const slabTop = addedHeight;
  const lifted = kept.map((tri) =>
    tri.map(([x, y, z]) => [x, y, z - cutZ + addedHeight] as V3) as Tri
  );

  // Footprint: the discarded plinth's own span, widened so the slab reads as a
  // plinth and carries lettering comfortably. Never narrower than the
  // sculpture standing on it.
  const keptBounds = boundsOf(lifted);
  const cx = (bounds.max[0] + bounds.min[0]) / 2;
  const cy = (bounds.max[1] + bounds.min[1]) / 2;
  const halfX = Math.max(
    (width * HEFT_FOOTPRINT_SCALE) / 2,
    Math.max(keptBounds.max[0] - cx, cx - keptBounds.min[0]) + 5,
  );
  const halfY = Math.max(
    (depth * HEFT_FOOTPRINT_SCALE) / 2,
    Math.max(keptBounds.max[1] - cy, cy - keptBounds.min[1]) + 5,
  );


  const out: Tri[] = [];
  // The slab overlaps the sculpture's open underside so the two fuse solidly.
  box(out, [cx - halfX, cy - halfY, 0], [cx + halfX, cy + halfY, slabTop + HEFT_OVERLAP_MM]);
  // Never spread here: these meshes carry >100k triangles and a spread blows
  // the call stack ("Maximum call stack size exceeded").
  for (const tri of lifted) out.push(tri);

  const next = boundsOf(out);
  return {
    tris: out,
    applied: true,
    baseHeightMm: Number((slabTop + HEFT_OVERLAP_MM).toFixed(2)),
    volumeAddedCm3: Number((halfX * 2 * halfY * 2 * (slabTop + HEFT_OVERLAP_MM) / 1000).toFixed(2)),
    size: {
      x: Number((next.max[0] - next.min[0]).toFixed(2)),
      y: Number((next.max[1] - next.min[1]).toFixed(2)),
      z: Number((next.max[2] - next.min[2]).toFixed(2)),
    },
  };
}


/** Applies the heavier Originals base before validation and partner quoting. */
export function reinforceKeepsakeStl(bytes: Uint8Array, maxDimensionMm?: number): HeftBaseResult {
  const tris = parseStl(bytes);
  const existingBounds = boundsOf(tris);
  const existingSize = {
    x: existingBounds.max[0] - existingBounds.min[0],
    y: existingBounds.max[1] - existingBounds.min[1],
    z: existingBounds.max[2] - existingBounds.min[2],
  };
  if (hasStlHeader(bytes, HEFT_HEADER)) {
    return {
      stl: bytes,
      applied: false,
      baseHeightMm: 0,
      volumeAddedCm3: 0,
      size: existingSize,
      reason: "already_reinforced",
    };
  }
  let reinforced = reinforceTris(tris);
  if (!reinforced.applied) {
    return { stl: bytes, ...reinforced, reason: "no_existing_plinth" };
  }
  const longest = Math.max(reinforced.size.x, reinforced.size.y, reinforced.size.z);
  if (maxDimensionMm && longest > maxDimensionMm) {
    const scale = maxDimensionMm / longest;
    const scaled = reinforced.tris.map((tri) =>
      tri.map(([x, y, z]) => [x * scale, y * scale, z * scale] as V3) as Tri
    );
    const scaledBounds = boundsOf(scaled);
    reinforced = {
      ...reinforced,
      tris: scaled,
      baseHeightMm: Number((reinforced.baseHeightMm * scale).toFixed(2)),
      volumeAddedCm3: Number((reinforced.volumeAddedCm3 * scale ** 3).toFixed(2)),
      size: {
        x: Number((scaledBounds.max[0] - scaledBounds.min[0]).toFixed(2)),
        y: Number((scaledBounds.max[1] - scaledBounds.min[1]).toFixed(2)),
        z: Number((scaledBounds.max[2] - scaledBounds.min[2]).toFixed(2)),
      },
    };
  }
  return { stl: writeStl(reinforced.tris, HEFT_HEADER), ...reinforced };
}

/**
 * Scales a finished print file so its longest edge matches the sold size.
 * The heavier-base step converts the mesh smaller on purpose to leave room for
 * the enlarged plinth; without this the buyer would receive a shorter piece
 * than the size they picked (and be quoted on the smaller file).
 */
export function fitStlToLongestEdge(
  bytes: Uint8Array,
  targetMm: number,
): { stl: Uint8Array; size: { x: number; y: number; z: number }; scale: number } {
  const tris = parseStl(bytes);
  const bounds = boundsOf(tris);
  const size = {
    x: bounds.max[0] - bounds.min[0],
    y: bounds.max[1] - bounds.min[1],
    z: bounds.max[2] - bounds.min[2],
  };
  const longest = Math.max(size.x, size.y, size.z);
  if (!(targetMm > 0) || !(longest > 0) || Math.abs(longest - targetMm) / targetMm < 0.005) {
    return { stl: bytes, size, scale: 1 };
  }
  const scale = targetMm / longest;
  const scaled = tris.map((tri) =>
    tri.map(([x, y, z]) => [x * scale, y * scale, z * scale] as V3) as Tri
  );
  const next = boundsOf(scaled);
  const header = hasStlHeader(bytes, LETTERED_HEADER)
    ? LETTERED_HEADER
    : hasStlHeader(bytes, HEFT_HEADER)
    ? HEFT_HEADER
    : undefined;
  return {
    stl: header ? writeStl(scaled, header) : writeStl(scaled),
    size: {
      x: Number((next.max[0] - next.min[0]).toFixed(2)),
      y: Number((next.max[1] - next.min[1]).toFixed(2)),
      z: Number((next.max[2] - next.min[2]).toFixed(2)),
    },
    scale,
  };
}

/** Area of triangles lying on one extreme plane of a mesh. */
function extremeArea(tris: Tri[], axis: 0 | 1 | 2, outward: -1 | 1, extreme: number, tolerance: number) {
  let area = 0;
  for (const tri of tris) {
    if (!tri.every((point) => Math.abs(point[axis] - extreme) <= tolerance)) continue;
    if (triNormal(tri)[axis] * outward > 0.82) area += triArea(tri);
  }
  return area;
}

/**
 * Older cached Meshy files were stored Y-up. Detect their broad -Y floor and
 * rotate them into the Z-up manufacturing convention before placing text.
 */
function normalizeManufacturingAxes(tris: Tri[]): { tris: Tri[]; normalized: boolean } {
  const bounds = boundsOf(tris);
  const span = bounds.max.map((value, axis) => value - bounds.min[axis]) as V3;
  const yFloor = extremeArea(tris, 1, -1, bounds.min[1], Math.max(0.5, span[1] * 0.01));
  const zFloor = extremeArea(tris, 2, -1, bounds.min[2], Math.max(0.5, span[2] * 0.01));
  if (!(yFloor > zFloor * 1.35 && yFloor > 25)) return { tris, normalized: false };

  const rotated = tris.map((tri) => tri.map(([x, y, z]) => [x, -z, y] as V3) as Tri);
  const next = boundsOf(rotated);
  const cx = (next.min[0] + next.max[0]) / 2;
  const cy = (next.min[1] + next.max[1]) / 2;
  const floor = next.min[2];
  return {
    tris: rotated.map((tri) => tri.map(([x, y, z]) => [x - cx, y - cy, z - floor] as V3) as Tri),
    normalized: true,
  };
}

/**
 * Engraves heading/footnote onto the flattest vertical face of the plinth of
 * the supplied mesh. `bandTopZ` overrides where the plinth is assumed to end.
 */
function engraveTris(
  tris: Tri[],
  heading: string,
  footnote: string,
  bandTopZ?: number,
): Attempt {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const t of tris) {
    for (const [x, y, z] of t) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
  }
  const height = maxZ - minZ;
  if (!(height > 0)) return { ok: false, reason: "degenerate_mesh" };

  // The plinth is the bottom slab of the piece. The supplied plinth top is a
  // rounded measurement, so allow a hair of slack — otherwise the plinth's own
  // front wall falls outside the band and the piece ships unlettered.
  const bandTop = (bandTopZ ?? (minZ + height * 0.3)) + 0.05;
  const band = tris.filter((t) => t.every(([, , z]) => z <= bandTop));
  if (!band.length) return { ok: false, reason: "no_plinth" };


  // The source image faces +Z in Meshy's Y-up coordinates. Conversion maps
  // that known buyer-visible side to -Y. Never choose a larger side/back wall:
  // that is how correctly spelled lettering can still be hidden from view.
  let best: { key: "+x" | "-x" | "+y" | "-y"; axis: "x" | "y"; outward: number; area: number } | null = null;
  for (const face of FACES.filter((candidate) => candidate.key === "-y")) {
    let area = 0;
    for (const t of band) {
      const n = triNormal(t);
      const dot = n[0] * face.dir[0] + n[1] * face.dir[1] + n[2] * face.dir[2];
      if (dot > 0.82) area += triArea(t);
    }
    if (!best || area > best.area) {
      best = {
        key: face.key,
        axis: face.dir[0] !== 0 ? "x" : "y",
        outward: face.dir[0] !== 0 ? face.dir[0] : face.dir[1],
        area,
      };
    }
  }
  if (!best || best.area <= 0) {
    return { ok: false, reason: "no_flat_face" };
  }


  const axis = best.axis;
  const outward = best.outward;
  // Only the wall that actually faces the buyer carries lettering.
  const facing = band.filter((t) => {
    const n = triNormal(t);
    const dot = axis === "x" ? n[0] * outward : n[1] * outward;
    return dot > 0.82;
  });
  if (!facing.length) return { ok: false, reason: "no_flat_face" };

  // A generated plinth is rounded and tapered: its most protruding contour is
  // one thin ring, so lettering aligned to that single plane hangs in the air
  // everywhere else. Anchor every stroke to the wall beneath it instead.
  const sampler = makeSurfaceSampler(facing, axis, outward);
  const region = chooseLetteringRegion(sampler);
  if (!region) return { ok: false, reason: "face_too_small" };
  const uMin = region.uMin;
  const uMax = region.uMax;
  const zMin = region.wMin;
  const zMax = region.wMax;

  const faceWidth = uMax - uMin;
  const faceHeight = zMax - zMin;
  if (!(faceWidth > 6) || !(faceHeight > 4)) {
    return { ok: false, reason: "face_too_small" };
  }


  const usableW = faceWidth * 0.78;

  /** Splits a long line at a word break so a small plinth keeps readable type. */
  const wrap = (text: string): string[] => {
    const words = text.split(" ").filter(Boolean);
    if (words.length < 2) return [text];
    let best: string[] = [text];
    let bestWidth = textWidth(text);
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(" ");
      const b = words.slice(i).join(" ");
      const widest = Math.max(textWidth(a), textWidth(b));
      if (widest < bestWidth) {
        bestWidth = widest;
        best = [a, b];
      }
    }
    return best;
  };

  const lines: Array<{ text: string; cap: number }> = [];
  if (heading) {
    const headingLines =
      usableW / Math.max(textWidth(heading), 0.001) < MIN_CAP_MM ? wrap(heading) : [heading];
    const widest = Math.max(...headingLines.map((l) => textWidth(l)), 0.001);
    const capByWidth = usableW / widest;
    const capByHeight = (faceHeight * (footnote ? 0.42 : 0.55)) / headingLines.length;
    const cap = Math.min(MAX_CAP_MM, capByWidth, capByHeight);
    for (const l of headingLines) lines.push({ text: l, cap });
  }
  if (footnote) {
    const capByWidth = usableW / Math.max(textWidth(footnote), 0.001);
    const capByHeight = faceHeight * 0.26;
    lines.push({ text: footnote, cap: Math.min(MAX_CAP_MM * 0.6, capByWidth, capByHeight) });
  }
  const primaryCap = lines[0].cap;
  if (primaryCap < MIN_CAP_MM) {
    return { ok: false, reason: "plinth_too_small_for_readable_text" };
  }


  const gap = primaryCap * 0.45;
  const blockHeight = lines.reduce((s, l) => s + l.cap, 0) + gap * (lines.length - 1);
  let cursorTop = (zMin + zMax) / 2 + blockHeight / 2;
  const uCenter = (uMin + uMax) / 2;
  // Text reads left-to-right when viewed from outside the face.
  const flip = axis === "y" ? outward > 0 : outward < 0;

  const out: Tri[] = tris.slice();
  const letteringStart = out.length;
  let studs = 0;
  let missed = 0;
  const planeAt = (u: number, w: number) => sampler.sample(u, w);
  for (const line of lines) {
    const baseline = cursorTop - line.cap;
    const width = textWidth(line.text) * line.cap;
    const strokeMm = strokeFor(line.cap);
    let pen = uCenter - width / 2;
    for (const ch of line.text) {
      if (ch === " ") {
        pen += SPACE_ADVANCE * line.cap;
        continue;
      }
      const strokes = glyph(ch);
      if (strokes) {
        for (const poly of strokes) {
          for (let i = 0; i + 1 < poly.length; i++) {
            const [ax, ay] = poly[i];
            const [bx, by] = poly[i + 1];
            const toU = (gx: number) => {
              const local = pen + gx * line.cap;
              return flip ? uCenter * 2 - local : local;
            };
            const tally = strokePrism(
              out,
              axis,
              outward,
              planeAt,
              toU(ax),
              baseline + ay * line.cap,
              toU(bx),
              baseline + by * line.cap,
              strokeMm,
            );
            studs += tally.studs;
            missed += tally.missed;
          }
        }
      }
      pen += ADVANCE * line.cap;
    }
    cursorTop = baseline - gap;
  }

  // Any meaningful number of unsupported strokes means part of the name would
  // print detached. Stop the order rather than ship floating letters.
  if (studs > 0 && missed / studs > 0.02) {
    return { ok: false, reason: "lettering_not_supported_by_face" };
  }

  const lettering = out.slice(letteringStart);
  if (!lettering.length) return { ok: false, reason: "no_geometry_added" };
  return {
    ok: true,
    tris: out,
    face: best.key,
    cap: Number(primaryCap.toFixed(2)),
    letteringBounds: boundsOf(lettering),
    floorZ: minZ,
  };
}

/**
 * Engraves heading/footnote onto the piece's existing enlarged plinth. If that
 * plinth cannot carry readable lettering, the order stops for review; adding
 * a second base or a detached nameplate is never an acceptable fallback.
 */
export function engraveStl(bytes: Uint8Array, opts: EngraveOptions): EngraveResult {
  const heading = normalizeEngravingText(opts.heading ?? "");
  const footnote = normalizeEngravingText(opts.footnote ?? "");
  const label = [heading, footnote].filter(Boolean).join(" / ");
  if (!heading && !footnote) {
    return { stl: bytes, applied: false, text: "", reason: "no_text" };
  }

  // Never letter a file that already carries lettering — a second pass places
  // glyphs on a different face and the piece ships with garbled duplicate text.
  if (hasStlHeader(bytes, LETTERED_HEADER)) {
    return { stl: bytes, applied: false, text: label, reason: "already_lettered" };
  }

  const parsed = parseStl(bytes);
  const oriented = normalizeManufacturingAxes(parsed);
  const alreadyReinforced = hasStlHeader(bytes, HEFT_HEADER);
  const heft = alreadyReinforced
    ? {
        tris: oriented.tris,
        applied: false,
        baseHeightMm: 0,
        volumeAddedCm3: 0,
        size: { x: 0, y: 0, z: 0 },
      }
    : reinforceTris(oriented.tris);
  // The enlarged plinth grows upward and outward, so a source file that was
  // not already clamped can exceed the size the buyer paid for. Scale the
  // whole piece back before the lettering is sized to the front face.
  let tris = heft.tris;
  if (heft.applied && opts.maxDimensionMm) {
    const b = boundsOf(tris);
    const longest = Math.max(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]);
    if (longest > opts.maxDimensionMm) {
      const k = opts.maxDimensionMm / longest;
      tris = tris.map((tri) => tri.map(([x, y, z]) => [x * k, y * k, z * k] as V3) as Tri);
      heft.baseHeightMm = Number((heft.baseHeightMm * k).toFixed(2));
      heft.volumeAddedCm3 = Number((heft.volumeAddedCm3 * k ** 3).toFixed(2));
    }
  }
  // Meshy faces +Z before conversion; our manufacturing normalization maps
  // that visible front to -Y. Do not silently accept another face.
  const reinforcedBounds = boundsOf(tris);
  const plinthTop = heft.applied
    ? heft.baseHeightMm
    : (existingPlinthTop(tris, reinforcedBounds) ?? undefined);
  const attempt = engraveTris(tris, heading, footnote, plinthTop);
  const addedPlinth = false;
  const baseCount = tris.length;

  if (!attempt.ok) {
    return { stl: bytes, applied: false, text: label, reason: attempt.reason };
  }

  // Last line of defence: an "engraved" file that gained no geometry is a
  // blank plinth waiting to ship. Refuse it rather than record a false pass.
  const triangleDelta = attempt.tris.length - baseCount;
  if (triangleDelta <= 0) {
    return { stl: bytes, applied: false, text: label, reason: "no_geometry_added" };
  }

  // Lettering must sit on the plinth's front face — never drift up onto the
  // sculpture, which is how text ends up looking like it floats.
  const withinPlinth =
    plinthTop === undefined ||
    attempt.letteringBounds.max[2] <= attempt.floorZ + (plinthTop - attempt.floorZ) + 1.5;
  const placementVerified =
    attempt.face === "-y" &&
    attempt.letteringBounds.min[2] >= attempt.floorZ + 0.5 &&
    attempt.letteringBounds.max[2] > attempt.letteringBounds.min[2] &&
    withinPlinth;
  if (!placementVerified) {
    return {
      stl: bytes,
      applied: false,
      text: label,
      face: attempt.face,
      letteringBounds: attempt.letteringBounds,
      reason: "visible_front_placement_not_verified",
    };
  }

  return {
    // Preserve the reinforcement marker after lettering so retries cannot add
    // a second base to an already reinforced final file.
    stl: writeStl(attempt.tris, LETTERED_HEADER),
    applied: true,
    text: label,
    face: attempt.face,
    capHeightMm: attempt.cap,
    addedPlinth,
    triangleDelta,
    reliefMm: PROUD_MM,
    strokeMm: Number(strokeFor(attempt.cap).toFixed(2)),
    placementVerified,
    orientationNormalized: oriented.normalized,
    letteringBounds: attempt.letteringBounds,
    heftBaseApplied: heft.applied,
    heftBaseHeightMm: heft.baseHeightMm,
    heftVolumeAddedCm3: heft.volumeAddedCm3,
  };
}



/**
 * The exact lettering a buyer paid for, normalised the same way the engraver
 * normalises it. Used as the fulfillment gate's expected value.
 */
export function engravingLabel(personalization: Record<string, unknown> | null): string {
  const heading = normalizeEngravingText(String(personalization?.heading ?? personalization?.name ?? ""));
  const footnote = normalizeEngravingText(String(personalization?.footnote ?? personalization?.dates ?? ""));
  return [heading, footnote].filter(Boolean).join(" / ");
}
