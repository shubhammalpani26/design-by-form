import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, ArrowRight, Loader2, Maximize2, Download, Shuffle, ShoppingBag, Check, Upload, X, ImagePlus, Home, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FullscreenImageViewer } from "@/components/FullscreenImageViewer";
import QuickSellDialog from "@/components/QuickSellDialog";

interface PreviewDesign {
  id: string;
  name: string;
  description: string;
  image: string;
  designer: string;
}

interface GeneratedVariation {
  imageUrl: string;
  index: number;
}

const InstantDesignPreview = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const roomInputRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("chairs");
  const [designs, setDesigns] = useState<PreviewDesign[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingSurprise, setIsGeneratingSurprise] = useState(false);
  const [generatedVariations, setGeneratedVariations] = useState<GeneratedVariation[]>([]);
  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [showQuickSellDialog, setShowQuickSellDialog] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [roomImage, setRoomImage] = useState<File | null>(null);
  const [roomImagePreview, setRoomImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchShowcaseDesigns();
    checkUser();
  }, []);

  useEffect(() => {
    // Only auto-rotate if we haven't generated custom images
    if (designs.length > 1 && generatedVariations.length === 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % designs.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [designs.length, generatedVariations.length]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchShowcaseDesigns = async () => {
    try {
      const { data, error } = await supabase
        .from('designer_products')
        .select(`
          id,
          name,
          description,
          image_url,
          category,
          designer_profiles!inner(name)
        `)
        .eq('status', 'approved')
        .not('image_url', 'is', null)
        .not('description', 'is', null)
        .not('category', 'eq', 'chairs')
        .order('total_sales', { ascending: false })
        .limit(6);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setDesigns(data.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || "",
          image: item.image_url || "",
          designer: item.designer_profiles.name
        })));
      }
    } catch (error) {
      console.error('Error fetching showcase designs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSurpriseMe = async () => {
    setIsGeneratingSurprise(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-product-description', {
        body: { 
          type: 'surprise_prompt',
          category 
        }
      });

      if (error) throw error;

      if (data?.description) {
        setPrompt(data.description);
        toast.success("Creative prompt generated! ✨");
      }
    } catch (error: any) {
      console.error('Surprise prompt error:', error);
      toast.error("Failed to generate surprise prompt");
    } finally {
      setIsGeneratingSurprise(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be less than 10MB");
        return;
      }
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    setUploadedImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRoomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be less than 10MB");
        return;
      }
      setRoomImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setRoomImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearRoomImage = () => {
    setRoomImage(null);
    setRoomImagePreview(null);
    if (roomInputRef.current) {
      roomInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !uploadedImage && !roomImage) {
      toast.error("Please enter a description, upload a sketch, or add a space photo");
      return;
    }

    if (prompt.trim().length > 0 && prompt.trim().length < 10 && !uploadedImage && !roomImage) {
      toast.error("Please describe your design in more detail (at least 10 characters)");
      return;
    }

    setIsGenerating(true);
    setGeneratedVariations([]);
    setSelectedVariationIndex(0);
    setGenerationProgress(0);

    try {
      let basePromptPart = prompt || 'Create a furniture design';
      if (uploadedImage && !prompt) {
        basePromptPart = 'Create a furniture design based on this sketch';
      }
      if (roomImage && !prompt) {
        basePromptPart = 'Create a furniture design that fits perfectly in this space';
      }
      if (roomImage && uploadedImage && !prompt) {
        basePromptPart = 'Create a furniture design based on this sketch that fits in this space';
      }
      const fullPrompt = `${category}: ${basePromptPart}`;
      
      // Convert uploaded image to base64 if present
      let sketchBase64: string | undefined;
      if (uploadedImage) {
        sketchBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(uploadedImage);
        });
      }

      // Convert room image to base64 if present
      let roomBase64: string | undefined;
      if (roomImage) {
        roomBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(roomImage);
        });
      }
      
      // Generate 3 variations in parallel
      const variationPromises = [1, 2, 3].map(async (variationNumber) => {
        const { data, error } = await supabase.functions.invoke('generate-design', {
          body: { 
            prompt: fullPrompt,
            variationNumber,
            generate3D: false,
            sketchImage: sketchBase64,
            roomImage: roomBase64
          }
        });

        if (error) throw error;
        
        // Update progress as each variation completes
        setGenerationProgress(prev => prev + 33);
        
        return { imageUrl: data?.imageUrl, index: variationNumber - 1 };
      });

      const results = await Promise.all(variationPromises);
      const validResults = results.filter(r => r.imageUrl) as GeneratedVariation[];
      
      if (validResults.length > 0) {
        setGeneratedVariations(validResults);
        setGenerationProgress(100);
        toast.success(`${validResults.length} design variations generated! ✨`);
      } else {
        throw new Error("No images generated");
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || "Failed to generate designs. Please try again.");
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const handleContinueInStudio = (mode?: 'designer' | 'personal') => {
    const queryParams = new URLSearchParams();
    if (prompt) queryParams.set('prompt', prompt);
    if (category) queryParams.set('category', category);
    if (mode) queryParams.set('mode', mode);
    
    // Clear old session data first to free up space
    try {
      sessionStorage.removeItem('homepage-generated-images');
      sessionStorage.removeItem('homepage-generated-image');
      sessionStorage.removeItem('homepage-sketch-image');
      sessionStorage.removeItem('homepage-space-image');
    } catch (e) {
      console.warn('Could not clear sessionStorage:', e);
    }
    
    if (generatedVariations.length > 0) {
      try {
        // Store all generated images in sessionStorage so studio can use them
        sessionStorage.setItem('homepage-generated-images', JSON.stringify(generatedVariations.map(v => v.imageUrl)));
        sessionStorage.setItem('homepage-generated-image', generatedVariations[selectedVariationIndex].imageUrl);
      } catch (storageError) {
        console.warn('SessionStorage quota exceeded, navigating without image data:', storageError);
        // Continue anyway - the studio can regenerate if needed
        toast.info("Navigating to studio. Your design preferences are saved.");
      }
    }
    
    // Persist sketch and space images to Design Studio (if they fit)
    try {
      if (uploadedImagePreview) {
        sessionStorage.setItem('homepage-sketch-image', uploadedImagePreview);
      }
      if (roomImagePreview) {
        sessionStorage.setItem('homepage-space-image', roomImagePreview);
      }
    } catch (e) {
      console.warn('Could not store additional images:', e);
    }
    
    navigate(`/design-studio?${queryParams.toString()}`);
  };

  const handleGetQuote = () => {
    // Clear old quote data first
    try {
      sessionStorage.removeItem('quote-design-image');
      sessionStorage.removeItem('quote-design-category');
      sessionStorage.removeItem('quote-design-prompt');
    } catch (e) {
      console.warn('Could not clear sessionStorage:', e);
    }
    
    // Store design data for quote request flow
    if (generatedVariations.length > 0) {
      try {
        sessionStorage.setItem('quote-design-image', generatedVariations[selectedVariationIndex].imageUrl);
        sessionStorage.setItem('quote-design-category', category);
        sessionStorage.setItem('quote-design-prompt', prompt);
      } catch (storageError) {
        console.warn('SessionStorage quota exceeded:', storageError);
        toast.info("Navigating to quote flow. Your preferences are saved.");
      }
    }
    // Navigate to design studio in personal use mode
    const queryParams = new URLSearchParams();
    if (prompt) queryParams.set('prompt', prompt);
    if (category) queryParams.set('category', category);
    queryParams.set('mode', 'personal');
    navigate(`/design-studio?${queryParams.toString()}`);
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      if (imageUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `design-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Image downloaded!");
      } else {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `design-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Image downloaded!");
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download image");
    }
  };

  const truncateText = (text: string, maxLength: number = 100): string => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  const hasGeneratedImages = generatedVariations.length > 0;
  const displayImage = hasGeneratedImages 
    ? generatedVariations[selectedVariationIndex]?.imageUrl 
    : (designs.length > 0 ? designs[currentIndex]?.image : null);
  const displayDescription = hasGeneratedImages ? prompt : (designs.length > 0 ? designs[currentIndex]?.description : "");
  const displayDesigner = hasGeneratedImages ? "You" : (designs.length > 0 ? designs[currentIndex]?.designer : "");

  return (
    <TooltipProvider delayDuration={300}>
      <>
      <section className="py-8 md:py-16 bg-gradient-to-b from-background to-accent/30">
        <div className="container">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-4">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-secondary">Try AI Design Magic</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">
              See AI Create Furniture in Real-Time
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Describe your dream furniture and watch AI bring it to life. No signup needed.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-center">
            {/* Input Section - show first on mobile */}
            <div className="space-y-4 order-1 lg:order-1">
              <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Describe your dream furniture
                </h3>
                
                <div className="space-y-3">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chairs">Chairs & Seating</SelectItem>
                      <SelectItem value="tables">Tables</SelectItem>
                      <SelectItem value="benches">Benches</SelectItem>
                      <SelectItem value="consoles">Consoles</SelectItem>
                      <SelectItem value="installations">Art Installations</SelectItem>
                      <SelectItem value="sculptural art">Sculptural Art</SelectItem>
                      <SelectItem value="decor">Decor & Vases</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Upload Section - Two side by side */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Upload Sketch */}
                    <div className="relative">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      {uploadedImagePreview ? (
                        <div className="relative h-20 rounded-lg border border-border overflow-hidden bg-muted">
                          <img 
                            src={uploadedImagePreview} 
                            alt="Uploaded sketch" 
                            className="w-full h-full object-contain"
                          />
                          <button
                            onClick={clearUploadedImage}
                            className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-background/80 text-[10px] text-muted-foreground">
                            Sketch
                          </div>
                        </div>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground"
                            >
                              <ImagePlus className="w-4 h-4" />
                              <span className="text-xs">Add Sketch</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[200px] text-center">
                            <p>Upload a hand-drawn sketch or reference image to guide the AI design</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    {/* Upload Space Photo */}
                    <div className="relative">
                      <input
                        ref={roomInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleRoomImageUpload}
                        className="hidden"
                      />
                      {roomImagePreview ? (
                        <div className="relative h-20 rounded-lg border border-secondary/50 overflow-hidden bg-muted">
                          <img 
                            src={roomImagePreview} 
                            alt="Your space" 
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={clearRoomImage}
                            className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-secondary/80 text-[10px] text-secondary-foreground">
                            Space
                          </div>
                        </div>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => roomInputRef.current?.click()}
                              className="w-full h-20 rounded-lg border-2 border-dashed border-secondary/30 hover:border-secondary/50 bg-secondary/5 hover:bg-secondary/10 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-secondary"
                            >
                              <Home className="w-4 h-4" />
                              <span className="text-xs">Add Space</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[220px] text-center">
                            <p>Upload a photo of your room, corner, or area to get furniture tailored to fit</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <Input
                      placeholder={
                        uploadedImagePreview && roomImagePreview 
                          ? "Describe your ideal design (optional)" 
                          : uploadedImagePreview 
                            ? "Describe what you want (optional with sketch)" 
                            : roomImagePreview 
                              ? "Describe furniture for this space (optional)"
                              : "e.g., A flowing wave-inspired lounge chair with organic curves..."
                      }
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="h-12 pr-12"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isGenerating && !isGeneratingSurprise) {
                          handleGenerate();
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 text-muted-foreground hover:text-primary"
                      onClick={handleSurpriseMe}
                      disabled={isGeneratingSurprise || isGenerating}
                      title="Surprise Me - Generate a creative prompt"
                    >
                      {isGeneratingSurprise ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Shuffle className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      size="lg"
                      className="flex-1"
                      onClick={handleSurpriseMe}
                      disabled={isGeneratingSurprise || isGenerating}
                    >
                      {isGeneratingSurprise ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Thinking...
                        </>
                      ) : (
                        <>
                          <Shuffle className="w-4 h-4 mr-2" />
                          Surprise Me
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="hero" 
                      size="lg" 
                      className="flex-1 group"
                      onClick={handleGenerate}
                      disabled={isGenerating || isGeneratingSurprise}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate
                          <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Generation Progress */}
                  {isGenerating && generationProgress > 0 && (
                    <div className="space-y-2">
                      <Progress value={generationProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center">
                        Generating 3 variations... {Math.round(generationProgress)}%
                      </p>
                    </div>
                  )}

                  {/* Action buttons after generation */}
                  {hasGeneratedImages && (
                    <div className="flex flex-col gap-2 pt-2">
                      {/* Two-column layout for primary actions */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Consumer path - Get a Quote / Buy for yourself */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="hero" 
                              size="lg" 
                              className="w-full"
                              onClick={handleGetQuote}
                            >
                              <ShoppingBag className="w-4 h-4 mr-2" />
                              Get a Quote
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[200px] text-center">
                            <p>Want this made for your home? Get a manufacturing quote</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Designer path - List for Sale */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {user ? (
                              <Button 
                                variant="secondary" 
                                size="lg" 
                                className="w-full"
                                onClick={() => setShowQuickSellDialog(true)}
                              >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Sell This Design
                              </Button>
                            ) : (
                              <Button 
                                variant="secondary" 
                                size="lg" 
                                className="w-full"
                                onClick={() => navigate('/auth')}
                              >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Sell This Design
                              </Button>
                            )}
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[200px] text-center">
                            <p>List this design and earn royalties when others buy it</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="w-full"
                        onClick={() => handleContinueInStudio()}
                      >
                        Continue in Full Design Studio
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-3 text-center">
                  ✨ Free to try • No credit card required
                </p>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>AI-powered</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Manufacturable</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Earn royalties</span>
                </div>
              </div>
            </div>

            {/* Preview Gallery */}
            <div className="relative order-2 lg:order-2">
              <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-3xl blur-3xl"></div>
              
              <div className="relative bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
                {/* Design showcase */}
                <div className="aspect-square relative group">
                  {isGenerating ? (
                    <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-4">
                      <div className="relative">
                        <Sparkles className="w-16 h-16 text-primary animate-pulse" />
                        <div className="absolute inset-0 animate-ping">
                          <Sparkles className="w-16 h-16 text-primary/30" />
                        </div>
                      </div>
                      <p className="text-muted-foreground font-medium">AI is creating 3 variations...</p>
                      <p className="text-sm text-muted-foreground/70">This usually takes 15-20 seconds</p>
                    </div>
                  ) : isLoading ? (
                    <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-muted-foreground/50 animate-spin" />
                    </div>
                  ) : displayImage ? (
                    <>
                      <img
                        src={displayImage}
                        alt={hasGeneratedImages ? "Your AI-generated design" : designs[currentIndex]?.name}
                        className="w-full h-full object-cover transition-opacity duration-500"
                      />
                      
                      {/* Overlay with design info - placed BEFORE buttons so buttons are on top */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      
                      {/* Action buttons overlay - show on hover, z-10 to be above gradient */}
                      <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-9 w-9 bg-white/90 hover:bg-white shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFullscreenImage(displayImage);
                          }}
                          aria-label="View fullscreen"
                        >
                          <Maximize2 className="w-4 h-4 text-foreground" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-9 w-9 bg-white/90 hover:bg-white shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(displayImage);
                          }}
                          aria-label="Download image"
                        >
                          <Download className="w-4 h-4 text-foreground" />
                        </Button>
                      </div>
                      
                      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/70 mb-1">
                              {hasGeneratedImages ? "Your Design:" : "AI Generated Design:"}
                            </p>
                            <p className="text-sm font-medium leading-snug">
                              {truncateText(displayDescription)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-white/60">
                            by <span className="text-white/80 font-medium">{displayDesigner}</span>
                          </p>
                          
                          {!hasGeneratedImages && designs.length > 0 && (
                            <Link 
                              to={`/product/${designs[currentIndex].id}`}
                              className="text-xs text-primary hover:text-primary/80 font-medium"
                            >
                              View Details →
                            </Link>
                          )}
                        </div>
                      </div>
                      
                      {/* Navigation arrows - only show when viewing gallery (no generated images) */}
                      {!hasGeneratedImages && designs.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentIndex((prev) => (prev - 1 + designs.length) % designs.length);
                            }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10"
                            aria-label="Previous design"
                          >
                            <ChevronLeft className="w-5 h-5 text-foreground" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentIndex((prev) => (prev + 1) % designs.length);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10"
                            aria-label="Next design"
                          >
                            <ChevronRight className="w-5 h-5 text-foreground" />
                          </button>
                        </>
                      )}
                      
                      {/* Progress dots - only show when viewing gallery (no generated images) */}
                      {!hasGeneratedImages && designs.length > 1 && (
                        <div className="absolute top-4 right-4 flex gap-1.5">
                          {designs.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentIndex(idx)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                idx === currentIndex 
                                  ? 'bg-white w-6' 
                                  : 'bg-white/40 hover:bg-white/60'
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      {/* "Your creation" badge when showing generated image */}
                      {hasGeneratedImages && (
                        <div className="absolute top-4 right-4 px-3 py-1.5 bg-primary/90 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                          ✨ Your creation
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <p className="text-muted-foreground">No designs available</p>
                    </div>
                  )}
                </div>

                {/* Variation Thumbnails - show when we have multiple variations */}
                {hasGeneratedImages && generatedVariations.length > 1 && (
                  <div className="p-3 bg-muted/50 border-t border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-muted-foreground">Select variation:</span>
                    </div>
                    <div className="flex gap-2 justify-center">
                      {generatedVariations.map((variation, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedVariationIndex(idx)}
                          className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                            idx === selectedVariationIndex 
                              ? 'border-primary ring-2 ring-primary/20' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <img 
                            src={variation.imageUrl} 
                            alt={`Variation ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {idx === selectedVariationIndex && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white drop-shadow-lg" />
                            </div>
                          )}
                          <span className="absolute bottom-0.5 right-0.5 text-[10px] font-bold text-white bg-black/50 rounded px-1">
                            {idx + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom CTA bar */}
                <div className="p-3 bg-accent/50 border-t border-border">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">26+ AI designs</span> ready for manufacturing
                    </p>
                    <Link to="/browse">
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                        Browse All →
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fullscreen Image Viewer */}
      <FullscreenImageViewer
        imageUrl={fullscreenImage}
        isOpen={!!fullscreenImage}
        onClose={() => setFullscreenImage(null)}
        alt="Design preview"
      />

      {/* Quick Sell Dialog */}
      {hasGeneratedImages && (
        <QuickSellDialog
          isOpen={showQuickSellDialog}
          onClose={() => setShowQuickSellDialog(false)}
          imageUrl={generatedVariations[selectedVariationIndex]?.imageUrl || ""}
          category={category}
          prompt={prompt}
        />
      )}
      </>
    </TooltipProvider>
  );
};

export default InstantDesignPreview;
