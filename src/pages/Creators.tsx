import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Creator {
  id: string;
  name: string;
  portfolio_url: string | null;
  furniture_interests: string | null;
  total_designs: number;
  approved_designs: number;
  total_sales: number;
}

const Creators = () => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    try {
      // Get all designer profiles with at least one approved product
      const { data: profiles, error: profilesError } = await supabase
        .from('designer_profiles')
        .select(`
          id,
          name,
          portfolio_url,
          furniture_interests
        `);

      if (profilesError) throw profilesError;

      // For each profile, get their product stats
      const creatorsWithStats = await Promise.all(
        profiles.map(async (profile) => {
          const { data: products } = await supabase
            .from('designer_products')
            .select('id, status')
            .eq('designer_id', profile.id);

          const { data: sales } = await supabase
            .from('product_sales')
            .select('id')
            .eq('designer_id', profile.id);

          const approvedDesigns = products?.filter(p => p.status === 'approved').length || 0;
          
          return {
            id: profile.id,
            name: profile.name,
            portfolio_url: profile.portfolio_url,
            furniture_interests: profile.furniture_interests,
            total_designs: products?.length || 0,
            approved_designs: approvedDesigns,
            total_sales: sales?.length || 0,
          };
        })
      );

      // Only show creators with at least one approved design
      const activeCreators = creatorsWithStats.filter(c => c.approved_designs > 0);
      setCreators(activeCreators);
    } catch (error) {
      console.error('Error fetching creators:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent py-16">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Meet Our Creators
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Talented designers from around the world bringing unique visions to life through Forma
            </p>
          </div>
        </section>

        {/* Creators Grid */}
        <section className="container py-16">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="w-20 h-20 rounded-full mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : creators.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No creators found yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {creators.map((creator) => (
                <Link key={creator.id} to={`/designer/${creator.id}`}>
                  <Card className="border-border hover:shadow-medium transition-all duration-300 group h-full">
                    <CardContent className="p-6">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold text-white mb-4 group-hover:scale-110 transition-transform">
                        {creator.name.charAt(0)}
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                        {creator.name}
                      </h3>
                      {creator.furniture_interests && (
                        <p className="text-muted-foreground mb-4 line-clamp-2">{creator.furniture_interests}</p>
                      )}
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Sales:</span>
                          <span className="font-semibold text-primary">{creator.total_sales}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Live Designs:</span>
                          <span className="font-semibold text-foreground">{creator.approved_designs}</span>
                        </div>
                        {creator.portfolio_url && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Portfolio:</span>
                            <a 
                              href={creator.portfolio_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline truncate ml-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View
                            </a>
                          </div>
                        )}
                      </div>
                      
                      <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        View Profile
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

      </main>
      
      <Footer />
    </div>
  );
};

export default Creators;
