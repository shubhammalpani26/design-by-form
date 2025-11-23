import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ListingFeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  onSuccess: () => void;
  isPersonalMode?: boolean;
}

export const ListingFeeDialog = ({
  open,
  onOpenChange,
  productId,
  onSuccess,
  isPersonalMode = false,
}: ListingFeeDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState("IN");
  const { toast } = useToast();

  const isInternational = country !== "IN";
  const fee = isInternational ? 15 : 1000; // $15 USD or Rs. 1,000
  const currency = isInternational ? "USD" : "INR";
  const symbol = isInternational ? "$" : "₹";

  const handlePayment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('pay-listing-fee', {
        body: {
          productId,
          paymentMethod: 'mock', // In production: stripe/razorpay
          country,
        }
      });

      if (error) throw error;

      toast({
        title: "Payment Successful!",
        description: data.message || "Your design is now under review.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const dialogTitle = isPersonalMode ? "Design Assessment Fee" : "Listing Fee";
  const dialogDescription = isPersonalMode 
    ? "One-time fee to assess your design for manufacturing feasibility" 
    : "One-time fee to list your design on our marketplace";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Country Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Your Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="IN">India</option>
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Fee Display */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                {isPersonalMode ? "Assessment Fee" : "Listing Fee"}
              </span>
              <div className="flex items-center gap-1">
                <DollarSign className="w-5 h-5 text-muted-foreground line-through" />
                <span className="text-xl text-muted-foreground line-through mr-2">
                  {symbol}{fee}
                </span>
                <span className="text-2xl font-bold text-primary">
                  {symbol}0
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground">
                One-time fee • No monthly charges{!isPersonalMode && ' • Keep 100% of your markup'}
              </span>
              <span className="text-green-600 font-semibold">100% OFF</span>
            </div>
            <p className="text-xs text-primary font-medium">
              🎉 Free for all creators during our launch phase!
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">What You Get:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{isPersonalMode ? 'Manufacturing feasibility review' : 'Your design listed on our global marketplace'}</span>
              </li>
              {!isPersonalMode && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>AI-generated product photos from multiple angles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Complete Success Kit with social media templates & captions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Trackable product links for marketing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Earn on every sale (your markup + 5% commission)*</span>
                  </li>
                </>
              )}
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Manufacturing quality check & approval</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Professional product photography</span>
              </li>
              {!isPersonalMode && (
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Marketing to our customer base</span>
                </li>
              )}
              {isPersonalMode && (
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Private design - not listed publicly</span>
                </li>
              )}
            </ul>
            <div className="mt-3 p-2 bg-accent/20 rounded text-xs text-muted-foreground">
              <p><strong>Optional:</strong> Add 3D model & AR preview for an additional fee</p>
            </div>
          </div>

          {/* Payment Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Processing..." : "Submit Design"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
