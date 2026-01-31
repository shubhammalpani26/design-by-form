import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HomeProductCard } from "@/components/HomeProductCard";
import { CommunityFeedPreview } from "@/components/CommunityFeedPreview";
import { supabase } from "@/integrations/supabase/client";
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
    quote: "I design, Formo manufactures and ships actual products. Seeing my chair design manufactured and sold to 47 customers is incredible!",
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
    quote: "I focus on creating innovative designs while Formo handles production and logistics. My bench design has been manufactured 63 times - earning me commission on each!",
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

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatorStats, setCreatorStats] = useState({
    activeCreators: 0,
  });
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [heroProduct, setHeroProduct] = useState<HeroProduct | null>(null);

  useEffect(() => {
    fetchFeaturedProducts();
    fetchCreatorStats();
    fetchHeroProduct();
  }, []);

  useEffect(() => {
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 10000); // 10 seconds for easier reading
    return () => clearInterval(testimonialInterval);
  }, []);


  const fetchCreatorStats = async () => {
    try {
      // Count unique designers with earnings
      const { data: designerData } = await supabase
        .from('designer_earnings')
        .select('designer_id');

      // Get unique count
      const uniqueDesigners = designerData 
        ? new Set(designerData.map(d => d.designer_id)).size 
        : 0;

      // Round down to nearest 5 (1-4 shows 1, 5-9 shows 5, 10-14 shows 10, etc.)
      const roundedCount = uniqueDesigners > 0 
        ? (uniqueDesigners < 5 ? 1 : Math.floor(uniqueDesigners / 5) * 5)
        : 1;

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
      // Fetch multiple products from each category for carousel
      const categories = ['tables', 'benches', 'installations', 'vases', 'home-decor'];
      const allProducts: Product[] = [];

      for (const category of categories) {
        const { data: categoryData, error } = await supabase
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
          .eq('category', category)
          .order('created_at', { ascending: false })
          .limit(2);

        if (!error && categoryData) {
          categoryData.forEach(product => {
            allProducts.push({
              id: product.id,
              name: product.name,
              designer: product.designer_profiles?.name || 'Unknown Designer',
              designerId: product.designer_id,
              price: Number(product.designer_price),
              weight: Number(product.weight || 5),
              image: product.image_url || ''
            });
          });
        }
      }

      // Keep up to 10 products for carousel scrolling
      setFeaturedProducts(allProducts.slice(0, 10));
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
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-accent to-background py-12 md:py-16">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 animate-fade-in">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <span className="text-sm font-semibold text-primary">AI-Powered Design Studio</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold leading-tight text-foreground">
                  From concept to{" "}
                  <span className="text-primary bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    creation
                  </span>
                </h1>
                
                <p className="text-lg text-muted-foreground max-w-xl">
                  Just imagine, and we bring it to life. From concept to creation, transform your vision into tangible masterpieces.
                </p>
                
                <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-2xl p-4 sm:p-6 max-w-xl backdrop-blur-sm shadow-lg">
                  <p className="text-base sm:text-lg font-semibold text-foreground mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    For Creators: Your Vision, Our Craftsmanship
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
                    Transform your ideas into real furniture and earn royalties as your designs come to life—without the burden of production or logistics.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                  <Link to="/design-studio" className="w-full sm:w-auto">
                    <Button variant="hero" size="lg" className="group w-full sm:w-auto">
                      Start Designing with AI
                      <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                    </Button>
                  </Link>
                  <Link to="/community" className="w-full sm:w-auto">
                    <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                      Creator Community
                    </Button>
                  </Link>
                  <Link to="/browse" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Browse Products
                    </Button>
                  </Link>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-3 sm:gap-4 pt-4 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>Unique designs from creators worldwide</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-secondary shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Sustainable on-demand manufacturing</span>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-3xl animate-pulse"></div>
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-medium border-2 border-primary/10 group">
                  {heroProduct ? (
                    <Link 
                      to={`/product/${heroProduct.id}`}
                      className="block w-full h-full cursor-pointer"
                    >
                      <img
                        src={heroProduct.image_url}
                        alt={heroProduct.name}
                        loading="eager"
                        decoding="async"
                        className="w-full h-full object-contain bg-muted/30 transition-all duration-700 group-hover:scale-105"
                      />
                      
                      {/* Simple overlay badge */}
                      <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg border border-primary/20 shadow-lg overflow-hidden">
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

        {/* Instant Design Preview - Try AI Section */}
        <InstantDesignPreview />

        {/* Featured Products */}
        <section className="container py-20">
          <div className="flex items-center justify-between mb-12">
            <div className="text-center flex-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Featured Designs</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Discover pieces crafted by our community of talented designers
              </p>
            </div>
          </div>
          
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
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No featured products available yet.</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/browse">
              <Button variant="outline" size="lg">
                View All Products
              </Button>
            </Link>
          </div>
        </section>

        {/* Designer Success Stats */}
        <section className="py-16 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-primary">
                  {creatorStats.activeCreators}+
                </div>
                <div className="text-lg font-semibold text-foreground">Active Creators</div>
                <div className="text-sm text-muted-foreground">Designers earning worldwide</div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-secondary leading-tight">
                  Early Creator Benefits
                </div>
                <div className="text-base font-semibold text-foreground">Priority Exposure & Higher Royalties</div>
                <div className="text-sm text-muted-foreground">Join now for maximum visibility</div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-green-600 leading-tight">
                  Curated Quality
                </div>
                <div className="text-base font-semibold text-foreground">Vibe-Matched Designs</div>
              </div>
            </div>
          </div>
        </section>

        {/* Designer Testimonials Carousel */}
        <section className="py-20">
          <div className="container">
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
            
            <div className="max-w-4xl mx-auto">
              <div className="bg-background rounded-3xl p-8 md:p-12 shadow-medium border border-border/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-32 translate-x-32"></div>
                
                <div className="relative">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <img
                      src={testimonials[currentTestimonial].image}
                      alt={testimonials[currentTestimonial].name}
                      className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-primary/20 shadow-soft"
                    />
                    
                    <div className="flex-1 text-center md:text-left space-y-4">
                      <div className="text-5xl text-primary/20 font-serif">"</div>
                      <p className="text-lg md:text-xl text-foreground leading-relaxed -mt-8">
                        {testimonials[currentTestimonial].quote}
                      </p>
                      
                      <div className="pt-4">
                        <div className="font-semibold text-foreground text-lg">
                          {testimonials[currentTestimonial].name}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {testimonials[currentTestimonial].role}
                        </div>
                        <div className="text-primary font-bold text-lg mt-2">
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
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentTestimonial 
                              ? 'bg-primary w-8' 
                              : 'bg-muted-foreground/30'
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
            
            <div className="text-center mt-12">
              <Link to="/designer-signup">
                <Button variant="hero" size="lg" className="group">
                  Start Earning as a Designer
                  <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* AI Design Showcase */}
        <section className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent py-20">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                From Idea to Reality in Minutes
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our AI design studio turns sketches, photos, or text descriptions into production-ready furniture designs
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-background rounded-2xl p-8 shadow-soft hover:shadow-medium transition-all group">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Sketch or Describe</h3>
                <p className="text-muted-foreground">
                  Upload a rough sketch or simply describe your vision in words
                </p>
              </div>
              
              <div className="bg-background rounded-2xl p-8 shadow-soft hover:shadow-medium transition-all group">
                <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">AI Transforms</h3>
                <p className="text-muted-foreground">
                  Our AI creates multiple design variations optimized for manufacturing
                </p>
              </div>
              
              <div className="bg-background rounded-2xl p-8 shadow-soft hover:shadow-medium transition-all group">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">You Earn Forever</h3>
                <p className="text-muted-foreground">
                  List your design and earn commissions on every sale, perpetually
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">The Formo Ecosystem</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto shadow-soft">
                  1
                </div>
                <h3 className="text-xl font-semibold text-foreground">Designers Create</h3>
                <p className="text-muted-foreground">
                  Anyone can submit designs - students, architects, hobbyists, professionals
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto shadow-soft">
                  2
                </div>
                <h3 className="text-xl font-semibold text-foreground">We Manufacture</h3>
                <p className="text-muted-foreground">
                  Each piece is crafted on-demand through our verified sustainable network
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto shadow-soft">
                  3
                </div>
                <h3 className="text-xl font-semibold text-foreground">Growth Loop</h3>
                <p className="text-muted-foreground">
                  Designers promote their work, bringing more customers and inspiring more creators
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Community Feed Preview */}
        <CommunityFeedPreview />

        {/* CTA Section */}
        <section className="container py-20">
          <div className="bg-primary rounded-3xl p-12 text-center text-primary-foreground shadow-medium">
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
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
