import { glbToStl } from "./glbToStl.ts";

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
}

function isPrintable(url: string): boolean {
  return /\.(stl|3mf|obj)(\?|$)/i.test(url);
}

/**
 * Ensures a slicer-readable mesh exists for a model URL. `.stl/.3mf/.obj`
 * pass through untouched; `.glb` is converted, scaled into the print
 * envelope and stored in the public `3d-models` bucket.
 */
export async function ensurePrintFile(
  admin: any,
  opts: { modelUrl: string; key: string; targetMaxMm?: number },
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
  const { stl, triangleCount, size } = glbToStl(bytes, target);

  const path = `print-files/${key}.stl`;
  const { error } = await admin.storage.from("3d-models").upload(path, stl, {
    contentType: "model/stl",
    upsert: true,
  });
  if (error) throw new Error(`Could not store the print file: ${error.message}`);

  const { data } = admin.storage.from("3d-models").getPublicUrl(path);
  return { url: data.publicUrl, path, triangleCount, size, converted: true };
}
