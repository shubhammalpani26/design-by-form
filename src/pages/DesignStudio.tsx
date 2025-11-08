import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { ModelViewer3D } from "@/components/ModelViewer3D";
import { ARViewer } from "@/components/ARViewer";
import { DesignerGuide, HelpButton } from "@/components/DesignerGuide";
import { ListingFeeDialog } from "@/components/ListingFeeDialog";
import { ThreeDGenerationFeeDialog } from "@/components/ThreeDGenerationFeeDialog";
import { IntentSelectionDialog } from "@/components/IntentSelectionDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { designSubmissionSchema } from "@/lib/validations";
import type { User, Session } from "@supabase/supabase-js";
import { applyColorTransformToFurniture } from "@/lib/colorTransform";

const DesignStudio = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDesign, setGeneratedDesign] = useState<string | null>(null);
  const [generated3DModel, setGenerated3DModel] = useState<string | null>(null);
  const [generatedVariations, setGeneratedVariations] = useState<Array<{
    imageUrl: string;
    modelUrl?: string;
    taskId?: string;
    pricing?: {
      basePrice: number;
      complexity: string;
      pricePerCubicFoot: number;
      reasoning: string;
    };
    colorVariations?: Record<string, Record<string, string>>; // color -> finish -> imageUrl
  }>>([]);
  const [polling3DStatus, setPolling3DStatus] = useState<Record<number, boolean>>({});
  const [model3DProgress, setModel3DProgress] = useState<Record<number, number>>({});
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<"2d" | "3d" | "ar">("2d");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [roomImage, setRoomImage] = useState<File | null>(null);
  const [roomImagePreview, setRoomImagePreview] = useState<string | null>(null);
  const [furnitureType, setFurnitureType] = useState<string>("");
  const [isRoomSectionOpen, setIsRoomSectionOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [currentPricing, setCurrentPricing] = useState<{
    basePrice: number;
    complexity: string;
    pricePerCubicFoot: number;
    reasoning: string;
  } | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [leadTime, setLeadTime] = useState<number | null>(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appliedCSSFilter, setAppliedCSSFilter] = useState<string>("");
  const [isUsingFilter, setIsUsingFilter] = useState(false);
  const [dimensions, setDimensions] = useState({
    length: "",
    breadth: "",
    height: ""
  });
  // Store dimensions per variation to prevent cross-contamination
  const [variationDimensions, setVariationDimensions] = useState<Record<number, {length: string, breadth: string, height: string}>>({});
  const [variationSelectedSize, setVariationSelectedSize] = useState<Record<number, string>>({});
  const [submissionData, setSubmissionData] = useState({
    name: "",
    description: "",
    category: "chairs",
    basePrice: 0,
    designerPrice: 0,
    termsAccepted: false,
  });
  const [showGuide, setShowGuide] = useState(false);
  const [showListingFeeDialog, setShowListingFeeDialog] = useState(false);
  const [show3DFeeDialog, setShow3DFeeDialog] = useState(false);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [threeDFeePaid, setThreeDFeePaid] = useState(false);
  const [showIntentDialog, setShowIntentDialog] = useState(true);
  const [userIntent, setUserIntent] = useState<'designer' | 'personal' | null>(null);
  const { toast } = useToast();

  // Check if user has seen the guide
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem("designer-guide-completed");
    if (!hasSeenGuide && user) {
      // Show guide after a brief delay for better UX
      setTimeout(() => setShowGuide(true), 1000);
    }
  }, [user]);

  // Clear AR mode from session when component unmounts
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('last-preview-mode');
    };
  }, []);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleRoomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      setRoomImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setRoomImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast({
        title: "Room image uploaded",
        description: "AI will design furniture that fits your space perfectly",
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      setUploadedImage(file);
      toast({
        title: "Image uploaded",
        description: "Your sketch has been added to the design prompt",
      });
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !uploadedImage) {
      toast({
        title: "Missing Description",
        description: "Please describe your furniture design or upload a sketch.",
        variant: "destructive",
      });
      return;
    }

    // Check credits before generation
    try {
      const { data: creditCheck, error: creditError } = await supabase.functions.invoke('check-credits', {
        body: { action: 'check', creditsNeeded: 1 }
      });

      if (creditError) throw creditError;

      if (!creditCheck.hasCredits) {
        toast({
          title: "Insufficient Credits",
          description: `You need ${creditCheck.creditsNeeded} credit to generate a design. You have ${creditCheck.balance} credits.`,
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error('Credit check error:', error);
      toast({
        title: "Error",
        description: "Failed to check credits. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedVariations([]);
    setSelectedVariation(null);
    setVariationDimensions({});
    setVariationSelectedSize({});
    setPolling3DStatus({});
    
    // Deduct credits after successful generation start
    const deductCreditsAfterGeneration = async () => {
      try {
        await supabase.functions.invoke('check-credits', {
          body: { action: 'deduct', creditsNeeded: 1 }
        });
      } catch (error) {
        console.error('Credit deduction error:', error);
      }
    };
    
    try {
      // Convert room image to base64 if uploaded
      let roomImageBase64: string | undefined;
      if (roomImage) {
        roomImageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(roomImage);
        });
      }

      // Convert uploaded sketch to base64 if uploaded
      let sketchImageBase64: string | undefined;
      if (uploadedImage) {
        sketchImageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(uploadedImage);
        });
      }

      // Build enhanced prompt
      let enhancedPrompt = prompt || "Create a furniture design based on the uploaded sketch";
      const manufacturingConstraints = "Design must be 3D-printable and manufacturable with CNC milling. Use smooth, organic forms that avoid sharp internal corners or impossible overhangs. All elements should be structurally sound and producible with additive/subtractive manufacturing techniques. Consider material waste, assembly requirements, and structural integrity.";
      
      if (roomImage && furnitureType) {
        enhancedPrompt = `Design a ${furnitureType} that fits perfectly in this interior space. The furniture should complement the existing room aesthetic. ${prompt}. ${manufacturingConstraints} Make sure the design harmonizes with the room's style, colors, and overall ambiance while being practical to manufacture.`;
      } else if (furnitureType) {
        enhancedPrompt = `${furnitureType}: ${prompt}. ${manufacturingConstraints}`;
      } else {
        enhancedPrompt = `${prompt}. ${manufacturingConstraints}`;
      }

      // Only generate base designs initially (3 AI calls instead of 18!)
      const variationPromises = [1, 2, 3].map(async (variationNum) => {
        try {
          const response = await supabase.functions.invoke('generate-design', {
            body: { 
              prompt: enhancedPrompt, 
              variationNumber: variationNum,
              roomImageBase64: roomImageBase64,
              sketchImageBase64: sketchImageBase64,
              generate3D: false // Don't auto-generate 3D
            }
          });

          if (response.data?.error || response.error) {
            console.error(`Variation ${variationNum} error:`, response.data?.error || response.error);
            throw new Error(response.data?.error || response.error?.message || 'Failed to generate design');
          }

          if (!response.data?.imageUrl) {
            console.error(`Variation ${variationNum} missing image`);
            throw new Error('No image generated');
          }

          return {
            imageUrl: response.data.imageUrl,
            modelUrl: response.data.modelUrl,
            taskId: response.data.taskId,
            pricing: response.data.pricing,
            colorVariations: {} // Empty initially, filled on-demand
          };
        } catch (error) {
          console.error(`Error generating variation ${variationNum}:`, error);
          throw error;
        }
      });

      const variations = await Promise.all(variationPromises);
      setGeneratedVariations(variations);
      
      // Deduct credits after successful generation
      await deductCreditsAfterGeneration();
      
      // Don't auto-start 3D generation anymore
      
      // Calculate initial estimated cost using category default dimensions and AI pricing
      const defaultDims = suggestDimensionsForDesign(submissionData.category, prompt);
      const l = parseFloat(defaultDims.length) / 12;
      const b = parseFloat(defaultDims.breadth) / 12;
      const h = parseFloat(defaultDims.height) / 12;
      const cubicFeet = l * b * h;
      
      // Use pricing from first variation if available
      const initialPricing = variations[0]?.pricing;
      const pricePerCubicFoot = initialPricing?.pricePerCubicFoot || 9000;
      const baseCost = Math.round(cubicFeet * pricePerCubicFoot);
      
      setEstimatedCost(baseCost);
      setLeadTime(28); // 4 weeks
      
      toast({
        title: roomImage ? "Room-Aware Designs Generated!" : "Designs Generated!",
        description: roomImage 
          ? "3 variations designed for your space."
          : "3 variations created. Select a design to continue.",
      });
    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : "Please try again.";
      
      // Check if it's a credits error
      const isCreditsError = errorMessage.includes('credits') || errorMessage.includes('402');
      
      toast({
        title: isCreditsError ? "AI Credits Depleted" : "Generation Failed",
        description: isCreditsError 
          ? "Your Lovable AI credits have been depleted. Please add credits in Settings → Workspace → Usage to continue generating designs."
          : errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const poll3DStatus = async (variationIndex: number, taskId: string) => {
    setPolling3DStatus(prev => ({ ...prev, [variationIndex]: true }));
    setModel3DProgress(prev => ({ ...prev, [variationIndex]: 0 }));
    
    const maxAttempts = 60; // 60 attempts * 10s = 10 minutes max
    let attempts = 0;
    
    const checkStatus = async () => {
      try {
        const response = await supabase.functions.invoke('check-3d-status', {
          body: { taskId }
        });
        
        // Update progress if available
        if (response.data?.progress !== undefined) {
          setModel3DProgress(prev => ({ ...prev, [variationIndex]: response.data.progress }));
        }
        
        if (response.data?.status === 'SUCCEEDED' && response.data?.modelUrl) {
          // Update variation with model URL
          setGeneratedVariations(prev => {
            const updated = [...prev];
            updated[variationIndex] = {
              ...updated[variationIndex],
              modelUrl: response.data.modelUrl
            };
            return updated;
          });
          
          // Update selected design if this is the selected variation
          if (selectedVariation === variationIndex) {
            setGenerated3DModel(response.data.modelUrl);
          }
          
          setPolling3DStatus(prev => ({ ...prev, [variationIndex]: false }));
          setModel3DProgress(prev => ({ ...prev, [variationIndex]: 100 }));
          
          toast({
            title: "3D Model Ready!",
            description: `Variation ${variationIndex + 1} 3D model is now available`,
          });
          
          return true; // Stop polling
        } else if (response.data?.status === 'FAILED') {
          setPolling3DStatus(prev => ({ ...prev, [variationIndex]: false }));
          setModel3DProgress(prev => ({ ...prev, [variationIndex]: 0 }));
          toast({
            title: "3D Generation Failed",
            description: "The 3D model generation failed. Please try again.",
            variant: "destructive",
          });
          return true; // Stop polling
        } else {
          // Still processing
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 10000); // Check every 10 seconds
          } else {
            setPolling3DStatus(prev => ({ ...prev, [variationIndex]: false }));
            setModel3DProgress(prev => ({ ...prev, [variationIndex]: 0 }));
            console.log('3D generation timed out for variation', variationIndex);
          }
          return false;
        }
      } catch (error) {
        console.error('Error checking 3D status:', error);
        setPolling3DStatus(prev => ({ ...prev, [variationIndex]: false }));
        setModel3DProgress(prev => ({ ...prev, [variationIndex]: 0 }));
        return true; // Stop polling on error
      }
    };
    
    // Start polling after 5 seconds (give Meshy time to start)
    setTimeout(checkStatus, 5000);
  };

  const handleSelectVariation = async (index: number) => {
    setSelectedVariation(index);
    const selectedVar = generatedVariations[index];
    
    setGeneratedDesign(selectedVar.imageUrl);
    setGenerated3DModel(selectedVar.modelUrl || null);
    setShowWorkflow(true);
    setPreviewMode("2d"); // Reset to 2D view when selecting new variation
    
    // Store the pricing data for this variation
    const pricingData = selectedVar.pricing || {
      basePrice: 9000,
      complexity: 'medium',
      pricePerCubicFoot: 9000,
      reasoning: 'Competitive pricing'
    };
    setCurrentPricing(pricingData);
    
    // Check if this variation already has dimensions stored, otherwise use suggested dimensions
    const suggestedDims = suggestDimensionsForDesign(submissionData.category, prompt);
    const finalDimensions = variationDimensions[index] || suggestedDims;
    
    // Store dimensions for this variation if not already stored
    if (!variationDimensions[index]) {
      setVariationDimensions(prev => ({
        ...prev,
        [index]: suggestedDims
      }));
    }
    
    setDimensions(finalDimensions);
    
    // Calculate price using AI-determined price per cubic foot
    calculatePriceFromDimensions(
      finalDimensions.length, 
      finalDimensions.breadth, 
      finalDimensions.height, 
      pricingData.pricePerCubicFoot
    );
    
    toast({
      title: "Variation Selected",
      description: "Ready to customize dimensions and submit your design.",
    });
  };

  const applyColorFinishToSelected = async (color?: string, finish?: string) => {
    if (selectedVariation === null) {
      toast({
        title: "No Design Selected",
        description: "Please select a design first",
        variant: "destructive",
      });
      return;
    }

    const colorToApply = color || selectedColor;
    const finishToApply = finish || selectedFinish;

    if (!colorToApply && !finishToApply) {
      return; // Silently ignore if nothing selected
    }

    setSelectedColor(colorToApply);
    setSelectedFinish(finishToApply);

    const selectedVar = generatedVariations[selectedVariation];
    
    // Check if this color/finish combo is already cached
    const cachedUrl = selectedVar.colorVariations?.[colorToApply]?.[finishToApply];
    if (cachedUrl) {
      setGeneratedDesign(cachedUrl);
      setIsUsingFilter(false);
      setAppliedCSSFilter("");
      toast({
        title: "Design Retrieved",
        description: "Loaded from cache instantly!",
      });
      return;
    }
    
    // Apply canvas-based color transformation
    try {
      setIsUsingFilter(true);
      toast({
        title: "Applying Color...",
        description: "Transforming the furniture color...",
      });

      const transformedUrl = await applyColorTransformToFurniture(
        selectedVar.imageUrl,
        colorToApply,
        finishToApply
      );

      setGeneratedDesign(transformedUrl);
      setAppliedCSSFilter('');
      
      toast({
        title: "Color Applied",
        description: "Canvas preview applied. Click 'Generate with AI' for perfect accuracy.",
      });
    } catch (error) {
      console.error('Color transformation failed:', error);
      toast({
        title: "Preview Failed",
        description: "Could not apply color preview. Try 'Generate with AI' instead.",
        variant: "destructive",
      });
      setIsUsingFilter(false);
    }
  };

  const getColorFilter = (color: string, finish: string): string => {
    // Base color filters
    let colorFilter = "";
    switch (color.toLowerCase()) {
      case "black":
        colorFilter = "brightness(0.3) contrast(1.2)";
        break;
      case "white":
        colorFilter = "brightness(1.3) contrast(0.9)";
        break;
      case "gray":
        colorFilter = "grayscale(60%) brightness(0.8)";
        break;
      case "brown":
        colorFilter = "sepia(80%) saturate(0.6) hue-rotate(-10deg)";
        break;
      default:
        colorFilter = "";
    }
    
    // Add finish effect
    let finishFilter = "";
    switch (finish.toLowerCase()) {
      case "glossy":
        finishFilter = " saturate(1.3) contrast(1.15)";
        break;
      case "metallic":
        finishFilter = " saturate(0.7) brightness(1.1) contrast(1.2)";
        break;
      case "satin":
        finishFilter = " saturate(1.1) contrast(1.05)";
        break;
      case "textured":
        finishFilter = " contrast(1.1)";
        break;
      case "wood grain":
        finishFilter = " sepia(40%) saturate(0.8)";
        break;
      case "marble":
        finishFilter = " grayscale(20%) brightness(1.1)";
        break;
      case "concrete":
        finishFilter = " grayscale(50%) brightness(0.9)";
        break;
      default:
        finishFilter = "";
    }
    
    return colorFilter + finishFilter;
  };

  const generateWithAI = async () => {
    if (selectedVariation === null) return;
    
    const selectedVar = generatedVariations[selectedVariation];
    const colorToApply = selectedColor || "Default";
    const finishToApply = selectedFinish || "Matte";
    
    setIsGenerating(true);
    try {
      const colorFinishPrompt = `Apply ${colorToApply} color and ${finishToApply} finish to this furniture design. Keep the exact same design shape, only change the color and surface finish.`;
      
      const response = await supabase.functions.invoke('generate-design', {
        body: { 
          prompt: colorFinishPrompt,
          imageUrl: selectedVar.imageUrl,
          variationNumber: selectedVariation + 1,
          generate3D: false
        }
      });
      
      if (response.data?.imageUrl) {
        const newImageUrl = response.data.imageUrl;
        
        // Cache the result for instant reuse
        setGeneratedVariations(prev => {
          const updated = [...prev];
          if (!updated[selectedVariation].colorVariations) {
            updated[selectedVariation].colorVariations = {};
          }
          if (!updated[selectedVariation].colorVariations![colorToApply]) {
            updated[selectedVariation].colorVariations![colorToApply] = {};
          }
          updated[selectedVariation].colorVariations![colorToApply][finishToApply] = newImageUrl;
          return updated;
        });
        
        setGeneratedDesign(newImageUrl);
        setIsUsingFilter(false);
        setAppliedCSSFilter("");
        
        toast({
          title: "AI Generation Complete!",
          description: "Your design has been regenerated with accurate colors.",
        });
      }
    } catch (error) {
      console.error("Error applying color/finish:", error);
      toast({
        title: "Generation Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const suggestDimensionsForDesign = (category: string, prompt: string): { length: string; breadth: string; height: string } => {
    // Analyze prompt for size hints
    const promptLower = prompt.toLowerCase();
    const isLarge = promptLower.includes('large') || promptLower.includes('big') || promptLower.includes('spacious') || promptLower.includes('six-seater') || promptLower.includes('four-seater');
    const isSmall = promptLower.includes('small') || promptLower.includes('compact') || promptLower.includes('mini');
    const isBench = promptLower.includes('bench');
    
    // Default dimensions based on category (in inches)
    const categoryDefaults: Record<string, { length: string; breadth: string; height: string }> = {
      chairs: isLarge ? { length: "24", breadth: "24", height: "36" } : 
              isSmall ? { length: "18", breadth: "18", height: "30" } :
              { length: "20", breadth: "20", height: "32" },
      tables: isLarge ? { length: "72", breadth: "40", height: "30" } :
              isSmall ? { length: "36", breadth: "24", height: "28" } :
              { length: "60", breadth: "36", height: "30" },
      benches: isLarge ? { length: "72", breadth: "18", height: "18" } :
               isSmall ? { length: "36", breadth: "16", height: "16" } :
               { length: "48", breadth: "18", height: "18" },
      storage: isLarge ? { length: "48", breadth: "20", height: "72" } :
               isSmall ? { length: "24", breadth: "16", height: "36" } :
               { length: "36", breadth: "18", height: "60" },
      decor: isLarge ? { length: "18", breadth: "18", height: "24" } :
             isSmall ? { length: "8", breadth: "8", height: "12" } :
             { length: "12", breadth: "12", height: "16" },
      lighting: isLarge ? { length: "20", breadth: "20", height: "48" } :
                isSmall ? { length: "10", breadth: "10", height: "18" } :
                { length: "14", breadth: "14", height: "30" },
    };
    
    // If prompt mentions bench but category isn't benches, use bench dimensions
    if (isBench && category !== 'benches') {
      return categoryDefaults['benches'];
    }
    
    return categoryDefaults[category] || { length: "36", breadth: "24", height: "30" };
  };

  const calculatePriceFromDimensions = (length: string, breadth: string, height: string, pricePerCubicFoot: number = 9000) => {
    if (!length || !breadth || !height) return;
    
    // Convert inches to feet and calculate cubic feet
    const l = parseFloat(length) / 12;
    const b = parseFloat(breadth) / 12;
    const h = parseFloat(height) / 12;
    const cubicFeet = l * b * h;
    
    // Calculate price using AI-determined or default price per cubic foot
    const baseCost = Math.round(cubicFeet * pricePerCubicFoot);
    
    setEstimatedCost(baseCost);
    setSubmissionData(prev => ({
      ...prev,
      basePrice: baseCost,
      designerPrice: Math.round(baseCost * 1.25), // Default 25% markup
    }));
    setShowSubmissionForm(true);
    
    toast({
      title: "Price Calculated",
      description: `Base price: ₹${baseCost.toLocaleString()} for ${cubicFeet.toFixed(2)} cubic feet`,
    });
  };

  const handleSubmitDesign = async () => {
    if (!generatedDesign) {
      toast({
        title: "No Design Selected",
        description: "Please generate and select a design first.",
        variant: "destructive",
      });
      return;
    }

    if (!userIntent) {
      toast({
        title: "Please Select Intent",
        description: "Please choose if you're creating to sell or for personal use.",
        variant: "destructive",
      });
      setShowIntentDialog(true);
      return;
    }

    if (!dimensions.length || !dimensions.breadth || !dimensions.height) {
      toast({
        title: "Dimensions Required",
        description: "Please enter the dimensions (L × B × H) for your design.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate submission data
      const validatedData = designSubmissionSchema.parse({
        ...submissionData,
        imageUrl: generatedDesign,
      });

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to submit your design.",
          variant: "destructive",
        });
        return;
      }

      // Get designer profile (or create for personal mode)
      const { data: profileData, error: profileError } = await supabase
        .from("designer_profiles")
        .select("id, status, terms_accepted")
        .eq("user_id", user.id)
        .single();
      
      let profile = profileData;

      // For personal mode, skip designer onboarding requirement
      if (userIntent === 'designer') {
        if (profileError || !profile) {
          toast({
            title: "Complete Designer Onboarding",
            description: "Please complete the designer onboarding process first.",
          });
          navigate('/designer-onboarding');
          return;
        }

        if (!profile.terms_accepted) {
          toast({
            title: "Terms Not Accepted",
            description: "Please complete the designer onboarding to accept terms.",
            variant: "destructive",
          });
          navigate('/designer-onboarding');
          return;
        }

        if (profile.status !== 'approved') {
          toast({
            title: "Profile Under Review",
            description: "Your designer profile is currently under review. We'll notify you once approved.",
            variant: "destructive",
          });
          return;
        }
      } else if (!profile && userIntent === 'personal') {
        // Create a basic designer profile for personal mode users
        const { data: newProfile, error: createError } = await supabase
          .from("designer_profiles")
          .insert({
            user_id: user.id,
            name: user.user_metadata?.full_name || user.email || 'Personal User',
            email: user.email || '',
            terms_accepted: true,
            status: 'approved', // Auto-approve for personal mode
          })
          .select()
          .single();

        if (createError) throw createError;
        
        // Reassign profile to use newProfile for product creation
        profile = newProfile;
      }

      // Create product with dimensions and pricing analytics
      const { data: newProduct, error: productError } = await supabase.from("designer_products")
        .insert({
          designer_id: profile.id,
          name: validatedData.name,
          description: validatedData.description,
          category: validatedData.category,
          base_price: validatedData.basePrice,
          designer_price: validatedData.designerPrice,
          original_designer_price: validatedData.designerPrice,
          image_url: generatedDesign,
          model_url: selectedVariation !== null ? generatedVariations[selectedVariation]?.modelUrl : null,
          dimensions: {
            length: parseFloat(dimensions.length),
            breadth: parseFloat(dimensions.breadth),
            height: parseFloat(dimensions.height)
          },
          // Save pricing analytics for backend data analysis (not shown to customer)
          pricing_complexity: currentPricing?.complexity || null,
          pricing_per_cubic_foot: currentPricing?.pricePerCubicFoot || null,
          pricing_reasoning: currentPricing?.reasoning || null,
          pricing_calculated_at: new Date().toISOString(),
          status: userIntent === 'personal' ? 'approved' : 'pending', // Personal use auto-approved, designer mode pending review
        })
        .select()
        .single();

      if (productError) throw productError;

      // Create design_listings record
      const { error: listingError } = await supabase
        .from('design_listings')
        .insert({
          product_id: newProduct.id,
          listing_fee_paid: false,
          three_d_fee_paid: false,
        });

      if (listingError) throw listingError;

      // Run plagiarism check in background (non-blocking)
      supabase.functions.invoke('check-plagiarism', {
        body: { imageUrl: generatedDesign, productId: newProduct.id }
      }).then(({ data, error }) => {
        if (error) {
          console.error('Background plagiarism check error:', error);
        } else if (data?.isPlagiarized) {
          console.warn(`Design similarity detected: ${data.similarCount} similar design(s)`);
        }
      });

      // Store product ID for listing fee payment
      setPendingProductId(newProduct.id);
      setShowListingFeeDialog(true);

    } catch (error: any) {
      if (error.name === 'ZodError') {
        toast({
          title: "Validation Error",
          description: error.errors[0]?.message || "Please check your input.",
          variant: "destructive",
        });
      } else {
        console.error('Submission error:', error);
        toast({
          title: "Submission Failed",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent py-8">
          <div className="container text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm font-semibold text-primary">AI Design Studio - Beta</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Give Form to Your Imagination
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Design custom furniture, home decor, and installations with AI. Upload your room, describe your vision, 
              and we'll manufacture and deliver it. Real products, not just renders.
            </p>
          </div>
        </section>

        {/* Design Interface */}
        <section className="container py-12">
          <div className="max-w-6xl mx-auto">
            {/* Mode Switcher */}
            {userIntent && (
              <div className="mb-6 flex justify-center">
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-lg bg-card border border-border shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Current Mode:</span>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${
                      userIntent === 'designer' 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'bg-secondary/10 text-secondary border border-secondary/20'
                    }`}>
                      {userIntent === 'designer' ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          <span className="font-semibold text-sm">Create to Sell</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-semibold text-sm">Personal Use</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowIntentDialog(true)}
                    className="text-xs"
                  >
                    Change Mode
                  </Button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Side */}
              <div className="space-y-6">
                <Card id="welcome-card" className="border-primary/20 shadow-medium">
                  <CardContent className="p-6 space-y-6">
                    {/* Main Design Description */}
                    <div>
                      <h3 className="text-lg font-semibold mb-1 text-foreground">Describe Your Design</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        Describe your furniture piece in detail. Include style, materials, colors, and finishes.
                      </p>
                    </div>

                    <Textarea
                      id="prompt-input"
                      placeholder="Example: A modern minimalist dining table with organic curved edges, matte black finish, 72×40×30 inches..."
                      className="min-h-[160px] text-base"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />

                    {/* Quick Ideas */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">💡 Quick Ideas:</p>
                      <div className="flex gap-2">
                        {(() => {
                          const allIdeas = [
                            "Dining chair with curved backrest",
                            "Coffee table with sculpted base",
                            "Bench with twisted seat design",
                            "Lounge chair with flowing armrest",
                            "Side table with spiral leg structure",
                            "Center table with organic edges",
                            "Outdoor bench inspired by waves",
                            "Sculptural stool with soft curves",
                            "Reading chair with continuous back and seat",
                            "Console table with fluid form",
                            "Dining table with sculpted pedestal base",
                            "Accent chair inspired by nature",
                            "Bench with smooth folded shape",
                            "Coffee table with hollow center",
                            "Chair with twisted back support",
                            "Table inspired by flowing fabric",
                            "Bench that appears to float above ground",
                            "Side table shaped like a droplet",
                            "Lounge chair with wave-like seat",
                            "Installation bench with interwoven lines",
                            "Two-seater bench with curved backrest",
                            "Cantilever chair with gradient finish",
                            "Nesting coffee tables with organic forms",
                            "Rocking chair with biomorphic armrests",
                            "Low-profile coffee table with stone top",
                            "Four-seater dining bench with wood slats",
                            "Swivel accent chair with metallic legs",
                            "Modular coffee table with hidden storage",
                            "Dining chair with curved backrest",
                            "Oval coffee table with wood and resin mix",
                            "Outdoor bench with organic flowing lines",
                            "High-back lounge chair with tufted cushion",
                            "Minimalist side table with single-color finish",
                            "Large six-seater bench with sculptural base",
                            "Wave-pattern wall shelf",
                            "Organic vase with spiral curves",
                            "Sculptural planter with drainage design",
                            "Parametric lamp base with lattice structure"
                          ];
                          // Shuffle and pick 2 random ideas
                          const shuffled = [...allIdeas].sort(() => Math.random() - 0.5);
                          return shuffled.slice(0, 2).map((example, i) => (
                            <button
                              key={i}
                              onClick={() => setPrompt(example)}
                              className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary hover:bg-accent transition-all flex-1"
                            >
                              {example}
                            </button>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* Color & Finish - Combined in one line */}
                    <div className="border-t pt-3 space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Color Picker */}
                        <div>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { name: 'Black', value: '#000000' },
                              { name: 'White', value: '#FFFFFF' },
                              { name: 'Gray', value: '#808080' },
                              { name: 'Brown', value: '#8B4513' }
                            ].map((color) => (
                              <button
                                key={color.name}
                                onClick={() => {
                                  const colorRegex = /,?\s*\b(black|white|gray|grey|brown|beige|navy|olive|burgundy|red|blue|green|yellow)\s+(color|finish|tone)\b/gi;
                                  if (selectedColor === color.name) {
                                    // Unselect - remove color from prompt
                                    setSelectedColor("");
                                    setPrompt(prev => prev.replace(colorRegex, '').replace(/,\s*,/g, ',').replace(/^,\s*/, '').trim());
                                    setIsUsingFilter(false);
                                    setAppliedCSSFilter("");
                                  } else {
                                    // Select - add or replace color in prompt
                                    setSelectedColor(color.name);
                                    if (prompt.match(colorRegex)) {
                                      setPrompt(prev => prev.replace(colorRegex, `, ${color.name.toLowerCase()} color`));
                                    } else {
                                      setPrompt(prev => `${prev}${prev ? ', ' : ''}${color.name.toLowerCase()} color`);
                                    }
                                    // Apply to selected variation if exists
                                    if (selectedVariation !== null) {
                                      applyColorFinishToSelected(color.name, selectedFinish);
                                    }
                                  }
                                }}
                                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
                                  selectedColor === color.name
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-secondary/10 hover:bg-secondary/20 border-secondary/20 hover:border-secondary'
                                }`}
                              >
                                <div 
                                  className="w-3 h-3 rounded-full border border-border"
                                  style={{ backgroundColor: color.value }}
                                />
                                {color.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Finish Selection */}
                        <div>
                          <div className="flex flex-wrap gap-1.5">
                            {['Matte', 'Glossy', 'Metallic', 'Satin', 'Textured', 'Wood Grain', 'Marble', 'Concrete'].map((finish) => (
                              <button
                                key={finish}
                                onClick={() => {
                                  const finishRegex = /,?\s*\b(matte|glossy|metallic|satin|textured|marble|wood grain|concrete)\s+(finish|effect)\b/gi;
                                  if (selectedFinish === finish) {
                                    // Unselect - remove finish from prompt
                                    setSelectedFinish("");
                                    setPrompt(prev => prev.replace(finishRegex, '').replace(/,\s*,/g, ',').replace(/^,\s*/, '').trim());
                                    setIsUsingFilter(false);
                                    setAppliedCSSFilter("");
                                  } else {
                                    // Select - add or replace finish in prompt
                                    setSelectedFinish(finish);
                                    if (prompt.match(finishRegex)) {
                                      setPrompt(prev => prev.replace(finishRegex, `, ${finish.toLowerCase()} finish`));
                                    } else {
                                      setPrompt(prev => `${prev}${prev ? ', ' : ''}${finish.toLowerCase()} finish`);
                                    }
                                    // Apply to selected variation if exists
                                    if (selectedVariation !== null) {
                                      applyColorFinishToSelected(selectedColor, finish);
                                    }
                                  }
                                }}
                                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                                  selectedFinish === finish
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-secondary/10 hover:bg-secondary/20 border-secondary/20 hover:border-secondary'
                                }`}
                              >
                                {finish}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dimensions Input */}
                    <div className="border-t pt-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Length</label>
                          <Input
                            type="number"
                            placeholder={
                              submissionData.category === 'chairs' ? '20' :
                              submissionData.category === 'tables' ? '60' :
                              submissionData.category === 'benches' ? '48' :
                              submissionData.category === 'decor' ? '12' : '36'
                            }
                            value={dimensions.length}
                            onChange={(e) => {
                              const newDimensions = { ...dimensions, length: e.target.value };
                              setDimensions(newDimensions);
                              if (selectedVariation !== null) {
                                setVariationDimensions(prev => ({
                                  ...prev,
                                  [selectedVariation]: newDimensions
                                }));
                              }
                              if (newDimensions.length && newDimensions.breadth && newDimensions.height) {
                                calculatePriceFromDimensions(
                                  newDimensions.length,
                                  newDimensions.breadth,
                                  newDimensions.height,
                                  currentPricing?.pricePerCubicFoot || 12000
                                );
                              }
                            }}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Breadth</label>
                          <Input
                            type="number"
                            placeholder={
                              submissionData.category === 'chairs' ? '20' :
                              submissionData.category === 'tables' ? '36' :
                              submissionData.category === 'benches' ? '18' :
                              submissionData.category === 'decor' ? '12' : '24'
                            }
                            value={dimensions.breadth}
                            onChange={(e) => {
                              const newDimensions = { ...dimensions, breadth: e.target.value };
                              setDimensions(newDimensions);
                              if (selectedVariation !== null) {
                                setVariationDimensions(prev => ({
                                  ...prev,
                                  [selectedVariation]: newDimensions
                                }));
                              }
                              if (newDimensions.length && newDimensions.breadth && newDimensions.height) {
                                calculatePriceFromDimensions(
                                  newDimensions.length,
                                  newDimensions.breadth,
                                  newDimensions.height,
                                  currentPricing?.pricePerCubicFoot || 12000
                                );
                              }
                            }}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Height</label>
                          <Input
                            type="number"
                            placeholder={
                              submissionData.category === 'chairs' ? '32' :
                              submissionData.category === 'tables' ? '30' :
                              submissionData.category === 'benches' ? '18' :
                              submissionData.category === 'decor' ? '16' : '30'
                            }
                            value={dimensions.height}
                            onChange={(e) => {
                              const newDimensions = { ...dimensions, height: e.target.value };
                              setDimensions(newDimensions);
                              if (selectedVariation !== null) {
                                setVariationDimensions(prev => ({
                                  ...prev,
                                  [selectedVariation]: newDimensions
                                }));
                              }
                              if (newDimensions.length && newDimensions.breadth && newDimensions.height) {
                                calculatePriceFromDimensions(
                                  newDimensions.length,
                                  newDimensions.breadth,
                                  newDimensions.height,
                                  currentPricing?.pricePerCubicFoot || 12000
                                );
                              }
                            }}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Upload Sketch */}
                    <div id="upload-section" className="border-t pt-3">
                      <Button variant="outline" className="w-full" asChild>
                        <label className="cursor-pointer">
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {uploadedImage ? `✓ ${uploadedImage.name}` : "Upload Image / Sketch"}
                        </label>
                      </Button>
                      {uploadedImage && (
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                          {uploadedImage.name}
                        </div>
                      )}
                    </div>

                    {/* Collapsible Room Context Section */}
                    <Collapsible open={isRoomSectionOpen} onOpenChange={setIsRoomSectionOpen} className="border-t pt-4">
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-between p-4 h-auto border border-primary/20 hover:bg-primary/5"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                            </div>
                            <div className="text-left">
                              <p className="font-semibold text-sm text-foreground">Upload Your Space</p>
                              <p className="text-xs text-muted-foreground">Get designs tailored to your room</p>
                            </div>
                          </div>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isRoomSectionOpen ? 'rotate-180' : ''}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-4 space-y-4 animate-accordion-down">
                        <div className="space-y-3 bg-primary/5 rounded-lg p-4 border border-primary/10">
                          <Button variant="outline" className="w-full justify-start h-auto py-3" asChild>
                            <label className="cursor-pointer">
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleRoomImageUpload} 
                              />
                              <div className="flex items-center gap-3 w-full">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm">
                                  {roomImage ? `✓ ${roomImage.name}` : "Upload Room Photo"}
                                </span>
                              </div>
                            </label>
                          </Button>

                          {roomImagePreview && (
                            <div className="relative rounded-lg overflow-hidden border-2 border-primary/20">
                              <img 
                                src={roomImagePreview} 
                                alt="Room context" 
                                className="w-full h-40 object-cover"
                              />
                              <button
                                onClick={() => {
                                  setRoomImage(null);
                                  setRoomImagePreview(null);
                                }}
                                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}

                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-2 block">
                              What do you need for this space?
                            </label>
                            <Input
                              placeholder="e.g., Coffee table, Dining chair, Side table..."
                              value={furnitureType}
                              onChange={(e) => setFurnitureType(e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Generate Button - At the end, prominently visible */}
                    <div id="generate-button" className="space-y-3 border-t pt-4">
                      <Button 
                        variant="hero" 
                        size="lg"
                        className="w-full group" 
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                      >
                        {isGenerating ? (
                          <>
                            <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Generating...
                          </>
                        ) : (
                          <>
                            Generate Design
                            <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* 3D Upload Option */}
                <Card className="bg-secondary/10 border-secondary/20">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                      <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Already Have a Model?
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Upload your .OBJ, .STL, or .FBX file and we'll prepare it for manufacturing
                    </p>
                     <Button variant="outline" size="sm" className="w-full" asChild>
                      <label className="cursor-pointer">
                        <input type="file" accept=".obj,.stl,.fbx" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            toast({
                              title: "Model Uploaded",
                              description: "We'll review your model for manufacturing feasibility",
                            });
                          }
                        }} />
                        Upload Model File
                      </label>
                    </Button>
                  </CardContent>
                </Card>

                {/* Tips */}
                <Card className="bg-accent border-border">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-3 text-foreground">💡 Design Guidelines</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">✓</span>
                        <span>Focus on <strong className="text-foreground">single-piece forms</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">✓</span>
                        <span>Describe <strong className="text-foreground">surface finishes</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">✓</span>
                        <span>Include <strong className="text-foreground">style & shape</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-1">✗</span>
                        <span className="line-through">Avoid wheels, hinges, or multi-material assemblies</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Preview Side */}
              <div className="space-y-6">
                <Card className="border-border shadow-soft">
                  <CardContent className="p-6">
                    <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as any)} className="w-full">
                      <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="2d">Image</TabsTrigger>
                        <TabsTrigger value="3d">3D Model</TabsTrigger>
                        <TabsTrigger value="ar" id="ar-tab">AR View</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="2d" className="mt-0">
                        {generatedVariations.length > 0 ? (
                          <div className="space-y-4">
                            {leadTime && (
                              <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                                <div className="flex items-center gap-2">
                                  <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-sm font-semibold text-foreground">Lead Time</span>
                                </div>
                                <span className="text-sm text-muted-foreground">{leadTime} days (~4 weeks)</span>
                              </div>
                            )}
                            {dimensions.length && dimensions.breadth && dimensions.height && (
                              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                                <div className="flex items-center gap-2">
                                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                  </svg>
                                  <span className="text-sm font-semibold text-foreground">Dimensions</span>
                                </div>
                                <span className="text-sm font-bold text-primary">{dimensions.length}" × {dimensions.breadth}" × {dimensions.height}"</span>
                              </div>
                            )}
                            <div id="variations-grid" className="grid grid-cols-1 gap-4">
                              {generatedVariations.map((variation, index) => (
                                 <div key={index} className="space-y-3">
                                   <button
                                     onClick={() => handleSelectVariation(index)}
                                     className={`group relative overflow-hidden rounded-xl transition-all w-full ${
                                       selectedVariation === index
                                         ? "ring-4 ring-primary shadow-elegant scale-[1.02]"
                                         : "hover:shadow-soft hover:scale-[1.01]"
                                     }`}
                                   >
                                      <div className="aspect-square bg-accent">
                                        <img 
                                          src={
                                            selectedVariation === index && generatedDesign 
                                              ? generatedDesign 
                                              : variation.imageUrl
                                          } 
                                          alt={`Design Variation ${index + 1}`} 
                                          className="w-full h-full object-contain transition-all"
                                          style={{ 
                                            imageRendering: '-webkit-optimize-contrast'
                                          }}
                                        />
                                        {selectedVariation === index && isUsingFilter && (
                                          <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500/90 text-yellow-950 text-xs rounded-full flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            Preview
                                          </div>
                                        )}
                                      </div>
                                     <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                       <div className="absolute bottom-4 left-4 right-4">
                                         <p className="text-white font-semibold">Variation {index + 1}</p>
                                       </div>
                                     </div>
                                     {selectedVariation === index && (
                                       <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                                         <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                           <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                         </svg>
                                       </div>
                                     )}
                                   </button>
                                  
                                   {selectedVariation === index && (
                                    <Card className="border-primary/20 bg-primary/5">
                                      <CardContent className="p-4 space-y-3">
                                        <h4 className="font-semibold text-foreground">Enter Dimensions for This Design</h4>
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground mb-2">Dimensions (L × B × H in inches):</p>
                                           <div className="grid grid-cols-3 gap-2">
                                            <Input
                                              type="number"
                                              placeholder="L"
                                              value={variationDimensions[index]?.length || ""}
                                              onChange={(e) => {
                                                const newDims = { 
                                                  ...variationDimensions[index],
                                                  length: e.target.value,
                                                  breadth: variationDimensions[index]?.breadth || "",
                                                  height: variationDimensions[index]?.height || ""
                                                };
                                                setVariationDimensions(prev => ({ ...prev, [index]: newDims }));
                                                setDimensions(newDims);
                                                if (newDims.length && newDims.breadth && newDims.height) {
                                                  calculatePriceFromDimensions(newDims.length, newDims.breadth, newDims.height);
                                                }
                                              }}
                                              className="text-sm"
                                            />
                                            <Input
                                              type="number"
                                              placeholder="B"
                                              value={variationDimensions[index]?.breadth || ""}
                                              onChange={(e) => {
                                                const newDims = { 
                                                  ...variationDimensions[index],
                                                  breadth: e.target.value,
                                                  length: variationDimensions[index]?.length || "",
                                                  height: variationDimensions[index]?.height || ""
                                                };
                                                setVariationDimensions(prev => ({ ...prev, [index]: newDims }));
                                                setDimensions(newDims);
                                                if (newDims.length && newDims.breadth && newDims.height) {
                                                  calculatePriceFromDimensions(newDims.length, newDims.breadth, newDims.height);
                                                }
                                              }}
                                              className="text-sm"
                                            />
                                            <Input
                                              type="number"
                                              placeholder="H"
                                              value={variationDimensions[index]?.height || ""}
                                              onChange={(e) => {
                                                const newDims = { 
                                                  ...variationDimensions[index],
                                                  height: e.target.value,
                                                  length: variationDimensions[index]?.length || "",
                                                  breadth: variationDimensions[index]?.breadth || ""
                                                };
                                                setVariationDimensions(prev => ({ ...prev, [index]: newDims }));
                                                setDimensions(newDims);
                                                if (newDims.length && newDims.breadth && newDims.height) {
                                                  calculatePriceFromDimensions(newDims.length, newDims.breadth, newDims.height);
                                                }
                                              }}
                                              className="text-sm"
                                            />
                                          </div>
                                        </div>
                                        
                                          <div>
                                           <p className="text-xs font-medium text-muted-foreground mb-2">Or select a preset:</p>
                                           <div className="flex flex-wrap gap-2">
                                             {['48"×24"×30"', '60"×36"×18"', '72"×40"×30"', '36"×36"×16"'].map((size) => (
                                               <button
                                                 key={size}
                                                 onClick={() => {
                                                   const [l, b, h] = size.replace(/"/g, '').split('×');
                                                   const newDims = { length: l, breadth: b, height: h };
                                                   setVariationDimensions(prev => ({ ...prev, [index]: newDims }));
                                                   setVariationSelectedSize(prev => ({ ...prev, [index]: size }));
                                                   setDimensions(newDims);
                                                   calculatePriceFromDimensions(l, b, h);
                                                 }}
                                                 className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                                                   variationSelectedSize[index] === size
                                                     ? 'bg-primary text-primary-foreground border-primary'
                                                     : 'bg-background hover:bg-accent border-border hover:border-primary'
                                                 }`}
                                               >
                                                 {size}
                                               </button>
                                             ))}
                                           </div>
                                         </div>
                                      </CardContent>
                                    </Card>
                                   )}
                                   
                                   {/* Generate with AI Button */}
                                   {selectedVariation === index && isUsingFilter && (
                                     <Card className="border-yellow-500/30 bg-yellow-500/5">
                                       <CardContent className="p-4 space-y-3">
                                         <div className="flex items-start gap-3">
                                           <div className="flex-shrink-0">
                                             <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                             </svg>
                                           </div>
                                           <div className="flex-1 space-y-2">
                                             <p className="text-sm text-foreground font-medium">
                                               You're viewing a CSS preview
                                             </p>
                                             <p className="text-xs text-muted-foreground">
                                               This is an instant color approximation. For accurate colors and finishes, generate with AI. 
                                               <span className="font-semibold"> (Uses 1 AI credit)</span>
                                             </p>
                                             <Button 
                                               onClick={generateWithAI}
                                               disabled={isGenerating}
                                               variant="default"
                                               size="sm"
                                               className="w-full mt-2"
                                             >
                                               {isGenerating ? (
                                                 <>
                                                   <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                   </svg>
                                                   Generating...
                                                 </>
                                               ) : (
                                                 <>
                                                   Generate with AI
                                                   <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                   </svg>
                                                 </>
                                               )}
                                             </Button>
                                           </div>
                                         </div>
                                       </CardContent>
                                     </Card>
                                   )}
                                 </div>
                               ))}
                             </div>
                           </div>
                        ) : (
                          <div className="aspect-square rounded-xl overflow-hidden bg-accent/50 flex items-center justify-center border-2 border-dashed border-border">
                            <div className="text-center p-8">
                              <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="text-muted-foreground text-sm">Your generated designs will appear here</p>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="3d" className="mt-0 min-h-[500px]">
                        {selectedVariation !== null && generatedVariations[selectedVariation]?.modelUrl ? (
                          <div className="h-[500px]">
                            <ModelViewer3D 
                              modelUrl={generatedVariations[selectedVariation].modelUrl} 
                              productName="Generated Design"
                            />
                          </div>
                        ) : polling3DStatus[selectedVariation!] ? (
                          <div className="h-[500px] rounded-xl overflow-hidden bg-accent/50 flex items-center justify-center border-2 border-dashed border-border">
                            <div className="text-center p-8 space-y-4">
                              <div className="relative w-24 h-24 mx-auto">
                                <svg className="w-24 h-24 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-2xl font-bold text-primary">
                                    {model3DProgress[selectedVariation!] || 0}%
                                  </div>
                                </div>
                              </div>
                              
                              <div className="w-full max-w-xs mx-auto">
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary transition-all duration-500 ease-out"
                                    style={{ width: `${model3DProgress[selectedVariation!] || 0}%` }}
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <p className="text-muted-foreground text-sm font-medium mb-1">Crafting Your 3D Model...</p>
                                <div className="flex items-center justify-center gap-1 mb-2">
                                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <p className="text-muted-foreground text-xs">This may take 3-5 minutes</p>
                              </div>
                            </div>
                          </div>
                        ) : generatedDesign && pendingProductId && threeDFeePaid ? (
                          <div className="h-[500px] rounded-xl overflow-hidden bg-accent/50 flex items-center justify-center border-2 border-dashed border-border">
                            <div className="text-center p-8 space-y-4 max-w-md">
                              <svg className="w-16 h-16 mx-auto mb-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              <div>
                                <p className="text-foreground text-base font-semibold mb-2">Ready to Generate 3D!</p>
                                <p className="text-muted-foreground text-sm mb-4">
                                  3D generation fee paid. Click below to start generating your 3D model.
                                </p>
                              </div>
                              <Button
                                id="generate-3d-button"
                                onClick={async () => {
                                  if (selectedVariation === null) return;
                                  const variation = generatedVariations[selectedVariation];
                                  if (variation.taskId) {
                                    poll3DStatus(selectedVariation, variation.taskId);
                                  }
                                }}
                                className="mt-4"
                              >
                                Generate 3D Model
                              </Button>
                            </div>
                          </div>
                        ) : generatedDesign && pendingProductId ? (
                          <div className="h-[500px] rounded-xl overflow-hidden bg-accent/50 flex items-center justify-center border-2 border-dashed border-border">
                            <div className="text-center p-8 space-y-4 max-w-md">
                              <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              <div>
                                <p className="text-foreground text-base font-semibold mb-2">Upgrade to 3D + AR</p>
                                <p className="text-muted-foreground text-sm mb-4">
                                  Enhance your listing with an interactive 3D model and AR preview
                                </p>
                              </div>
                              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-left mb-4">
                                <p className="text-xs font-semibold text-primary mb-2">✨ Benefits:</p>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                  <li>• Professional 3D model via Meshy API</li>
                                  <li>• Interactive 360° product view</li>
                                  <li>• AR preview for customers</li>
                                  <li>• Higher conversion rates</li>
                                </ul>
                              </div>
                              <Button
                                onClick={() => setShow3DFeeDialog(true)}
                                className="w-full"
                              >
                                Add 3D for ₹750 / $15
                              </Button>
                            </div>
                          </div>
                        ) : generatedDesign ? (
                          <div className="h-[500px] rounded-xl overflow-hidden bg-accent/50 flex items-center justify-center border-2 border-dashed border-border">
                            <div className="text-center p-8 space-y-4 max-w-md">
                              <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              <div>
                                <p className="text-foreground text-base font-semibold mb-2">3D Model Optional</p>
                                <p className="text-muted-foreground text-sm mb-4">
                                  Submit your design first. You can add 3D after paying the listing fee (₹500).
                                </p>
                              </div>
                              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-left">
                                <p className="text-xs font-semibold text-primary mb-2">📋 Next Steps:</p>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                  <li>1. Complete the submission form below</li>
                                  <li>2. Pay listing fee (₹500 India / $10 International)</li>
                                  <li>3. Optionally add 3D (₹750 India / $15 International)</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="h-[500px] rounded-xl overflow-hidden bg-accent/50 flex items-center justify-center border-2 border-dashed border-border">
                            <div className="text-center p-8">
                              <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              <p className="text-muted-foreground text-sm">3D model will be available after selecting a design</p>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                      
                       <TabsContent value="ar" className="mt-0 min-h-[500px]" id="ar-tab">
                        {generatedDesign ? (
                          <div className="h-[500px] rounded-xl overflow-auto bg-accent/5 border border-border">
                            <ARViewer 
                              productName="Generated Design" 
                              imageUrl={generatedDesign}
                              modelUrl={selectedVariation !== null ? generatedVariations[selectedVariation]?.modelUrl : undefined}
                              roomImage={roomImage}
                              onStartAR={() => {
                                toast({
                                  title: "AR Preview Available",
                                  description: "View your design in your space. 3D model enhances AR experience!",
                                });
                              }}
                            />
                          </div>
                        ) : (
                          <div className="h-[500px] rounded-xl overflow-hidden bg-accent/50 flex items-center justify-center border-2 border-dashed border-border">
                            <div className="text-center p-8 space-y-3">
                              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">Generate a design first</p>
                                <p className="text-xs text-muted-foreground mt-1">AR preview will be available after design generation</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Set Your Price & Earnings */}
                {generatedDesign && estimatedCost && (
                  <Card className="border-primary/20">
                    <CardContent className="p-6 space-y-4">
                      <h3 className="font-semibold text-lg text-foreground">Set Your Price & Earnings</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between pb-2 border-b border-border">
                          <span className="text-muted-foreground">Base Manufacturing Cost</span>
                          <span className="font-semibold text-foreground">₹{estimatedCost.toLocaleString()}</span>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Your Selling Price (₹)</label>
                          <input
                            type="number"
                            min={estimatedCost}
                            defaultValue={estimatedCost * 1.5}
                            className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background"
                            onChange={(e) => {
                              const markup = parseInt(e.target.value) - estimatedCost;
                              const commission = estimatedCost * 0.10;
                              const total = markup + commission;
                              document.getElementById('markup-display')!.textContent = `₹${markup.toLocaleString()}`;
                              document.getElementById('commission-display')!.textContent = `₹${commission.toLocaleString()}`;
                              document.getElementById('total-earnings')!.textContent = `₹${total.toLocaleString()}`;
                            }}
                          />
                          <p className="text-xs text-muted-foreground">Minimum: ₹{estimatedCost.toLocaleString()}</p>
                        </div>

                        <div className="bg-primary/5 rounded-lg p-3 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Your Markup (100% yours)</span>
                            <span id="markup-display" className="font-semibold text-primary">₹{(estimatedCost * 0.5).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Commission (10% on base)</span>
                            <span id="commission-display" className="font-semibold text-secondary">₹{(estimatedCost * 0.10).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-primary/20">
                            <span className="font-semibold text-foreground">Per Sale Earnings</span>
                            <span id="total-earnings" className="font-bold text-primary">₹{(estimatedCost * 0.60).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="bg-accent/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-2">📈 If you sell 10 units/month:</p>
                          <p className="text-sm font-bold text-foreground">
                            Monthly Income: ₹{(submissionData.designerPrice > submissionData.basePrice
                              ? ((submissionData.designerPrice - submissionData.basePrice) + (submissionData.basePrice * 0.10)) * 10 
                              : 0).toLocaleString()}
                          </p>
                        </div>

                        {leadTime && (
                          <div className="flex justify-between pt-2">
                            <span className="text-muted-foreground">Manufacturing Time</span>
                            <span className="font-semibold text-foreground">{leadTime} days</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Design Submission Form */}
        {showSubmissionForm && (
          <section id="submit-section" className="bg-accent/20 py-16">
            <div className="container max-w-3xl mx-auto">
              <Card className="border-primary/20">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-2 text-foreground">Submit Your Design</h2>
                  <p className="text-muted-foreground mb-6">
                    Complete the details below to submit your design for review and listing
                  </p>

                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">Design Name *</label>
                      <Input 
                        placeholder="e.g., Modern Curve Chair"
                        value={submissionData.name}
                        onChange={(e) => setSubmissionData({ ...submissionData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">Description *</label>
                      <Textarea 
                        placeholder="Describe your design, its features, and what makes it unique..."
                        className="min-h-[100px]"
                        value={submissionData.description}
                        onChange={(e) => setSubmissionData({ ...submissionData, description: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">Category *</label>
                      <select
                        className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-background"
                        value={submissionData.category}
                        onChange={(e) => {
                          const newCategory = e.target.value;
                          setSubmissionData({ ...submissionData, category: newCategory });
                          
                          // Auto-update dimensions based on new category
                          const newDims = suggestDimensionsForDesign(newCategory, prompt);
                          setDimensions(newDims);
                          
                          // Update variationDimensions if a variation is selected
                          if (selectedVariation !== null) {
                            setVariationDimensions(prev => ({
                              ...prev,
                              [selectedVariation]: newDims
                            }));
                          }
                          
                          // Recalculate price with new dimensions
                          if (newDims.length && newDims.breadth && newDims.height) {
                            calculatePriceFromDimensions(
                              newDims.length,
                              newDims.breadth,
                              newDims.height,
                              currentPricing?.pricePerCubicFoot || 12000
                            );
                          }
                        }}
                      >
                        <option value="chairs">Chairs</option>
                        <option value="tables">Tables</option>
                        <option value="benches">Benches</option>
                        <option value="storage">Storage</option>
                        <option value="decor">Decor</option>
                        <option value="lighting">Lighting</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block text-foreground">Dimensions (L × B × H in inches) *</label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input 
                            type="number"
                            placeholder="L"
                            value={dimensions.length}
                            disabled
                          />
                          <Input 
                            type="number"
                            placeholder="B"
                            value={dimensions.breadth}
                            disabled
                          />
                          <Input 
                            type="number"
                            placeholder="H"
                            value={dimensions.height}
                            disabled
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {dimensions.length && dimensions.breadth && dimensions.height 
                            ? `${dimensions.length}" × ${dimensions.breadth}" × ${dimensions.height}"`
                            : "Please select dimensions from the size options above"}
                        </p>
                      </div>
                    </div>

                    {dimensions.length && dimensions.breadth && dimensions.height && submissionData.basePrice > 0 ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block text-foreground">Base Price (₹) *</label>
                            <Input 
                              type="number"
                              value={submissionData.basePrice}
                              onChange={(e) => setSubmissionData({ ...submissionData, basePrice: parseFloat(e.target.value) })}
                              min={1000}
                              required
                              disabled
                            />
                            <p className="text-xs text-muted-foreground mt-1">Production cost</p>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block text-foreground">Your Price (₹) *</label>
                            <Input 
                              type="number"
                              value={submissionData.designerPrice}
                              onChange={(e) => {
                                const price = parseFloat(e.target.value);
                                if (price < submissionData.basePrice) {
                                  toast({
                                    title: "Invalid Price",
                                    description: `Your selling price cannot be less than the base price of ₹${submissionData.basePrice.toLocaleString()}`,
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                setSubmissionData({ ...submissionData, designerPrice: price });
                              }}
                              min={submissionData.basePrice}
                              required
                            />
                            <p className="text-xs text-muted-foreground mt-1">Must be at least ₹{submissionData.basePrice.toLocaleString()}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-accent/50 border border-border rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          Please select dimensions from the size options above to see pricing information
                        </p>
                      </div>
                    )}

                    {dimensions.length && dimensions.breadth && dimensions.height && submissionData.basePrice > 0 && submissionData.designerPrice > 0 && (
                      <div className="bg-primary/5 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-foreground">Your Earnings Per Sale</span>
                          <span className="text-xl font-bold text-primary">
                            ₹{((submissionData.designerPrice - submissionData.basePrice) + (submissionData.basePrice * 0.10)).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Markup: ₹{(submissionData.designerPrice - submissionData.basePrice).toLocaleString()} + 
                          Commission: ₹{(submissionData.basePrice * 0.10).toLocaleString()}
                        </p>
                      </div>
                    )}

                    <div className="border border-border rounded-lg p-4 space-y-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox 
                          id="terms" 
                          checked={submissionData.termsAccepted}
                          onCheckedChange={(checked) => 
                            setSubmissionData({ ...submissionData, termsAccepted: checked as boolean })
                          }
                          required
                        />
                        <label
                          htmlFor="terms"
                          className="text-sm leading-relaxed cursor-pointer text-foreground"
                        >
                          I accept the{" "}
                          <a href="/terms" target="_blank" className="text-primary hover:underline">
                            Terms & Conditions
                          </a>
                          {" "}including commission structure, intellectual property policies, and manufacturing guidelines.
                        </label>
                      </div>
                    </div>

                    <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/20">
                      <h4 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                        <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        Order Notifications
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        You'll receive email and SMS notifications when someone places an order for your design. 
                        Make sure your contact details in your creator profile are up to date.
                      </p>
                    </div>

                    <Button 
                      variant="hero" 
                      className="w-full" 
                      onClick={handleSubmitDesign}
                      disabled={isSubmitting || !submissionData.termsAccepted}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Submitting Design...
                        </>
                      ) : (
                        "Submit Design for Review"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Workflow Section */}
        {showWorkflow && (
          <section className="bg-accent/30 py-16">
            <div className="container max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12 text-foreground">What Happens Next?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { step: 1, title: "Design Refinement", desc: "We'll review and optimize your design for manufacturing feasibility" },
                  { step: 2, title: "Manufacturing", desc: "Your piece is manufactured using premium FRP and hand-finished" },
                  { step: 3, title: "Listing & Sales", desc: "We list your design on Forma marketplace and handle all sales" },
                  { step: 4, title: "You Earn", desc: "You'll receive notifications when orders are placed and earn income automatically" }
                ].map((item) => (
                  <Card key={item.step} className="relative overflow-hidden">
                    <CardContent className="p-6">
                      <div className="absolute top-2 right-2 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary">{item.step}</span>
                      </div>
                      <h4 className="font-semibold mb-2 mt-6 text-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />

      {/* Intent Selection Dialog */}
      <IntentSelectionDialog
        isOpen={showIntentDialog}
        onSelect={(intent) => {
          if (!intent) {
            // User closed dialog without selecting
            setShowIntentDialog(false);
            return;
          }
          
          const previousIntent = userIntent;
          setUserIntent(intent);
          setShowIntentDialog(false);
          
          if (previousIntent && previousIntent !== intent) {
            // Switching modes
            toast({
              title: "Mode Changed",
              description: intent === 'designer' 
                ? "Switched to Designer Mode. You can now list your designs for sale."
                : "Switched to Personal Mode. Your designs will be private and for personal use only.",
            });
          } else if (!previousIntent) {
            // First time selection
            if (intent === 'designer') {
              toast({
                title: "Designer Mode Selected",
                description: "You'll need to complete designer onboarding before listing your design.",
              });
            } else {
              toast({
                title: "Personal Mode Selected",
                description: "Your design will be private and manufactured for your personal use only.",
              });
            }
          }
        }}
      />

      {/* Listing Fee Dialog */}
      {pendingProductId && (
        <ListingFeeDialog
          open={showListingFeeDialog}
          onOpenChange={setShowListingFeeDialog}
          productId={pendingProductId}
          isPersonalMode={userIntent === 'personal'}
          onSuccess={() => {
            const successMessage = userIntent === 'personal' 
              ? "Assessment fee paid! Your design is being reviewed for manufacturing feasibility."
              : "Listing fee paid! Your design is now under review and will be listed in the marketplace.";
            toast({
              title: userIntent === 'personal' ? "Assessment Complete" : "Design Submitted!",
              description: successMessage,
            });
            setGeneratedDesign(null);
            setGeneratedVariations([]);
            setPendingProductId(null);
            navigate('/creator/dashboard');
          }}
        />
      )}

      {/* 3D Generation Fee Dialog */}
      {pendingProductId && (
        <ThreeDGenerationFeeDialog
          open={show3DFeeDialog}
          onOpenChange={setShow3DFeeDialog}
          productId={pendingProductId}
          onSuccess={() => {
            setThreeDFeePaid(true);
            toast({
              title: "3D Generation Enabled!",
              description: "You can now generate 3D models for this design.",
            });
          }}
        />
      )}

      {/* Designer Guide Dialog */}
      <DesignerGuide
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        onComplete={() => {
          toast({
            title: "Welcome!",
            description: "You're all set. Start creating your first design.",
          });
        }}
      />

      {/* Help Button */}
      <HelpButton onClick={() => setShowGuide(true)} />
    </div>
  );
};

export default DesignStudio;
