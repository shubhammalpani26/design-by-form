import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, ArrowRight, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    fetchShowcaseDesigns();
  }, []);

  useEffect(() => {
    if (designs.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % designs.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [designs.length]);

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

  const handleTryNow = () => {
    // Navigate to design studio with pre-filled prompt
    const queryParams = new URLSearchParams();
    if (prompt) queryParams.set('prompt', prompt);
    if (category) queryParams.set('category', category);
    navigate(`/design-studio${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  };

  const truncateText = (text: string, maxLength: number = 100): string => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-accent/30">
      <div className="container">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-4">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-secondary">Try AI Design Magic</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            See AI Create Furniture in Real-Time
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Watch how your words transform into stunning designs. No signup needed to explore.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Input Section */}
          <div className="space-y-6 order-2 lg:order-1">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">1</span>
                Describe your dream furniture
              </h3>
              
              <div className="space-y-4">
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
                />
                
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full group"
                  onClick={handleTryNow}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Try the AI Design Studio
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-4 text-center">
                ✨ First generation is free • No credit card required
              </p>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
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
                {isLoading ? (
                  <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-muted-foreground/50 animate-spin" />
                  </div>
                ) : designs.length > 0 ? (
                  <>
                    <img
                      src={designs[currentIndex].image}
                      alt={designs[currentIndex].name}
                      className="w-full h-full object-cover transition-opacity duration-500"
                    />
                    
                    {/* Overlay with design info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/70 mb-1">AI Generated Design:</p>
                          <p className="text-sm font-medium leading-snug">
                            {truncateText(designs[currentIndex].description)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-white/60">
                          by <span className="text-white/80 font-medium">{designs[currentIndex].designer}</span>
                        </p>
                        
                        <Link 
                          to={`/product/${designs[currentIndex].id}`}
                          className="text-xs text-primary hover:text-primary/80 font-medium"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                    
                    {/* Progress dots */}
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
                  </>
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <p className="text-muted-foreground">No designs available</p>
                  </div>
                )}
              </div>

              {/* Bottom CTA bar */}
              <div className="p-4 bg-accent/50 border-t border-border">
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
