import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { HomeProductCard } from "@/components/HomeProductCard";
import { CommunityFeedPreview } from "@/components/CommunityFeedPreview";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/slugify";
import { useToast } from "@/hooks/use-toast";

import { Skeleton } from "@/components/ui/skeleton";
import categoryLinen from "@/assets/category-linen.jpg";
import categoryJewelry from "@/assets/category-jewelry.jpg";
import categoryDecor from "@/assets/category-decor.jpg";
import categoryAccessories from "@/assets/category-accessories.jpg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import testimonialPriya from "@/assets/testimonial-priya.jpg";
import testimonialRajesh from "@/assets/testimonial-rajesh.jpg";
import testimonialAnanya from "@/assets/testimonial-ananya.jpg";
import testimonialArjun from "@/assets/testimonial-arjun.jpg";
import CuratedShowcase from "@/components/CuratedShowcase";
import testimonialMeera from "@/assets/testimonial-meera.jpg";
import testimonialKaran from "@/assets/testimonial-karan.jpg";
import { ScrollReveal, StaggerReveal, useCountUp } from "@/hooks/useScrollReveal";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Furniture Creator",
    image: testimonialPriya,
    quote: "My virtual designs became real furniture in customers' homes! The perpetual commission from each physical sale is amazing. I earned ₹2.5 lakhs in my first 6 months.",
    earnings: "₹2,50,000"
  },
  {
    name: "Rajesh Kumar",
    role: "Architecture Student",
    image: testimonialRajesh,
    quote: "I design, Nyzora manufactures and ships actual products. Seeing my chair design manufactured and sold to 47 customers is incredible!",
    earnings: "₹1,85,000"
  },
  {
    name: "Ananya Desai",
    role: "Product Creator",
    image: testimonialAnanya,
    quote: "From digital concept to physical furniture - the platform handles manufacturing and shipping while I keep earning from every piece sold. It's like having my own furniture factory!",
    earnings: "₹3,20,000"
  },
  {
    name: "Arjun Mehta",
    role: "Interior Creator",
    image: testimonialArjun,
    quote: "Every table I design gets manufactured and delivered to actual customers. I earn royalties on every physical piece sold. No inventory, no manufacturing headaches!",
    earnings: "₹4,10,000"
  },
  {
    name: "Meera Patel",
    role: "3D Artist",
    image: testimonialMeera,
    quote: "Watching my designs transform into real products that people use in their homes is surreal. The manufacturing quality is excellent and I earn from every sale!",
    earnings: "₹2,95,000"
  },
  {
    name: "Karan Singh",
    role: "Industrial Creator",
    image: testimonialKaran,
    quote: "I focus on creating innovative designs while Nyzora handles production and logistics. My bench design has been manufactured 63 times - earning me commission on each!",
    earnings: "₹3,75,000"
  }
];

// Note: Testimonials represent illustrative success scenarios to demonstrate platform potential

interface Product {
  id: string;
  name: string;
  designer: string;
  designerId: string;
  price: number;
  weight: number;
  image: string;
  description?: string;
}

interface HeroProduct {
  id: string;
  name: string;
  image_url: string;
}

// Truncate description for display
const truncateDescription = (description: string | undefined, maxLength: number = 80): string => {
  if (!description) return "AI-generated furniture design";
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength).trim() + "...";
};

// Marquee brands/features strip
const marqueeItems = [
  "Vetted Makers"
];

const expansionCategories = [
  {
    id: "linen",
    name: "Linen & Soft Furnishings",
    description: "Custom patterns designed for your space",
    image: categoryLinen,
    tag: "Coming Soon",
  },
  {
    id: "jewelry",
    name: "Jewelry",
    description: "Personal pieces crafted with AI and precision",
    image: categoryJewelry,
    tag: "Coming Soon",
  },
  {
    id: "decor-lighting",
    name: "Decor & Lighting",
    description: "Sculptural objects and ambient lighting, designed by you",
    image: categoryDecor,
    tag: "Coming Soon",
  },
  {
    id: "accessories",
    name: "Accessories",
    description: "Tote bags, scarves & more — your pattern, your product",
    image: categoryAccessories,
    tag: "Coming Soon",
  },
];

const styleBubbles = [
  { label: "Modern coffee table" },
  { label: "Sculptural lounge chair" },
  { label: "Dining table for 8" },
  { label: "Floating wall shelf" },
];

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatorStats, setCreatorStats] = useState({
    activeCreators: 0,
  });
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [heroProduct, setHeroProduct] = useState<HeroProduct | null>(null);
  const [heroPrompt, setHeroPrompt] = useState("");
  
  // Early access modal state
  const [earlyAccessCategory, setEarlyAccessCategory] = useState<string | null>(null);
  const [earlyAccessEmail, setEarlyAccessEmail] = useState("");
  const [earlyAccessWhatsapp, setEarlyAccessWhatsapp] = useState("");
  const [earlyAccessSubmitting, setEarlyAccessSubmitting] = useState(false);

  // Animated counters
  const creatorsCounter = useCountUp(creatorStats.activeCreators, 1500);

  useEffect(() => {
    fetchFeaturedProducts();
    fetchCreatorStats();
    fetchHeroProduct();
  }, []);

  useEffect(() => {
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 10000);
    return () => clearInterval(testimonialInterval);
  }, []);

  const fetchCreatorStats = async () => {
    try {
      const { count, error } = await supabase
        .from('designer_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved');

      if (error) throw error;

      const total = count ?? 0;
      const roundedCount = total < 5 ? Math.max(total, 1) : Math.floor(total / 5) * 5;

      setCreatorStats({
        activeCreators: roundedCount,
      });
    } catch (error) {
      console.error('Error fetching creator stats:', error);
    }
  };

  const fetchHeroProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('designer_products')
        .select('id, name, image_url')
        .ilike('name', '%obsidian flow bench%')
        .limit(1)
        .maybeSingle();
      
      if (!error && data) {
        setHeroProduct(data);
      }
    } catch (error) {
      console.error('Error fetching hero product:', error);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const { data: allData, error } = await supabase
        .from('designer_products')
        .select(`
          id,
          name,
          designer_price,
          weight,
          image_url,
          designer_id,
          category,
          designer_profiles!inner(name)
        `)
        .eq('status', 'approved')
        .in('category', ['tables', 'benches', 'installations', 'vases', 'home-decor'])
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && allData) {
        const products = allData.map(product => ({
          id: product.id,
          name: product.name,
          designer: product.designer_profiles?.name || 'Unknown Designer',
          designerId: product.designer_id,
          price: Number(product.designer_price),
          weight: Number(product.weight || 5),
          image: product.image_url || ''
        }));
        setFeaturedProducts(products);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEarlyAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!earlyAccessEmail && !earlyAccessWhatsapp) {
      toast({ title: "Please enter email or WhatsApp number", variant: "destructive" });
      return;
    }
    setEarlyAccessSubmitting(true);
    try {
      const { error } = await supabase.from("early_access_signups" as any).insert({
        email: earlyAccessEmail || null,
        whatsapp: earlyAccessWhatsapp || null,
        category: earlyAccessCategory,
      } as any);
      if (error) throw error;
      toast({ title: "You're on the list! 🎉", description: "We'll notify you when this category launches." });
      setEarlyAccessCategory(null);
      setEarlyAccessEmail("");
      setEarlyAccessWhatsapp("");
    } catch (error) {
      console.error("Early access signup error:", error);
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    } finally {
      setEarlyAccessSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section — Clean, editorial style */}
        <section className="relative overflow-hidden bg-background pt-10 pb-6 md:pt-16 md:pb-10">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-6xl font-bold leading-[1.1] text-foreground animate-slide-up">
                  Design Anything.{" "}
                  <span className="gradient-text-animated">We Make It Real.</span>
                </h1>
                
                <p className="text-lg md:text-xl text-muted-foreground max-w-lg animate-blur-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                  Create custom physical products—<span className="text-foreground font-semibold">starting with furniture.</span>
                </p>

                <p className="text-sm font-medium text-primary/80 max-w-lg animate-blur-in tracking-wide" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
                  AI-powered design. Real-world manufacturing.
                </p>
                
                {/* Smart Prompt Bar */}
                <div 
                  className="animate-fade-in"
                  style={{ animationDelay: '400ms', animationFillMode: 'both' }}
                >
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (heroPrompt.trim()) {
                        navigate(`/design-studio?prompt=${encodeURIComponent(heroPrompt.trim())}`);
                      } else {
                        navigate('/design-studio');
                      }
                    }}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 w-full max-w-lg sm:relative"
                  >
                    <div className="relative flex-1">
                      <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                      <input
                        type="text"
                        value={heroPrompt}
                        onChange={(e) => setHeroPrompt(e.target.value)}
                        placeholder="What do you want to create?"
                        className="w-full h-12 pl-10 pr-4 sm:pr-28 rounded-full border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm md:text-base shadow-soft"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      variant="hero" 
                      size="sm" 
                      className="sm:absolute sm:right-1.5 rounded-full h-10 sm:h-9 px-5 sm:px-3.5 text-xs font-medium w-full sm:w-auto"
                    >
                      Start Designing <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </form>

                  {/* Click-to-Try Bubbles */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="text-xs text-muted-foreground/50 font-medium">Try:</span>
                    {styleBubbles.map((bubble) => (
                      <button
                        key={bubble.label}
                        onClick={() => navigate(`/design-studio?prompt=${encodeURIComponent(bubble.label)}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 hover:bg-primary/10 border border-border/50 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      >
                        {bubble.label}
                      </button>
                    ))}
                  </div>

                  {/* Trust indicator */}
                  <p className="text-xs text-muted-foreground/60 mt-3">
                    Built with real manufacturers. Delivered to your space.
                  </p>
                </div>
                
                <div className="flex items-center gap-6 pt-2 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>
                  <Link to="/browse" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    Browse created designs →
                  </Link>
                </div>
              </div>
              
              <div className="relative animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-3xl animate-pulse"></div>
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-medium border-2 border-primary/10 group">
                  {heroProduct ? (
                    <Link 
                      to={`/product/${slugify(heroProduct.name)}`}
                      className="block w-full h-full cursor-pointer"
                    >
                      <img
                        src={heroProduct.image_url}
                        alt={heroProduct.name}
                        loading="eager"
                        decoding="async"
                        className="w-full h-full object-contain bg-muted/30 transition-all duration-700 group-hover:scale-105"
                      />
                      
                       <div className="absolute bottom-4 left-4 right-4 glass rounded-lg shadow-lg overflow-hidden">
                        <div className="p-3">
                          <p className="text-sm font-medium text-foreground">
                              {heroProduct.name}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                      <Skeleton className="w-full h-full" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Curated Showcase — Prompt → Product → Space */}
        <CuratedShowcase />

        {/* Featured Products */}
        <section className="container py-10 md:py-16">
          <ScrollReveal animation="fade-up">
            <div className="flex items-center justify-between mb-12">
              <div className="text-center flex-1">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Featured Designs</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Discover pieces crafted by our community of talented creators
                </p>
              </div>
            </div>
          </ScrollReveal>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <ScrollReveal animation="fade-up" delay={200}>
              <Carousel
                opts={{ align: "start", loop: false }}
                className="relative px-10"
              >
                <CarouselContent>
                  {featuredProducts.map((product) => (
                    <CarouselItem
                      key={product.id}
                      className="basis-full sm:basis-1/2 lg:basis-1/5"
                    >
                      <HomeProductCard {...product} />
                    </CarouselItem>
                  ))}
                </CarouselContent>

                <CarouselPrevious
                  className="left-0 h-10 w-10 bg-background/95 backdrop-blur-sm shadow-lg"
                />
                <CarouselNext
                  className="right-0 h-10 w-10 bg-background/95 backdrop-blur-sm shadow-lg"
                />
              </Carousel>
            </ScrollReveal>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No featured products available yet.</p>
            </div>
          )}

          <ScrollReveal animation="zoom-in" delay={300}>
            <div className="text-center mt-12">
              <Link to="/browse">
                <Button variant="outline" size="lg">
                  View All Products
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </section>

        {/* Social Proof Strip */}
        <section className="py-8 md:py-12 bg-muted/50">
          <div className="container">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
              <div className="text-center">
                <div 
                  ref={creatorsCounter.ref}
                  className="text-4xl md:text-5xl font-bold text-foreground"
                >
                  {creatorsCounter.isVisible ? creatorsCounter.count : 0}+
                </div>
                <div className="text-sm text-muted-foreground mt-1 tracking-wide uppercase">Active Creators</div>
              </div>
              <div className="hidden md:block w-px h-12 bg-border" />
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-foreground">~30s</div>
                <div className="text-sm text-muted-foreground mt-1 tracking-wide uppercase">Design Generation</div>
              </div>
              <div className="hidden md:block w-px h-12 bg-border" />
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-foreground">70%</div>
                <div className="text-sm text-muted-foreground mt-1 tracking-wide uppercase">Creator Royalty</div>
              </div>
            </div>
          </div>
        </section>

        {/* Designer Testimonials Carousel */}
        <section className="py-10 md:py-16">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                  Real Creators, Real Success
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto mb-2">
                  Join thousands of creators earning from physical product sales
                </p>
                <p className="text-xs text-muted-foreground/70 italic">
                  *Testimonials represent illustrative success scenarios
                </p>
              </div>
            </ScrollReveal>
            
            <ScrollReveal animation="zoom-in" delay={100}>
              <div className="max-w-4xl mx-auto">
                <div className="bg-background rounded-3xl p-8 md:p-12 shadow-medium border border-border/50 relative overflow-hidden hover-lift">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-32 translate-x-32"></div>
                  
                  <div className="relative">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                      <img
                        src={testimonials[currentTestimonial].image}
                        alt={testimonials[currentTestimonial].name}
                        className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-primary/20 shadow-soft transition-all duration-500"
                        key={currentTestimonial}
                      />
                      
                      <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="text-5xl text-primary/20 font-serif">"</div>
                        <p 
                          className="text-lg md:text-xl text-foreground leading-relaxed -mt-8 transition-opacity duration-500"
                          key={`quote-${currentTestimonial}`}
                        >
                          {testimonials[currentTestimonial].quote}
                        </p>
                        
                        <div className="pt-4">
                          <div className="font-semibold text-foreground text-lg">
                            {testimonials[currentTestimonial].name}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {testimonials[currentTestimonial].role}
                          </div>
                          <div className="text-primary font-bold text-lg mt-2 gradient-text">
                            Earned: {testimonials[currentTestimonial].earnings}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center gap-4 mt-8">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                        className="rounded-full"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </Button>
                      
                      <div className="flex gap-2">
                        {testimonials.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentTestimonial(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              index === currentTestimonial 
                                ? 'bg-primary w-8' 
                                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                            }`}
                            aria-label={`Go to testimonial ${index + 1}`}
                          />
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
                        className="rounded-full"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
            
            <ScrollReveal animation="fade-up" delay={200}>
              <div className="text-center mt-12">
                <Link to="/designer-signup">
                  <Button variant="hero" size="lg" className="group">
                    Start Earning as a Creator
                    <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* How It Works — Compact 3-step */}
        <section className="bg-accent py-12 md:py-16">
          <div className="container">
            <ScrollReveal animation="blur-in">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
                  How it <span className="gradient-text-animated">works</span>
                </h2>
              </div>
            </ScrollReveal>
            
            <StaggerReveal 
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
              staggerDelay={150}
              animation="fade-up"
            >
              <div className="text-center space-y-3 group">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto shadow-soft group-hover:scale-110 transition-transform">
                  1
                </div>
                <h3 className="text-lg font-semibold text-foreground">Create with AI</h3>
                <p className="text-sm text-muted-foreground">
                  Describe or sketch your idea. Get 3 design variations in ~30 seconds.
                </p>
              </div>
              
              <div className="text-center space-y-3 group">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto shadow-soft group-hover:scale-110 transition-transform">
                  2
                </div>
                <h3 className="text-lg font-semibold text-foreground">We manufacture</h3>
                <p className="text-sm text-muted-foreground">
                  Each piece is crafted on-demand by our vetted makers. You handle nothing.
                </p>
              </div>
              
              <div className="text-center space-y-3 group">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto shadow-soft group-hover:scale-110 transition-transform">
                  3
                </div>
                <h3 className="text-lg font-semibold text-foreground">Earn forever</h3>
                <p className="text-sm text-muted-foreground">
                  Earn 70% of markup on every sale. Perpetual royalties, monthly payouts.
                </p>
              </div>
            </StaggerReveal>
            
            <ScrollReveal animation="fade-up" delay={300}>
              <div className="text-center mt-10">
                <Link to="/how-it-works">
                  <Button variant="outline" size="lg">
                    Learn More
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>


        {/* Expanding Beyond Furniture */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-4">
                <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
                  Expanding Beyond <span className="gradient-text-animated">Furniture</span>
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Custom products, designed by you — starting with furniture.
                </p>
              </div>
            </ScrollReveal>

            <StaggerReveal
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
              staggerDelay={120}
              animation="fade-up"
            >
              {expansionCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="group relative rounded-2xl overflow-hidden border border-border/50 bg-card shadow-soft hover:shadow-medium hover:border-primary/30 transition-all duration-500 cursor-pointer"
                  onClick={() => setEarlyAccessCategory(cat.id)}
                >
                  <div className="aspect-[4/5] relative overflow-hidden">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      loading="lazy"
                      width={640}
                      height={800}
                      className="w-full h-full object-cover brightness-[0.85] group-hover:brightness-100 group-hover:scale-105 transition-all duration-700"
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                    
                    {/* Glow on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-primary/20 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Tag */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-sm text-[10px] font-semibold uppercase tracking-wider text-foreground/80 border border-border/40">
                      {cat.tag}
                    </span>
                  </div>

                  {/* Text overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 space-y-1.5">
                    <h3 className="text-base font-semibold text-background leading-tight">{cat.name}</h3>
                    <p className="text-xs text-background/70 leading-snug">{cat.description}</p>
                    <button
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground bg-primary/90 backdrop-blur-sm px-3 py-1.5 rounded-full hover:bg-primary group-hover:translate-x-0.5 transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEarlyAccessCategory(cat.id);
                      }}
                    >
                      Get Priority Access <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </StaggerReveal>
          </div>
        </section>

        {/* Early Access Modal */}
        {earlyAccessCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm" onClick={() => setEarlyAccessCategory(null)}>
            <div
              className="relative bg-background rounded-2xl shadow-lg border border-border w-full max-w-md mx-4 p-8 animate-zoom-in"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setEarlyAccessCategory(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-xl font-bold text-foreground mb-1">
                Get Early Access
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Be the first to know when{" "}
                <span className="font-medium text-foreground">
                  {expansionCategories.find((c) => c.id === earlyAccessCategory)?.name}
                </span>{" "}
                launches on Nyzora.
              </p>
              <form onSubmit={handleEarlyAccessSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    value={earlyAccessEmail}
                    onChange={(e) => setEarlyAccessEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full mt-1 h-10 px-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">WhatsApp (optional)</label>
                  <input
                    type="tel"
                    value={earlyAccessWhatsapp}
                    onChange={(e) => setEarlyAccessWhatsapp(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full mt-1 h-10 px-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={earlyAccessSubmitting}>
                  {earlyAccessSubmitting ? "Submitting..." : "Notify Me"}
                </Button>
                <p className="text-[10px] text-muted-foreground text-center">We'll only use this to notify you. No spam.</p>
              </form>
            </div>
          </div>
        )}

        {/* Crafted by Verified Makers */}
        <section className="py-12 md:py-16 bg-accent">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <div className="max-w-2xl mx-auto text-center mb-12">
                <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-4">Trust & Quality</p>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                  Crafted by <span className="gradient-text-animated">Verified Makers</span>
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Every product is brought to life by carefully vetted artisans and fabricators — selected for craft, consistency, and care.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-3 gap-px bg-border rounded-xl overflow-hidden max-w-3xl mx-auto">
              {[
                { name: "Solid Wood Experts", location: "Jodhpur", years: "15+" },
                { name: "Metal Fabricators", location: "Pune", years: "12+" },
                { name: "Composite Artisans", location: "Bengaluru", years: "8+" },
              ].map((maker) => (
                <div key={maker.name} className="bg-background p-6 md:p-8 text-center space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">{maker.name}</h3>
                  <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{maker.location} · {maker.years} years</p>
                </div>
              ))}
            </div>

            <ScrollReveal animation="fade-up" delay={200}>
              <div className="text-center mt-8">
                <Link to="/verified-makers" className="text-xs text-primary font-medium hover:underline uppercase tracking-wider">
                  Meet All Verified Makers →
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Designed by Creators Worldwide */}
        <section className="py-12 md:py-16">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <div className="max-w-2xl mx-auto text-center mb-12">
                <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-4">Creator Economy</p>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                  Designed by Creators <span className="gradient-text-animated">Worldwide</span>
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Discover original designs created by creators across the world. Each piece is exclusive, customizable, and available only on Nyzora.
                </p>
                <p className="text-xs font-medium text-primary mt-4 uppercase tracking-wider">
                  Creators earn from every product sold.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden max-w-3xl mx-auto">
              {[
                { label: "Original Designs" },
                { label: "Exclusively on Nyzora" },
                { label: "Custom-Made for You" },
                { label: "Perpetual Royalties" },
              ].map((item) => (
                <div key={item.label} className="bg-background p-6 text-center">
                  <p className="text-xs font-semibold text-foreground tracking-tight">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Nyzora */}
        <section className="py-12 md:py-16 bg-accent">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <div className="max-w-2xl mx-auto text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-3">
                  Why <span className="gradient-text-animated">Nyzora</span>?
                </h2>
                <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.2em]">Designed. Built. Delivered.</p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden max-w-4xl mx-auto">
              {[
                { title: "AI-Powered Design", desc: "Create custom products with intelligent design tools" },
                { title: "Verified Makers", desc: "Expert manufacturers vetted for quality and reliability" },
                { title: "End-to-End", desc: "From design to delivery — we manage everything" },
                { title: "Quality Assured", desc: "Every piece inspected before it reaches your space" },
              ].map((item) => (
                <div key={item.title} className="bg-background p-6 md:p-8 text-center space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-10 md:py-14 border-t border-border">
          <div className="container">
            <div className="relative py-12 md:py-16 px-8 md:px-16 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-[hsl(var(--primary))]" />
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground tracking-tight mb-2">
                    Ready to Transform<br />Your Space?
                  </h2>
                  <p className="text-primary-foreground/50 text-sm">
                    Custom-made for your space. Built by real manufacturers. Verified by Nyzora.
                  </p>
                </div>
                <Link
                  to="/browse"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-primary-foreground text-primary text-sm font-medium rounded-full hover:opacity-90 transition-opacity shrink-0"
                >
                  Start Shopping <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
