import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import chairHero from "@/assets/chair-hero.jpg";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Furniture Creator",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    quote: "I've earned over ₹2.5 lakhs in my first 6 months! The platform makes it so easy to turn my designs into income.",
    earnings: "₹2,50,000"
  },
  {
    name: "Rajesh Kumar",
    role: "Architecture Student",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    quote: "As a student, this platform has given me real-world experience and actual earnings. My chair design sold 47 units!",
    earnings: "₹1,85,000"
  },
  {
    name: "Ananya Desai",
    role: "Industrial Creator",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    quote: "The approval process was smooth, and within 2 weeks my designs were live. I love seeing customers enjoy my work!",
    earnings: "₹3,20,000"
  }
];

interface Product {
  id: string;
  name: string;
  designer: string;
  designerId: string;
  price: number;
  weight: number;
  image: string;
}

const examplePrompts = [
  "Modern organic chair with flowing curves",
  "Minimalist dining table with sculptural legs",
  "Ergonomic curved bench design",
  "Contemporary spiral column sculpture",
  "Fluid wave coffee table",
  "Sculptural decorative vase",
  "Abstract geometric wall shelf",
  "Parametric furniture with natural forms",
  "Avant-garde seating with organic shapes",
  "Biomorphic side table design"
];

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroProducts, setHeroProducts] = useState<Product[]>([]);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [creatorStats, setCreatorStats] = useState({
    activeCreators: 0,
    avgEarnings: 0,
    approvalRate: 94,
  });
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    fetchFeaturedProducts();
    fetchHeroProducts();
    fetchCreatorStats();
  }, []);

  useEffect(() => {
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(testimonialInterval);
  }, []);

  useEffect(() => {
    if (heroProducts.length > 0) {
      const interval = setInterval(() => {
        setCurrentProductIndex((prev) => (prev + 1) % heroProducts.length);
      }, 6000); // Change every 6 seconds

      return () => clearInterval(interval);
    }
  }, [heroProducts.length]);

  const fetchHeroProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('designer_products')
        .select(`
          id,
          name,
          designer_price,
          weight,
          image_url,
          designer_id,
          total_sales,
          designer_profiles!inner(name)
        `)
        .eq('status', 'approved')
        .not('image_url', 'is', null)
        .order('total_sales', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (data && data.length > 0) {
        const mappedProducts: Product[] = data.map(item => ({
          id: item.id,
          name: item.name,
          designer: item.designer_profiles.name,
          designerId: item.designer_id,
          price: Number(item.designer_price),
          weight: Number(item.weight || 5),
          image: item.image_url || ''
        }));
        setHeroProducts(mappedProducts);
      }
    } catch (error) {
      console.error('Error fetching hero products:', error);
    }
  };


  const nextProduct = () => {
    if (heroProducts.length > 0) {
      setCurrentProductIndex((prev) => (prev + 1) % heroProducts.length);
    }
  };

  const prevProduct = () => {
    if (heroProducts.length > 0) {
      setCurrentProductIndex((prev) => (prev - 1 + heroProducts.length) % heroProducts.length);
    }
  };

  const fetchCreatorStats = async () => {
    try {
      // Count active creators with earnings
      const { count: activeCreatorsCount } = await supabase
        .from('designer_earnings')
        .select('designer_id', { count: 'exact', head: true });

      // Get average earnings
      const { data: earningsData } = await supabase
        .from('designer_earnings')
        .select('royalty_amount');

      let avgEarnings = 0;
      if (earningsData && earningsData.length > 0) {
        const total = earningsData.reduce((sum, item) => sum + Number(item.royalty_amount), 0);
        avgEarnings = Math.round(total / earningsData.length);
      }

      setCreatorStats({
        activeCreators: activeCreatorsCount || 0,
        avgEarnings,
        approvalRate: 94,
      });
    } catch (error) {
      console.error('Error fetching creator stats:', error);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      // Fetch one product from each category
      const categories = ['chairs', 'tables', 'benches', 'installations', 'vases', 'home-decor'];
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
          .limit(1)
          .maybeSingle();

        if (!error && categoryData) {
          allProducts.push({
            id: categoryData.id,
            name: categoryData.name,
            designer: categoryData.designer_profiles?.name || 'Unknown Designer',
            designerId: categoryData.designer_id,
            price: Number(categoryData.designer_price),
            weight: Number(categoryData.weight || 5),
            image: categoryData.image_url || ''
          });
        }
      }

      // Take first 5 products (one from each main category)
      setFeaturedProducts(allProducts.slice(0, 5));
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
        <section className="relative overflow-hidden bg-gradient-to-b from-accent to-background py-20 md:py-32">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
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
                
                <div className="flex flex-wrap gap-4">
                  <Link to="/design-studio">
                    <Button variant="hero" size="lg" className="group">
                      Start Designing with AI
                      <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                    </Button>
                  </Link>
                  <Link to="/browse">
                    <Button variant="outline" size="lg">
                      Browse Products
                    </Button>
                  </Link>
                </div>
                
                <div className="flex items-center flex-wrap gap-4 pt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>Unique designs from creators worldwide</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Sustainable on-demand manufacturing</span>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-3xl animate-pulse"></div>
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-medium border-2 border-primary/10 group">
                  <Link 
                    to={heroProducts.length > 0 ? `/product/${heroProducts[currentProductIndex].id}` : "/browse"}
                    className="block w-full h-full cursor-pointer"
                  >
                    <img
                      src={heroProducts.length > 0 ? heroProducts[currentProductIndex].image : chairHero}
                      alt="AI-generated furniture design"
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                    />
                    
                    {/* AI Prompt Badge */}
                    <div className="absolute bottom-6 left-6 right-6 bg-background/95 backdrop-blur-sm rounded-xl p-4 border border-primary/20 shadow-lg animate-fade-in">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Created with AI prompt:</p>
                          <p className="text-sm font-medium text-foreground leading-snug">
                            "{examplePrompts[currentProductIndex % examplePrompts.length]}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  {heroProducts.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          prevProduct();
                        }}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>

                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          nextProduct();
                        }}
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Button>

                      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-full z-10">
                        {heroProducts.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCurrentProductIndex(idx);
                            }}
                            className={`w-2 h-2 rounded-full transition-all ${
                              idx === currentProductIndex ? 'bg-primary w-8' : 'bg-muted-foreground/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="container py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Featured Designs</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover pieces crafted by our community of talented designers
            </p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
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
                <div className="text-lg font-semibold text-foreground">Creators Earning</div>
                <div className="text-sm text-muted-foreground">Active creators on the platform</div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-secondary">
                  ₹{creatorStats.avgEarnings > 0 ? creatorStats.avgEarnings.toLocaleString() : '1,50,000'}
                </div>
                <div className="text-lg font-semibold text-foreground">Average Earnings</div>
                <div className="text-sm text-muted-foreground">Per creator lifetime</div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-green-600">
                  {creatorStats.approvalRate}%
                </div>
                <div className="text-lg font-semibold text-foreground">Approval Rate</div>
                <div className="text-sm text-muted-foreground">High quality standards met</div>
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
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Join thousands of creators earning from their designs
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
                  
                  <div className="flex justify-center gap-2 mt-8">
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">The Forma Ecosystem</h2>
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
