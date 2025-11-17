import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount, isLoading, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  
  // Checkout form state
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    gstin: ""
  });

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
  ];

  const handleCheckout = async () => {
    // Validate form
    if (!checkoutForm.name || !checkoutForm.address || !checkoutForm.city || 
        !checkoutForm.state || !checkoutForm.zipCode || !checkoutForm.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCheckingOut(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("create-order", {
        body: {
          shippingAddress: {
            name: checkoutForm.name,
            address: checkoutForm.address,
            city: checkoutForm.city,
            state: checkoutForm.state,
            zipCode: checkoutForm.zipCode,
            phone: checkoutForm.phone
          },
          paymentMethod: "razorpay",
          paymentId: `pay_${Date.now()}`,
          customerGSTIN: checkoutForm.gstin || undefined,
          customerState: checkoutForm.state
        }
      });

      if (error) throw error;

      toast.success("Order placed successfully! You can download your invoice from order history.");
      await clearCart();
      setShowCheckoutDialog(false);
      navigate("/order-history");
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Failed to place order");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
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
      
      <main className="flex-1 container py-12">
        <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

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
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{item.product.name}</h3>
                        <p className="text-lg text-primary font-semibold mb-4">
                          {formatPrice(item.product.designer_price)}
                        </p>
                        
                        {item.customizations && Object.keys(item.customizations).length > 0 && (
                          <div className="text-sm text-muted-foreground mb-4">
                            {item.customizations.finish && <p>Finish: {item.customizations.finish}</p>}
                            {item.customizations.size && <p>Size: {item.customizations.size}</p>}
                          </div>
                        )}

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
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
                  <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span>Items ({cartCount})</span>
                      <span>{formatPrice(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="text-green-600">FREE</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span>{formatPrice(cartTotal)}</span>
                    </div>
                  </div>

                  <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full" size="lg">
                        Proceed to Checkout
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Checkout - Shipping Details</DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                              id="name"
                              value={checkoutForm.name}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                              placeholder="John Doe"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input
                              id="phone"
                              value={checkoutForm.phone}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                              placeholder="+91 9876543210"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address">Address *</Label>
                          <Input
                            id="address"
                            value={checkoutForm.address}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                            placeholder="123 Main Street, Apartment 4B"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">City *</Label>
                            <Input
                              id="city"
                              value={checkoutForm.city}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                              placeholder="Mumbai"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="zipCode">Pin Code *</Label>
                            <Input
                              id="zipCode"
                              value={checkoutForm.zipCode}
                              onChange={(e) => setCheckoutForm({ ...checkoutForm, zipCode: e.target.value })}
                              placeholder="400001"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="state">State *</Label>
                          <Select
                            value={checkoutForm.state}
                            onValueChange={(value) => setCheckoutForm({ ...checkoutForm, state: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                            <SelectContent>
                              {indianStates.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="gstin">GSTIN (Optional - for businesses)</Label>
                          <Input
                            id="gstin"
                            value={checkoutForm.gstin}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, gstin: e.target.value })}
                            placeholder="22AAAAA0000A1Z5"
                          />
                          <p className="text-sm text-muted-foreground">
                            Enter your GSTIN if you need a GST invoice for business purposes
                          </p>
                        </div>

                        <div className="border-t pt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Subtotal</span>
                            <span>{formatPrice(cartTotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>GST @ 18%</span>
                            <span>{formatPrice(cartTotal * 0.18)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total (incl. GST)</span>
                            <span>{formatPrice(cartTotal * 1.18)}</span>
                          </div>
                        </div>

                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={handleCheckout}
                          disabled={isCheckingOut}
                        >
                          {isCheckingOut ? "Processing..." : "Place Order"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
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
