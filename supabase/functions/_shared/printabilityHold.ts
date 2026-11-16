/**
 * Decides whether an order is held for review before it goes to the partner.
 *
 * The generator's printability report describes the *raw* 3D model, before we
 * repair it and fuse the lettering. Once the finished print file is proven
 * closed (zero open edges, fingerprinted), that old report no longer describes
 * what ships and must not hold the order. An unscreened customer photo always
 * holds, whatever the file looks like.
 */
export const HOLD_HOLES = 5;
export const HOLD_NON_MANIFOLD_EDGES = 200;

/** True when the finished, lettered print file was checked and is fully closed. */
export function finalFileClosed(meta: Record<string, unknown> | null | undefined): boolean {
  if (!meta) return false;
  return meta.openEdges === 0 && typeof meta.fileSha256 === "string" && meta.fileSha256.length > 0;
}

export interface HoldPreview {
  photo_screen?: string | null;
  engineering?: Record<string, unknown> | null;
}

/** Reasons to hold one preview's pieces; `filesClosed` = every piece's final file is closed. */
export function previewHoldReasons(preview: HoldPreview, filesClosed: boolean): string[] {
  const reasons: string[] = [];
  if (preview.photo_screen === "unscreened") {
    reasons.push("customer photo was not screened (pet / explicit check was unavailable)");
  }
  if (filesClosed) return reasons;
  const report = (preview.engineering ?? {}).printability as Record<string, unknown> | undefined;
  if (!report) return reasons;
  const holes = Number(report.holes);
  const edges = Number(report.nonManifoldEdges);
  if (Number.isFinite(holes) && holes > HOLD_HOLES) reasons.push(`${holes} holes`);
  if (Number.isFinite(edges) && edges > HOLD_NON_MANIFOLD_EDGES) reasons.push(`${edges} non-manifold edges`);
  return reasons;
}
