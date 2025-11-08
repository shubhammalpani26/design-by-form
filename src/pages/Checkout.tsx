import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";
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
      // Prices and features in INR to match Plans page exactly
      const plans: any = {
        creator: {
          name: "Creator",
          icon: "⚡",
          description: "For serious furniture designers",
          monthly: { 
            price: 2999,
            features: [
              "Unlimited AI designs",
              "5 free listings per month",
              "Additional listings at ₹500 each",
              "5 free 3D models per month",
              "Additional models at ₹300 each",
              "Advanced AI design tools",
              "Premium product photography",
              "Priority 3-day review",
              "Creator badge",
              "Analytics dashboard",
              "Email support"
            ]
          },
          yearly: { 
            price: 29990,
            features: [
              "Unlimited AI designs",
              "5 free listings per month",
              "Additional listings at ₹500 each",
              "5 free 3D models per month",
              "Additional models at ₹300 each",
              "Advanced AI design tools",
              "Premium product photography",
              "Priority 3-day review",
              "Creator badge",
              "Analytics dashboard",
              "Email support"
            ]
          }
        },
        pro: {
          name: "Pro Studio",
          icon: "👑",
          description: "For design studios & agencies",
          monthly: { 
            price: 9999,
            features: [
              "Everything in Creator",
              "Unlimited listings included",
              "20 free 3D models per month",
              "Additional models at ₹200 each",
              "Unlimited team members",
              "White-label options",
              "Custom branding",
              "Same-day priority review",
              "Dedicated account manager",
              "Phone & priority support",
              "Quarterly business reviews"
            ]
          },
          yearly: { 
            price: 99990,
            features: [
              "Everything in Creator",
              "Unlimited listings included",
              "20 free 3D models per month",
              "Additional models at ₹200 each",
              "Unlimited team members",
              "White-label options",
              "Custom branding",
              "Same-day priority review",
              "Dedicated account manager",
              "Phone & priority support",
              "Quarterly business reviews"
            ]
          }
        }
      };

      const plan = plans[planType];
      if (plan) {
        setPlanDetails({
          name: plan.name,
          icon: plan.icon,
          description: plan.description,
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
              {/* Plan Header */}
              <div className="flex items-center gap-3 pb-4 border-b">
                <span className="text-3xl">{planDetails.icon}</span>
                <div>
                  <h3 className="text-xl font-bold">{planDetails.name}</h3>
                  <p className="text-sm text-muted-foreground">{planDetails.description}</p>
                </div>
              </div>

              {/* Billing Info */}
              <div className="bg-primary/5 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Billing Cycle</span>
                  <span className="font-semibold capitalize">{billingCycle}</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/50">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(planDetails.price)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Features List */}
              <div>
                <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                  What's Included
                </h4>
                <ul className="space-y-2">
                  {planDetails.features?.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
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