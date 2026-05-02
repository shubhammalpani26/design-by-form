import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import { ScrollReveal } from "@/hooks/useScrollReveal";

const Plans = () => {
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      name: "Free",
      priceMonthly: 0,
      priceYearly: 0,
      description: "Try the platform, no commitment.",
      features: [
        "10 AI designs included",
        "Basic AI design tools",
        "Standard product photos",
        "Listing fees waived during early access*",
        "3D models free during early access*",
        "Community support",
        "7-day design review",
      ],
      cta: "Get Started Free",
      popular: false,
    },
    {
      name: "Creator",
      priceMonthly: 2999,
      priceYearly: 29990,
      description: "Free during early access — for serious furniture designers.",
      features: [
        "Unlimited designs",
        "Unlimited listings (early access)*",
        "Unlimited 3D models (early access)*",
        "Advanced AI design tools",
        "Premium product photography",
        "Priority 3-day review",
        "Creator badge",
        "Analytics dashboard",
        "Email support",
      ],
      cta: "Start Creating — Free",
      popular: true,
    },
    {
      name: "Pro Studio",
      priceMonthly: 9999,
      priceYearly: 99990,
      description: "Free during early access — for design studios & agencies.",
      features: [
        "Everything in Creator",
        "Unlimited listings (early access)*",
        "Unlimited 3D models (early access)*",
        "Unlimited team members",
        "White-label options",
        "Custom branding",
        "Same-day priority review",
        "Dedicated account manager",
        "Phone & priority support",
      ],
      cta: "Get Pro Studio — Free",
      popular: false,
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
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Pricing Plans — Nyzora"
        description="Start free, upgrade as you grow. All plans include AI design tools and access to verified manufacturers."
        keywords={["pricing", "plans", "AI design pricing", "creator plans", "furniture design subscription"]}
        url="https://nyzora.ai/plans"
      />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-24 md:py-36 overflow-hidden">
          <div className="absolute inset-0 bg-[hsl(var(--primary))]" />
          <div className="container relative z-10">
            <ScrollReveal animation="fade-up">
              <div className="max-w-3xl">
                <p className="text-primary-foreground/40 text-xs font-medium uppercase tracking-[0.3em] mb-6">
                  Pricing
                </p>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-[0.95] tracking-tight mb-8">
                  Simple Plans,<br />
                  <span className="font-light italic">Real Value</span>
                </h1>
                <p className="text-primary-foreground/50 text-base md:text-lg max-w-lg leading-relaxed">
                  We're in early access — every plan, every feature, completely free right now.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Early Access Banner */}
        <section className="border-b border-border bg-accent/40">
          <div className="container py-5">
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 text-center">
              <span className="inline-block text-[10px] uppercase tracking-[0.25em] text-primary font-semibold px-2 py-1 border border-primary/30 rounded-full">
                Early Access
              </span>
              <p className="text-sm md:text-base text-foreground">
                All plans and features are <span className="font-semibold">free right now</span> while we're in our initial phase. No card required.
              </p>
            </div>
          </div>
        </section>

        {/* Billing toggle */}
        <section className="py-12">
          <div className="container">
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm ${billingCycle === "monthly" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                className="relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                style={{ backgroundColor: billingCycle === "yearly" ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-primary-foreground transition-transform ${
                    billingCycle === "yearly" ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
              <span className={`text-sm ${billingCycle === "yearly" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                Yearly
                {billingCycle === "yearly" && (
                  <span className="ml-2 text-xs text-primary font-medium">Save up to 17%</span>
                )}
              </span>
            </div>
          </div>
        </section>

        {/* Plans grid */}
        <section className="pb-20 md:pb-28">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border max-w-5xl mx-auto rounded-xl overflow-hidden">
              {plans.map((plan) => {
                const savings = calculateSavings(plan.priceMonthly, plan.priceYearly);

                return (
                  <div
                    key={plan.name}
                    className={`bg-background p-8 md:p-10 flex flex-col ${
                      plan.popular ? "relative" : ""
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
                    )}

                    <div className="mb-8">
                      <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.2em] mb-2">
                        {plan.popular ? "Most Popular" : "\u00A0"}
                      </p>
                      <h3 className="text-xl font-semibold text-foreground tracking-tight mb-1">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>

                    <div className="mb-8">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                          {calculatePrice(plan.priceMonthly, plan.priceYearly)}
                        </span>
                        {plan.priceMonthly > 0 && (
                          <span className="text-sm text-muted-foreground">/mo</span>
                        )}
                      </div>
                      {billingCycle === "yearly" && savings && (
                        <p className="text-xs text-primary mt-1">Save {savings}% yearly</p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-10 flex-1">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full rounded-full ${plan.popular ? "" : ""}`}
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => {
                        if (plan.name === "Free") {
                          navigate("/auth");
                        } else {
                          const planType = plan.name === "Creator" ? "creator" : "pro";
                          navigate(`/checkout?plan=${planType}&cycle=${billingCycle}`);
                        }
                      }}
                    >
                      {plan.cta}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3D pricing comparison */}
        <section className="py-16 md:py-24 bg-accent">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-4 text-center">
                3D Model Pricing
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight mb-12 text-center">
                Cost per 3D model, by plan
              </h2>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border max-w-3xl mx-auto rounded-xl overflow-hidden">
              {[
                { plan: "Free", price: 500, note: "per 3D model", tag: null },
                { plan: "Creator", price: 300, note: "after 5 free / month", tag: "40% savings" },
                { plan: "Pro Studio", price: 200, note: "after 20 free / month", tag: "60% savings" },
              ].map((item) => (
                <div key={item.plan} className="bg-background p-8 md:p-10 text-center">
                  <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.2em] mb-3">{item.plan}</p>
                  <p className="text-3xl font-bold text-foreground tracking-tight mb-1">{formatPrice(item.price)}</p>
                  <p className="text-xs text-muted-foreground mb-2">{item.note}</p>
                  {item.tag && (
                    <span className="inline-block text-[10px] uppercase tracking-wider text-primary font-medium">
                      {item.tag}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground/50 mt-6">
              *Listing fees currently waived during our initial phase
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 md:py-28">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-4 text-center">FAQ</p>
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight mb-12 text-center">
                Common Questions
              </h2>
            </ScrollReveal>
            <div className="max-w-2xl mx-auto space-y-0 border-t border-border">
              {[
                {
                  q: "What happens when I run out of free 3D models?",
                  a: `You can purchase additional 3D models at your plan's per-model rate. Creator plan members pay ${formatPrice(300)} per model, while Pro Studio members pay ${formatPrice(200)} per model.`,
                },
                {
                  q: "Can I upgrade or downgrade anytime?",
                  a: "Yes. When upgrading, you're charged the prorated amount. When downgrading, the new plan takes effect at the next billing cycle.",
                },
                {
                  q: "Do unused 3D model credits roll over?",
                  a: "No, unused credits reset each month. However, any additional models you purchase separately never expire.",
                },
                {
                  q: "What payment methods do you accept?",
                  a: "We accept all major credit cards, debit cards, and UPI payments for Indian customers. International payments are processed through Stripe.",
                },
              ].map((faq) => (
                <div key={faq.q} className="py-6 border-b border-border">
                  <h3 className="text-base font-semibold text-foreground tracking-tight mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20 border-t border-border">
          <div className="container">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                  Still have questions?
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Our team is here to help you find the right plan.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="default"
                  className="rounded-full"
                  onClick={() => navigate("/auth")}
                >
                  Start Free <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => navigate("/contact")}
                >
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Plans;
