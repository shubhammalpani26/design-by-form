/**
 * Slant 3D API v1 client (https://www.slant3dapi.com).
 * Auth is a plain `api-key` header. All prices are USD.
 */
const BASE_URL = "https://www.slant3dapi.com/api";

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

export class Slant3DError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

function apiKey(): string {
  const key = Deno.env.get("SLANT3D_API_KEY");
  if (!key) throw new Slant3DError("SLANT3D_API_KEY is not configured", 503);
  return key;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "api-key": apiKey(),
      "Content-Type": "application/json",
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
    throw new Slant3DError(`Slant 3D ${path} failed (${res.status}): ${detail}`, res.status);
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
    throw new Slant3DError("Slant 3D did not return a price for this file");
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
    throw new Slant3DError("Slant 3D did not return an estimate");
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
  if (!id) throw new Slant3DError("Slant 3D did not return an order id");
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