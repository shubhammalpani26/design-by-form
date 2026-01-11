import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Store, User, Loader2 } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface IntentSelectionDialogProps {
  isOpen: boolean;
  onSelect: (intent: 'designer' | 'personal') => void;
}

export const IntentSelectionDialog = ({ isOpen, onSelect }: IntentSelectionDialogProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatPrice, currency } = useCurrency();
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  
  // Listing fee: ₹1,000 for India, $10 USD equivalent for international
  const feeInINR = currency === 'INR' ? 1000 : 10 / 0.012; // $10 USD = ~833 INR
  const displayFee = formatPrice(feeInINR);

  const handleDesignerSelect = async () => {
    setIsCheckingProfile(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to sell designs.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Check if user has an approved designer profile
      const { data: profile, error } = await supabase
        .from("designer_profiles")
        .select("id, status, terms_accepted")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking designer profile:', error);
      }

      if (!profile || !profile.terms_accepted) {
        // No profile or terms not accepted - redirect to onboarding
        // Save current intent so we can return to design studio after onboarding
        localStorage.setItem('pending-design-intent', 'designer');
        
        toast({
          title: "Complete Designer Registration",
          description: "Let's set up your designer profile first, then you can create designs to sell.",
        });
        
        navigate('/designer-onboarding');
        return;
      }

      if (profile.status !== 'approved') {
        toast({
          title: "Profile Under Review",
          description: "Your designer profile is pending approval. We'll notify you once it's approved.",
          variant: "destructive",
        });
        return;
      }

      // Profile exists and is approved - proceed with designer mode
      onSelect('designer');
      
    } catch (error) {
      console.error('Error checking designer profile:', error);
      toast({
        title: "Error",
        description: "Could not verify designer status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingProfile(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onSelect && onSelect(null as any)}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">What brings you here today?</DialogTitle>
          <DialogDescription className="text-center text-base">
            Choose how you'd like to proceed with your furniture design
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <button
            onClick={handleDesignerSelect}
            disabled={isCheckingProfile}
            className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-all p-6 text-left bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-wait"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                {isCheckingProfile ? (
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                ) : (
                  <Store className="w-8 h-8 text-primary" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Create to Sell</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  List your design in our marketplace and earn on every sale
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Become a verified designer</li>
                  <li>• Pay listing fee ({displayFee})*</li>
                  <li>• Earn 70% of your markup on every sale</li>
                  <li>• Platform fees waived initially*</li>
                  <li>• Public marketplace listing</li>
                </ul>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelect('personal')}
            disabled={isCheckingProfile}
            className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-all p-6 text-left bg-card hover:bg-accent disabled:opacity-50"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Create for Personal Use</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Design custom furniture just for yourself, no public listing
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Skip designer onboarding</li>
                  <li>• Professional feasibility review ({displayFee})</li>
                  <li>• Expert manufacturing assessment</li>
                  <li>• Private design, not listed publicly</li>
                  <li>• Direct to production after approval</li>
                </ul>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-xs text-center text-muted-foreground">
            * Listing fees currently waived. You earn 70% of markup on every sale.
          </p>
          <p className="text-xs text-center text-muted-foreground">
            You can always become a designer later if you choose personal use
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
