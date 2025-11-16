import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ShareButton } from "@/components/ShareButton";
import { SEOHead } from "@/components/SEOHead";
import { ExternalLink } from "lucide-react";

interface Designer {
  id: string;
  name: string;
  email: string;
  design_background: string;
  furniture_interests: string;
  portfolio_url: string;
  location?: string;
  joined?: string;
  totalSales: number;
  totalProducts: number;
  products: Array<{
    id: string;
    name: string;
    designer_price: number;
    image_url: string;
  }>;
}

const DesignerProfile = () => {
  const { id } = useParams();
  const [designer, setDesigner] = useState<Designer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDesignerData();
  }, [id]);

  const fetchDesignerData = async () => {
    try {
      // Fetch designer profile
      const { data: profile, error: profileError } = await supabase
        .from('designer_profiles')
        .select('*')
        .eq('id', id)
        .eq('status', 'approved')
        .single();

      if (profileError) throw profileError;

      // Fetch designer's products
      const { data: products } = await supabase
        .from('designer_products')
        .select('*')
        .eq('designer_id', id)
        .eq('status', 'approved');

      // Calculate stats
      const totalSales = products?.reduce((sum, p) => sum + (p.total_sales || 0), 0) || 0;

      setDesigner({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        design_background: profile.design_background || '',
        furniture_interests: profile.furniture_interests || '',
        portfolio_url: profile.portfolio_url || '',
        totalSales,
        totalProducts: products?.length || 0,
        products: products?.map(p => ({
          id: p.id,
          name: p.name,
          designer_price: p.designer_price,
          image_url: p.image_url
        })) || []
      });
    } catch (error) {
      console.error('Error fetching designer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-12">
          <Skeleton className="h-48 w-full mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64" />)}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!designer) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-12">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Designer not found</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={`${designer.name} - Designer Profile`}
        description={`Explore ${designer.name}'s unique furniture designs. ${designer.totalProducts} products with ${designer.totalSales} sales. ${designer.design_background || 'Creative furniture designer'}`}
        image={designer.products[0]?.image_url || `${window.location.origin}/og-default.png`}
        url={window.location.href}
        type="profile"
        author={designer.name}
        keywords={['furniture designer', designer.name, 'custom furniture', designer.furniture_interests || 'furniture']}
      />
      <Header />
      
      <main className="flex-1">
        {/* Hero Banner */}
        <div className="relative bg-gradient-to-br from-primary/10 via-secondary/5 to-accent py-20">
          <div className="container">
            <div className="max-w-4xl">
              <div className="flex items-start gap-6 mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-bold text-white flex-shrink-0">
                  {designer.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl md:text-5xl font-bold mb-3 text-foreground">{designer.name}</h1>
                  <p className="text-lg text-muted-foreground mb-4">{designer.email}</p>
                  {designer.portfolio_url && (
                    <div className="mb-4">
                      <a 
                        href={designer.portfolio_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Portfolio
                      </a>
                    </div>
                  )}
                  <div className="mt-4">
                    <ShareButton
                      url={window.location.href}
                      title={`Check out ${designer.name}'s designs on Forma`}
                      description={`Browse ${designer.totalProducts} unique furniture designs by ${designer.name}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="border-b border-border">
          <div className="container py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="border-border">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-primary mb-1">{designer.totalSales}</p>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-foreground mb-1">{designer.totalProducts}</p>
                  <p className="text-sm text-muted-foreground">Designs Listed</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="container py-16">
          {/* About the Designer */}
          {(designer.design_background || designer.furniture_interests) && (
            <div className="mb-16 max-w-4xl">
              <h2 className="text-3xl font-bold mb-6 text-foreground">About the Designer</h2>
              <div className="bg-accent rounded-2xl p-8 border border-border space-y-4">
                {designer.design_background && (
                  <div>
                    <h3 className="font-semibold mb-2 text-foreground">Background</h3>
                    <p className="text-muted-foreground leading-relaxed">{designer.design_background}</p>
                  </div>
                )}
                {designer.furniture_interests && (
                  <div>
                    <h3 className="font-semibold mb-2 text-foreground">Interests</h3>
                    <p className="text-muted-foreground leading-relaxed">{designer.furniture_interests}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Collection */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-foreground">Design Collection</h2>
              <p className="text-muted-foreground">{designer.products.length} pieces</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {designer.products.map((product) => (
                <ProductCard 
                  key={product.id} 
                  id={product.id}
                  name={product.name}
                  designer={designer.name}
                  designerId={designer.id}
                  price={product.designer_price}
                  image={product.image_url}
                  weight={5}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DesignerProfile;
