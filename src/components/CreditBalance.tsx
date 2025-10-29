import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PurchaseCreditsDialog } from "./PurchaseCreditsDialog";

export const CreditBalance = () => {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPurchase, setShowPurchase] = useState(false);
  const { toast } = useToast();

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

      setCredits(data?.balance ?? 10);
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

  if (loading || credits === null) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-primary/10 to-primary/5 rounded-full border border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{credits} credits</span>
        </div>
        {credits < 5 && (
          <Button
            size="sm"
            onClick={() => setShowPurchase(true)}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            Get More
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
