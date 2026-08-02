import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  CART_QUERY,
  addLineToShopifyCart,
  createShopifyCart,
  removeLineFromShopifyCart,
  storefrontApiRequest,
  updateShopifyCartLine,
} from "@/lib/shopify";

export interface ShopifyCartItem {
  /** Shopify cart line id — used as the stable UI key */
  id: string;
  product_id: string;
  variantId: string;
  quantity: number;
  customizations: Record<string, any>;
  product: {
    name: string;
    designer_price: number;
    image_url: string;
  };
}

interface AddItemInput {
  product_id: string;
  variantId: string;
  quantity: number;
  customizations: Record<string, any>;
  product: ShopifyCartItem["product"];
}

interface ShopifyCartState {
  items: ShopifyCartItem[];
  cartId: string | null;
  checkoutUrl: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  addItem: (item: AddItemInput) => Promise<boolean>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  getCheckoutUrl: () => string | null;
}

function toAttributes(customizations: Record<string, any>) {
  return Object.entries(customizations || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([key, value]) => ({ key, value: String(value) }));
}

export const useShopifyCart = create<ShopifyCartState>()(
  persist(
    (set, get) => ({
      items: [],
      cartId: null,
      checkoutUrl: null,
      isLoading: false,
      isSyncing: false,

      addItem: async (item) => {
        const { items, cartId, clearCart } = get();
        const existing = items.find(
          (i) =>
            i.variantId === item.variantId &&
            JSON.stringify(i.customizations) === JSON.stringify(item.customizations),
        );
        const attributes = toAttributes(item.customizations);

        set({ isLoading: true });
        try {
          if (!cartId) {
            const result = await createShopifyCart(item.variantId, item.quantity, attributes);
            if (!result) return false;
            set({
              cartId: result.cartId,
              checkoutUrl: result.checkoutUrl,
              items: [{ ...item, id: result.lineId }],
            });
            return true;
          }

          if (existing) {
            const newQuantity = existing.quantity + item.quantity;
            const result = await updateShopifyCartLine(cartId, existing.id, newQuantity);
            if (result.success) {
              set({
                items: get().items.map((i) =>
                  i.id === existing.id ? { ...i, quantity: newQuantity } : i,
                ),
              });
              return true;
            }
            if (result.cartNotFound) clearCart();
            return false;
          }

          const result = await addLineToShopifyCart(
            cartId,
            item.variantId,
            item.quantity,
            attributes,
          );
          if (result.success && result.lineId) {
            set({ items: [...get().items, { ...item, id: result.lineId }] });
            return true;
          }
          if (result.cartNotFound) clearCart();
          return false;
        } catch (error) {
          console.error("Failed to add item:", error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      updateQuantity: async (lineId, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(lineId);
          return;
        }
        const { cartId, clearCart } = get();
        if (!cartId) return;

        set({ isLoading: true });
        try {
          const result = await updateShopifyCartLine(cartId, lineId, quantity);
          if (result.success) {
            set({
              items: get().items.map((i) => (i.id === lineId ? { ...i, quantity } : i)),
            });
          } else if (result.cartNotFound) {
            clearCart();
          }
        } catch (error) {
          console.error("Failed to update quantity:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (lineId) => {
        const { cartId, clearCart } = get();
        if (!cartId) return;

        set({ isLoading: true });
        try {
          const result = await removeLineFromShopifyCart(cartId, lineId);
          if (result.success) {
            const newItems = get().items.filter((i) => i.id !== lineId);
            if (newItems.length === 0) clearCart();
            else set({ items: newItems });
          } else if (result.cartNotFound) {
            clearCart();
          }
        } catch (error) {
          console.error("Failed to remove item:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      clearCart: () => set({ items: [], cartId: null, checkoutUrl: null }),

      getCheckoutUrl: () => get().checkoutUrl,

      syncCart: async () => {
        const { cartId, isSyncing, clearCart } = get();
        if (!cartId || isSyncing) return;

        set({ isSyncing: true });
        try {
          const data = await storefrontApiRequest(CART_QUERY, { id: cartId });
          if (!data) return;
          const cart = data?.data?.cart;
          if (!cart || cart.totalQuantity === 0) clearCart();
        } catch (error) {
          console.error("Failed to sync cart with Shopify:", error);
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: "nyzora-shopify-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        cartId: state.cartId,
        checkoutUrl: state.checkoutUrl,
      }),
    },
  ),
);