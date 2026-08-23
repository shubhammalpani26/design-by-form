import { useEffect, useRef, useState } from "react";

/**
 * Razorpay Custom Checkout (headless) SDK. Kept separate from the standard
 * checkout.js bundle used for the card window — both define `window.Razorpay`,
 * so each constructor is captured right after its own script loads.
 */
const CUSTOM_SDK = "https://checkout.razorpay.com/v1/razorpay.js";

let customCtor: any = null;
let customLoader: Promise<any> | null = null;

function loadCustomCheckout(): Promise<any> {
  if (customCtor) return Promise.resolve(customCtor);
  if (customLoader) return customLoader;
  customLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CUSTOM_SDK;
    script.async = true;
    script.onload = () => {
      customCtor = (window as any).Razorpay;
      resolve(customCtor);
    };
    script.onerror = () => reject(new Error("Apple Pay unavailable"));
    document.head.appendChild(script);
  });
  return customLoader;
}

export interface ApplePayOrder {
  keyId: string;
  providerOrderId: string;
  amount: number;
  currency: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  groupId: string;
  orderId: string;
}

interface Props {
  /** Called on click; resolves the server-created order, or null if the form is incomplete. */
  createOrder: () => Promise<ApplePayOrder | null>;
  /** Where to send the buyer after a successful payment (already carries group/order). */
  buildReturnUrl: (order: ApplePayOrder, paymentId: string, signature: string) => string;
  onError: (message: string) => void;
  onPaying?: () => void;
  disabled?: boolean;
}

/**
 * Apple Pay lives alongside the card flow: we only render the sheet when the
 * device is eligible, and the whole thing collapses silently otherwise.
 */
export function ApplePayButton({ createOrder, buildReturnUrl, onError, onPaying, disabled }: Props) {
  const [eligible, setEligible] = useState(false);
  const [busy, setBusy] = useState(false);
  const probeRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    // Apple Pay needs a secure context; skip the SDK fetch entirely elsewhere.
    if (typeof window === "undefined" || !window.isSecureContext) return;
    if (!(window as any).ApplePaySession) return;

    (async () => {
      try {
        const Ctor = await loadCustomCheckout();
        if (cancelled) return;
        // Eligibility probe does not need an order id.
        const probe = new Ctor({ key: "" });
        probeRef.current = probe;
        const res = await probe.canMakePayment({ method: "card", app: { name: "apple_pay" } });
        if (!cancelled && res?.available) setEligible(true);
      } catch {
        /* device or account not eligible — stay hidden */
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const pay = async () => {
    if (busy || disabled) return;
    setBusy(true);
    try {
      const order = await createOrder();
      if (!order) return;

      const Ctor = await loadCustomCheckout();
      const rzp = new Ctor({
        key: order.keyId,
        order_id: order.providerOrderId,
        email: order.prefill?.email,
        contact: order.prefill?.contact,
      });

      rzp.on("payment.success", (response: any) => {
        onPaying?.();
        window.location.href = buildReturnUrl(
          order,
          response?.razorpay_payment_id ?? "",
          response?.razorpay_signature ?? "",
        );
      });

      rzp.on("payment.error", (response: any) => {
        setBusy(false);
        const reason = response?.error?.reason;
        if (reason !== "payment_cancelled") {
          onError(response?.error?.description ?? "Apple Pay didn't go through.");
        }
      });

      // Must run inside the user gesture chain — Apple requires it.
      rzp.createPayment({
        method: "card",
        app: { name: "apple_pay" },
        order_id: order.providerOrderId,
        email: order.prefill?.email,
        contact: order.prefill?.contact,
      });
    } catch (e) {
      setBusy(false);
      onError((e as Error).message || "Apple Pay didn't start.");
    }
  };

  if (!eligible) return null;

  return (
    <button
      type="button"
      onClick={() => void pay()}
      disabled={busy || disabled}
      aria-label="Pay with Apple Pay"
      className="w-full h-12 bg-foreground text-background flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-60"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
        <path d="M16.36 12.78c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.62-1.7-3.18-1.72-1.35-.14-2.64.8-3.33.8-.69 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.19-1.54 2.67-.39 6.62 1.11 8.79.73 1.06 1.6 2.25 2.75 2.2 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.7.71 2.87.69 1.19-.02 1.94-1.08 2.66-2.14.84-1.23 1.19-2.42 1.21-2.48-.03-.01-2.32-.89-2.33-3.55zM14.2 5.9c.61-.74 1.02-1.77.91-2.8-.88.04-1.94.59-2.57 1.32-.56.65-1.05 1.7-.92 2.7.98.08 1.98-.5 2.58-1.22z" />
      </svg>
      <span>Pay</span>
    </button>
  );
}
