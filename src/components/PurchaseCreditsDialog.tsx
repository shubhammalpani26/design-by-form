import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { billingCurrency, CREDIT_PACKS } from "@/lib/billingPrices";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

interface PurchaseCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const PurchaseCreditsDialog = ({
  open,
  onOpenChange,
}: PurchaseCreditsDialogProps) => {
  const { currency } = useCurrency();
  const cur = billingCurrency(currency);
  const symbol = cur === "inr" ? "₹" : "$";
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();
  const [selected, setSelected] = useState<string | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      closeCheckout();
      setSelected(null);
    }
    onOpenChange(next);
  };

  const handlePurchase = (pack: (typeof CREDIT_PACKS)[number]) => {
    setSelected(pack.id);
    openCheckout({
      priceId: pack.priceIds[cur],
      returnUrl: `${window.location.origin}/billing/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {isOpen ? "Complete your purchase" : "Get More Credits"}
          </DialogTitle>
          <DialogDescription>
            {isOpen
              ? "Credits are added to your balance as soon as the payment clears."
              : "Choose a credit package to continue creating amazing designs"}
          </DialogDescription>
        </DialogHeader>

        {isOpen ? (
          <div className="py-2">
            <PaymentTestModeBanner />
            {checkoutElement}
            <Button
              variant="ghost"
              className="mt-4 w-full"
              onClick={() => {
                closeCheckout();
                setSelected(null);
              }}
            >
              Choose a different pack
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              {CREDIT_PACKS.map((pkg) => {
                const price = cur === "inr" ? pkg.inr : pkg.usd;
                const popular = "popular" in pkg && pkg.popular;
                return (
                  <div
                    key={pkg.id}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      popular ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    {popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                        Most Popular
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{pkg.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {pkg.credits} AI generation credits
                        </p>
                        <div className="mt-2 flex items-baseline gap-1 flex-wrap">
                          <span className="text-2xl font-bold">
                            {symbol}
                            {price}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            (~{symbol}
                            {(price / pkg.credits).toFixed(cur === "inr" ? 0 : 2)}/credit)
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handlePurchase(pkg)}
                        disabled={selected !== null}
                        className={popular ? "bg-primary" : ""}
                      >
                        Buy Now
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Credits never expire — use them anytime
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  1 credit = 1 AI-generated furniture design
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Paid plans include a monthly credit refill
                </p>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
