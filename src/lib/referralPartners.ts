import type { Database, Json } from "../integrations/supabase/types";

export type Partner = Database["public"]["Tables"]["referral_partners"]["Row"];
export type Commission = Database["public"]["Tables"]["referral_commissions"]["Row"];
export type PartnerPayment = Database["public"]["Tables"]["referral_partner_payments"]["Row"];
export type PartnerCode = Database["public"]["Tables"]["referral_partner_codes"]["Row"] & { code: string; active: boolean; percent_off: number | null };
export type PartnerGift = Database["public"]["Tables"]["referral_partner_gifts"]["Row"];
export type GiftContact = Pick<Database["public"]["Tables"]["outreach_contacts"]["Row"], "id" | "email" | "contact_name" | "org_name" | "category_slug" | "status" | "outcome" | "reply_snippet" | "replied_at" | "gmail_thread_id">;
export type PartnerOrder = Pick<Database["public"]["Tables"]["originals_orders"]["Row"],
  "id" | "group_id" | "preview_id" | "customer_email" | "shipping_address" | "personalization" | "amount_usd" | "quantity" | "size_key" | "size_label" | "status" | "production_status" | "preview_image_url" | "print_file_url" | "partner_order_id" | "promo_code" | "created_at" | "delivered_at" | "engraved_text" | "tracking_numbers" | "payment_provider">;

export function jsonObject(value: Json | null | undefined): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
export function text(value: Json | undefined): string { return typeof value === "string" ? value : ""; }
export function addressLabel(value: Json | null): string {
  const root = jsonObject(value), a = jsonObject(root.address ?? value);
  return [text(a.line1), text(a.line2), [text(a.city), text(a.state), text(a.postal_code)].filter(Boolean).join(" "), text(a.country)].filter(Boolean).join(", ");
}
export function partnerRate(size: string): number { return size === "statement" ? 0.30 : 0.20; }
export function commissionEstimate(amount: number, size: string): number { return Math.round((amount * partnerRate(size) + Number.EPSILON) * 100) / 100; }
export function monthEnd(month: string): string {
  const [year, n] = month.split("-").map(Number);
  return new Date(Date.UTC(year, n, 1)).toISOString();
}
export function completedMonth(month: string, now = new Date()): boolean { return monthEnd(month) <= now.toISOString(); }
export function partnerTotals(commissions: Commission[], payments: PartnerPayment[], month: string, now = new Date()) {
  const end = Date.parse(monthEnd(month)), start = Date.parse(`${month}-01T00:00:00.000Z`);
  const sum = (rows: Commission[]) => rows.reduce((n, c) => n + Number(c.earned_usd), 0);
  const delivered = commissions.filter(c => c.state === "delivered" && c.eligible_at);
  const throughMonth = sum(delivered.filter(c => Date.parse(String(c.eligible_at)) < end));
  const paid = payments.reduce((n, p) => n + Number(p.amount_usd), 0);
  const rawBalance = Math.round((throughMonth - paid) * 100) / 100;
  return {
    earned: sum(commissions.filter(c => c.state !== "void")),
    held: sum(commissions.filter(c => c.state === "pending_delivery")),
    monthEarned: sum(delivered.filter(c => Date.parse(String(c.eligible_at)) >= start && Date.parse(String(c.eligible_at)) < end)),
    paid, balance: rawBalance, payable: completedMonth(month, now) ? Math.max(0, rawBalance) : 0,
    adjustment: Math.min(0, rawBalance),
  };
}
export function receivedOrderCount(orders: PartnerOrder[]): number {
  return new Set(orders.filter(o => Number(o.amount_usd) > 0 && ["paid", "fulfilled"].includes(o.status) && o.production_status !== "cancelled" && !["test", "internal_test"].includes(o.payment_provider ?? "")).map(o => o.group_id || o.id)).size;
}
export function giftRequestStage(contact: Pick<GiftContact,"outcome">, orders: PartnerOrder[]): string {
  const latest = [...orders].sort((a,b) => b.created_at.localeCompare(a.created_at))[0];
  if(!latest) return contact.outcome === "yes" ? "Needs gift order" : "Review reply";
  if(latest.production_status === "cancelled" || latest.status === "refunded") return "Needs replacement";
  if(latest.production_status === "delivered") return "Delivered";
  if(latest.production_status === "shipped") return "Shipped";
  if(latest.partner_order_id) return "Factory order placed";
  if(latest.production_status === "awaiting_admin_approval") return "Awaiting your approval";
  return "Order saved · not placed at factory";
}
export const usd = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);