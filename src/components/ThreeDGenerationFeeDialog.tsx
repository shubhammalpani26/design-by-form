import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ThreeDGenerationFeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  onSuccess: () => void;
}

export const ThreeDGenerationFeeDialog = ({
  open,
  onOpenChange,
  productId,
  onSuccess,
}: ThreeDGenerationFeeDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState("IN");
  const { toast } = useToast();

  const isInternational = country !== "IN";
  const fee = isInternational ? 15 : 750;
  const currency = isInternational ? "USD" : "INR";
  const symbol = isInternational ? "$" : "₹";

  const handlePayment = async () => {
    setLoading(true);
    try {
      // If productId is "preview", this is a pre-submission payment
      // Just mark as paid locally without backend call
      if (productId === "preview") {
        toast({
          title: "3D Generation Enabled!",
          description: "You can now generate 3D models for your design.",
        });
        onSuccess();
        onOpenChange(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('pay-3d-generation-fee', {
        body: {
          productId,
          paymentMethod: 'mock', // In production: stripe/razorpay
          country,
        }
      });

      if (error) throw error;

      toast({
        title: "Payment Successful!",
        description: data.message || "3D generation is now available for your design.",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Enable 3D Model Generation
          </DialogTitle>
          <DialogDescription>
            Unlock 3D model generation and AR preview for your design
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
              <span className="text-sm font-medium text-foreground">3D Generation Fee</span>
              <div className="flex items-center gap-1">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold text-primary">
                  {symbol}{fee}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              One-time fee per design • High-quality 3D model • AR preview enabled
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">What You Get:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Professional 3D model generation via Meshy API</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Interactive AR preview for customers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>360° product visualization</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Higher conversion rates with immersive experience</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Stand out from 2D-only listings</span>
              </li>
            </ul>
          </div>

          {/* Payment Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Skip (2D Only)
            </Button>
            <Button
              onClick={handlePayment}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Processing..." : "Enable 3D Model"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
