import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PreviewDesign {
  id: string;
  name: string;
  description: string;
  image: string;
  designer: string;
}

const InstantDesignPreview = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("chairs");
  const [designs, setDesigns] = useState<PreviewDesign[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchShowcaseDesigns();
  }, []);

  useEffect(() => {
    // Only auto-rotate if we haven't generated a custom image
    if (designs.length > 1 && !generatedImage) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % designs.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [designs.length, generatedImage]);

  const fetchShowcaseDesigns = async () => {
    try {
      const { data, error } = await supabase
        .from('designer_products')
        .select(`
          id,
          name,
          description,
          image_url,
          designer_profiles!inner(name)
        `)
        .eq('status', 'approved')
        .not('image_url', 'is', null)
        .not('description', 'is', null)
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

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a design description");
      return;
    }

    if (prompt.trim().length < 10) {
      toast.error("Please describe your design in more detail (at least 10 characters)");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const fullPrompt = `${category}: ${prompt}`;
      
      const { data, error } = await supabase.functions.invoke('generate-design', {
        body: { 
          prompt: fullPrompt,
          variationNumber: 1,
          generate3D: false
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast.success("Design generated! ✨");
      } else {
        throw new Error("No image generated");
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || "Failed to generate design. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinueInStudio = () => {
    const queryParams = new URLSearchParams();
    if (prompt) queryParams.set('prompt', prompt);
    if (category) queryParams.set('category', category);
    if (generatedImage) {
      // Store generated image in sessionStorage so studio can use it
      sessionStorage.setItem('homepage-generated-image', generatedImage);
    }
    navigate(`/design-studio${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  };

  const truncateText = (text: string, maxLength: number = 100): string => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  const displayImage = generatedImage || (designs.length > 0 ? designs[currentIndex]?.image : null);
  const displayDescription = generatedImage ? prompt : (designs.length > 0 ? designs[currentIndex]?.description : "");
  const displayDesigner = generatedImage ? "You" : (designs.length > 0 ? designs[currentIndex]?.designer : "");

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-background to-accent/30">
      <div className="container">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-4">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-secondary">Try AI Design Magic</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            See AI Create Furniture in Real-Time
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Describe your dream furniture and watch AI bring it to life. No signup needed.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          {/* Input Section */}
          <div className="space-y-4 order-2 lg:order-1">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">1</span>
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
                    <SelectItem value="installations">Art Installations</SelectItem>
                    <SelectItem value="sculptural art">Sculptural Art</SelectItem>
                    <SelectItem value="decor">Decor & Vases</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="e.g., A flowing wave-inspired lounge chair with organic curves..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="h-12"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isGenerating) {
                      handleGenerate();
                    }
                  }}
                />
                
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full group"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating your design...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Design
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>

                {generatedImage && (
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full"
                    onClick={handleContinueInStudio}
                  >
                    Continue in Full Design Studio
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
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
          <div className="relative order-1 lg:order-2">
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-3xl blur-3xl"></div>
            
            <div className="relative bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
              {/* Design showcase */}
              <div className="aspect-square relative">
                {isGenerating ? (
                  <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                      <Sparkles className="w-16 h-16 text-primary animate-pulse" />
                      <div className="absolute inset-0 animate-ping">
                        <Sparkles className="w-16 h-16 text-primary/30" />
                      </div>
                    </div>
                    <p className="text-muted-foreground font-medium">AI is creating your design...</p>
                    <p className="text-sm text-muted-foreground/70">This usually takes 10-15 seconds</p>
                  </div>
                ) : isLoading ? (
                  <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-muted-foreground/50 animate-spin" />
                  </div>
                ) : displayImage ? (
                  <>
                    <img
                      src={displayImage}
                      alt={generatedImage ? "Your AI-generated design" : designs[currentIndex]?.name}
                      className="w-full h-full object-cover transition-opacity duration-500"
                    />
                    
                    {/* Overlay with design info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/70 mb-1">
                            {generatedImage ? "Your Design:" : "AI Generated Design:"}
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
                        
                        {!generatedImage && designs.length > 0 && (
                          <Link 
                            to={`/product/${designs[currentIndex].id}`}
                            className="text-xs text-primary hover:text-primary/80 font-medium"
                          >
                            View Details →
                          </Link>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress dots - only show when viewing gallery */}
                    {!generatedImage && designs.length > 1 && (
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
                    {generatedImage && (
                      <div className="absolute top-4 left-4 px-3 py-1.5 bg-primary/90 backdrop-blur-sm rounded-full text-white text-xs font-medium">
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

              {/* Bottom CTA bar */}
              <div className="p-3 bg-accent/50 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{designs.length}+</span> AI designs ready for manufacturing
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
  );
};

export default InstantDesignPreview;
