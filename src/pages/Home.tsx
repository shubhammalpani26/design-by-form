import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HomeProductCard } from "@/components/HomeProductCard";
import { CommunityFeedPreview } from "@/components/CommunityFeedPreview";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/slugify";

import { Skeleton } from "@/components/ui/skeleton";
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
import InstantDesignPreview from "@/components/InstantDesignPreview";
import testimonialMeera from "@/assets/testimonial-meera.jpg";
import testimonialKaran from "@/assets/testimonial-karan.jpg";
import { ScrollReveal, StaggerReveal, useCountUp } from "@/hooks/useScrollReveal";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Furniture Designer",
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
    role: "Product Designer",
    image: testimonialAnanya,
    quote: "From digital concept to physical furniture - the platform handles manufacturing and shipping while I keep earning from every piece sold. It's like having my own furniture factory!",
    earnings: "₹3,20,000"
  },
  {
    name: "Arjun Mehta",
    role: "Interior Designer",
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
    role: "Industrial Designer",
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
  "AI-Powered Design", "Sustainable Manufacturing", "Global Creators", 
  "On-Demand Production", "3D Visualization", "AR Preview",
  "Perpetual Royalties", "Zero Inventory", "Eco-Friendly",
  "Custom Furniture", "Designer Community", "Smart Pricing"
];

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatorStats, setCreatorStats] = useState({
    activeCreators: 0,
  });
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [heroProduct, setHeroProduct] = useState<HeroProduct | null>(null);

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section — Clean, editorial style */}
        <section className="relative overflow-hidden bg-gradient-to-b from-accent to-background py-12 md:py-20">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-6xl font-bold leading-[1.1] text-foreground animate-slide-up">
                  Create real furniture{" "}
                  <span className="gradient-text-animated">with AI</span>
                </h1>
                
                <p className="text-lg md:text-xl text-muted-foreground max-w-lg animate-blur-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                  Design, manufacture, and sell unique furniture — crafted by our community of creators and makers.
                </p>
                
                <div 
                  className="flex flex-col sm:flex-row gap-3 animate-fade-in"
                  style={{ animationDelay: '400ms', animationFillMode: 'both' }}
                >
                  <Link to="/design-studio" className="w-full sm:w-auto">
                    <Button variant="hero" size="lg" className="group w-full sm:w-auto text-base">
                      Start Creating
                      <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                    </Button>
                  </Link>
                  <Link to="/browse" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
                      Explore Designs
                    </Button>
                  </Link>
                </div>
                
                <div className="flex items-center gap-6 pt-2 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    AI-powered
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    On-demand manufacturing
                  </span>
                  <span className="flex items-center gap-1.5 hidden sm:flex">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Perpetual royalties
                  </span>
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
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                              <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {heroProduct.name}
                            </p>
                          </div>
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

        {/* Scrolling Marquee Strip */}
        <div className="overflow-hidden bg-foreground py-3 marquee-container">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={i} className="mx-6 text-sm font-medium text-background/90 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Instant Design Preview - Try AI Section */}
        <InstantDesignPreview />

        {/* Featured Products */}
        <section className="container py-10 md:py-20">
          <ScrollReveal animation="fade-up">
            <div className="flex items-center justify-between mb-12">
              <div className="text-center flex-1">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Featured Designs</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Discover pieces crafted by our community of talented designers
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
        <section className="py-8 md:py-12 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent">
          <div className="container">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
              <div className="text-center">
                <div 
                  ref={creatorsCounter.ref}
                  className="text-4xl md:text-5xl font-bold text-primary"
                >
                  {creatorsCounter.isVisible ? creatorsCounter.count : 0}+
                </div>
                <div className="text-sm text-muted-foreground mt-1">Active Creators</div>
              </div>
              <div className="hidden md:block w-px h-12 bg-border" />
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-secondary">~30s</div>
                <div className="text-sm text-muted-foreground mt-1">Design Generation</div>
              </div>
              <div className="hidden md:block w-px h-12 bg-border" />
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary">70%</div>
                <div className="text-sm text-muted-foreground mt-1">Creator Royalty</div>
              </div>
            </div>
          </div>
        </section>

        {/* Designer Testimonials Carousel */}
        <section className="py-10 md:py-20">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                  Real Designers, Real Success
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto mb-2">
                  Join thousands of designers earning from physical product sales
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
                    Start Earning as a Designer
                    <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* How It Works — Compact 3-step */}
        <section className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent py-12 md:py-20">
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

        {/* Community Feed Preview */}
        <CommunityFeedPreview />

        {/* CTA Section */}
        <section className="container py-10 md:py-20">
          <ScrollReveal animation="zoom-in">
            <div className="bg-primary rounded-3xl p-6 md:p-12 text-center text-primary-foreground shadow-medium relative overflow-hidden">
              {/* Animated background accents */}
              <div className="absolute top-0 left-0 w-72 h-72 bg-secondary/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl animate-pulse" />
              <div className="absolute bottom-0 right-0 w-72 h-72 bg-accent/20 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
              
              <div className="relative">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready to Transform Your Space?
                </h2>
                <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
                  Join thousands of customers who've discovered the perfect blend of style, sustainability, and story
                </p>
                <Link to="/browse">
                  <Button variant="outline" size="lg" className="bg-background text-foreground hover:bg-background/90">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
