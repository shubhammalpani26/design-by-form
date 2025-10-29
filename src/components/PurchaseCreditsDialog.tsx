import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Package {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular?: boolean;
}

const packages: Package[] = [
  { id: 'basic', name: 'Starter', credits: 10, price: 299 },
  { id: 'standard', name: 'Creator', credits: 20, price: 499, popular: true },
  { id: 'premium', name: 'Pro', credits: 50, price: 999 },
];

interface PurchaseCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const PurchaseCreditsDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: PurchaseCreditsDialogProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePurchase = async (packageType: string) => {
    setLoading(packageType);
    try {
      const { data, error } = await supabase.functions.invoke('purchase-credits', {
        body: { packageType }
      });

      if (error) throw error;

      toast({
        title: "Credits Purchased!",
        description: `Successfully added ${data.credits} credits to your account.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "Failed to purchase credits",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Get More Credits
          </DialogTitle>
          <DialogDescription>
            Choose a credit package to continue creating amazing designs
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                pkg.popular
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                  Most Popular
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{pkg.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {pkg.credits} AI generation credits
                  </p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-bold">₹{pkg.price}</span>
                    <span className="text-sm text-muted-foreground">
                      (~₹{Math.round(pkg.price / pkg.credits)}/credit)
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={loading !== null}
                  className={pkg.popular ? 'bg-primary' : ''}
                >
                  {loading === pkg.id ? 'Processing...' : 'Buy Now'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-muted p-4 space-y-2">
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-primary mt-0.5" />
            <p className="text-sm text-muted-foreground">
              10 free credits every month for all users
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-primary mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Credits never expire - use them anytime
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-primary mt-0.5" />
            <p className="text-sm text-muted-foreground">
              1 credit = 1 AI-generated furniture design
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
