import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { jsonObject, text, type Partner, type PartnerOrder } from "@/lib/referralPartners";
import type { Json } from "@/integrations/supabase/types";

export type PartnerFields = { name: string; email: string; organization: string; kind: "creator" | "business"; address: Json; petName: string; notes: string };
export function PartnerForm({ partner, availableGifts, busy, onClose, onSave }: { partner: Partner | null; availableGifts: PartnerOrder[]; busy: boolean; onClose: () => void; onSave: (fields: PartnerFields) => Promise<void> }) {
  const root = jsonObject(partner?.shipping_address), a = jsonObject(root.address);
  const [fields, setFields] = useState({ name: partner?.name ?? "", email: partner?.email ?? "", organization: partner?.organization ?? "", kind: (partner?.kind ?? "business") as "creator" | "business", petName: partner?.pet_name ?? "", notes: partner?.notes ?? "", line1: text(a.line1), line2: text(a.line2), city: text(a.city), state: text(a.state), postal: text(a.postal_code), country: text(a.country) || "US", phone: text(root.phone) });
  const change = (key: keyof typeof fields, value: string) => setFields(f => ({ ...f, [key]: value }));
  const useGift = (id: string) => {
    const o = availableGifts.find(o => o.id === id); if (!o) return;
    const root = jsonObject(o.shipping_address), ad = jsonObject(root.address), p = jsonObject(o.personalization);
    setFields(f => ({ ...f, name: text(root.name), email: o.customer_email ?? "", petName: text(p.heading), line1: text(ad.line1), line2: text(ad.line2), city: text(ad.city), state: text(ad.state), postal: text(ad.postal_code), country: text(ad.country) || "US", phone: text(root.phone) }));
  };
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="w-[95vw] max-w-2xl max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{partner?.id ? "Edit partner" : "Add partner"}</DialogTitle></DialogHeader>
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); void onSave({ name: fields.name, email: fields.email, organization: fields.organization, kind: fields.kind, petName: fields.petName, notes: fields.notes, address: { name: fields.name, phone: fields.phone, address: { line1: fields.line1, line2: fields.line2, city: fields.city, state: fields.state, postal_code: fields.postal, country: fields.country } } }); }}>
      {!partner && availableGifts.length > 0 && <div className="space-y-2"><Label>Existing free piece</Label><Select onValueChange={useGift}><SelectTrigger className="w-full min-w-0 [&>span]:truncate"><SelectValue placeholder="Choose a recipient (optional)" /></SelectTrigger><SelectContent>{availableGifts.map(o => <SelectItem key={o.id} value={o.id}>{text(jsonObject(o.shipping_address).name) || o.customer_email} · {text(jsonObject(o.personalization).heading) || "Unnamed"}</SelectItem>)}</SelectContent></Select></div>}
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="partner-name">Recipient name</Label><Input id="partner-name" required value={fields.name} onChange={e => change("name", e.target.value)} /></div><div className="space-y-2"><Label htmlFor="partner-email">Email</Label><Input id="partner-email" type="email" required value={fields.email} onChange={e => change("email", e.target.value)} /></div></div>
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="partner-org">Business / account name</Label><Input id="partner-org" value={fields.organization} onChange={e => change("organization", e.target.value)} /></div><div className="space-y-2"><Label>Partner type</Label><Select value={fields.kind} onValueChange={v => change("kind", v)}><SelectTrigger aria-label="Partner type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="business">Business · customers 5% off</SelectItem><SelectItem value="creator">Creator · followers 10% off</SelectItem></SelectContent></Select></div></div>
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="partner-pet">Pet name</Label><Input id="partner-pet" value={fields.petName} onChange={e => change("petName", e.target.value)} /></div><div className="space-y-2"><Label htmlFor="partner-phone">Delivery phone (optional)</Label><Input id="partner-phone" type="tel" value={fields.phone} onChange={e => change("phone", e.target.value)} /></div></div>
      <div className="space-y-2"><Label htmlFor="partner-address">Shipping address</Label><Input id="partner-address" value={fields.line1} onChange={e => change("line1", e.target.value)} /></div>
      <Input aria-label="Address line 2" placeholder="Apartment / suite (optional)" value={fields.line2} onChange={e => change("line2", e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-2">{([['city','City'],['state','State / region'],['postal','ZIP / postal code'],['country','Country code']] as const).map(([key,label]) => <div key={key} className="space-y-2"><Label htmlFor={`partner-${key}`}>{label}</Label><Input id={`partner-${key}`} value={fields[key]} onChange={e => change(key, e.target.value)} /></div>)}</div>
      <div className="space-y-2"><Label htmlFor="partner-notes">Notes</Label><Textarea id="partner-notes" value={fields.notes} onChange={e => change("notes", e.target.value)} /></div>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save partner"}</Button></div>
    </form>
  </DialogContent></Dialog>;
}