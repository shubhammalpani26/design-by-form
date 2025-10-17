import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cartCustomizationsSchema } from '@/lib/validations';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  customizations: any;
  product: {
    name: string;
    designer_price: number;
    image_url: string;
  };
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (productId: string, customizations?: any) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartTotal: number;
  cartCount: number;
  isLoading: boolean;
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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('cart')
        .select(`
          *,
          product:designer_products(name, designer_price, image_url)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCart(data || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const addToCart = async (productId: string, customizations = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Please sign in',
          description: 'You need to be logged in to add items to cart',
          variant: 'destructive',
        });
        return;
      }

      // Validate customizations
      const validatedCustomizations = cartCustomizationsSchema.parse(customizations);

      const { error } = await supabase.from('cart').upsert([{
        user_id: user.id,
        product_id: productId,
        quantity: 1,
        customizations: validatedCustomizations as any,
      }], {
        onConflict: 'user_id,product_id',
      });

      if (error) throw error;

      await fetchCart();
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
    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;
      await fetchCart();
      toast({
        title: 'Removed from cart',
        description: 'Item removed successfully',
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove item',
        variant: 'destructive',
      });
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    try {
      const { error } = await supabase
        .from('cart')
        .update({ quantity })
        .eq('id', cartItemId);

      if (error) throw error;
      await fetchCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: 'Error',
        description: 'Failed to update quantity',
        variant: 'destructive',
      });
    }
  };

  const clearCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const cartTotal = cart.reduce((sum, item) => 
    sum + (item.product?.designer_price || 0) * item.quantity, 0
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
