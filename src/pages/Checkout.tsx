import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCurrency } from "@/contexts/CurrencyContext";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [planDetails, setPlanDetails] = useState<any>(null);

  const planType = searchParams.get("plan");
  const billingCycle = searchParams.get("cycle") || "monthly";

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (planType) {
      // Prices in INR to match Plans page
      const plans: any = {
        creator: {
          name: "Creator",
          monthly: { price: 2999, listings: 5, models: 5 },
          yearly: { price: 29990, listings: 5, models: 5 }
        },
        pro: {
          name: "Pro Studio",
          monthly: { price: 9999, listings: 20, models: 20 },
          yearly: { price: 99990, listings: 20, models: 20 }
        }
      };

      const plan = plans[planType];
      if (plan) {
        setPlanDetails({
          ...plan,
          ...(plan[billingCycle as keyof typeof plan.monthly] as object)
        });
      }
    }
  }, [planType, billingCycle]);

  const handleCheckout = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to continue");
        navigate("/auth");
        return;
      }

      // Create subscription
      const { data, error } = await supabase.functions.invoke('create-razorpay-subscription', {
        body: { planType, billingCycle }
      });

      if (error) throw error;

      const options = {
        key: data.razorpayKeyId,
        subscription_id: data.subscriptionId,
        name: "Fractal Furniture",
        description: `${planDetails?.name} Plan - ${billingCycle}`,
        handler: async function (response: any) {
          try {
            // Verify payment
            const { error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              }
            });

            if (verifyError) throw verifyError;

            toast.success("Subscription activated successfully!");
            navigate("/designer-dashboard");
          } catch (err: any) {
            toast.error(err.message || "Payment verification failed");
          }
        },
        prefill: {
          email: session.user.email,
        },
        theme: {
          color: "#8B5CF6"
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Failed to initiate checkout");
    } finally {
      setLoading(false);
    }
  };

  if (!planType || !planDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Invalid plan selected</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Subscription</CardTitle>
              <CardDescription>
                Review your plan details and proceed to payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Plan:</span>
                  <span>{planDetails.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Billing Cycle:</span>
                  <span className="capitalize">{billingCycle}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Design Listings:</span>
                  <span>{planDetails.listings}/month</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">3D Models:</span>
                  <span>{planDetails.models}/month</span>
                </div>
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatPrice(planDetails.price)}/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleCheckout} 
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Proceed to Payment"
                )}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Secure payment powered by Razorpay
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;