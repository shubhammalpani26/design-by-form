import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Store, User } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface IntentSelectionDialogProps {
  isOpen: boolean;
  onSelect: (intent: 'designer' | 'personal') => void;
}

export const IntentSelectionDialog = ({ isOpen, onSelect }: IntentSelectionDialogProps) => {
  const { formatPrice, currency } = useCurrency();
  
  // Listing fee: ₹1,000 for India, $10 USD equivalent for international
  const feeInINR = currency === 'INR' ? 1000 : 10 / 0.012; // $10 USD = ~833 INR
  const displayFee = formatPrice(feeInINR);

  // Let users explore the studio freely - profile check happens at submission time
  const handleDesignerSelect = () => {
    onSelect('designer');
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
            className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-all p-6 text-left bg-card hover:bg-accent"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Store className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Create & List</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Publish your design to our marketplace and earn royalties
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Join as a verified creator</li>
                  <li>• Listing fee ({displayFee})*</li>
                  <li>• Earn 70% of your markup per sale</li>
                  <li>• Platform fees waived initially*</li>
                  <li>• Featured in public catalogue</li>
                </ul>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelect('personal')}
            className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-all p-6 text-left bg-card hover:bg-accent"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Get a Quote</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get a manufacturing quote for your custom design
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• No creator profile required</li>
                  <li>• Free feasibility assessment</li>
                  <li>• Custom manufacturing quote</li>
                  <li>• Private, one-of-a-kind piece</li>
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
