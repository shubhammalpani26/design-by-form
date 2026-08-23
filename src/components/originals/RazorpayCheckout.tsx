import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck } from "lucide-react";
import { ApplePayButton, type ApplePayOrder } from "./ApplePayButton";


export interface RazorpayLine {
  skuSlug: string;
  sizeKey: string;
  previewId: string | null;
  quantity: number;
}

interface Props {
  items: RazorpayLine[];
  returnUrl: string;
  totalUsd: number;
  onPaying?: () => void;
}

const US_STATES: { code: string; name: string }[] = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],["CA","California"],
  ["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],["DC","District of Columbia"],
  ["FL","Florida"],["GA","Georgia"],["HI","Hawaii"],["ID","Idaho"],["IL","Illinois"],
  ["IN","Indiana"],["IA","Iowa"],["KS","Kansas"],["KY","Kentucky"],["LA","Louisiana"],
  ["ME","Maine"],["MD","Maryland"],["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],
  ["MS","Mississippi"],["MO","Missouri"],["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],
  ["NH","New Hampshire"],["NJ","New Jersey"],["NM","New Mexico"],["NY","New York"],
  ["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],["OK","Oklahoma"],["OR","Oregon"],
  ["PA","Pennsylvania"],["RI","Rhode Island"],["SC","South Carolina"],["SD","South Dakota"],
  ["TN","Tennessee"],["TX","Texas"],["UT","Utah"],["VT","Vermont"],["VA","Virginia"],
  ["WA","Washington"],["WV","West Virginia"],["WI","Wisconsin"],["WY","Wyoming"],
].map(([code, name]) => ({ code, name }));

/** +1 (315) 555-0134 as you type. */
function formatUsPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^1/, "").slice(0, 10);
  if (!digits) return "";
  const a = digits.slice(0, 3), b = digits.slice(3, 6), c = digits.slice(6, 10);
  let out = "+1";
  if (a) out += ` (${a}`;
  if (a.length === 3) out += ")";
  if (b) out += ` ${b}`;
  if (c) out += `-${c}`;
  return out;
}

const RAZORPAY_SDK = "https://checkout.razorpay.com/v1/checkout.js";

let standardCtor: any = null;

function loadRazorpay(): Promise<any> {
  // The Apple Pay flow loads a different Razorpay bundle onto the same global,
  // so hold our own reference instead of trusting window.Razorpay.
  if (standardCtor) return Promise.resolve(standardCtor);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SDK;
    script.async = true;
    script.onload = () => {
      standardCtor = (window as any).Razorpay;
      resolve(standardCtor);
    };
    script.onerror = () => reject(new Error("Could not load the payment window."));
    document.body.appendChild(script);
  });
}


/**
 * Razorpay does not collect a shipping address for us, so we take the buyer's
 * details here, create the order server-side, then open Razorpay Checkout. The
 * signed handoff is verified server-side before the buyer sees a confirmation.
 */
export function RazorpayCheckout({ items, returnUrl, totalUsd, onPaying }: Props) {
  const { toast } = useToast();
  const [values, setValues] = useState({
    name: "", email: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "",
  });
  const [busy, setBusy] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; discountUsd: number } | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);


  const set = (key: keyof typeof values, v: string) => setValues((p) => ({ ...p, [key]: v }));

  // ZIP drives city + state so the buyer types five digits instead of three fields.
  useEffect(() => {
    const zip = values.postalCode.replace(/\D/g, "").slice(0, 5);
    if (zip.length !== 5) return;
    let cancelled = false;
    setLookingUp(true);
    fetch(`https://api.zippopotam.us/us/${zip}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.places?.length) return;
        const place = d.places[0];
        setValues((p) => ({
          ...p,
          city: place["place name"] ?? p.city,
          state: place["state abbreviation"] ?? p.state,
        }));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLookingUp(false); });
    return () => { cancelled = true; };
  }, [values.postalCode]);

  const missingLabel = (): string | null => {
    const req: [keyof typeof values, string][] = [
      ["name", "full name"], ["email", "email"], ["phone", "phone"],
      ["line1", "address"], ["city", "city"], ["state", "state"], ["postalCode", "ZIP code"],
    ];
    const missing = req.filter(([k]) => !values[k].trim()).map(([, l]) => l);
    return missing.length ? missing.join(", ") : null;
  };

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setPromoBusy(true);
    setPromoError(null);
    try {
      const { data, error } = await supabase.functions.invoke("originals-promo", {
        body: { code, subtotalUsd: totalUsd },
      });
      if (error || data?.error) throw new Error(data?.error || "That code isn't valid.");
      setPromo({ code: data.code, discountUsd: Number(data.discountUsd) || 0 });
      toast({ title: "Promo applied", description: `You saved $${Number(data.discountUsd).toFixed(2)}.` });
    } catch (e) {
      setPromo(null);
      setPromoError((e as Error).message);
    } finally {
      setPromoBusy(false);
    }
  };

  const payableUsd = Math.max(0, Math.round((totalUsd - (promo?.discountUsd ?? 0)) * 100) / 100);

  /** Server-side order creation shared by the card window and Apple Pay. */
  const createOrder = async (): Promise<ApplePayOrder | null> => {
    const missing = missingLabel();
    if (missing) {
      toast({ title: "A few details missing", description: `Please add your ${missing}.`, variant: "destructive" });
      return null;
    }
    const { data, error } = await supabase.functions.invoke("razorpay-checkout", {
      body: { items, returnUrl, customer: values, promoCode: promo?.code ?? null },
    });
    if (error || data?.error || !data?.providerOrderId) {
      throw new Error(data?.error || "Checkout is temporarily unavailable.");
    }
    return data as ApplePayOrder;
  };

  const buildReturnUrl = (order: ApplePayOrder, paymentId: string, signature: string) => {
    const sep = returnUrl.includes("?") ? "&" : "?";
    const params = new URLSearchParams({ payment_id: paymentId, signature });
    return `${returnUrl}${sep}group=${order.groupId}&order=${order.orderId}&provider=razorpay&${params.toString()}`;
  };



  const pay = async () => {
    const missing = missingLabel();
    if (missing) {
      toast({ title: "A few details missing", description: `Please add your ${missing}.`, variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
      const [Razorpay, checkout] = await Promise.all([
        loadRazorpay(),
        supabase.functions.invoke("razorpay-checkout", {
          body: { items, returnUrl, customer: values, promoCode: promo?.code ?? null },
        }),
      ]);

      const { data, error } = checkout;
      if (error || data?.error || !data?.providerOrderId) {
        throw new Error(data?.error || "Checkout is temporarily unavailable.");
      }

      const sep = returnUrl.includes("?") ? "&" : "?";
      const back = `${returnUrl}${sep}group=${data.groupId}&order=${data.orderId}&provider=razorpay`;

      onPaying?.();

      const rzp = new Razorpay({
        key: data.keyId,
        order_id: data.providerOrderId,
        amount: data.amount,
        currency: data.currency,
        name: "Nyzora",
        description: data.description,
        prefill: { ...data.prefill, method: "card" },
        notes: { group_id: data.groupId },
        theme: { color: "#111111" },
        // International storefront: cards only, no India-specific rails.
        method: { card: true, upi: false, netbanking: false, wallet: false, paylater: false, emi: false },
        config: {
          display: {
            blocks: {
              card: { name: "Pay by card", instruments: [{ method: "card" }] },
            },
            sequence: ["block.card"],
            preferences: { show_default_blocks: false },
          },
        },
        handler: (response: any) => {
          const params = new URLSearchParams({
            payment_id: response?.razorpay_payment_id ?? "",
            signature: response?.razorpay_signature ?? "",
          });
          window.location.href = `${back}&${params.toString()}`;
        },
        modal: {
          ondismiss: () => setBusy(false),
        },
      });


      rzp.on("payment.failed", (resp: any) => {
        setBusy(false);
        toast({
          title: "Payment failed",
          description: resp?.error?.description ?? "Please try another card.",
          variant: "destructive",
        });
      });

      rzp.open();
    } catch (e) {
      toast({ title: "Payment didn't start", description: (e as Error).message, variant: "destructive" });
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="rp-name" className="text-xs text-muted-foreground">Full name</Label>
          <Input id="rp-name" autoComplete="name" value={values.name}
            onChange={(e) => set("name", e.target.value)} className="mt-1 rounded-none" />
        </div>
        <div>
          <Label htmlFor="rp-email" className="text-xs text-muted-foreground">Email</Label>
          <Input id="rp-email" type="email" autoComplete="email" value={values.email}
            onChange={(e) => set("email", e.target.value)} className="mt-1 rounded-none" />
        </div>
        <div>
          <Label htmlFor="rp-phone" className="text-xs text-muted-foreground">Phone</Label>
          <Input id="rp-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+1 (315) 555-0134"
            value={values.phone} onChange={(e) => set("phone", formatUsPhone(e.target.value))}
            className="mt-1 rounded-none" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="rp-line1" className="text-xs text-muted-foreground">Address</Label>
          <Input id="rp-line1" autoComplete="address-line1" value={values.line1}
            onChange={(e) => set("line1", e.target.value)} className="mt-1 rounded-none" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="rp-line2" className="text-xs text-muted-foreground">Apartment, suite (optional)</Label>
          <Input id="rp-line2" autoComplete="address-line2" value={values.line2}
            onChange={(e) => set("line2", e.target.value)} className="mt-1 rounded-none" />
        </div>
        <div>
          <Label htmlFor="rp-zip" className="text-xs text-muted-foreground">
            ZIP code {lookingUp && <span className="ml-1">looking up…</span>}
          </Label>
          <Input id="rp-zip" inputMode="numeric" autoComplete="postal-code" placeholder="10001"
            value={values.postalCode}
            onChange={(e) => set("postalCode", e.target.value.replace(/[^\d-]/g, "").slice(0, 10))}
            className="mt-1 rounded-none" />
        </div>
        <div>
          <Label htmlFor="rp-city" className="text-xs text-muted-foreground">City</Label>
          <Input id="rp-city" autoComplete="address-level2" value={values.city}
            onChange={(e) => set("city", e.target.value)} className="mt-1 rounded-none" />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs text-muted-foreground">State</Label>
          <Select value={values.state} onValueChange={(v) => set("state", v)}>
            <SelectTrigger className="mt-1 rounded-none" aria-label="State">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {US_STATES.map((s) => (
                <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ---- Promo code ---- */}
      <div className="border border-border p-3">
        <Label htmlFor="rp-promo" className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
          Promo code
        </Label>
        <div className="mt-2 flex gap-2">
          <Input
            id="rp-promo"
            value={promoInput}
            placeholder="Enter code"
            onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); }}
            className="rounded-none uppercase"
          />
          {promo ? (
            <Button type="button" variant="outline" className="rounded-none"
              onClick={() => { setPromo(null); setPromoInput(""); setPromoError(null); }}>
              Remove
            </Button>
          ) : (
            <Button type="button" variant="outline" className="rounded-none"
              disabled={promoBusy || !promoInput.trim()} onClick={() => void applyPromo()}>
              {promoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
            </Button>
          )}
        </div>
        {promoError && <p className="mt-2 text-xs text-destructive">{promoError}</p>}
        {promo && (
          <p className="mt-2 text-xs text-muted-foreground tabular-nums">
            {promo.code} applied — −${promo.discountUsd.toFixed(2)}
          </p>
        )}
      </div>

      <div className="space-y-1 text-sm tabular-nums">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span><span>${totalUsd.toFixed(2)} USD</span>
        </div>
        {promo && (
          <div className="flex justify-between text-muted-foreground">
            <span>Discount</span><span>−${promo.discountUsd.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span><span>Free</span>
        </div>
        <div className="flex justify-between border-t border-border pt-1 font-medium">
          <span>Total</span><span>${payableUsd.toFixed(2)} USD</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        We ship within the USA only. Free shipping is included in the price. All prices and charges
        are in US dollars (USD).
      </p>

      <Button type="button" size="lg" className="w-full rounded-none h-12" disabled={busy} onClick={() => void pay()}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Pay ${payableUsd.toFixed(2)} USD
      </Button>

      <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" /> Card details are entered in the secure payment window.
        Visa, Mastercard and Amex accepted.
      </p>
    </div>
  );
}

