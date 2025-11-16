import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import chairHero from "@/assets/chair-hero.jpg";

interface Product {
  id: string;
  name: string;
  designer: string;
  designerId: string;
  price: number;
  weight: number;
  image: string;
}

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroProducts, setHeroProducts] = useState<Product[]>([]);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);

  useEffect(() => {
    fetchFeaturedProducts();
    fetchHeroProducts();
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
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium text-green-600 dark:text-green-400">SSL Secure</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium text-blue-600 dark:text-blue-400">Secure Payments</span>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-3xl animate-pulse"></div>
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-medium border-2 border-primary/10 group">
                  <img
                    src={heroProducts.length > 0 ? heroProducts[currentProductIndex].image : chairHero}
                    alt="AI-generated furniture design"
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 to-transparent p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      {heroProducts.length > 0 && (
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground transition-all duration-500">
                            {heroProducts[currentProductIndex].name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Designed by {heroProducts[currentProductIndex].designer}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
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
