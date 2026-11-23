import { useCallback, useEffect, useState } from "react";
import { secondCopyUsd } from "@/lib/originalsOffers";

export interface OriginalsCartItem {
  /** Local line id. */
  id: string;
  skuSlug: string;
  sizeKey: string;
  sizeLabel: string;
  price: number;
  quantity: number;
  productName: string;
  previewId: string | null;
  previewUrl: string | null;
  personName?: string;
  /** Two identical pieces, the second at the discounted second-copy price. Always quantity 2. */
  secondCopy?: boolean;
}

const KEY = "nyzora.originals.cart.v1";
const EVENT = "nyzora-originals-cart";
const MAX_LINES = 10;

function read(): OriginalsCartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_LINES) : [];
  } catch {
    return [];
  }
}

function write(items: OriginalsCartItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX_LINES)));
  } catch {
    /* storage full — cart is best-effort */
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

export const originalsCart = {
  items: read,
  add(item: Omit<OriginalsCartItem, "id" | "quantity"> & { quantity?: number }) {
    const items = read();
    // Same preview + same size is the same line — bump quantity instead.
    // Second-copy pairs are fixed at two pieces, so they never merge.
    const existing = item.secondCopy
      ? undefined
      : items.find(
          (i) =>
            !i.secondCopy && i.previewId === item.previewId && i.sizeKey === item.sizeKey && i.skuSlug === item.skuSlug,
        );
    if (existing) {
      existing.quantity = Math.min(10, existing.quantity + (item.quantity ?? 1));
    } else {
      items.push({
        ...item,
        quantity: item.secondCopy ? 2 : Math.min(10, item.quantity ?? 1),
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });
    }
    write(items);
    return items;
  },
  setQuantity(id: string, quantity: number) {
    const items = read()
      .map((i) => {
        if (i.id !== id) return i;
        // A pair can drop to one full-price piece, but can't grow past two.
        if (i.secondCopy) return quantity >= 2 ? i : { ...i, secondCopy: false, quantity: Math.max(0, quantity) };
        return { ...i, quantity: Math.max(0, Math.min(10, quantity)) };
      })
      .filter((i) => i.quantity > 0);
    write(items);
  },
  remove(id: string) {
    write(read().filter((i) => i.id !== id));
  },
  clear() {
    write([]);
  },
};

export const cartCount = (items: OriginalsCartItem[]) =>
  items.reduce((n, i) => n + i.quantity, 0);

export const cartLineTotal = (i: Pick<OriginalsCartItem, "price" | "quantity" | "secondCopy">) =>
  i.secondCopy ? i.price + secondCopyUsd(i.price) : i.price * i.quantity;

export const cartTotal = (items: OriginalsCartItem[]) =>
  items.reduce((n, i) => n + cartLineTotal(i), 0);

/** The line sent to checkout; the server re-prices and forces pairs to quantity 2. */
export const cartCheckoutLine = (i: OriginalsCartItem) => ({
  skuSlug: i.skuSlug,
  sizeKey: i.sizeKey,
  previewId: i.previewId,
  quantity: i.quantity,
  ...(i.secondCopy ? { secondCopy: true } : {}),
});

export function useOriginalsCart() {
  const [items, setItems] = useState<OriginalsCartItem[]>(() => read());

  useEffect(() => {
    const sync = () => setItems(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return {
    items,
    count: cartCount(items),
    total: cartTotal(items),
    add: useCallback((i: Parameters<typeof originalsCart.add>[0]) => originalsCart.add(i), []),
    setQuantity: useCallback((id: string, q: number) => originalsCart.setQuantity(id, q), []),
    remove: useCallback((id: string) => originalsCart.remove(id), []),
    clear: useCallback(() => originalsCart.clear(), []),
  };
}
