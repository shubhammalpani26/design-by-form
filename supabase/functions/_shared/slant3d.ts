/**
 * US print-partner API client. Internal only — never surface the partner's
 * name in any user-facing string. Auth is a plain `api-key` header, USD prices.
 */
const BASE_URL = "https://www.slant3dapi.com/api";

/** Nyzora's manufacturing margin on top of the partner's landed print cost. */
export const US_PARTNER_MARKUP = 1.25;

export interface Slant3DOrderLine {
  email: string;
  phone: string;
  name: string;
  orderNumber: string;
  filename: string;
  fileURL: string;
  bill_to_street_1: string;
  bill_to_street_2?: string;
  bill_to_city: string;
  bill_to_state: string;
  bill_to_zip: string;
  bill_to_country_as_iso?: string;
  bill_to_is_US_residential?: "true" | "false";
  ship_to_name: string;
  ship_to_street_1: string;
  ship_to_street_2?: string;
  ship_to_city: string;
  ship_to_state: string;
  ship_to_zip: string;
  ship_to_country_as_iso: string;
  ship_to_is_US_residential?: "true" | "false";
  order_item_name: string;
  order_quantity: string;
  order_image_url?: string;
  order_sku?: string;
  order_item_color: string;
  profile?: string;
}

export class PartnerApiError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

/** @deprecated internal alias */
export { PartnerApiError as Slant3DError };

function apiKey(): string {
  const key = Deno.env.get("SLANT3D_API_KEY");
  if (!key) throw new PartnerApiError("US manufacturing partner is not configured", 503);
  return key;
}

/**
 * Partner-issued platform identifier. Attributes every slice/order call to
 * Nyzora on the partner side (volume tiers, support, partner-rate pricing).
 * Optional: calls still work without it, just unattributed.
 */
function platformId(): string | null {
  return Deno.env.get("SLANT3D_PLATFORM_ID") ?? null;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const pid = platformId();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "api-key": apiKey(),
      "Content-Type": "application/json",
      ...(pid ? { "platform-id": pid, "x-platform-id": pid } : {}),
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* Slant occasionally answers text/plain */
  }

  if (!res.ok) {
    const detail =
      typeof body === "object" && body && "error" in (body as Record<string, unknown>)
        ? JSON.stringify((body as Record<string, unknown>).error)
        : String(text).slice(0, 400);
    throw new PartnerApiError(
      `US manufacturing partner request failed (${res.status}): ${detail}`,
      res.status,
    );
  }
  return body as T;
}

/** Slices a printable file and returns the unit print price in USD. */
export async function sliceModel(fileURL: string): Promise<number> {
  const data = await request<{ message?: string; data?: { price?: number } }>("/slicer", {
    method: "POST",
    body: JSON.stringify({ fileURL }),
  });
  const price = data?.data?.price;
  if (typeof price !== "number") {
    throw new PartnerApiError("The US manufacturing partner could not price this file");
  }
  return price;
}

/** Estimated landed cost (print + shipping) for a set of order lines, in USD. */
export async function estimateOrder(lines: Slant3DOrderLine[]): Promise<number> {
  const data = await request<{ totalPrice?: number }>("/order/estimate", {
    method: "POST",
    body: JSON.stringify(lines),
  });
  if (typeof data?.totalPrice !== "number") {
    throw new PartnerApiError("The US manufacturing partner did not return an estimate");
  }
  return data.totalPrice;
}

/** Places a print + ship order. Returns Slant's order id. */
export async function placeOrder(
  lines: Slant3DOrderLine[],
): Promise<{ orderId: string; raw: unknown }> {
  const data = await request<{ orderId?: string | string[] }>("/order", {
    method: "POST",
    body: JSON.stringify(lines),
  });
  const id = Array.isArray(data?.orderId) ? data.orderId[0] : data?.orderId;
  if (!id) throw new PartnerApiError("The US manufacturing partner did not return an order id");
  return { orderId: String(id), raw: data };
}

export async function getTracking(
  orderId: string,
): Promise<{ status: string; trackingNumbers: unknown[] }> {
  const data = await request<{ status?: string; trackingNumbers?: unknown[] }>(
    `/order/${encodeURIComponent(orderId)}/get-tracking`,
  );
  return {
    status: data?.status ?? "unknown",
    trackingNumbers: Array.isArray(data?.trackingNumbers) ? data.trackingNumbers : [],
  };
}

export async function cancelOrder(orderId: string): Promise<void> {
  await request(`/order/${encodeURIComponent(orderId)}`, { method: "DELETE" });
}

export async function getFilaments(): Promise<
  Array<{ filament: string; hexColor: string; colorTag: string; profile: string }>
> {
  const data = await request<{ filaments?: unknown[] }>("/filament");
  return (Array.isArray(data?.filaments) ? data.filaments : []) as Array<{
    filament: string;
    hexColor: string;
    colorTag: string;
    profile: string;
  }>;
}

/** Nyzora only prints in the US when the file is a slicer-readable mesh. */
export function isPrintableFileUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(stl|3mf|obj)(\?|$)/i.test(url);
}

/** Manufacturing base price (USD) = partner landed cost + Nyzora's 25% margin. */
export function partnerCostToMbpUsd(partnerCostUsd: number): number {
  return Math.round(partnerCostUsd * US_PARTNER_MARKUP * 100) / 100;
}

/**
 * Representative US destination used to fold an average shipping cost into the
 * MBP at quote time (customers are then shipped free). Mid-country residential
 * address keeps the estimate close to the national average.
 */
const REFERENCE_US_DESTINATION = {
  street1: "1 N Central Ave",
  city: "Kansas City",
  state: "MO",
  zip: "64105",
};

/**
 * Landed unit cost in USD (print + shipping) for a single piece, using a
 * reference US destination. Falls back to the slicer-only price when the
 * partner cannot estimate shipping.
 */
export async function estimateLandedUnitCost(
  fileUrl: string,
  itemName: string,
  color = "PLA BLACK",
): Promise<{ landedUsd: number; printUsd: number; shippingUsd: number; estimated: boolean }> {
  const printUsd = await sliceModel(fileUrl);

  const line: Slant3DOrderLine = {
    email: "orders@nyzora.ai",
    phone: "000-000-0000",
    name: "Nyzora Quote",
    orderNumber: `quote-${Date.now()}`,
    filename: fileUrl.split("/").pop() ?? "model.stl",
    fileURL: fileUrl,
    bill_to_street_1: REFERENCE_US_DESTINATION.street1,
    bill_to_city: REFERENCE_US_DESTINATION.city,
    bill_to_state: REFERENCE_US_DESTINATION.state,
    bill_to_zip: REFERENCE_US_DESTINATION.zip,
    bill_to_country_as_iso: "US",
    bill_to_is_US_residential: "true",
    ship_to_name: "Nyzora Quote",
    ship_to_street_1: REFERENCE_US_DESTINATION.street1,
    ship_to_city: REFERENCE_US_DESTINATION.city,
    ship_to_state: REFERENCE_US_DESTINATION.state,
    ship_to_zip: REFERENCE_US_DESTINATION.zip,
    ship_to_country_as_iso: "US",
    ship_to_is_US_residential: "true",
    order_item_name: itemName.slice(0, 120) || "Nyzora piece",
    order_quantity: "1",
    order_item_color: color,
  };

  try {
    const total = await estimateOrder([line]);
    if (Number.isFinite(total) && total > 0) {
      const landedUsd = Math.round(total * 100) / 100;
      const shippingUsd = Math.max(0, Math.round((landedUsd - printUsd) * 100) / 100);
      return { landedUsd, printUsd, shippingUsd, estimated: true };
    }
  } catch (_e) {
    /* shipping estimate unavailable — fall back to print-only cost */
  }
  return { landedUsd: printUsd, printUsd, shippingUsd: 0, estimated: false };
}