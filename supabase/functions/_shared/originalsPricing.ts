/**
 * Pricing for Nyzora Originals.
 *
 * Retail is never taken from the client. Whenever we can, we price a piece by
 * actually slicing its production file with the US manufacturing partner —
 * that both proves the piece is printable and gives us the true landed cost.
 * If that call fails for any reason we fall back to the agreed list price so a
 * buyer is never blocked by a partner outage.
 */
import {
  estimateLandedUnitCost,
  partnerCostToMbpUsd,
} from "./slant3d.ts";

export interface SizeEntry {
  label: string;
  usd: number;
}

/** Agreed retail list, inclusive of free US shipping. Also the safety net. */
export const PRICE_BOOK: Record<string, Record<string, SizeEntry>> = {
  "pet-silhouette-keepsake": {
    petite: { label: "Petite — 120 mm tall", usd: 59 },
    standard: { label: "Standard — 140 mm tall", usd: 89 },
    statement: { label: "Statement — 196 mm tall", usd: 139 },
  },
  "pet-portrait-sculpture": {
    petite: { label: "Petite — 120 mm tall", usd: 59 },
    standard: { label: "Standard — 140 mm tall", usd: 89 },
    statement: { label: "Statement — 196 mm tall", usd: 139 },
  },
  "nursery-name-date": {
    standard: { label: "Standard — 155 mm wide", usd: 60 },
  },
  "wedding-coordinates": {
    standard: { label: "Standard — 155 mm wide", usd: 85 },
  },
};

export const SKU_NAMES: Record<string, string> = {
  "pet-silhouette-keepsake": "Custom Pet Memorial Sculpture",
  "pet-portrait-sculpture": "Custom Pet Portrait Sculpture",
  "nursery-name-date": "Baby Name & Date Piece",
  "wedding-coordinates": "Wedding Coordinates Piece",
};

/**
 * SKUs whose piece is sculpted from the buyer's own photo. For these, the SKU
 * master STL is a pricing reference only — it must never be manufactured, or
 * the buyer receives a generic bust with no engraving.
 */
export const PHOTO_PERSONALIZED_SKUS = new Set([
  "pet-silhouette-keepsake",
  "pet-portrait-sculpture",
]);

/** True when this URL is a SKU master reference model rather than a buyer's own piece. */
export async function isMasterPrintFile(admin: any, url: string): Promise<boolean> {
  const { data } = await admin
    .from("originals_print_models")
    .select("id")
    .eq("stl_url", url)
    .maybeSingle();
  return Boolean(data);
}

/**
 * Minimum retail multiple over the landed manufacturing cost. Covers the
 * manufacturing margin plus ad spend, packaging and payment fees.
 */
export const RETAIL_MULTIPLE = 3.5;

/** Quotes are stable for a day — the partner's slicer output does not move. */
const CACHE_MS = 24 * 60 * 60 * 1000;

const roundUpTo5 = (n: number) => Math.ceil(n / 5) * 5;

export interface QuoteInput {
  skuSlug: string;
  sizeKey: string;
  previewId?: string | null;
}

export interface QuoteResult {
  skuSlug: string;
  sizeKey: string;
  sizeLabel: string;
  /** Retail price per unit, USD. */
  unitUsd: number;
  listUsd: number;
  /** "live" = priced from a real partner slice, "list" = agreed fallback. */
  source: "live" | "list" | "cache";
  feasible: boolean;
  partnerCostUsd: number | null;
  printFileUrl: string | null;
  /** Internal only — never surface to the buyer. */
  reason?: string;
}

/** Production file for this line: the buyer's own model first, else the SKU master. */
async function resolvePrintFile(
  admin: any,
  input: QuoteInput,
): Promise<{ url: string | null; filament: string | null }> {
  if (input.previewId) {
    const { data } = await admin
      .from("originals_previews")
      .select("print_file_url, print_files, sku_slug")
      .eq("id", input.previewId)
      .maybeSingle();
    if (data && data.sku_slug === input.skuSlug) {
      // Per-size file built at preview time is the most accurate thing to slice.
      const perSize = (data.print_files ?? {}) as Record<string, string>;
      const sized = perSize[input.sizeKey];
      if (sized) return { url: sized, filament: null };
      if (data.print_file_url) return { url: data.print_file_url as string, filament: null };
    }
  }

  const { data: master } = await admin
    .from("originals_print_models")
    .select("stl_url, filament")
    .eq("sku_slug", input.skuSlug)
    .eq("size_key", input.sizeKey)
    .eq("active", true)
    .maybeSingle();

  return { url: (master?.stl_url as string) ?? null, filament: (master?.filament as string) ?? null };
}

/**
 * Prices a single line. Always returns a usable price — falls back to the
 * agreed list price when the partner cannot be reached.
 */
export async function quoteLine(admin: any, input: QuoteInput): Promise<QuoteResult> {
  const size = PRICE_BOOK[input.skuSlug]?.[input.sizeKey];
  if (!size) throw new Error("unknown_sku_size");

  const base: QuoteResult = {
    skuSlug: input.skuSlug,
    sizeKey: input.sizeKey,
    sizeLabel: size.label,
    unitUsd: size.usd,
    listUsd: size.usd,
    source: "list",
    feasible: true,
    partnerCostUsd: null,
    printFileUrl: null,
  };

  let file: { url: string | null; filament: string | null };
  try {
    file = await resolvePrintFile(admin, input);
  } catch (_e) {
    return { ...base, reason: "print_file_lookup_failed" };
  }
  if (!file.url) return { ...base, reason: "no_production_file" };
  base.printFileUrl = file.url;

  // Fresh cached slice for this exact file?
  try {
    const since = new Date(Date.now() - CACHE_MS).toISOString();
    const { data: cached } = await admin
      .from("originals_quotes")
      .select("landed_usd, retail_usd, feasible, error")
      .eq("print_file_url", file.url)
      .eq("size_key", input.sizeKey)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cached && cached.feasible && Number(cached.retail_usd) > 0) {
      return {
        ...base,
        unitUsd: Number(cached.retail_usd),
        source: "cache",
        partnerCostUsd: Number(cached.landed_usd),
        feasible: true,
      };
    }
  } catch (_e) {
    /* cache is best-effort */
  }

  try {
    const landed = await estimateLandedUnitCost(
      file.url,
      `${SKU_NAMES[input.skuSlug] ?? "Nyzora Original"} ${input.sizeKey}`,
      file.filament ?? "PLA BLACK",
    );
    const mbpUsd = partnerCostToMbpUsd(landed.landedUsd);
    const retail = Math.max(size.usd, roundUpTo5(landed.landedUsd * RETAIL_MULTIPLE));

    await admin.from("originals_quotes").insert({
      sku_slug: input.skuSlug,
      size_key: input.sizeKey,
      print_file_url: file.url,
      print_usd: landed.printUsd,
      shipping_usd: landed.shippingUsd,
      landed_usd: landed.landedUsd,
      mbp_usd: mbpUsd,
      retail_usd: retail,
      feasible: true,
      source: "live",
    });

    return {
      ...base,
      unitUsd: retail,
      source: "live",
      feasible: true,
      partnerCostUsd: landed.landedUsd,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("originals live quote failed", input.skuSlug, input.sizeKey, message);
    await admin
      .from("originals_quotes")
      .insert({
        sku_slug: input.skuSlug,
        size_key: input.sizeKey,
        print_file_url: file.url,
        retail_usd: size.usd,
        feasible: false,
        source: "list",
        error: message.slice(0, 500),
      })
      .then(() => {}, () => {});
    // Partner outage must never block a sale — hold the agreed retail price.
    return { ...base, reason: "partner_unavailable" };
  }
}
