/**
 * Minimal GLB (binary glTF) -> binary STL converter.
 *
 * The AI 3D generator returns .glb, but the US print partner's slicer only
 * accepts .stl/.3mf/.obj. This walks the glTF scene graph, bakes node
 * transforms into world-space triangles and writes a binary STL.
 *
 * Only POSITION attributes + triangle topology are needed for slicing.
 */

type Mat4 = Float64Array;

const COMPONENT_SIZE: Record<number, number> = {
  5120: 1, // BYTE
  5121: 1, // UNSIGNED_BYTE
  5122: 2, // SHORT
  5123: 2, // UNSIGNED_SHORT
  5125: 4, // UNSIGNED_INT
  5126: 4, // FLOAT
};

const TYPE_COUNT: Record<string, number> = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT4: 16,
};

function identity(): Mat4 {
  const m = new Float64Array(16);
  m[0] = m[5] = m[10] = m[15] = 1;
  return m;
}

function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Float64Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      out[c * 4 + r] = s;
    }
  }
  return out;
}

function fromTRS(t?: number[], r?: number[], s?: number[]): Mat4 {
  const [x, y, z, w] = r ?? [0, 0, 0, 1];
  const [sx, sy, sz] = s ?? [1, 1, 1];
  const [tx, ty, tz] = t ?? [0, 0, 0];
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  const m = new Float64Array(16);
  m[0] = (1 - (yy + zz)) * sx;
  m[1] = (xy + wz) * sx;
  m[2] = (xz - wy) * sx;
  m[4] = (xy - wz) * sy;
  m[5] = (1 - (xx + zz)) * sy;
  m[6] = (yz + wx) * sy;
  m[8] = (xz + wy) * sz;
  m[9] = (yz - wx) * sz;
  m[10] = (1 - (xx + yy)) * sz;
  m[12] = tx;
  m[13] = ty;
  m[14] = tz;
  m[15] = 1;
  return m;
}

function transformPoint(m: Mat4, p: [number, number, number]): [number, number, number] {
  const [x, y, z] = p;
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12],
    m[1] * x + m[5] * y + m[9] * z + m[13],
    m[2] * x + m[6] * y + m[10] * z + m[14],
  ];
}

interface Gltf {
  accessors?: any[];
  bufferViews?: any[];
  buffers?: any[];
  meshes?: any[];
  nodes?: any[];
  scenes?: any[];
  scene?: number;
}

function parseGlb(bytes: Uint8Array): { json: Gltf; bin: Uint8Array } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== 0x46546c67) throw new Error("Not a GLB file");
  let offset = 12;
  let json: Gltf | null = null;
  let bin = new Uint8Array(0);
  while (offset < bytes.byteLength) {
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    const chunk = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(chunk));
    else if (type === 0x004e4942) bin = chunk;
    offset += 8 + length + ((4 - (length % 4)) % 4 === 4 ? 0 : 0);
    offset += (4 - (length % 4)) % 4;
  }
  if (!json) throw new Error("GLB has no JSON chunk");
  return { json, bin };
}

function readAccessor(gltf: Gltf, bin: Uint8Array, index: number): number[][] {
  const accessor = gltf.accessors?.[index];
  if (!accessor) throw new Error("Missing accessor");
  const comps = TYPE_COUNT[accessor.type] ?? 1;
  const compSize = COMPONENT_SIZE[accessor.componentType];
  if (!compSize) throw new Error("Unsupported component type");
  const bv = gltf.bufferViews?.[accessor.bufferView ?? -1];
  const base = (bv?.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const stride = bv?.byteStride ?? comps * compSize;
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  const out: number[][] = [];
  for (let i = 0; i < accessor.count; i++) {
    const row: number[] = [];
    for (let c = 0; c < comps; c++) {
      const o = base + i * stride + c * compSize;
      switch (accessor.componentType) {
        case 5126: row.push(view.getFloat32(o, true)); break;
        case 5125: row.push(view.getUint32(o, true)); break;
        case 5123: row.push(view.getUint16(o, true)); break;
        case 5122: row.push(view.getInt16(o, true)); break;
        case 5121: row.push(view.getUint8(o)); break;
        case 5120: row.push(view.getInt8(o)); break;
      }
    }
    out.push(row);
  }
  return out;
}

export interface StlResult {
  stl: Uint8Array;
  triangleCount: number;
  /** Bounding box in the model's own units. */
  size: { x: number; y: number; z: number };
}

/**
 * Converts GLB bytes to a binary STL. Optionally rescales the mesh so its
 * largest dimension equals `targetMaxMm` (glTF is metres; slicers read mm).
 */
export function glbToStl(bytes: Uint8Array, targetMaxMm?: number): StlResult {
  const { json: gltf, bin } = parseGlb(bytes);
  const triangles: Array<[[number, number, number], [number, number, number], [number, number, number]]> = [];

  const sceneIndex = gltf.scene ?? 0;
  const roots: number[] = gltf.scenes?.[sceneIndex]?.nodes ?? gltf.nodes?.map((_, i) => i) ?? [];

  const visit = (nodeIndex: number, parent: Mat4) => {
    const node = gltf.nodes?.[nodeIndex];
    if (!node) return;
    const local = node.matrix
      ? (Float64Array.from(node.matrix) as Mat4)
      : fromTRS(node.translation, node.rotation, node.scale);
    const world = multiply(parent, local);

    if (typeof node.mesh === "number") {
      for (const prim of gltf.meshes?.[node.mesh]?.primitives ?? []) {
        if (prim.mode !== undefined && prim.mode !== 4) continue; // triangles only
        const posIndex = prim.attributes?.POSITION;
        if (typeof posIndex !== "number") continue;
        const positions = readAccessor(gltf, bin, posIndex);
        const indices = typeof prim.indices === "number"
          ? readAccessor(gltf, bin, prim.indices).map((r) => r[0])
          : positions.map((_, i) => i);
        for (let i = 0; i + 2 < indices.length; i += 3) {
          const tri = [indices[i], indices[i + 1], indices[i + 2]].map((idx) => {
            const p = positions[idx] ?? [0, 0, 0];
            return transformPoint(world, [p[0], p[1], p[2]]);
          }) as [[number, number, number], [number, number, number], [number, number, number]];
          triangles.push(tri);
        }
      }
    }
    for (const child of node.children ?? []) visit(child, world);
  };

  for (const root of roots) visit(root, identity());
  if (triangles.length === 0) throw new Error("No triangle geometry found in the model");

  // Bounding box
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const tri of triangles) {
    for (const [x, y, z] of tri) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
  }
  const rawSize = { x: maxX - minX, y: maxY - minY, z: maxZ - minZ };
  const largest = Math.max(rawSize.x, rawSize.y, rawSize.z) || 1;
  const scale = targetMaxMm && targetMaxMm > 0 ? targetMaxMm / largest : 1;

  // Sit the model on Z=0 and centre it in X/Y, which is what slicers expect.
  const offset: [number, number, number] = [
    -(minX + maxX) / 2,
    -(minY + maxY) / 2,
    -minZ,
  ];

  const count = triangles.length;
  const buffer = new ArrayBuffer(84 + count * 50);
  const view = new DataView(buffer);
  const header = new TextEncoder().encode("Nyzora print file");
  new Uint8Array(buffer, 0, 80).set(header.subarray(0, 80));
  view.setUint32(80, count, true);

  let p = 84;
  for (const tri of triangles) {
    const [a, b, c] = tri.map(([x, y, z]) => [
      (x + offset[0]) * scale,
      (y + offset[1]) * scale,
      (z + offset[2]) * scale,
    ]) as [number[], number[], number[]];
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

  return {
    stl: new Uint8Array(buffer),
    triangleCount: count,
    size: {
      x: rawSize.x * scale,
      y: rawSize.y * scale,
      z: rawSize.z * scale,
    },
  };
}
