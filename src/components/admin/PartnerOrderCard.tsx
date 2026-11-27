import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ModelViewer3D } from "@/components/ModelViewer3D";
import { Box, Download, ExternalLink } from "lucide-react";
import { addressLabel, jsonObject, text, usd, type Commission, type PartnerGift, type PartnerOrder } from "@/lib/referralPartners";

export function PartnerOrderCard({ order, gift, commission, busy, recordShared }: { order: PartnerOrder; gift?: PartnerGift; commission?: Commission; busy: boolean; recordShared?: () => void }) {
  const [model, setModel] = useState<string | null>(null);
  const root = jsonObject(order.shipping_address), p = jsonObject(order.personalization);
  const pet = text(p.heading) || order.engraved_text || "Name not supplied";
  const status = order.production_status || order.status;
  return <article className="rounded-md border p-4 space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="font-semibold break-words">{pet} <span className="font-normal text-muted-foreground">· {order.size_label} × {order.quantity}</span></h3><p className="text-xs text-muted-foreground">#{order.id.slice(0,8)} · {new Date(order.created_at).toLocaleDateString()}</p></div><Badge variant="outline" className="max-w-full whitespace-normal">{status.replaceAll("_", " ")}</Badge></div>
    <div className="grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)]">
      {order.preview_image_url ? <a href={order.preview_image_url} target="_blank" rel="noreferrer" className="block"><img src={order.preview_image_url} alt={`${pet} render`} className="w-full h-44 sm:h-36 object-contain bg-muted" loading="lazy" /></a> : <div className="h-36 grid place-items-center bg-muted text-sm text-muted-foreground">No render saved</div>}
      <div className="space-y-2 text-sm min-w-0"><p className="font-medium break-words">{text(root.name) || "Recipient not supplied"}</p><p className="break-all">{order.customer_email || "Email not supplied"}</p><p className="break-words text-muted-foreground">{addressLabel(order.shipping_address) || "Address not supplied"}</p>{text(root.phone) && <p>{text(root.phone)}</p>}
        <p>{gift ? "Gifted piece · $0" : `${["paid","fulfilled","refunded"].includes(order.status) ? "Customer paid" : "Order total"} ${usd(Number(order.amount_usd))}`} {order.promo_code && !gift && <span className="text-muted-foreground">· {order.promo_code}</span>}</p>
        {commission && <p className={commission.state === "void" ? "text-destructive" : "font-medium"}>{commission.state === "void" ? "Reversed" : `${Math.round(commission.rate*100)}% share · ${usd(Number(commission.earned_usd))}`} <span className="text-muted-foreground">· {commission.state.replaceAll("_", " ")}</span></p>}
        {!gift && !commission && <p className="text-muted-foreground">No earnings yet · {order.status}</p>}
        <p className="break-all text-xs text-muted-foreground">Factory order ID: {order.partner_order_id || "Not placed yet"}</p>
        <p className="break-all text-xs">Shipping ID (tracking): {order.tracking_numbers?.length ? order.tracking_numbers.join(", ") : "Not assigned yet"}</p>
      </div>
    </div>
    <div className="flex flex-wrap gap-2">{order.preview_image_url && <Button asChild size="sm" variant="outline"><a href={order.preview_image_url} target="_blank" rel="noreferrer"><ExternalLink />Render</a></Button>}{order.print_file_url && <><Button size="sm" variant="outline" onClick={() => setModel(order.print_file_url)}><Box />View 3D</Button><Button size="sm" variant="outline" asChild><a href={order.print_file_url} target="_blank" rel="noreferrer" download><Download />STL</a></Button></>}</div>
    {gift && <div className="border-t pt-3 space-y-2 text-sm">{gift.shared_at ? <><p className="text-muted-foreground">Files shared · recorded {new Date(gift.shared_at).toLocaleDateString()}</p><div className="flex flex-wrap gap-2">{gift.sent_preview_url && <Button variant="link" className="h-auto p-0" asChild><a href={gift.sent_preview_url} target="_blank" rel="noreferrer">Render shared with partner</a></Button>}{gift.sent_model_url && <Button variant="link" className="h-auto p-0" onClick={() => setModel(gift.sent_model_url)}>3D file shared with partner</Button>}</div></> : <><p className="text-muted-foreground">No shared-files date recorded. This does not indicate whether an order confirmation was sent.</p><Button variant="outline" size="sm" disabled={busy || !order.preview_image_url} onClick={recordShared}>Record files already shared</Button></>}</div>}
    {model && <Dialog open onOpenChange={open => { if (!open) setModel(null); }}><DialogContent className="w-[95vw] max-w-3xl"><DialogHeader><DialogTitle>{pet} · Production 3D</DialogTitle></DialogHeader><ModelViewer3D modelUrl={model} productName={pet} /></DialogContent></Dialog>}
  </article>;
}