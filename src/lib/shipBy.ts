/**
 * The ship-by promise: 8 business days from today, skipping weekends.
 * Customers get one certain date — no delivery window (owner decision 2026-11-22).
 */
export function shipByDate(from: Date = new Date(), businessDays = 8): Date {
  const d = new Date(from);
  let added = 0;
  while (added < businessDays) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return d;
}

/** "Thu, Dec 4" */
export function formatShipBy(d: Date = shipByDate()): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
