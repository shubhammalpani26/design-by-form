import { supabase } from "@/integrations/supabase/client";
import type { Partner, PartnerCode, PartnerGift, PartnerOrder, Commission, PartnerPayment, GiftContact } from "./referralPartners";

async function allPages<T>(fetch: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await fetch(from, from + 499);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < 500) return rows;
  }
}
export type PartnerDashboardData = { partners: Partner[]; codes: PartnerCode[]; gifts: PartnerGift[]; orders: PartnerOrder[]; commissions: Commission[]; payments: PartnerPayment[]; contacts:GiftContact[]; lastEmailCheck:string | null };
export async function loadPartnerDashboard(): Promise<PartnerDashboardData> {
  const [partners, links, gifts, commissions, payments, promos, contacts, settings] = await Promise.all([
    allPages((a,b) => supabase.from("referral_partners").select("id,name,email,organization,kind,shipping_address,pet_name,notes,created_at,updated_at").order("created_at", { ascending: false }).order("id").range(a,b)),
    allPages((a,b) => supabase.from("referral_partner_codes").select("id,partner_id,promo_id,created_at").order("id").range(a,b)),
    allPages((a,b) => supabase.from("referral_partner_gifts").select("id,partner_id,order_id,shared_at,sent_preview_url,sent_model_url,created_at").order("id").range(a,b)),
    allPages((a,b) => supabase.from("referral_commissions").select("id,partner_id,order_id,code,rate,basis_usd,earned_usd,state,eligible_at,created_at,updated_at").order("id").range(a,b)),
    allPages((a,b) => supabase.from("referral_partner_payments").select("id,partner_id,period_month,amount_usd,reference,paid_at,recorded_by").order("paid_at", { ascending: false }).order("id").range(a,b)),
    allPages((a,b) => supabase.from("originals_promo_codes").select("id,code,active,percent_off").order("id").range(a,b)),
    allPages((a,b) => supabase.from("outreach_contacts").select("id,email,contact_name,org_name,category_slug,status,outcome,reply_snippet,replied_at,gmail_thread_id").or("status.eq.replied,outcome.eq.yes").order("replied_at",{ascending:false}).order("id").range(a,b)),
    supabase.from("outreach_settings").select("last_sync_at").eq("id",1).maybeSingle(),
  ]);
  const codes = links.flatMap(link => {
    const promo = promos.find(p => p.id === link.promo_id);
    return promo ? [{ ...link, code: promo.code, active: promo.active, percent_off: promo.percent_off }] : [];
  });
  const orderColumns = "id,group_id,preview_id,customer_email,shipping_address,personalization,amount_usd,quantity,size_key,size_label,status,production_status,preview_image_url,print_file_url,partner_order_id,promo_code,created_at,delivered_at,engraved_text,tracking_numbers,payment_provider" as const;
  const [freeOrders, codeOrders] = await Promise.all([
    allPages((a,b) => supabase.from("originals_orders").select(orderColumns).eq("amount_usd",0).order("created_at",{ ascending:false }).order("id").range(a,b)),
    codes.length ? allPages((a,b) => supabase.from("originals_orders").select(orderColumns).in("promo_code", codes.map(c => c.code)).order("created_at",{ ascending:false }).order("id").range(a,b)) : Promise.resolve([]),
  ]);
  // Ledger ownership is immutable even if an order's promo field is later corrected.
  const present = new Set([...freeOrders, ...codeOrders].map(o => o.id));
  const missing = commissions.filter(c => !present.has(c.order_id)).map(c => c.order_id);
  const extra: PartnerOrder[] = [];
  for (let from=0; from<missing.length; from+=100) {
    const { data,error } = await supabase.from("originals_orders").select(orderColumns).in("id", missing.slice(from,from+100));
    if(error) throw new Error(error.message); extra.push(...(data ?? []));
  }
  if(settings.error) throw new Error(settings.error.message);
  return { partners,codes,gifts,commissions,payments,contacts:contacts.filter(c => c.outcome!=="no" && !["opted_out","bounced"].includes(c.status)),lastEmailCheck:settings.data?.last_sync_at ?? null, orders: [...new Map([...freeOrders,...codeOrders,...extra].map(o => [o.id,o])).values()].sort((a,b) => b.created_at.localeCompare(a.created_at)) };
}