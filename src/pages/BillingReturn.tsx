import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, Check } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";

const BillingReturn = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [settled, setSettled] = useState(false);

  // Fulfilment happens in the webhook, so poll briefly for the state to land.
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: sub }, { data: purchase }] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", user.id)
          .eq("environment", getStripeEnvironment())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("credit_purchases")
          .select("id")
          .eq("stripe_session_id", sessionId)
          .maybeSingle(),
      ]);

      if (cancelled) return;
      if (purchase || (sub && ["active", "trialing"].includes(sub.status))) {
        setSettled(true);
        return;
      }
      if (++attempts < 8) setTimeout(poll, 1500);
      else setSettled(true);
    };

    poll();
    return () => { cancelled = true; };
  }, [sessionId]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead title="Payment complete" description="Your Nyzora payment confirmation." noIndex />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-md mx-auto text-center border border-border p-10">
          {!sessionId ? (
            <p className="text-muted-foreground">No payment information found.</p>
          ) : settled ? (
            <>
              <Check className="h-10 w-10 mx-auto mb-6" strokeWidth={1.25} />
              <h1 className="text-2xl font-semibold mb-3">Payment received</h1>
              <p className="text-sm text-muted-foreground mb-8">
                Your plan and credits are now active on your account.
              </p>
              <Button asChild className="w-full">
                <Link to="/designer-dashboard">Go to dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              <Loader2 className="h-8 w-8 mx-auto mb-6 animate-spin" />
              <p className="text-sm text-muted-foreground">Confirming your payment…</p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BillingReturn;
