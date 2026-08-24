/**
 * Geometry-level printability gate for FDM.
 *
 * Runs on the binary STL we already generate, before we accept a partner
 * slice. Meshy gives us a clean mesh and the engineering agent reasons over
 * the image — neither of them measures the actual solid. This does:
 *
 *  - watertight / manifold check (every edge shared by exactly two faces)
 *  - mean wall thickness estimate (2V/A) to catch paper-thin shells
 *  - overhang histogram (down-facing area needing support)
 *  - base footprint vs height tipping ratio
 *  - build-envelope fit
 */

export const FDM = {
  /** Nozzle-limited practical minimum wall. */
  minMeanWallMm: 1.2,
  /** Below this we refuse outright. */
  hardMinMeanWallMm: 0.8,
  /** Facets steeper than this from vertical are unsupported overhang. */
  overhangAngleDeg: 45,
  /** Warn above this share of surface area in overhang. */
  overhangWarnFraction: 0.18,
  /** Refuse above this share. */
  overhangFailFraction: 0.35,
  /** Height / base-width above this tips on the belt. */
  tipRatioWarn: 3.0,
  tipRatioFail: 4.5,
  /** Slab used to measure the footprint that actually touches the plate. */
  baseSlabMm: 1.0,
} as const;

export interface MeshMetric {
  key: string;
  label: string;
  /** Human-readable measured value. */
  value: string;
  status: "pass" | "warn" | "fail";
  /** What we require for a pass. */
  target: string;
}

export interface MeshReport {
  triangleCount: number;
  sizeMm: { x: number; y: number; z: number };
  volumeCm3: number;
  surfaceAreaCm2: number;
  meanWallMm: number;
  openEdges: number;
  watertight: boolean;
  overhangFraction: number;
  baseFootprintMm2: number;
  tipRatio: number;
  warnings: string[];
  blockers: string[];
  printable: boolean;
  /** 0-100 confidence that this prints cleanly on FDM. */
  score: number;
  metrics: MeshMetric[];
}


type V3 = [number, number, number];

function parseBinaryStl(bytes: Uint8Array): V3[][] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint32(80, true);
  const tris: V3[][] = [];
  let p = 84;
  for (let i = 0; i < count && p + 50 <= bytes.byteLength; i++) {
    p += 12; // stored normal, recomputed below
    const tri: V3[] = [];
    for (let v = 0; v < 3; v++) {
      tri.push([
        view.getFloat32(p, true),
        view.getFloat32(p + 4, true),
        view.getFloat32(p + 8, true),
      ]);
      p += 12;
    }
    p += 2;
    tris.push(tri);
  }
  return tris;
}

const key = (v: V3) =>
  `${Math.round(v[0] * 1000)},${Math.round(v[1] * 1000)},${Math.round(v[2] * 1000)}`;

/** Analyses binary STL bytes (millimetres) for FDM printability. */
export function analyseStl(
  bytes: Uint8Array,
  opts: { envelopeMm?: number } = {},
): MeshReport {
  const tris = parseBinaryStl(bytes);
  const warnings: string[] = [];
  const blockers: string[] = [];

  if (!tris.length) {
    return {
      triangleCount: 0,
      sizeMm: { x: 0, y: 0, z: 0 },
      volumeCm3: 0,
      surfaceAreaCm2: 0,
      meanWallMm: 0,
      openEdges: 0,
      watertight: false,
      overhangFraction: 0,
      baseFootprintMm2: 0,
      tipRatio: 0,
      warnings,
      blockers: ["The mesh has no geometry."],
      printable: false,
    };
  }

  let min: V3 = [Infinity, Infinity, Infinity];
  let max: V3 = [-Infinity, -Infinity, -Infinity];
  let volume = 0;
  let area = 0;
  let overhangArea = 0;
  let baseArea = 0;
  const edges = new Map<string, number>();
  const cosLimit = Math.cos((FDM.overhangAngleDeg * Math.PI) / 180);

  for (const [a, b, c] of tris) {
    for (const v of [a, b, c]) {
      for (let i = 0; i < 3; i++) {
        if (v[i] < min[i]) min[i] = v[i];
        if (v[i] > max[i]) max[i] = v[i];
      }
    }

    const u: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const w: V3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n: V3 = [
      u[1] * w[2] - u[2] * w[1],
      u[2] * w[0] - u[0] * w[2],
      u[0] * w[1] - u[1] * w[0],
    ];
    const len = Math.hypot(n[0], n[1], n[2]);
    const triArea = len / 2;
    area += triArea;

    // Signed volume of the tetrahedron to the origin.
    volume +=
      (a[0] * (b[1] * c[2] - b[2] * c[1]) -
        a[1] * (b[0] * c[2] - b[2] * c[0]) +
        a[2] * (b[0] * c[1] - b[1] * c[0])) /
      6;

    if (len > 0) {
      const nz = n[2] / len;
      // Down-facing and shallower than the overhang limit -> needs support.
      if (nz < 0 && Math.abs(nz) >= cosLimit) overhangArea += triArea;
      const zMax = Math.max(a[2], b[2], c[2]);
      if (nz < -0.5 && zMax <= FDM.baseSlabMm) baseArea += triArea;
    }

    const ks = [key(a), key(b), key(c)];
    for (let i = 0; i < 3; i++) {
      const p1 = ks[i];
      const p2 = ks[(i + 1) % 3];
      const e = p1 < p2 ? `${p1}|${p2}` : `${p2}|${p1}`;
      edges.set(e, (edges.get(e) ?? 0) + 1);
    }
  }

  let openEdges = 0;
  for (const n of edges.values()) if (n !== 2) openEdges++;

  const size = { x: max[0] - min[0], y: max[1] - min[1], z: max[2] - min[2] };
  const volumeMm3 = Math.abs(volume);
  const meanWallMm = area > 0 ? (2 * volumeMm3) / area : 0;
  const overhangFraction = area > 0 ? overhangArea / area : 0;
  const baseWidth = Math.max(1e-6, Math.min(size.x, size.y));
  const tipRatio = size.z / baseWidth;

  if (openEdges > 0) {
    const msg = `Mesh is not watertight (${openEdges} open edges).`;
    if (openEdges > tris.length * 0.01) blockers.push(msg);
    else warnings.push(msg);
  }

  if (meanWallMm < FDM.hardMinMeanWallMm) {
    blockers.push(`Walls are too thin to print (~${meanWallMm.toFixed(2)} mm).`);
  } else if (meanWallMm < FDM.minMeanWallMm) {
    warnings.push(`Thin walls (~${meanWallMm.toFixed(2)} mm) — fragile at this size.`);
  }

  if (overhangFraction >= FDM.overhangFailFraction) {
    blockers.push(
      `Too much unsupported overhang (${Math.round(overhangFraction * 100)}% of the surface).`,
    );
  } else if (overhangFraction >= FDM.overhangWarnFraction) {
    warnings.push(
      `Notable overhang (${Math.round(overhangFraction * 100)}% of the surface) — supports needed.`,
    );
  }

  if (baseArea <= 0) {
    warnings.push("No flat contact with the build plate detected.");
  }

  if (tipRatio >= FDM.tipRatioFail) {
    blockers.push(`Too tall for its base (height/width ${tipRatio.toFixed(1)}).`);
  } else if (tipRatio >= FDM.tipRatioWarn) {
    warnings.push(`Tall and narrow (height/width ${tipRatio.toFixed(1)}) — may need a raft.`);
  }

  const envelope = opts.envelopeMm;
  if (envelope && Math.max(size.x, size.y, size.z) > envelope + 0.5) {
    blockers.push(`Piece exceeds the build envelope (${envelope} mm).`);
  }

  return {
    triangleCount: tris.length,
    sizeMm: size,
    volumeCm3: volumeMm3 / 1000,
    surfaceAreaCm2: area / 100,
    meanWallMm,
    openEdges,
    watertight: openEdges === 0,
    overhangFraction,
    baseFootprintMm2: baseArea,
    tipRatio,
    warnings,
    blockers,
    printable: blockers.length === 0,
  };
}
