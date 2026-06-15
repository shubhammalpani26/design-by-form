import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertTriangle } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { PurchaseCreditsDialog } from "./PurchaseCreditsDialog";

export const CreditBalance = () => {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPurchase, setShowPurchase] = useState(false);

  const fetchCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching credits:', error);
        return;
      }

      setCredits(data?.balance ?? 5);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();

    // Subscribe to credit changes
    const channel = supabase
      .channel('user-credits-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits'
        },
        () => {
          fetchCredits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // One-time low-credit toast per session
  useEffect(() => {
    if (credits === null) return;
    const key = "low-credits-toast-shown";
    const alreadyShown = sessionStorage.getItem(key);
    if (credits <= 3 && !alreadyShown) {
      if (credits <= 0) {
        sonnerToast.error("You're out of AI credits", {
          description: "Top up to keep generating designs.",
          action: { label: "Get credits", onClick: () => setShowPurchase(true) },
          duration: 8000,
        });
      } else {
        sonnerToast.warning(`Only ${credits} AI credit${credits === 1 ? "" : "s"} left`, {
          description: "Free credits don't refill — top up to keep creating.",
          action: { label: "Get credits", onClick: () => setShowPurchase(true) },
          duration: 8000,
        });
      }
      sessionStorage.setItem(key, "1");
    }
    if (credits > 3) {
      sessionStorage.removeItem(key);
    }
  }, [credits]);

  if (loading || credits === null) {
    return null;
  }

  const low = credits <= 3;

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => low && setShowPurchase(true)}
          className={`flex items-center gap-1 px-2 xl:px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
            low
              ? "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/15 cursor-pointer"
              : "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 cursor-default"
          }`}
        >
          {low ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Sparkles className="h-4 w-4 text-primary" />
          )}
          <span className="text-sm font-medium">
            <span className="xl:hidden">{credits}</span>
            <span className="hidden xl:inline">{credits} credits</span>
          </span>
        </button>
        {low && (
          <Button
            size="sm"
            onClick={() => setShowPurchase(true)}
            className="hidden xl:inline-flex bg-gradient-to-r from-primary to-primary/80"
          >
            Top up
          </Button>
        )}
      </div>

      <PurchaseCreditsDialog
        open={showPurchase}
        onOpenChange={setShowPurchase}
        onSuccess={fetchCredits}
      />
    </>
  );
};
