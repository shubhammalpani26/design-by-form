/**
 * Snaps stray vertices that sit just off the plinth's tapered shoulder back
 * onto its flat faces. Hole-fill / fusion can leave points ~0.3 mm proud of
 * the shoulder, which shows as a horizontal line across the base (Murphy,
 * Amanda, Nov 2026). Only coordinates move (never topology), so a closed file
 * stays closed; header and triangle order are preserved byte-for-byte.
 */
export const SHOULDER_SNAP_MM = 0.6;

export function flattenPlinthShoulder(bytes: Uint8Array): { stl: Uint8Array; moved: number } {
  if (bytes.length < 84) return { stl: bytes, moved: 0 };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const n = view.getUint32(80, true);
  if (84 + n * 50 > bytes.length) return { stl: bytes, moved: 0 };
  const P = (t: number, k: number, a: number) => 84 + t * 50 + 12 + k * 12 + a * 4;
  let zMin = Infinity;
  for (let t = 0; t < n; t++) for (let k = 0; k < 3; k++) zMin = Math.min(zMin, view.getFloat32(P(t, k, 2), true));
  // Bottom outline.
  let bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
  for (let t = 0; t < n; t++) for (let k = 0; k < 3; k++) {
    if (Math.abs(view.getFloat32(P(t, k, 2), true) - zMin) > 0.01) continue;
    const x = view.getFloat32(P(t, k, 0), true), y = view.getFloat32(P(t, k, 1), true);
    bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y);
  }
  if (!isFinite(bx0)) return { stl: bytes, moved: 0 };
  // Block top: highest vertex on the bottom outline's corner.
  let zBlock = zMin;
  for (let t = 0; t < n; t++) for (let k = 0; k < 3; k++) {
    const x = view.getFloat32(P(t, k, 0), true), y = view.getFloat32(P(t, k, 1), true);
    if (Math.abs(x - bx1) < 0.01 && Math.abs(y - by1) < 0.01) zBlock = Math.max(zBlock, view.getFloat32(P(t, k, 2), true));
  }
  // Shoulder top: largest upward flat area above the block.
  const areaAt = new Map<number, number>();
  for (let t = 0; t < n; t++) {
    const v = [0, 1, 2].map((k) => [0, 1, 2].map((a) => view.getFloat32(P(t, k, a), true)));
    if (Math.abs(v[0][2] - v[1][2]) > 0.01 || Math.abs(v[0][2] - v[2][2]) > 0.01) continue;
    const cz = (v[1][0] - v[0][0]) * (v[2][1] - v[0][1]) - (v[1][1] - v[0][1]) * (v[2][0] - v[0][0]);
    if (cz <= 0 || v[0][2] <= zBlock + 1) continue;
    const key = Math.round(v[0][2] * 100);
    areaAt.set(key, (areaAt.get(key) ?? 0) + cz / 2);
  }
  let zTop = NaN, best = 0;
  for (const [k, a] of areaAt) if (a > best) { best = a; zTop = k / 100; }
  if (!(zTop - zBlock >= 2 && zTop - zBlock <= 25)) return { stl: bytes, moved: 0 };
  let tx0 = Infinity, tx1 = -Infinity, ty0 = Infinity, ty1 = -Infinity;
  for (let t = 0; t < n; t++) for (let k = 0; k < 3; k++) {
    if (Math.abs(view.getFloat32(P(t, k, 2), true) - zTop) > 0.01) continue;
    const x = view.getFloat32(P(t, k, 0), true), y = view.getFloat32(P(t, k, 1), true);
    tx0 = Math.min(tx0, x); tx1 = Math.max(tx1, x); ty0 = Math.min(ty0, y); ty1 = Math.max(ty1, y);
  }
  if (!(tx0 > bx0 + 0.2 && tx1 < bx1 - 0.2 && ty0 > by0 + 0.2 && ty1 < by1 - 0.2)) return { stl: bytes, moved: 0 };
  const out = bytes.slice();
  const w = new DataView(out.buffer, out.byteOffset, out.byteLength);
  const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
  let moved = 0;
  for (let t = 0; t < n; t++) for (let k = 0; k < 3; k++) {
    const x = w.getFloat32(P(t, k, 0), true), y = w.getFloat32(P(t, k, 1), true), z = w.getFloat32(P(t, k, 2), true);
    if (z <= zBlock + 0.02 || z >= zTop - 0.02) continue;
    const f = (z - zBlock) / (zTop - zBlock);
    const faces: Array<[number, number]> = [ // [axis, target]
      [1, lerp(by0, ty0, f)], [1, lerp(by1, ty1, f)], [0, lerp(bx0, tx0, f)], [0, lerp(bx1, tx1, f)],
    ];
    let bestAxis = -1, bestTarget = 0, bestD = SHOULDER_SNAP_MM;
    for (const [axis, target] of faces) {
      const d = Math.abs((axis === 0 ? x : y) - target);
      if (d < bestD) { bestD = d; bestAxis = axis; bestTarget = target; }
    }
    if (bestAxis < 0 || bestD < 1e-4) continue;
    w.setFloat32(P(t, k, bestAxis), bestTarget, true);
    moved++;
  }
  return { stl: moved ? out : bytes, moved };
}
