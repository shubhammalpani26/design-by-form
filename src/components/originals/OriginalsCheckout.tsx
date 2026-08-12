import { useCallback } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";

/**
 * Mounts Stripe's embedded checkout inline. The client secret is fetched once
 * by the caller and handed over here — remounting with a new secret is done by
 * changing the `key` prop on this component from the parent.
 */
export function OriginalsCheckout({ clientSecret }: { clientSecret: string }) {
  const fetchClientSecret = useCallback(async () => clientSecret, [clientSecret]);

  return (
    <div id="originals-checkout" className="min-h-[520px]">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
