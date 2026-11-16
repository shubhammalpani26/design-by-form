/**
 * Fuses raised lettering into the piece as one closed solid.
 *
 * The engraver stamps each letter stroke as a chain of overlapping square
 * studs. Slicers union those, but the file itself then carries hundreds of
 * overlapping shells — which mesh checkers (and Meshy's viewer) report as
 * holes / non-manifold edges. Here the studs of each flat lettering layer are
 * merged in 2D, extruded once, and boolean-unioned with the body, giving a
 * single watertight shell with the letters exactly where they were.
 *
 * Returns null whenever the fusion cannot be proven clean; callers then keep
 * the unfused file and the normal print-file gate decides.
 */
import Module from "npm:manifold-3d@3.0.1";
import { parseStl } from "./engraveStl.ts";

type V3 = [number, number, number];

// deno-lint-ignore no-explicit-any
let wasmPromise: Promise<any> | null = null;
function manifold() {
  wasmPromise ??= Module().then((w) => {
    w.setup();
    return w;
  });
  return wasmPromise;
}

/** More distinct relief depths than this means a curved wall: fall back to 3D studs. */
const MAX_FLAT_LAYERS = 24;

function writeBinary(header: Uint8Array, pos: Float32Array | number[], numProp: number, tri: Uint32Array): Uint8Array {
  const nt = tri.length / 3;
  const out = new Uint8Array(84 + nt * 50);
  out.set(header.subarray(0, 80), 0);
  const v = new DataView(out.buffer);
  v.setUint32(80, nt, true);
  for (let i = 0; i < nt; i++) {
    let p = 84 + i * 50 + 12;
    for (let k = 0; k < 3; k++) {
      const vi = tri[i * 3 + k] * numProp;
      v.setFloat32(p, pos[vi], true);
      v.setFloat32(p + 4, pos[vi + 1], true);
      v.setFloat32(p + 8, pos[vi + 2], true);
      p += 12;
    }
  }
  return out;
}

/** Splits welded triangles into connected shells. */
function shells(tris: V3[][]) {
  const ids = new Map<string, number>();
  const pos: number[] = [];
  const idx: number[] = [];
  for (const t of tris) {
    for (const p of t) {
      const k = `${Math.round(p[0] * 1e4)},${Math.round(p[1] * 1e4)},${Math.round(p[2] * 1e4)}`;
      let id = ids.get(k);
      if (id === undefined) {
        id = pos.length / 3;
        ids.set(k, id);
        pos.push(p[0], p[1], p[2]);
      }
      idx.push(id);
    }
  }
  const parent = new Int32Array(pos.length / 3).map((_, i) => i);
  const find = (a: number): number => {
    while (parent[a] !== a) {
      parent[a] = parent[parent[a]];
      a = parent[a];
    }
    return a;
  };
  for (let t = 0; t < idx.length; t += 3) {
    parent[find(idx[t + 1])] = find(idx[t]);
    parent[find(idx[t + 2])] = find(idx[t]);
  }
  const groups = new Map<number, number[]>();
  for (let t = 0; t < idx.length; t += 3) {
    const r = find(idx[t]);
    const g = groups.get(r);
    if (g) g.push(t);
    else groups.set(r, [t]);
  }
  const out: { vert: Float32Array; tri: Uint32Array }[] = [];
  for (const g of groups.values()) {
    const local = new Map<number, number>();
    const vp: number[] = [];
    const tv: number[] = [];
    for (const t of g) {
      for (let k = 0; k < 3; k++) {
        const gid = idx[t + k];
        let l = local.get(gid);
        if (l === undefined) {
          l = vp.length / 3;
          local.set(gid, l);
          vp.push(pos[gid * 3], pos[gid * 3 + 1], pos[gid * 3 + 2]);
        }
        tv.push(l);
      }
    }
    out.push({ vert: new Float32Array(vp), tri: new Uint32Array(tv) });
  }
  return out;
}

/**
 * @param stl           lettered file from engraveStl (body triangles first)
 * @param letteringStart index of the first lettering triangle (EngraveResult.letteringStart)
 * @param face          face the lettering is on; only the -Y front is supported
 */
export async function fuseLettering(stl: Uint8Array, letteringStart: number, face: string | undefined): Promise<Uint8Array | null> {
  if (face !== "-y") return null;
  const tris = parseStl(stl) as V3[][];
  if (!(letteringStart > 0) || letteringStart >= tris.length) return null;
  const studTris = tris.length - letteringStart;
  if (studTris % 12 !== 0) return null;

  // Each stud is a 12-triangle axis-aligned box.
  const layers = new Map<string, { near: number; far: number; squares: [number, number][][] }>();
  for (let s = letteringStart; s < tris.length; s += 12) {
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (let t = s; t < s + 12; t++) {
      for (const p of tris[t]) {
        for (let i = 0; i < 3; i++) {
          if (p[i] < lo[i]) lo[i] = p[i];
          if (p[i] > hi[i]) hi[i] = p[i];
        }
      }
    }
    const k = `${lo[1].toFixed(3)}|${hi[1].toFixed(3)}`;
    const layer = layers.get(k) ?? { near: lo[1], far: hi[1], squares: [] };
    layer.squares.push([[lo[0], lo[2]], [hi[0], lo[2]], [hi[0], hi[2]], [lo[0], hi[2]]]);
    layers.set(k, layer);
  }

  const w = await manifold();
  const { Manifold, Mesh, CrossSection } = w;
  const parts = [];
  try {
    for (const shell of shells(tris.slice(0, letteringStart))) {
      parts.push(new Manifold(new Mesh({ numProp: 3, vertProperties: shell.vert, triVerts: shell.tri })));
    }
    if (layers.size <= MAX_FLAT_LAYERS) {
      for (const layer of layers.values()) {
        const section = CrossSection.union(layer.squares.map((sq) => new CrossSection([sq])));
        // Extrude along +Z, then rotate +90° about X: (u, v, e) -> (u, -e, v).
        parts.push(section.extrude(layer.far - layer.near).rotate([90, 0, 0]).translate([0, layer.far, 0]));
      }
    } else {
      for (const layer of layers.values()) {
        for (const sq of layer.squares) {
          parts.push(
            Manifold.cube([sq[1][0] - sq[0][0], layer.far - layer.near, sq[2][1] - sq[1][1]])
              .translate([sq[0][0], layer.near, sq[0][1]]),
          );
        }
      }
    }
    const fused = Manifold.union(parts);
    if (fused.status() !== "NoError" || fused.isEmpty()) return null;
    const mesh = fused.getMesh();
    return writeBinary(stl, mesh.vertProperties, mesh.numProp, mesh.triVerts);
  } catch (e) {
    console.warn("fuseLettering failed", e instanceof Error ? e.message : String(e));
    return null;
  }
}
