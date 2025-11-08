import { useState } from "react";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useNavigate } from "react-router-dom";

const Plans = () => {
  const { formatPrice, currency } = useCurrency();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // Prices in INR
  const plans = [
    {
      name: "Free",
      icon: Sparkles,
      priceMonthly: 0,
      priceYearly: 0,
      description: "Perfect for trying out the platform",
      features: [
        "10 AI designs included",
        "Basic AI design tools",
        "Standard product photos",
        "Pay ₹1,000 per listing",
        "Pay ₹500 per 3D model",
        "Community support",
        "7-day design review",
      ],
      cta: "Get Started Free",
      popular: false,
      color: "text-muted-foreground",
    },
    {
      name: "Creator",
      icon: Zap,
      priceMonthly: 2999,
      priceYearly: 29990,
      description: "For serious furniture designers",
      features: [
        "Unlimited designs",
        "5 free listings per month",
        "Additional listings at ₹500 each",
        "5 free 3D models per month",
        "Additional models at ₹300 each",
        "Advanced AI design tools",
        "Premium product photography",
        "Priority 3-day review",
        "Creator badge",
        "Analytics dashboard",
        "Email support",
      ],
      cta: "Start Creating",
      popular: true,
      color: "text-primary",
    },
    {
      name: "Pro Studio",
      icon: Crown,
      priceMonthly: 9999,
      priceYearly: 99990,
      description: "For design studios & agencies",
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
        "Quarterly business reviews",
      ],
      cta: "Get Pro Studio",
      popular: false,
      color: "text-accent",
    },
  ];

  const calculatePrice = (monthlyPrice: number, yearlyPrice: number) => {
    if (monthlyPrice === 0) return formatPrice(0);
    
    const price = billingCycle === "monthly" ? monthlyPrice : yearlyPrice / 12;
    return formatPrice(price);
  };

  const calculateSavings = (monthlyPrice: number, yearlyPrice: number) => {
    if (monthlyPrice === 0) return null;
    const monthlyCost = monthlyPrice * 12;
    const savings = ((monthlyCost - yearlyPrice) / monthlyCost) * 100;
    return Math.round(savings);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-accent/20">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <Badge variant="secondary" className="mb-4">
            Pricing Plans
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Start free, upgrade as you grow. All plans include our powerful AI design tools.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={billingCycle === "monthly" ? "font-semibold" : "text-muted-foreground"}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
              className="relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              style={{ backgroundColor: billingCycle === "yearly" ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === "yearly" ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
            <span className={billingCycle === "yearly" ? "font-semibold" : "text-muted-foreground"}>
              Yearly
              {billingCycle === "yearly" && (
                <Badge variant="default" className="ml-2">Save up to 17%</Badge>
              )}
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const savings = calculateSavings(plan.priceMonthly, plan.priceYearly);
            
            return (
              <Card
                key={plan.name}
                className={`relative transition-all hover:shadow-xl ${
                  plan.popular 
                    ? "border-primary shadow-lg scale-105 md:scale-110" 
                    : "border-border"
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <div className={`mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit ${plan.color}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                  
                  <div className="mt-6">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-bold">
                        {calculatePrice(plan.priceMonthly, plan.priceYearly)}
                      </span>
                      {plan.priceMonthly > 0 && (
                        <span className="text-muted-foreground">/month</span>
                      )}
                    </div>
                    {billingCycle === "yearly" && plan.priceMonthly > 0 && savings && (
                      <p className="text-sm text-primary mt-2">
                        Save {savings}% with yearly billing
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => {
                      if (plan.name === "Free") {
                        navigate("/auth");
                      } else {
                        // For Creator and Pro Studio, navigate to checkout
                        // TODO: Implement Stripe checkout
                        navigate("/auth");
                      }
                    }}
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* 3D Model Pricing Comparison */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">3D Model Generation Pricing</CardTitle>
              <CardDescription>
                Compare the cost per 3D model across plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground mb-2">Free Plan</p>
                  <p className="text-3xl font-bold mb-1">{formatPrice(500)}</p>
                  <p className="text-sm text-muted-foreground">per 3D model</p>
                </div>
                <div className="text-center p-6 rounded-lg bg-primary/10 border-2 border-primary">
                  <p className="text-sm text-primary mb-2">Creator Plan</p>
                  <p className="text-3xl font-bold mb-1">{formatPrice(300)}</p>
                  <p className="text-sm text-muted-foreground">after 5 free/month</p>
                  <Badge variant="default" className="mt-2">40% savings</Badge>
                </div>
                <div className="text-center p-6 rounded-lg bg-accent/10">
                  <p className="text-sm text-muted-foreground mb-2">Pro Studio</p>
                  <p className="text-3xl font-bold mb-1">{formatPrice(200)}</p>
                  <p className="text-sm text-muted-foreground">after 20 free/month</p>
                  <Badge variant="secondary" className="mt-2">60% savings</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens when I run out of free 3D models?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You can purchase additional 3D models at your plan's per-model rate. Creator plan members pay {formatPrice(300)} per model, while Pro Studio members pay {formatPrice(200)} per model.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I upgrade or downgrade anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated amount. When downgrading, your new plan takes effect at the next billing cycle.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do unused 3D model credits roll over?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No, unused 3D model credits reset each month. However, any additional models you purchase separately never expire.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We accept all major credit cards, debit cards, and UPI payments for Indian customers. International payments are processed through Stripe.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">Still have questions?</CardTitle>
              <CardDescription>Our team is here to help you choose the right plan</CardDescription>
            </CardHeader>
            <CardFooter className="justify-center gap-4">
              <Button variant="outline" onClick={() => navigate("/contact")}>
                Contact Sales
              </Button>
              <Button onClick={() => navigate("/auth")}>
                Start Free Trial
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Plans;