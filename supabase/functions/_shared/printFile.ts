import { glbToStl } from "./glbToStl.ts";
import { HEFT_SIZE_RESERVE_MM, reinforceKeepsakeStl } from "./engraveStl.ts";

/**
 * Default longest-edge size (mm) used when a design has no verified
 * dimensions yet. Keeps generated meshes inside the US print envelope.
 */
export const DEFAULT_PRINT_MAX_MM = 180;
/** Hard build-envelope limit of the US print route. */
export const US_MAX_MM = 220;

export interface PreparedPrintFile {
  url: string;
  path: string;
  triangleCount: number;
  size: { x: number; y: number; z: number };
  converted: boolean;
  /** Binary STL bytes when we generated the file (used for the geometry gate). */
  stl?: Uint8Array;
  heftBaseApplied?: boolean;
  heftBaseHeightMm?: number;
  heftVolumeAddedCm3?: number;
}

function isPrintable(url: string): boolean {
  return /\.(stl|3mf|obj)(\?|$)/i.test(url);
}

/** Stores binary STL bytes in the public `3d-models` bucket and returns its URL. */
export async function uploadStl(
  admin: any,
  key: string,
  stl: Uint8Array,
): Promise<{ url: string; path: string }> {
  const path = `print-files/${key}.stl`;
  const { error } = await admin.storage.from("3d-models").upload(path, stl, {
    contentType: "model/stl",
    upsert: true,
  });
  if (error) throw new Error(`Could not store the print file: ${error.message}`);
  const { data } = admin.storage.from("3d-models").getPublicUrl(path);
  return { url: data.publicUrl, path };
}


/**
 * Ensures a slicer-readable mesh exists for a model URL. `.stl/.3mf/.obj`
 * pass through untouched; `.glb` is converted, scaled into the print
 * envelope and stored in the public `3d-models` bucket.
 */
export async function ensurePrintFile(
  admin: any,
  opts: { modelUrl: string; key: string; targetMaxMm?: number; reinforceBase?: boolean },
): Promise<PreparedPrintFile> {
  const { modelUrl, key } = opts;
  if (isPrintable(modelUrl)) {
    return {
      url: modelUrl,
      path: modelUrl,
      triangleCount: 0,
      size: { x: 0, y: 0, z: 0 },
      converted: false,
    };
  }
  if (!/\.glb(\?|$)/i.test(modelUrl)) {
    throw new Error("Only .glb models can be converted to a print file");
  }

  const res = await fetch(modelUrl);
  if (!res.ok) throw new Error(`Could not download the 3D model (${res.status})`);
  const bytes = new Uint8Array(await res.arrayBuffer());

  const target = Math.min(opts.targetMaxMm || DEFAULT_PRINT_MAX_MM, US_MAX_MM);
  const conversionTarget = opts.reinforceBase
    ? Math.max(1, target - HEFT_SIZE_RESERVE_MM)
    : target;
  const converted = glbToStl(bytes, conversionTarget);
  const reinforced = opts.reinforceBase ? reinforceKeepsakeStl(converted.stl, target) : null;
  let stl = reinforced?.stl ?? converted.stl;
  let size = reinforced?.size ?? converted.size;
  // The conversion deliberately reserved headroom for the enlarged plinth, and
  // reinforcement may add less than that (or be skipped entirely). Always bring
  // the finished file back to the sold size before quoting or printing.
  if (opts.reinforceBase) {
    const fitted = fitStlToLongestEdge(stl, target);
    if (fitted.scale !== 1) {
      stl = fitted.stl;
      size = fitted.size;
    }
  }
  const triangleCount = new DataView(stl.buffer, stl.byteOffset, stl.byteLength).getUint32(80, true);

  const path = `print-files/${key}.stl`;
  const { error } = await admin.storage.from("3d-models").upload(path, stl, {
    contentType: "model/stl",
    upsert: true,
  });
  if (error) throw new Error(`Could not store the print file: ${error.message}`);

  const { data } = admin.storage.from("3d-models").getPublicUrl(path);
  return {
    url: data.publicUrl,
    path,
    triangleCount,
    size,
    converted: true,
    stl,
    heftBaseApplied: reinforced?.applied ?? false,
    heftBaseHeightMm: reinforced?.baseHeightMm,
    heftVolumeAddedCm3: reinforced?.volumeAddedCm3,
  };
}
