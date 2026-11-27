import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowUpRight, Copy, Download, Loader2, Pencil, Plus, RefreshCw, Search } from "lucide-react";
import { PartnerForm, type PartnerFields } from "./PartnerForm";
import { PartnerOrderCard } from "./PartnerOrderCard";
import { PartnerGiftRequests } from "./PartnerGiftRequests";
import { loadPartnerDashboard, type PartnerDashboardData } from "@/lib/referralPartnerData";
import { addressLabel, completedMonth, jsonObject, partnerTotals, receivedOrderCount, text, usd, type Partner } from "@/lib/referralPartners";

const empty: PartnerDashboardData = { partners:[],codes:[],gifts:[],orders:[],commissions:[],payments:[],contacts:[],lastEmailCheck:null };
const currentMonth = new Date().toISOString().slice(0,7);
const previousMonth = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth()-1,1)).toISOString().slice(0,7);
function Stat({ label,value }: { label:string; value:string | number }) { return <div className="min-w-0 border-l pl-3 py-2"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums break-words">{value}</p></div>; }

export function PartnersPanel() {
  const { toast } = useToast();
  const [data,setData] = useState(empty), [loading,setLoading] = useState(true), [error,setError] = useState("");
  const [busy,setBusy] = useState(false), [selected,setSelected] = useState<string | null>(null);
  const [search,setSearch] = useState(""), [kind,setKind] = useState("all"), [month,setMonth] = useState(previousMonth);
  const [form,setForm] = useState<{ partner:Partner | null } | null>(null);
  const [codeDialog,setCodeDialog] = useState(false), [code,setCode] = useState("");
  const [paymentDialog,setPaymentDialog] = useState(false), [paymentAmount,setPaymentAmount] = useState(""), [reference,setReference] = useState("");
  const [giftToLink,setGiftToLink] = useState("");
  const [sharedGift,setSharedGift] = useState<string | null>(null);
  const [listView,setListView]=useState("partners");
  const checkEmails=async()=>{
    if(busy) return;setBusy(true);
    try {
      const {data:result,error}=await supabase.functions.invoke("outreach-admin",{body:{action:"partner_inbox_sync"}});
      if(error) throw new Error("Email check failed; your existing records are unchanged. Please try again.");
      if(result?.error) throw new Error(result.error);
      await refresh();toast({title:"Email replies checked",description:`${result?.replies ?? 0} updated replies. No emails or orders sent.`});
    }catch(e){toast({title:"Couldn't check emails",description:e instanceof Error?e.message:"Try again",variant:"destructive"});}
    finally{setBusy(false);}
  };
  const refresh = async () => {
    setLoading(true);setError("");
    try { setData(await loadPartnerDashboard()); } catch(e) { setError(e instanceof Error ? e.message : "Could not load partners"); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, []);
  const partner = data.partners.find(p => p.id===selected);
  const codesFor = (id:string) => data.codes.filter(c => c.partner_id===id);
  const ordersFor = (id:string) => {
    const codes=new Set(codesFor(id).map(c => c.code.toUpperCase()));
    return data.orders.filter(o => {
      const commission=data.commissions.find(c => c.order_id===o.id);
      return commission ? commission.partner_id===id : Number(o.amount_usd)>0 && codes.has((o.promo_code ?? "").toUpperCase());
    });
  };
  const totalsFor = (id:string) => partnerTotals(data.commissions.filter(c => c.partner_id===id),data.payments.filter(p => p.partner_id===id),month);
  const availableGifts = data.orders.filter(o => Number(o.amount_usd)===0 && o.payment_provider!=="test" && !data.gifts.some(g => g.order_id===o.id));
  const myGifts = data.gifts.filter(g => g.partner_id===selected), myOrders = selected ? ordersFor(selected) : [];
  const totals = selected ? totalsFor(selected) : null;
  const filtered = data.partners.filter(p => (kind==="all" || p.kind===kind) && [p.name,p.email,p.organization,p.pet_name,...codesFor(p.id).map(c => c.code)].join(" ").toLowerCase().includes(search.toLowerCase()));
  const act = async (action: () => PromiseLike<{ error: { message:string } | null }>, success:string) => {
    if(busy) return false; setBusy(true);
    try { const { error }=await action(); if(error) throw new Error(error.message); await refresh(); toast({ title:success }); return true; }
    catch(e) { toast({ title:"Could not save", description:e instanceof Error ? e.message : "Please try again", variant:"destructive" });return false; }
    finally { setBusy(false); }
  };
  const savePartner = async (fields:PartnerFields) => {
    if(busy) return; setBusy(true);
    try {
      const {data:id,error}=await supabase.rpc("admin_save_referral_partner",{ p_id:form?.partner?.id || null,p_name:fields.name,p_email:fields.email,p_organization:fields.organization,p_kind:fields.kind,p_address:fields.address,p_pet_name:fields.petName,p_notes:fields.notes });
      if(error) throw new Error(error.message);
      setForm(null);setSelected(id);await refresh();toast({ title:"Partner saved" });
    } catch(e) {toast({title:"Could not save partner",description:e instanceof Error ? e.message : "Please try again",variant:"destructive"});}
    finally {setBusy(false);}
  };
  const exportCsv = () => {
    const rows: (string|number)[][]=[["Partner","Email","Month (UTC)","Received orders","Delivered earnings this month (USD)","Held for delivery (USD)","Total paid (USD)","Net balance through month (USD)","Payable now (USD)"]];
    (partner ? [partner] : filtered).forEach(p => { const t=totalsFor(p.id);rows.push([p.name,p.email,month,receivedOrderCount(ordersFor(p.id)),t.monthEarned,t.held,t.paid,t.balance,t.payable]); });
    const escape=(value:string|number) => `"${String(value).replace(/^[=+@-]/,"'$&").replaceAll('"','""')}"`;
    const url=URL.createObjectURL(new Blob(["\uFEFF"+rows.map(r => r.map(escape).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"}));
    const a=document.createElement("a");a.href=url;a.download=`partner-statement-${month}.csv`;a.click();URL.revokeObjectURL(url);
  };
  const monthControl=<div className="flex flex-wrap items-end gap-2"><div className="space-y-1"><Label htmlFor="partner-month" className="text-xs">Statement month (UTC)</Label><Input id="partner-month" type="month" value={month} min="2026-01" max={currentMonth} className="w-44" onChange={e => {if(/^\d{4}-\d{2}$/.test(e.target.value)) setMonth(e.target.value);}} /></div><Button size="icon" variant="outline" title="Export monthly statement" aria-label="Export monthly statement" onClick={exportCsv}><Download /></Button></div>;
  return <section className="space-y-6">
    <div className="flex flex-wrap justify-between items-start gap-3"><div className="flex items-center gap-3">{partner && <Button size="icon" variant="outline" aria-label="Back to partners" onClick={() => setSelected(null)}><ArrowLeft /></Button>}<div><h2 className="text-2xl font-semibold">{partner ? partner.organization || partner.name : "Partners"}</h2><p className="text-sm text-muted-foreground">{partner ? partner.kind==="creator" ? "Creator · followers 10% off · 20% share, 30% Statement" : "Business · customers 5% off · 20% share, 30% Statement" : `${data.partners.length} partners · ${data.gifts.length} gifted pieces`}</p></div></div><div className="flex gap-2"><Button variant="outline" size="icon" aria-label="Refresh partners" title="Refresh partners" disabled={loading || busy} onClick={() => void refresh()}><RefreshCw className={loading ? "animate-spin" : ""} /></Button>{partner ? <Button variant="outline" onClick={() => setForm({partner})}><Pencil />Edit</Button> : <Button onClick={() => setForm({partner:null})}><Plus />Add partner</Button>}</div></div>
    {error ? <div role="alert" className="border border-destructive p-4 text-destructive"><p>Partners could not be loaded: {error}</p><Button variant="outline" className="mt-2" onClick={() => void refresh()}>Try again</Button></div> : loading && !data.partners.length ? <div className="py-12 flex justify-center gap-2 text-muted-foreground"><Loader2 className="animate-spin" />Loading partners…</div> : <>
    {!partner ? <>
      <div className="flex flex-wrap items-center justify-between gap-3"><Tabs value={listView} onValueChange={setListView}><TabsList><TabsTrigger value="partners">Partners</TabsTrigger><TabsTrigger value="requests">Gift requests ({data.contacts.length})</TabsTrigger></TabsList></Tabs><div className="space-y-1"><Button variant="outline" disabled={busy || loading} onClick={()=>void checkEmails()}><RefreshCw className={busy?"animate-spin":""} />Check email replies</Button>{data.lastEmailCheck && <p className="text-xs text-muted-foreground">Last checked {new Date(data.lastEmailCheck).toLocaleString()}</p>}</div></div>
      {listView==="requests" ? <PartnerGiftRequests data={data} onPartner={setSelected} onAdd={c=>setForm({partner:{id:"",name:c.contact_name||c.org_name||"",email:c.email,organization:c.org_name||"",kind:c.category_slug==="petfluencers"?"creator":"business",shipping_address:{},pet_name:"",notes:"",created_at:"",updated_at:""}})} /> : <>
      <div className="flex flex-wrap items-end justify-between gap-3"><div className="flex flex-wrap gap-2"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search partners" placeholder="Name, email, pet or referral code" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-full sm:w-80" /></div><Select value={kind} onValueChange={setKind}><SelectTrigger className="w-40" aria-label="Filter partner type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All partners</SelectItem><SelectItem value="creator">Creators</SelectItem><SelectItem value="business">Businesses</SelectItem></SelectContent></Select></div>{monthControl}</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 border-y py-4"><Stat label="Received orders · all time" value={data.partners.reduce((n,p) => n+receivedOrderCount(ordersFor(p.id)),0)} /><Stat label="Delivered earnings · this month" value={usd(data.partners.reduce((n,p) => n+totalsFor(p.id).monthEarned,0))} /><Stat label="Awaiting delivery · all time" value={usd(data.partners.reduce((n,p) => n+totalsFor(p.id).held,0))} /><Stat label="Net payable · through month" value={usd(data.partners.reduce((n,p) => n+totalsFor(p.id).payable,0))} /></div>
      {!completedMonth(month) && <p className="text-sm text-muted-foreground">This month is still open. Delivered earnings become payable on the first day of next month.</p>}
      <div className="space-y-3">{filtered.map(p => {const t=totalsFor(p.id);const firstGift=data.gifts.find(g => g.partner_id===p.id),o=data.orders.find(o => o.id===firstGift?.order_id);return <article key={p.id} className="border rounded-md p-4"><div className="flex gap-4"><div className="hidden sm:block w-20 h-24 shrink-0 bg-muted">{o?.preview_image_url && <img className="w-full h-full object-contain" src={o.preview_image_url} alt={`${p.pet_name} gifted piece`} loading="lazy" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-2"><div className="min-w-0"><Button variant="link" className="h-auto p-0 text-base text-foreground whitespace-normal text-left" onClick={() => setSelected(p.id)}>{p.organization || p.name}<ArrowUpRight className="shrink-0" /></Button><p className="text-sm break-words">{p.name}{p.pet_name && ` · ${p.pet_name}`}</p><p className="text-xs text-muted-foreground break-all">{p.email}</p></div><Badge variant="outline" className="h-fit">{p.kind==="creator"?"Creator":"Business"}</Badge></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 mt-4 text-sm"><div><p className="text-xs text-muted-foreground">Referral codes</p><p className="break-all">{codesFor(p.id).map(c=>c.code).join(", ") || "Not assigned"}</p></div><div><p className="text-xs text-muted-foreground">Received orders</p><p>{receivedOrderCount(ordersFor(p.id))}</p></div><div><p className="text-xs text-muted-foreground">Earned · all time</p><p>{usd(t.earned)}</p></div><div><p className="text-xs text-muted-foreground">Net payable</p><p className="font-medium">{usd(t.payable)}</p>{t.adjustment<0 && <p className="text-xs text-destructive">Adjustment {usd(t.adjustment)}</p>}</div></div></div></div></article>;})}{!filtered.length && <p className="text-muted-foreground py-8 text-center">{data.partners.length ? "No matching partners." : "No partner records yet."}</p>}</div>
      </>}
    </> : <>
      <div className="grid gap-4 md:grid-cols-2 border-y py-4"><div className="text-sm space-y-1 min-w-0"><p className="font-medium">{partner.name}{partner.pet_name && ` · Pet: ${partner.pet_name}`}</p><p className="break-all">{partner.email}</p><p className="text-muted-foreground break-words">{addressLabel(partner.shipping_address) || "Shipping address not recorded"}</p>{partner.notes && <p className="whitespace-pre-wrap break-words pt-2">{partner.notes}</p>}</div><div className="space-y-2"><p className="text-xs text-muted-foreground">Referral codes</p><div className="flex flex-wrap gap-2">{codesFor(partner.id).map(c => <div key={c.id} className="inline-flex items-center gap-2 border px-2 py-1 rounded"><span className="font-mono text-sm break-all">{c.code}</span><span className="text-xs text-muted-foreground">{c.percent_off}% off · {c.active?"active":"off"}</span><Button size="icon-xs" variant="ghost" title="Copy referral code" aria-label={`Copy ${c.code}`} onClick={() => {void navigator.clipboard.writeText(c.code).then(() => toast({title:"Code copied"})).catch(() => toast({title:"Couldn't copy code",variant:"destructive"}));}}><Copy /></Button></div>)}</div><Button variant="outline" size="sm" onClick={() => {setCode("");setCodeDialog(true);}}><Plus />{codesFor(partner.id).length ? "Add code" : "Assign referral code"}</Button></div></div>
      <div className="flex justify-between items-end flex-wrap gap-3"><h3 className="text-lg font-semibold">Earnings & settlement</h3>{monthControl}</div>
      {totals && <><div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><Stat label="Delivered earnings · month" value={usd(totals.monthEarned)} /><Stat label="Awaiting delivery · all time" value={usd(totals.held)} /><Stat label="Payments recorded · all time" value={usd(totals.paid)} /><Stat label="Net payable · through month" value={usd(totals.payable)} /></div><div className="flex flex-wrap justify-between gap-3 border-b pb-4"><p className="text-sm text-muted-foreground max-w-xl">{completedMonth(month) ? "Unpaid delivered earnings through this month, less all recorded transfers. Shares use the discounted amount paid; free pieces earn nothing." : "This month is still open; settlement starts next month."}{totals.adjustment<0 && <span className="block text-destructive">Refund adjustment: {usd(totals.adjustment)} will reduce future earnings.</span>}</p><Button disabled={totals.payable<=0 || busy} onClick={() => {setPaymentAmount(totals.payable.toFixed(2));setReference("");setPaymentDialog(true);}}>Record payment</Button></div></>}
      <Tabs defaultValue="gifts"><TabsList className="w-full sm:w-auto"><TabsTrigger className="flex-1" value="gifts">Gifts ({myGifts.length})</TabsTrigger><TabsTrigger className="flex-1" value="customers">Customers ({receivedOrderCount(myOrders)})</TabsTrigger><TabsTrigger className="flex-1" value="payments">Payments</TabsTrigger></TabsList>
        <TabsContent value="gifts" className="space-y-4"><div className="flex flex-wrap gap-2 items-center">{availableGifts.length>0 && <><Select value={giftToLink} onValueChange={setGiftToLink}><SelectTrigger className="w-full sm:w-80 min-w-0 [&>span]:truncate" aria-label="Gift order to link"><SelectValue placeholder="Link another existing free piece" /></SelectTrigger><SelectContent>{availableGifts.map(o => <SelectItem key={o.id} value={o.id}>{text(jsonObject(o.shipping_address).name)||o.customer_email} · {text(jsonObject(o.personalization).heading)} · #{o.id.slice(0,8)}</SelectItem>)}</SelectContent></Select><Button variant="outline" disabled={!giftToLink || busy} onClick={async () => {if(await act(() => supabase.rpc("admin_link_referral_gift",{p_partner_id:partner.id,p_order_id:giftToLink}),"Gift linked")) setGiftToLink("");}}>Link gift</Button></>}</div><div className="grid gap-4 xl:grid-cols-2">{myGifts.map(g => {const o=data.orders.find(o => o.id===g.order_id);return o && <PartnerOrderCard key={g.id} order={o} gift={g} busy={busy} recordShared={() => setSharedGift(g.id)} />;})}</div>{!myGifts.length && <p className="py-8 text-muted-foreground">No gifted piece linked yet.</p>}</TabsContent>
        <TabsContent value="customers" className="space-y-4"><div className="grid gap-4 xl:grid-cols-2">{myOrders.map(o => <PartnerOrderCard key={o.id} order={o} commission={data.commissions.find(c=>c.order_id===o.id)} busy={busy} />)}</div>{!myOrders.length && <p className="py-8 text-muted-foreground">No customer orders received with this partner's code yet.</p>}</TabsContent>
        <TabsContent value="payments"><div className="divide-y">{data.payments.filter(p=>p.partner_id===partner.id).map(p => <div key={p.id} className="py-4 flex flex-wrap justify-between gap-3 text-sm"><div className="min-w-0"><p className="font-medium">{p.period_month.slice(0,7)} statement</p><p className="break-all text-muted-foreground">{p.reference}</p><p className="text-xs text-muted-foreground">Recorded {new Date(p.paid_at).toLocaleString()}</p></div><p className="font-semibold tabular-nums">{usd(Number(p.amount_usd))}</p></div>)}</div>{!data.payments.some(p=>p.partner_id===partner.id) && <p className="py-8 text-muted-foreground">No payments recorded.</p>}</TabsContent>
      </Tabs>
    </>}
    </>}
    {form && <PartnerForm partner={form.partner} availableGifts={availableGifts} busy={busy} onClose={() => setForm(null)} onSave={savePartner} />}
    {partner && <Dialog open={codeDialog} onOpenChange={setCodeDialog}><DialogContent className="w-[95vw] max-w-md"><DialogHeader><DialogTitle>Assign referral code</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={async e => {e.preventDefault();if(await act(() => supabase.rpc("admin_add_referral_code",{p_partner_id:partner.id,p_code:code}),"Referral code assigned")) setCodeDialog(false);}}><p className="text-sm">{partner.kind==="creator"?"10% off for followers":"5% off for customers"}. Partner earns 20% per order, 30% on Statement. A new code is active immediately.</p><Label htmlFor="referral-code">Code</Label><Input id="referral-code" required minLength={3} maxLength={40} pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,39}" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} /><Button disabled={busy} type="submit">{busy?"Saving…":"Save code"}</Button></form></DialogContent></Dialog>}
    {partner && <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}><DialogContent className="w-[95vw] max-w-md"><DialogHeader><DialogTitle>Record payment · {month}</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={async e=>{e.preventDefault();if(await act(() => supabase.rpc("admin_record_referral_payment",{p_partner_id:partner.id,p_month:`${month}-01`,p_amount:Number(paymentAmount),p_reference:reference}),"Payment recorded")) setPaymentDialog(false);}}><p className="text-sm">Only record a transfer you have already made. This does not move money.</p><div className="space-y-2"><Label htmlFor="partner-payment">Amount paid (USD)</Label><Input id="partner-payment" type="number" step="0.01" min="0.01" max={totals?.payable} required value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="partner-reference">Bank / PayPal transfer reference</Label><Input id="partner-reference" required value={reference} onChange={e=>setReference(e.target.value)} /></div><Button type="submit" disabled={busy}>Record completed transfer</Button></form></DialogContent></Dialog>}
    <Dialog open={!!sharedGift} onOpenChange={open=>{if(!open) setSharedGift(null);}}><DialogContent className="w-[95vw] max-w-md"><DialogHeader><DialogTitle>Record shared files?</DialogTitle></DialogHeader><p className="text-sm">Confirm you have already shared this render and any current 3D file with the partner. Their links will be saved as a permanent record. No email is sent.</p><div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>setSharedGift(null)}>Cancel</Button><Button disabled={busy} onClick={async()=>{if(sharedGift && await act(()=>supabase.rpc("admin_record_referral_shared",{p_gift_id:sharedGift}),"Shared files recorded"))setSharedGift(null);}}>Confirm already shared</Button></div></DialogContent></Dialog>
  </section>;
}