/** Nyzora Originals — the in-house design studio profile. */
export const HOUSE_CREATOR_NAME = "Nyzora Originals";
export const HOUSE_CREATOR_SLUG = "nyzora-originals";

/** True when a product's creator is the Nyzora Originals house profile. */
export const isOriginal = (designerName?: string | null) =>
  (designerName || "").trim().toLowerCase() === HOUSE_CREATOR_NAME.toLowerCase();