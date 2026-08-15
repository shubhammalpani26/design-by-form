/**
 * Production colour map for Nyzora Originals. Mirrors src/lib/originalsColors.ts —
 * keep the two in step. Colour keys are stored on the order's personalization
 * and resolved here to the manufacturing filament at fulfilment time.
 */
export interface OriginalsColor {
  key: string;
  label: string;
  filament: string;
  filamentId: string;
}

export const ORIGINALS_COLORS: OriginalsColor[] = [
  { key: "bone", label: "Bone White", filament: "PLA+ ESUN BONE WHITE", filamentId: "ad1dbeb2-7519-4ef7-a4c3-eb6d161493fc" },
  { key: "charcoal", label: "Charcoal", filament: "PLA MATTE BLACK", filamentId: "97e187cd-3051-4463-9f0c-59e361afc10e" },
  { key: "marble", label: "Marble", filament: "PLA MARBLE", filamentId: "bb405c27-451b-4783-8c01-81945b4a4ba7" },
  { key: "slate", label: "Slate Grey", filament: "PLA+ ESUN GREY", filamentId: "d79e9473-acf1-4db1-ad48-bd4278f1d7a3" },
  { key: "sand", label: "Sand", filament: "PLA TAN", filamentId: "11572791-2e31-45d4-9fce-e27d4405e995" },
  { key: "blush", label: "Blush", filament: "PLA+ ESUN SOFT PINK", filamentId: "0d719fea-3698-4278-b331-ea25309ccfa5" },
];

export const DEFAULT_ORIGINALS_COLOR = ORIGINALS_COLORS[0];

export function findOriginalsColor(key?: string | null): OriginalsColor {
  return ORIGINALS_COLORS.find((c) => c.key === key) ?? DEFAULT_ORIGINALS_COLOR;
}
