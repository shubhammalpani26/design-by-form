import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Sparkles, IndianRupee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";

interface QuickSellDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  category: string;
  prompt: string;
}

// Smart dimension defaults based on category
const suggestDimensionsForCategory = (category: string) => {
  const defaults: Record<string, { width: number; depth: number; height: number }> = {
    chairs: { width: 60, depth: 55, height: 85 },
    tables: { width: 120, depth: 80, height: 75 },
    benches: { width: 150, depth: 45, height: 45 },
    installations: { width: 200, depth: 200, height: 250 },
    "sculptural art": { width: 60, depth: 60, height: 120 },
    decor: { width: 30, depth: 30, height: 40 },
  };
  return defaults[category.toLowerCase()] || { width: 60, depth: 60, height: 60 };
};

// Calculate price based on dimensions (simplified pricing logic)
const calculateBasePrice = (dimensions: { width: number; depth: number; height: number }, category: string): number => {
  const volume = (dimensions.width * dimensions.depth * dimensions.height) / 1000000; // Convert to cubic meters
  const basePricePerCubicMeter = 150000; // ₹1.5L per cubic meter
  
  // Category multipliers
  const multipliers: Record<string, number> = {
    chairs: 1.2,
    tables: 1.0,
    benches: 0.9,
    installations: 1.5,
    "sculptural art": 1.8,
    decor: 1.3,
  };
  
  const multiplier = multipliers[category.toLowerCase()] || 1.0;
  const calculatedPrice = Math.round(volume * basePricePerCubicMeter * multiplier);
  
  // Minimum prices by category
  const minimums: Record<string, number> = {
    chairs: 15000,
    tables: 25000,
    benches: 20000,
    installations: 50000,
    "sculptural art": 30000,
    decor: 8000,
  };
  
  return Math.max(calculatedPrice, minimums[category.toLowerCase()] || 10000);
};

const QuickSellDialog = ({ isOpen, onClose, imageUrl, category, prompt }: QuickSellDialogProps) => {
  const navigate = useNavigate();
  const [productName, setProductName] = useState("");
  const [dimensions, setDimensions] = useState(suggestDimensionsForCategory(category));
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [designerProfile, setDesignerProfile] = useState<{ id: string } | null>(null);

  // Recalculate dimensions when category changes
  useEffect(() => {
    setDimensions(suggestDimensionsForCategory(category));
  }, [category]);

  // Check for designer profile on mount
  useEffect(() => {
    const checkDesignerProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('designer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .single();

      setDesignerProfile(profile);
    };

    if (isOpen) {
      checkDesignerProfile();
      generateProductName();
    }
  }, [isOpen, prompt, category]);

  const generateProductName = async () => {
    if (!prompt) return;
    
    setIsGeneratingName(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-product-title', {
        body: { prompt, category }
      });

      if (error) throw error;
      if (data?.title) {
        setProductName(data.title);
      }
    } catch (error) {
      console.error('Error generating name:', error);
      // Fallback to a simple name
      setProductName(`${category.charAt(0).toUpperCase() + category.slice(1)} Design`);
    } finally {
      setIsGeneratingName(false);
    }
  };

  const basePrice = calculateBasePrice(dimensions, category);
  const suggestedPrice = Math.round(basePrice * 1.2); // 20% margin for designer

  const handleSubmit = async () => {
    if (!productName.trim()) {
      toast.error("Please enter a product name");
      return;
    }

    if (!termsAccepted) {
      toast.error("Please accept the terms to continue");
      return;
    }

    if (!designerProfile) {
      toast.error("You need a verified designer profile to sell designs");
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate description
      const { data: descData } = await supabase.functions.invoke('generate-product-description', {
        body: { productName, category, dimensions }
      });

      const description = descData?.description || `A unique ${category} design created with AI.`;

      // Insert the product
      const { data: product, error: insertError } = await supabase
        .from('designer_products')
        .insert({
          name: productName,
          category: category.charAt(0).toUpperCase() + category.slice(1),
          description,
          image_url: imageUrl,
          base_price: basePrice,
          designer_price: suggestedPrice,
          designer_id: designerProfile.id,
          dimensions: dimensions,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success("Design submitted for review! 🎉");
      onClose();
      navigate('/designer-dashboard');
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || "Failed to submit design");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBecomeDesigner = () => {
    // Store the design data for after signup
    sessionStorage.setItem('pendingQuickSell', JSON.stringify({
      imageUrl,
      category,
      prompt,
      productName,
      dimensions
    }));
    onClose();
    navigate('/designer-signup');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Quick List Your Design
          </DialogTitle>
          <DialogDescription>
            List your AI-generated design for sale in seconds
          </DialogDescription>
        </DialogHeader>

        {/* Preview Image */}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-4">
          <img 
            src={imageUrl} 
            alt="Design preview" 
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 px-2 py-1 bg-primary/90 text-white text-xs rounded-full">
            {category}
          </div>
        </div>

        <div className="space-y-4">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="productName">Product Name</Label>
            <div className="relative">
              <Input
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Wave Lounge Chair"
                disabled={isGeneratingName}
              />
              {isGeneratingName && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Dimensions */}
          <div className="space-y-2">
            <Label>Dimensions (cm)</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="width" className="text-xs text-muted-foreground">Width</Label>
                <Input
                  id="width"
                  type="number"
                  value={dimensions.width}
                  onChange={(e) => setDimensions(prev => ({ ...prev, width: Number(e.target.value) }))}
                  min={10}
                  max={500}
                />
              </div>
              <div>
                <Label htmlFor="depth" className="text-xs text-muted-foreground">Depth</Label>
                <Input
                  id="depth"
                  type="number"
                  value={dimensions.depth}
                  onChange={(e) => setDimensions(prev => ({ ...prev, depth: Number(e.target.value) }))}
                  min={10}
                  max={500}
                />
              </div>
              <div>
                <Label htmlFor="height" className="text-xs text-muted-foreground">Height</Label>
                <Input
                  id="height"
                  type="number"
                  value={dimensions.height}
                  onChange={(e) => setDimensions(prev => ({ ...prev, height: Number(e.target.value) }))}
                  min={10}
                  max={500}
                />
              </div>
            </div>
          </div>

          {/* Price Preview */}
          <div className="p-3 bg-accent/50 rounded-lg space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Manufacturing Cost</span>
              <span className="flex items-center"><IndianRupee className="w-3 h-3" />{basePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Your Selling Price</span>
              <span className="flex items-center text-primary"><IndianRupee className="w-3 h-3" />{suggestedPrice.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              You earn ₹{(suggestedPrice - basePrice).toLocaleString()} per sale (adjustable in full studio)
            </p>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
            />
            <Label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
              I confirm this is my original AI-generated design and agree to the{" "}
              <Link to="/terms" className="text-primary hover:underline" target="_blank">
                terms of service
              </Link>
            </Label>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {designerProfile ? (
            <Button 
              variant="hero" 
              className="w-full" 
              onClick={handleSubmit}
              disabled={isSubmitting || !termsAccepted || !productName.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Submit for Review
                </>
              )}
            </Button>
          ) : (
            <Button 
              variant="hero" 
              className="w-full" 
              onClick={handleBecomeDesigner}
            >
              Become a Designer to Sell
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickSellDialog;
