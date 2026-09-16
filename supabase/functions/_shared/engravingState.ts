export interface EngravingState {
  print_file_url: string | null;
  engraved_text: string | null;
  engraving_meta?: Record<string, unknown> | null;
}

/**
 * An order-level print URL may already contain raised lettering. It is safe to
 * reuse only when it is unlettered, or when the current verified lettering is
 * exactly what the buyer requested. All other cases must restart from the
 * preserved source mesh.
 */
export function reusableOrderPrintFile(row: EngravingState, expectedLabel: string): string | null {
  if (!row.print_file_url) return null;
  const meta = row.engraving_meta;
  // Reinforced-base v1 is part of the production specification. Older source
  // and engraved files must be rebuilt instead of bypassing the heavier base.
  if (!row.engraved_text) return row.print_file_url;

  const verifiedCurrent =
    row.engraved_text === expectedLabel &&
    meta?.placementVersion === 4 &&
    meta?.heftVersion === 7 &&
    meta?.placementVerified === true;

  return verifiedCurrent ? row.print_file_url : null;
}

export function preservedSourcePrintFile(row: EngravingState): string | null {
  const source = row.engraving_meta?.sourcePrintFileUrl;
  return typeof source === "string" && source.length > 0 && source !== row.print_file_url
    ? source
    : null;
}