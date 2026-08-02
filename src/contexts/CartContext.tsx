import { createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cartCustomizationsSchema } from '@/lib/validations';
import { useShopifyCart, ShopifyCartItem } from '@/stores/shopifyCart';
import { useCartSync } from '@/hooks/useCartSync';

type CartItem = ShopifyCartItem;

interface CartContextType {
  cart: CartItem[];
  addToCart: (productId: string, customizations?: any) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartTotal: number;
  cartCount: number;
  isLoading: boolean;
  checkoutUrl: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const cart = useShopifyCart((s) => s.items);
  const isLoading = useShopifyCart((s) => s.isLoading);
  const checkoutUrl = useShopifyCart((s) => s.checkoutUrl);
  const addItem = useShopifyCart((s) => s.addItem);
  const removeItem = useShopifyCart((s) => s.removeItem);
  const updateLineQuantity = useShopifyCart((s) => s.updateQuantity);
  const clearShopifyCart = useShopifyCart((s) => s.clearCart);

  useCartSync();

  const addToCart = async (productId: string, customizations = {}) => {
    try {
      const validatedCustomizations = cartCustomizationsSchema.parse(customizations);

      const { data: product, error } = await supabase
        .from('designer_products')
        .select('id, name, designer_price, image_url, status, shopify_variant_id')
        .eq('id', productId)
        .maybeSingle();

      if (error) throw error;
      if (!product || product.status !== 'approved') {
        toast({
          title: 'Unavailable',
          description: 'This piece is not available for purchase right now.',
          variant: 'destructive',
        });
        return;
      }

      if (!product.shopify_variant_id) {
        toast({
          title: 'Not yet purchasable',
          description: 'This piece is still being set up in the store. Please check back shortly.',
          variant: 'destructive',
        });
        return;
      }

      const ok = await addItem({
        product_id: product.id,
        variantId: product.shopify_variant_id,
        quantity: 1,
        customizations: (validatedCustomizations || {}) as Record<string, any>,
        product: {
          name: product.name,
          designer_price: Number(product.designer_price),
          image_url: product.image_url || '',
        },
      });

      if (!ok) throw new Error('Failed to add item to cart');

      toast({
        title: 'Added to cart',
        description: 'Item successfully added to your cart',
      });
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      if (error.name === 'ZodError') {
        toast({
          title: 'Invalid customization',
          description: error.errors[0]?.message || 'Please check your options.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to add item to cart',
          variant: 'destructive',
        });
      }
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    await removeItem(cartItemId);
    toast({
      title: 'Removed from cart',
      description: 'Item removed successfully',
    });
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    await updateLineQuantity(cartItemId, quantity);
  };

  const clearCart = async () => {
    clearShopifyCart();
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + (item.product?.designer_price || 0) * item.quantity,
    0
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        isLoading,
        checkoutUrl,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
