/**
 * The six colours we sell Originals in. Deliberately curated: the factory
 * stocks dozens of filaments, but a keepsake buyer needs a confident palette,
 * not a paint shop. Every entry is a single PLA-family filament, so the piece
 * prints as one solid colour and the price never moves with the choice.
 *
 * `filament` / `filamentId` are the production references passed straight
 * through to manufacturing, so what is previewed is what gets printed.
 */
export interface OriginalsColor {
  key: string;
  label: string;
  swatch: string;
  /** Wording used in the render prompt. */
  prompt: string;
  /** Production filament name. */
  filament: string;
  /** Production filament id. */
  filamentId: string;
}

export const ORIGINALS_COLORS: OriginalsColor[] = [
  {
    key: "bone",
    label: "Bone White",
    swatch: "#F0EADF",
    prompt: "warm bone white",
    filament: "PLA+ ESUN BONE WHITE",
    filamentId: "ad1dbeb2-7519-4ef7-a4c3-eb6d161493fc",
  },
  {
    key: "charcoal",
    label: "Charcoal",
    swatch: "#232323",
    prompt: "deep matte charcoal black",
    filament: "PLA MATTE BLACK",
    filamentId: "97e187cd-3051-4463-9f0c-59e361afc10e",
  },
  {
    key: "marble",
    label: "Marble",
    swatch: "#B9B4B1",
    prompt: "pale speckled marble grey",
    filament: "PLA MARBLE",
    filamentId: "bb405c27-451b-4783-8c01-81945b4a4ba7",
  },
  {
    key: "slate",
    label: "Slate Grey",
    swatch: "#5F5F66",
    prompt: "cool slate grey",
    filament: "PLA+ ESUN GREY",
    filamentId: "d79e9473-acf1-4db1-ad48-bd4278f1d7a3",
  },
  {
    key: "sand",
    label: "Sand",
    swatch: "#D49459",
    prompt: "soft sand tan",
    filament: "PLA TAN",
    filamentId: "11572791-2e31-45d4-9fce-e27d4405e995",
  },
  {
    key: "blush",
    label: "Blush",
    swatch: "#F5AAA6",
    prompt: "muted blush pink",
    filament: "PLA+ ESUN SOFT PINK",
    filamentId: "0d719fea-3698-4278-b331-ea25309ccfa5",
  },
];

export const DEFAULT_ORIGINALS_COLOR = ORIGINALS_COLORS[0];

export const findOriginalsColor = (key?: string | null): OriginalsColor =>
  ORIGINALS_COLORS.find((c) => c.key === key) ?? DEFAULT_ORIGINALS_COLOR;
