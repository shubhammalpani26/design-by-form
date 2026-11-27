import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Plus } from "lucide-react";
import { giftRequestStage, type GiftContact } from "@/lib/referralPartners";
import type { PartnerDashboardData } from "@/lib/referralPartnerData";

export function PartnerGiftRequests({data,onPartner,onAdd}: { data:PartnerDashboardData;onPartner:(id:string)=>void;onAdd:(contact:GiftContact)=>void }) {
  const [search,setSearch]=useState(""),[filter,setFilter]=useState("all");
  const rows=data.contacts.map(c=>{
    const partner=data.partners.find(p=>p.email.toLowerCase()===c.email.toLowerCase());
    const orders=data.orders.filter(o=>Number(o.amount_usd)===0 && o.payment_provider!=="test" && (o.customer_email?.toLowerCase()===c.email.toLowerCase() || (partner && data.gifts.some(g=>g.partner_id===partner.id && g.order_id===o.id))));
    return {contact:c,partner,orders,stage:giftRequestStage(c,orders)};
  });
  const filtered=rows.filter(r=>[r.contact.email,r.contact.contact_name,r.contact.org_name,r.contact.reply_snippet].join(" ").toLowerCase().includes(search.toLowerCase()) && (filter==="all" || filter==="needs" && ["Needs gift order","Needs replacement"].includes(r.stage) || filter==="review" && r.stage==="Review reply" || filter==="placed" && r.orders.length>0));
  return <div className="space-y-4">
    <div className="grid grid-cols-3 border-y py-3 gap-2 text-sm"><div><p className="text-muted-foreground text-xs">Needs order</p><p className="font-semibold text-lg">{rows.filter(r=>["Needs gift order","Needs replacement"].includes(r.stage)).length}</p></div><div><p className="text-muted-foreground text-xs">Review replies</p><p className="font-semibold text-lg">{rows.filter(r=>r.stage==="Review reply").length}</p></div><div><p className="text-muted-foreground text-xs">Gift order saved</p><p className="font-semibold text-lg">{rows.filter(r=>r.orders.length>0).length}</p></div></div>
    <div className="flex flex-wrap gap-2"><Input aria-label="Search gift replies" className="w-full sm:w-80" placeholder="Search name, email or reply" value={search} onChange={e=>setSearch(e.target.value)} /><Select value={filter} onValueChange={setFilter}><SelectTrigger aria-label="Filter gift requests" className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All replies</SelectItem><SelectItem value="needs">Needs gift order</SelectItem><SelectItem value="review">Review reply</SelectItem><SelectItem value="placed">Gift order saved</SelectItem></SelectContent></Select></div>
    <div className="divide-y">{filtered.map(({contact:c,partner,orders,stage})=><article key={c.id} className="py-4 space-y-3"><div className="flex flex-wrap justify-between gap-2"><div className="min-w-0"><h3 className="font-medium break-words">{c.org_name || c.contact_name || c.email}</h3><p className="text-sm text-muted-foreground break-all">{c.email}</p></div><Badge variant="outline" className="h-fit max-w-full whitespace-normal">{stage}</Badge></div>{c.reply_snippet && <blockquote className="border-l-2 pl-3 text-sm whitespace-pre-wrap break-words">{c.reply_snippet}</blockquote>}<p className="text-xs text-muted-foreground">{c.outcome==="yes"?"Marked interested":"Interest not confirmed"}{c.replied_at && ` · Last reply ${new Date(c.replied_at).toLocaleString()}`}</p>
      {orders.map(o=><div key={o.id} className="text-xs space-y-1 break-all"><p>Gift #{o.id.slice(0,8)} · {o.production_status?.replaceAll("_"," ") || o.status}</p><p>Factory order ID: {o.partner_order_id || "Not placed"}</p><p>Shipping ID: {o.tracking_numbers?.length ? o.tracking_numbers.join(", ") : "Not assigned yet"}</p></div>)}
      <div className="flex flex-wrap gap-2"><Button asChild variant="outline" size="sm"><a href={`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(c.email)}`} target="_blank" rel="noreferrer"><Mail />Open email</a></Button>{partner ? <Button variant="outline" size="sm" onClick={()=>onPartner(partner.id)}>View partner</Button> : <Button variant="outline" size="sm" onClick={()=>onAdd(c)}><Plus />Add partner</Button>}{["Needs gift order","Needs replacement"].includes(stage) && <Button asChild size="sm"><a href="/originals/pet-portrait-sculpture" target="_blank" rel="noreferrer">Create gift order</a></Button>}</div>
    </article>)}</div>{!filtered.length && <p className="text-sm text-muted-foreground py-8">No matching gift requests.</p>}
  </div>;
}