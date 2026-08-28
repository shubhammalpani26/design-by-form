/**
 * Real carrier delivery confirmation. We never guess delivery from transit
 * time — a "your order was delivered" email that arrives before the box does
 * reads as fraud. Only a carrier-reported Delivered event closes an order.
 *
 * USPS (the partner ships from Boise — almost always USPS) exposes the free
 * Web Tools Track/Confirm API. It needs a USPS USERID stored as the
 * USPS_TRACKING_USER_ID secret. Without it, or for non-USPS carriers, this
 * returns null and the order simply stays "shipped" until an admin marks it.
 */

export type CarrierDeliveryResult = {
  delivered: boolean;
  deliveredAt: string | null;
  statusText: string | null;
} | null;

const USPS_ENDPOINT = "https://secure.shippingapis.com/ShippingAPI.dll";

const escapeXml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] as string,
  );

/** USPS Track/Confirm: returns delivery status for one tracking number. */
async function checkUsps(trackingNumber: string): Promise<CarrierDeliveryResult> {
  const userId = Deno.env.get("USPS_TRACKING_USER_ID");
  if (!userId) return null;

  const xml =
    `<TrackFieldRequest USERID="${escapeXml(userId)}">` +
    `<Revision>1</Revision><ClientIp>127.0.0.1</ClientIp>` +
    `<SourceId>Nyzora</SourceId>` +
    `<TrackID ID="${escapeXml(trackingNumber)}"/></TrackFieldRequest>`;

  const url = `${USPS_ENDPOINT}?API=TrackV2&XML=${encodeURIComponent(xml)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const body = await res.text();
  if (/<Error>/i.test(body)) return null;

  const summary =
    body.match(/<TrackSummary>([\s\S]*?)<\/TrackSummary>/i)?.[1] ?? "";
  const event =
    body.match(/<Event>([\s\S]*?)<\/Event>/i)?.[1] ?? "";
  const eventDate = body.match(/<EventDate>([\s\S]*?)<\/EventDate>/i)?.[1] ?? "";
  const statusText = (summary || event).replace(/<[^>]+>/g, "").trim() || null;

  const delivered = /\bdelivered\b/i.test(statusText ?? "") || /\bdelivered\b/i.test(event);
  if (!delivered) {
    return { delivered: false, deliveredAt: null, statusText };
  }

  // USPS gives "August 28, 2026 at 2:14 pm" — parse loosely, fall back to now.
  let deliveredAt: string | null = null;
  const parsed = Date.parse(eventDate);
  deliveredAt = Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();

  return { delivered: true, deliveredAt, statusText };
}

/**
 * Confirms delivery with the carrier for a tracking number. Returns null when
 * no carrier integration can answer (unsupported carrier / missing key) —
 * callers must treat null as "unknown", never as delivered.
 */
export async function confirmCarrierDelivery(
  carrierName: string | null,
  trackingNumber: string,
): Promise<CarrierDeliveryResult> {
  const name = (carrierName ?? "").toLowerCase();
  // USPS numbers are also our default when the carrier is unknown.
  if (!name || name.includes("usps") || name.includes("postal")) {
    return checkUsps(trackingNumber);
  }
  // UPS/FedEx tracking APIs need paid keys — no silent guessing.
  return null;
}
