import { useState, useCallback } from "react";
import { StripeEmbeddedCheckoutForm } from "@/components/StripeEmbeddedCheckout";

interface CheckoutOptions {
  priceId: string;
  returnUrl?: string;
}

export function useStripeCheckout() {
  const [options, setOptions] = useState<CheckoutOptions | null>(null);

  const openCheckout = useCallback((opts: CheckoutOptions) => setOptions(opts), []);
  const closeCheckout = useCallback(() => setOptions(null), []);

  const checkoutElement = options ? <StripeEmbeddedCheckoutForm {...options} /> : null;

  return { openCheckout, closeCheckout, isOpen: options !== null, checkoutElement };
}
