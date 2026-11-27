import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { commissionEstimate, completedMonth, partnerTotals, receivedOrderCount } from "../src/lib/referralPartners.ts";
import type { Commission, PartnerPayment, PartnerOrder } from "../src/lib/referralPartners.ts";

const delivered = (patch: Partial<Commission> = {}): Commission => ({ id: "c1", partner_id: "p", order_id: "o", code: "PAWS", rate: .2, basis_usd: 56.05, earned_usd: 11.21, state: "delivered", eligible_at: "2026-10-20T12:00:00.000Z", created_at: "2026-10-10", updated_at: "2026-10-20", ...patch });
const payment: PartnerPayment = { id: "pay", partner_id: "p", amount_usd: 5, period_month: "2026-10-01", reference: "BANK-1", recorded_by: "admin", paid_at: "2026-11-01" };
const now = new Date("2026-11-27T00:00:00Z");
Deno.test("partner receives 20% of actual discounted Petite payment, not list price", () => assertEquals(commissionEstimate(59 * .95, "petite"), 11.21));
Deno.test("partner receives 30% of Statement payment", () => assertEquals(commissionEstimate(139 * .90, "statement"), 37.53));
Deno.test("free gift earns zero", () => assertEquals(commissionEstimate(0, "statement"), 0));
Deno.test("second-copy share uses entire pair amount", () => assertEquals(commissionEstimate(98, "petite"), 19.60));
Deno.test("undelivered orders are held, not payable", () => { const t = partnerTotals([delivered({ state: "pending_delivery", eligible_at: null })], [], "2026-10", now); assertEquals(t.held, 11.21); assertEquals(t.payable, 0); });
Deno.test("month-end means UTC first day of next month", () => { assertEquals(completedMonth("2026-11", new Date("2026-11-30T23:59:59Z")), false); assertEquals(completedMonth("2026-11", new Date("2026-12-01T00:00:00Z")), true); });
Deno.test("current month's delivered earnings are not yet payable", () => assertEquals(partnerTotals([delivered({ eligible_at: "2026-11-20T00:00:00Z" })], [], "2026-11", now).payable, 0));
Deno.test("month-end net payable subtracts payments and carries older unpaid earnings", () => { const t = partnerTotals([delivered()], [payment], "2026-10", now); assertEquals(t.payable, 6.21); assertEquals(t.monthEarned, 11.21); });
Deno.test("refunded orders never contribute earnings", () => { const t = partnerTotals([delivered({ state: "void" })], [], "2026-10", now); assertEquals(t.payable, 0); assertEquals(t.earned, 0); });
Deno.test("refund after payout is retained as negative adjustment", () => { const t = partnerTotals([delivered({ state: "void" })], [payment], "2026-10", now); assertEquals(t.adjustment, -5); assertEquals(t.payable, 0); });
Deno.test("basket lines count as one received order", () => { const row = { id: "1", group_id: "g", amount_usd: 59, status: "paid", production_status: "queued", payment_provider: "razorpay" } as PartnerOrder; assertEquals(receivedOrderCount([row, { ...row, id: "2" }, { ...row, id: "3", group_id: "g2", status: "pending" }]), 1); });