import { useEffect } from "react";
import { useShopifyCart } from "@/stores/shopifyCart";

/** Keeps the local cart in step with Shopify (clears it after a completed checkout). */
export function useCartSync() {
  const syncCart = useShopifyCart((s) => s.syncCart);

  useEffect(() => {
    syncCart();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") syncCart();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [syncCart]);
}