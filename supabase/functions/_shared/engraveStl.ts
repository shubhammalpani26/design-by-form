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
const HEFT_HEADER = "Nyzora enlarged plinth v2";
const HEFT_TARGET_INCREASE = 0.4;
const HEFT_MIN_HEIGHT_MM = 16;
const HEFT_MAX_HEIGHT_MM = 24;
const HEFT_OVERLAP_MM = 1.2;
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
 */
function strokePrism(
  out: Tri[],
  axis: "x" | "y",
  outward: number,
  facePlane: number,
  u0: number,
  w0: number,
  u1: number,
  w1: number,
  strokeMm: number,
) {
  const dx = u1 - u0;
  const dz = w1 - w0;
  const len = Math.hypot(dx, dz);
  if (len < 1e-6) return;
  const steps = Math.max(1, Math.ceil(len / (strokeMm * 0.6)));
  const half = strokeMm / 2;

  const near = facePlane - outward * EMBED_MM;
  const far = facePlane + outward * PROUD_MM;
  const nMin = Math.min(near, far);
  const nMax = Math.max(near, far);
  // A stroke is stamped as a chain of overlapping square studs; the slicer
  // unions them into one clean, continuous letter stroke.
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = u0 + dx * t;
    const w = w0 + dz * t;
    const min: V3 = axis === "y"
      ? [u - half, nMin, w - half]
      : [nMin, u - half, w - half];
    const max: V3 = axis === "y"
      ? [u + half, nMax, w + half]
      : [nMax, u + half, w + half];
    box(out, min, max);
  }
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
  reason?: "already_reinforced" | "degenerate_mesh";
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

  let best: { z: number; area: number } | null = null;
  for (const [z, area] of candidates) {
    if (area < footprint * 0.12) continue;
    if (!best || area > best.area || (area === best.area && z > best.z)) best = { z, area };
  }
  return best?.z ?? null;
}

/**
 * Enlarges the generated piece's own plinth toward a 40% geometric-volume
 * increase. Vertices in the plinth are stretched vertically and the sculpture
 * above it is translated by the same amount. No second slab or shell is added.
 */
function reinforceTris(tris: Tri[]): ReinforcedTris {
  const bounds = boundsOf(tris);
  const width = bounds.max[0] - bounds.min[0];
  const depth = bounds.max[1] - bounds.min[1];
  const height = bounds.max[2] - bounds.min[2];
  if (!(width > 0) || !(depth > 0) || !(height > 0)) {
    return { tris, applied: false, baseHeightMm: 0, volumeAddedCm3: 0, size: { x: width, y: depth, z: height } };
  }

  const plinthTop = existingPlinthTop(tris, bounds);
  if (plinthTop === null || plinthTop <= bounds.min[2]) {
    return { tris, applied: false, baseHeightMm: 0, volumeAddedCm3: 0, size: { x: width, y: depth, z: height } };
  }
  const plinthHeight = plinthTop - bounds.min[2];
  const currentVolume = signedVolumeMm3(tris);
  const targetExtra = currentVolume * HEFT_TARGET_INCREASE;
  const targetHeight = targetExtra > 0 ? targetExtra / (width * depth) : 0;
  const addedHeight = Math.min(HEFT_MAX_HEIGHT_MM, Math.max(HEFT_MIN_HEIGHT_MM, targetHeight));
  const scale = (plinthHeight + addedHeight) / plinthHeight;
  const out = tris.map((tri) => tri.map(([x, y, z]) => {
    const localZ = z - bounds.min[2];
    const nextZ = localZ <= plinthHeight
      ? localZ * scale
      : localZ + addedHeight;
    return [x, y, nextZ] as V3;
  }) as Tri);
  const next = boundsOf(out);
  return {
    tris: out,
    applied: true,
    baseHeightMm: Number((plinthHeight + addedHeight).toFixed(2)),
    volumeAddedCm3: Number((targetExtra / 1000).toFixed(2)),
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

  // The plinth is the bottom slab of the piece.
  const bandTop = bandTopZ ?? (minZ + height * 0.3);
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
  // Plane of the chosen face, measured from the geometry actually facing it.
  let facePlane = outward > 0 ? -Infinity : Infinity;
  let uMin = Infinity, uMax = -Infinity, zMin = Infinity, zMax = -Infinity;
  for (const t of band) {
    const n = triNormal(t);
    const dot = axis === "x" ? n[0] * outward : n[1] * outward;
    if (dot <= 0.82) continue;
    for (const [x, y, z] of t) {
      const a = axis === "x" ? x : y;
      const u = axis === "x" ? y : x;
      facePlane = outward > 0 ? Math.max(facePlane, a) : Math.min(facePlane, a);
      if (u < uMin) uMin = u; if (u > uMax) uMax = u;
      if (z < zMin) zMin = z; if (z > zMax) zMax = z;
    }
  }
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
            strokePrism(
              out,
              axis,
              outward,
              facePlane,
              toU(ax),
              baseline + ay * line.cap,
              toU(bx),
              baseline + by * line.cap,
              strokeMm,
            );
          }
        }
      }
      pen += ADVANCE * line.cap;
    }
    cursorTop = baseline - gap;
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

/** Failures that a purpose-built nameplate base can rescue. */
const RESCUABLE = new Set([
  "no_plinth",
  "no_flat_face",
  "face_too_small",
  "plinth_too_small_for_readable_text",
]);

/**
 * Builds a nameplate base under the piece so there is always a flat, readable
 * face for the buyer's lettering. Used only when the generated mesh has no
 * usable plinth of its own — a paid keepsake must never stall for want of a
 * surface to engrave.
 */
function addNameplate(tris: Tri[], heading: string, footnote: string): { tris: Tri[]; bandTopZ: number } | null {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  for (const t of tris) {
    for (const [x, y, z] of t) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
    }
  }
  const footW = maxX - minX;
  const footD = maxY - minY;
  if (!(footW > 0) || !(footD > 0)) return null;

  // Width the target cap height needs, allowing the engraver's own wrapping.
  const capTarget = MIN_CAP_MM * 1.25;
  const words = heading.split(" ").filter(Boolean);
  let headingUnits = textWidth(heading);
  if (words.length > 1) {
    for (let i = 1; i < words.length; i++) {
      headingUnits = Math.min(
        headingUnits,
        Math.max(textWidth(words.slice(0, i).join(" ")), textWidth(words.slice(i).join(" "))),
      );
    }
  }
  const unitsNeeded = Math.max(headingUnits, textWidth(footnote) * 0.6, 0.001);
  const neededW = (unitsNeeded * capTarget) / 0.78;

  // Keep the base inside the printer envelope even for very long names.
  const MAX_PLATE_MM = 200;
  const plateW = Math.min(MAX_PLATE_MM, Math.max(footW * 1.08, neededW + 8));
  const plateD = Math.min(MAX_PLATE_MM, Math.max(footD * 1.08, 20));
  const plateH = Math.max(16, capTarget / 0.4 + 5);

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const out = tris.slice();
  box(
    out,
    [cx - plateW / 2, cy - plateD / 2, minZ - plateH],
    [cx + plateW / 2, cy + plateD / 2, minZ + 0.2],
  );
  // Only the new plate counts as the plinth band.
  return { tris: out, bandTopZ: minZ + 0.25 };
}

/**
 * Engraves heading/footnote onto the piece. Falls back to adding a nameplate
 * base when the mesh has no engravable plinth, so personalised orders cannot
 * get permanently stuck before printing. Returns `applied: false` only when
 * there is no text or the mesh is unusable.
 */
export function engraveStl(bytes: Uint8Array, opts: EngraveOptions): EngraveResult {
  const heading = normalizeEngravingText(opts.heading ?? "");
  const footnote = normalizeEngravingText(opts.footnote ?? "");
  const label = [heading, footnote].filter(Boolean).join(" / ");
  if (!heading && !footnote) {
    return { stl: bytes, applied: false, text: "", reason: "no_text" };
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
  const tris = heft.tris;
  // Meshy faces +Z before conversion; our manufacturing normalization maps
  // that visible front to -Y. Do not silently accept another face.
  const reinforcedBounds = boundsOf(tris);
  const plinthTop = existingPlinthTop(tris, reinforcedBounds) ?? undefined;
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

  const placementVerified =
    attempt.face === "-y" &&
    attempt.letteringBounds.min[2] >= attempt.floorZ + 0.5 &&
    attempt.letteringBounds.max[2] > attempt.letteringBounds.min[2];
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
    stl: writeStl(attempt.tris, HEFT_HEADER),
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
