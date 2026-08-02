import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useRef } from "react";
import { SEOHead } from "@/components/SEOHead";
import { ExternalLink } from "lucide-react";

const Cart = () => {
  const { cart, addToCart, removeFromCart, updateQuantity, cartTotal, cartCount, isLoading, checkoutUrl } = useCart();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const prefillHandled = useRef(false);

  // Agent deep-link prefill: /cart?prefill=[{"id":"...","qty":1}]
  useEffect(() => {
    if (prefillHandled.current) return;
    const raw = searchParams.get("prefill");
    if (!raw) return;
    prefillHandled.current = true;

    (async () => {
      try {
        const items = JSON.parse(decodeURIComponent(raw));
        if (!Array.isArray(items) || items.length === 0) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // Stash for after sign-in
          localStorage.setItem("cart_prefill_pending", JSON.stringify(items));
          toast.info("Please sign in to add the suggested items to your cart.");
          navigate("/auth?redirect=/cart");
          return;
        }

        for (const it of items) {
          if (it?.id) {
            await addToCart(it.id, {});
          }
        }
        toast.success("Items added to your cart");
      } catch (e) {
        console.error("Prefill failed", e);
      } finally {
        // Clean URL
        searchParams.delete("prefill");
        setSearchParams(searchParams, { replace: true });
      }
    })();
  }, [searchParams, navigate, addToCart, setSearchParams]);

  // After login, replay stashed prefill
  useEffect(() => {
    const pending = localStorage.getItem("cart_prefill_pending");
    if (!pending) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      try {
        const items = JSON.parse(pending);
        for (const it of items) {
          if (it?.id) await addToCart(it.id, {});
        }
        toast.success("Items added to your cart");
      } finally {
        localStorage.removeItem("cart_prefill_pending");
      }
    })();
  }, [addToCart]);
  
  const handleCheckout = () => {
    if (!checkoutUrl) {
      toast.error("Checkout is not ready yet. Please try again in a moment.");
      return;
    }
    window.open(checkoutUrl, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
      <SEOHead title={"Your Cart"} description={"Private page on Nyzora."} noIndex />
        <Header />
        <main className="flex-1 container py-12">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container px-4 sm:px-6 py-6 sm:py-12">
        <h1 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-8">Shopping Cart</h1>

        {cart.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-24 h-24 mx-auto mb-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some amazing furniture pieces to get started!</p>
            <Link to="/browse">
              <Button size="lg">Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex gap-3 sm:gap-6">
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-20 h-20 sm:w-32 sm:h-32 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-xl font-semibold mb-1 sm:mb-2 truncate">{item.product.name}</h3>
                        <p className="text-sm sm:text-lg text-primary font-semibold mb-2 sm:mb-4">
                          {formatPrice(item.product.designer_price)}
                        </p>
                        
                        {item.customizations && Object.keys(item.customizations).length > 0 && (
                          <div className="text-sm text-muted-foreground mb-4">
                            {item.customizations.finish && <p>Finish: {item.customizations.finish}</p>}
                            {item.customizations.filament && <p>Color: {item.customizations.filament}</p>}
                            {item.customizations.size && <p>Size: {item.customizations.size}</p>}
                            {item.customizations.engraved_text && (
                              <p className="truncate">Engraving: "{item.customizations.engraved_text}"</p>
                            )}
                            {item.customizations.gift_note && (
                              <p className="truncate">Gift note: "{item.customizations.gift_note}"</p>
                            )}
                          </div>
                        )}


                        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            >
                              -
                            </Button>
                            <span className="w-12 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardContent className="p-6">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Order Summary</h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span>Items ({cartCount})</span>
                      <span>{formatPrice(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping &amp; taxes</span>
                      <span className="text-muted-foreground">Calculated at checkout</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between text-xl font-bold">
                      <span>Subtotal</span>
                      <span>{formatPrice(cartTotal)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || isLoading || !checkoutUrl}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Proceed to Checkout
                  </Button>
                  <p className="mt-3 text-xs text-muted-foreground text-center">
                    Secure checkout. Shipping and taxes are calculated on the next step.
                  </p>
                  
                  <Link to="/browse" className="block mt-4">
                    <Button variant="outline" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Cart;
