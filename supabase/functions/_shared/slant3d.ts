/**
 * US print-partner API client (v2). Internal only — never surface the partner's
 * name in any user-facing string. Auth is `Authorization: Bearer <key>`, USD prices.
 *
 * v2 flow: upload STL via presigned URL -> confirm -> estimate / draft order -> process.
 */
const BASE_URL = "https://slant3dapi.com/v2/api";

/** Nyzora's manufacturing margin on top of the partner's landed print cost. */
export const US_PARTNER_MARKUP = 2.0;

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

/** Partner-issued platform UUID. Required by every v2 file/order call. */
function platformId(): string {
  const id = Deno.env.get("SLANT3D_PLATFORM_ID");
  if (!id) throw new PartnerApiError("US manufacturing partner platform is not configured", 503);
  return id;
}

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Authorization": `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* partner occasionally answers text/plain */
  }

  if (!res.ok) {
    const record = (typeof body === "object" && body ? body : {}) as Record<string, unknown>;
    const detail = String(record.message ?? record.error ?? text).slice(0, 400);
    throw new PartnerApiError(
      `US manufacturing partner request failed (${res.status}): ${detail}`,
      res.status,
    );
  }
  return (body as ApiEnvelope<T>)?.data as T;
}

export interface PartnerAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface PartnerFile {
  publicFileServiceId: string;
  name: string;
  STLMetrics?: {
    x?: number;
    y?: number;
    z?: number;
    weight?: number;
    volume?: number;
    imageURL?: string;
  };
}

/**
 * Uploads a printable file to the partner and returns its file record.
 * The partner only accepts STL; callers must convert first.
 */
export async function uploadPrintFile(
  fileUrl: string,
  opts: { name?: string; ownerId?: string } = {},
): Promise<PartnerFile> {
  const rawName = opts.name ?? fileUrl.split("/").pop()?.split("?")[0] ?? "model.stl";
  const name = rawName.toLowerCase().endsWith(".stl") ? rawName : `${rawName}.stl`;

  const source = await fetch(fileUrl);
  if (!source.ok) {
    throw new PartnerApiError(`Could not download the print file (${source.status})`, 400);
  }
  const bytes = new Uint8Array(await source.arrayBuffer());

  const presign = await request<{
    presignedUrl: string;
    key: string;
    filePlaceholder: Record<string, unknown>;
  }>("/files/direct-upload", {
    method: "POST",
    body: JSON.stringify({ name, platformId: platformId(), ownerId: opts.ownerId ?? "nyzora" }),
  });

  const put = await fetch(presign.presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body: bytes,
  });
  if (!put.ok) {
    throw new PartnerApiError(`Print file upload failed (${put.status})`, 502);
  }

  return await request<PartnerFile>("/files/confirm-upload", {
    method: "POST",
    body: JSON.stringify({ filePlaceholder: presign.filePlaceholder }),
  });
}

/** Unit print price in USD for an already-uploaded partner file. */
export async function estimateFilePrice(
  publicFileServiceId: string,
  filamentId?: string,
): Promise<number> {
  const data = await request<{ total?: number; pricePerUnit?: number }>(
    `/files/${encodeURIComponent(publicFileServiceId)}/estimate`,
    {
      method: "POST",
      body: JSON.stringify({ options: filamentId ? { filamentId } : {} }),
    },
  );
  const price = data?.pricePerUnit ?? data?.total;
  if (typeof price !== "number") {
    throw new PartnerApiError("The US manufacturing partner could not price this file");
  }
  return price;
}

/** Slices a printable file URL and returns the unit print price in USD. */
export async function sliceModel(fileURL: string): Promise<number> {
  const file = await uploadPrintFile(fileURL);
  return await estimateFilePrice(file.publicFileServiceId);
}

export interface PartnerPrintItem {
  publicFileServiceId: string;
  quantity: number;
  filamentId?: string;
}

export interface PartnerDraftOrder {
  publicId: string;
  status: string;
  printingCost: number;
  deliveryCost: number;
  total: number;
  raw: unknown;
}

function toNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Creates a DRAFT order (no charge) so we can read print + shipping cost. */
export async function draftOrder(
  customer: { email: string; address: PartnerAddress },
  items: PartnerPrintItem[],
  ownerId?: string,
): Promise<PartnerDraftOrder> {
  const data = await request<Record<string, unknown>>("/orders", {
    method: "POST",
    body: JSON.stringify({
      platformId: platformId(),
      ownerId: ownerId ?? "nyzora",
      customer: { details: { email: customer.email, address: customer.address } },
      items: items.map((i) => ({
        type: "PRINT",
        quantity: i.quantity,
        publicFileServiceId: i.publicFileServiceId,
        ...(i.filamentId ? { filamentId: i.filamentId } : {}),
      })),
    }),
  });

  const order = (data?.order ?? data) as Record<string, unknown>;
  const printingCost = toNumber(order?.printingCost);
  const deliveryCost = toNumber(order?.deliveryCost);
  const publicId = String(order?.publicId ?? "");
  if (!publicId) throw new PartnerApiError("The US manufacturing partner did not return an order id");

  return {
    publicId,
    status: String(order?.status ?? "DRAFT"),
    printingCost,
    deliveryCost,
    total: Math.round((printingCost + deliveryCost) * 100) / 100,
    raw: data,
  };
}

/** Moves a draft order into production (charges the partner account). */
export async function processOrder(publicOrderId: string): Promise<unknown> {
  return await request<unknown>(`/orders/${encodeURIComponent(publicOrderId)}`, { method: "POST" });
}

/** Drafts and immediately processes a print order. Returns the partner order id. */
export async function placeOrder(
  customer: { email: string; address: PartnerAddress },
  items: PartnerPrintItem[],
  ownerId?: string,
): Promise<{ orderId: string; draft: PartnerDraftOrder; raw: unknown }> {
  const draft = await draftOrder(customer, items, ownerId);
  const raw = await processOrder(draft.publicId);
  return { orderId: draft.publicId, draft, raw };
}

export async function getTracking(
  orderId: string,
): Promise<{ status: string; trackingNumbers: unknown[] }> {
  const data = await request<Record<string, unknown>>(
    `/orders/${encodeURIComponent(orderId)}`,
  );
  const order = ((data?.order ?? data) ?? {}) as Record<string, unknown>;
  const fulfillment = (order?.fulfillment ?? {}) as Record<string, unknown>;

  const raw = fulfillment.trackingNumbers ?? fulfillment.tracking_numbers ??
    fulfillment.trackingNumber ?? fulfillment.tracking ?? null;
  const trackingNumbers = Array.isArray(raw) ? raw : raw ? [raw] : [];

  // Map partner statuses onto the ones our fulfillment table already uses.
  const partnerStatus = String(order?.status ?? "unknown").toUpperCase();
  const statusMap: Record<string, string> = {
    DRAFT: "pending",
    PROCESSING: "awaiting_shipment",
    SHIPPED: "shipped",
    DELIVERED: "delivered",
    CANCELED: "cancelled",
  };

  return { status: statusMap[partnerStatus] ?? partnerStatus.toLowerCase(), trackingNumbers };
}

export async function cancelOrder(orderId: string): Promise<void> {
  await request(`/orders/${encodeURIComponent(orderId)}`, { method: "DELETE" });
}

export interface PartnerFilament {
  filament: string;
  hexColor: string;
  colorTag: string;
  profile: string;
  filamentId: string;
}

export async function getFilaments(): Promise<PartnerFilament[]> {
  const data = await request<Array<Record<string, unknown>>>("/filaments");
  return (Array.isArray(data) ? data : [])
    .filter((f) => f?.available !== false && f?.hidden !== true)
    .map((f) => ({
      filament: String(f.name ?? ""),
      hexColor: String(f.hexValue ?? "#2D2D2D"),
      colorTag: String(f.color ?? ""),
      profile: String(f.profile ?? "PLA"),
      filamentId: String(f.publicId ?? ""),
    }))
    .filter((f) => f.filament && f.filamentId);
}

/** Resolves a human filament name (e.g. "PLA BLACK") to the partner's filament UUID. */
export async function resolveFilamentId(name?: string | null): Promise<string | undefined> {
  if (!name) return undefined;
  const wanted = name.trim().toUpperCase();
  const list = await getFilaments().catch(() => [] as PartnerFilament[]);
  const exact = list.find((f) => f.filament.toUpperCase() === wanted);
  if (exact) return exact.filamentId;
  const loose = list.find((f) => f.filament.toUpperCase().includes(wanted));
  return loose?.filamentId;
}

/** Nyzora only prints in the US when the file is a slicer-readable mesh. */
export function isPrintableFileUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(stl|3mf|obj)(\?|$)/i.test(url);
}

/** Manufacturing base price (USD) = partner landed cost + Nyzora's margin. */
export function partnerCostToMbpUsd(partnerCostUsd: number): number {
  return Math.round(partnerCostUsd * US_PARTNER_MARKUP * 100) / 100;
}

/**
 * Representative US destination used to fold an average shipping cost into the
 * MBP at quote time (customers are then shipped free).
 */
const REFERENCE_US_DESTINATION: PartnerAddress = {
  name: "Nyzora Quote",
  line1: "1 N Central Ave",
  city: "Kansas City",
  state: "MO",
  zip: "64105",
  country: "US",
};

/**
 * Landed unit cost in USD (print + shipping) for a single piece, using a
 * reference US destination. Falls back to print-only when the partner cannot
 * estimate shipping.
 */
export async function estimateLandedUnitCost(
  fileUrl: string,
  itemName: string,
  color = "PLA BLACK",
): Promise<{
  landedUsd: number;
  printUsd: number;
  shippingUsd: number;
  estimated: boolean;
  fileId: string;
  filamentId?: string;
  metrics?: PartnerFile["STLMetrics"];
}> {
  const file = await uploadPrintFile(fileUrl, { name: itemName });
  const filamentId = await resolveFilamentId(color);
  const printUsd = await estimateFilePrice(file.publicFileServiceId, filamentId);

  try {
    const draft = await draftOrder(
      { email: "orders@nyzora.ai", address: REFERENCE_US_DESTINATION },
      [{ publicFileServiceId: file.publicFileServiceId, quantity: 1, filamentId }],
    );
    if (draft.total > 0) {
      // Free the draft so it never lingers on the partner dashboard.
      cancelOrder(draft.publicId).catch(() => {});
      const printCost = draft.printingCost > 0 ? draft.printingCost : printUsd;
      return {
        landedUsd: draft.total,
        printUsd: printCost,
        shippingUsd: Math.max(0, Math.round((draft.total - printCost) * 100) / 100),
        estimated: true,
        fileId: file.publicFileServiceId,
        filamentId,
        metrics: file.STLMetrics,
      };
    }
  } catch (_e) {
    /* shipping estimate unavailable — fall back to print-only cost */
  }

  return {
    landedUsd: printUsd,
    printUsd,
    shippingUsd: 0,
    estimated: false,
    fileId: file.publicFileServiceId,
    filamentId,
    metrics: file.STLMetrics,
  };
}
