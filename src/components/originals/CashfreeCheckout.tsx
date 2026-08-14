import { useState } from "react";
import { load } from "@cashfreepayments/cashfree-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck } from "lucide-react";

export interface CashfreeLine {
  skuSlug: string;
  sizeKey: string;
  previewId: string | null;
  quantity: number;
}

interface Props {
  items: CashfreeLine[];
  returnUrl: string;
  totalUsd: number;
  onPaying?: () => void;
}

const FIELDS = [
  { key: "name", label: "Full name", autoComplete: "name", required: true },
  { key: "email", label: "Email", autoComplete: "email", type: "email", required: true },
  { key: "phone", label: "Phone", autoComplete: "tel", type: "tel", required: true },
  { key: "line1", label: "Address", autoComplete: "address-line1", required: true },
  { key: "line2", label: "Apartment, suite (optional)", autoComplete: "address-line2", required: false },
  { key: "city", label: "City", autoComplete: "address-level2", required: true },
  { key: "state", label: "State", autoComplete: "address-level1", required: true },
  { key: "postalCode", label: "ZIP code", autoComplete: "postal-code", required: true },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

/**
 * Cashfree does not collect a shipping address for us, so we take the buyer's
 * details here, create the order server-side, then hand the payment session to
 * Cashfree's hosted checkout.
 */
export function CashfreeCheckout({ items, returnUrl, totalUsd, onPaying }: Props) {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<FieldKey, string>>({
    name: "", email: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "",
  });
  const [busy, setBusy] = useState(false);

  const set = (key: FieldKey, v: string) => setValues((p) => ({ ...p, [key]: v }));

  const pay = async () => {
    const missing = FIELDS.filter((f) => f.required && !values[f.key].trim());
    if (missing.length) {
      toast({
        title: "A few details missing",
        description: `Please add your ${missing.map((m) => m.label.toLowerCase()).join(", ")}.`,
        variant: "destructive",
      });
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("cashfree-checkout", {
        body: { items, returnUrl, customer: values },
      });
      if (error) throw new Error("Checkout is temporarily unavailable.");
      if (data?.error) throw new Error(data.error);
      if (!data?.paymentSessionId) throw new Error("Checkout is temporarily unavailable.");

      onPaying?.();
      const cashfree = await load({ mode: data.mode === "sandbox" ? "sandbox" : "production" });
      await cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_self",
      });
    } catch (e) {
      toast({
        title: "Payment didn't start",
        description: (e as Error).message,
        variant: "destructive",
      });
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className={f.key === "line1" || f.key === "line2" ? "sm:col-span-2" : ""}>
            <Label htmlFor={`cf-${f.key}`} className="text-xs text-muted-foreground">
              {f.label}
            </Label>
            <Input
              id={`cf-${f.key}`}
              type={"type" in f ? f.type : "text"}
              autoComplete={f.autoComplete}
              value={values[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              className="mt-1 rounded-none"
            />
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        We ship within the USA only. Free shipping is included in the price.
      </p>

      <Button type="button" size="lg" className="w-full rounded-none h-12" disabled={busy} onClick={() => void pay()}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Pay ${totalUsd}
      </Button>

      <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" /> Card details are entered on the secure payment page.
      </p>
    </div>
  );
}