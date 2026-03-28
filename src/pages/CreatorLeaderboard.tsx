import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface Creator {
  id: string;
  name: string;
  email: string;
  design_background: string;
  furniture_interests: string;
  portfolio_url: string;
  slug: string | null;
  totalSales: number;
  totalProducts: number;
}

const CreatorLeaderboard = () => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    try {
      const { data: profiles } = await supabase
        .from('designer_profiles')
        .select('id, name, email, design_background, furniture_interests, portfolio_url, profile_picture_url, slug')
        .eq('status', 'approved');

      if (!profiles) return;

      const creatorsWithStats = await Promise.all(
        profiles.map(async (profile) => {
          const { data: products } = await supabase
            .from('designer_products')
            .select('total_sales')
            .eq('designer_id', profile.id)
            .eq('status', 'approved');

          const totalSales = products?.reduce((sum, p) => sum + p.total_sales, 0) || 0;

          return {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            design_background: profile.design_background,
            furniture_interests: profile.furniture_interests,
            portfolio_url: profile.portfolio_url,
            slug: profile.slug,
            totalSales,
            totalProducts: products?.length || 0,
          };
        })
      );

      // Sort by sales first, then by products listed as tiebreaker
      creatorsWithStats.sort((a, b) => {
        if (b.totalSales !== a.totalSales) return b.totalSales - a.totalSales;
        return b.totalProducts - a.totalProducts;
      });
      setCreators(creatorsWithStats);
    } catch (error) {
      console.error('Error fetching creators:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent py-16">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Creator Leaderboard
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Meet our talented furniture creators and their amazing work
            </p>
          </div>
        </section>

        <section className="container py-16">
          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading creators...</p>
          ) : creators.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No creators yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.map((creator, index) => (
                <Link
                  key={creator.id}
                  to={`/designer/${creator.slug || creator.id}`}
                  className="block"
                >
                  <Card className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer hover:border-primary/30 h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative flex-shrink-0">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold text-white">
                            {creator.name.charAt(0)}
                          </div>
                          {index < 3 && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[10px] font-bold text-white border-2 border-background">
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-lg text-foreground truncate">{creator.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {creator.totalProducts} {creator.totalProducts === 1 ? 'product' : 'products'} listed
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-center">
                          <p className="text-xl font-bold text-primary">{creator.totalProducts}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Products</p>
                        </div>
                        {creator.totalSales > 0 && (
                          <div className="p-3 rounded-lg bg-secondary/5 border border-secondary/10 text-center">
                            <p className="text-xl font-bold text-secondary">{creator.totalSales}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sales</p>
                          </div>
                        )}
                      </div>

                      {creator.design_background && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {creator.design_background}
                        </p>
                      )}

                      {creator.furniture_interests && (
                        <p className="text-xs text-muted-foreground mb-3">
                          <strong>Interests:</strong> {creator.furniture_interests}
                        </p>
                      )}

                      <span className="text-sm text-primary font-medium">
                        View Profile →
                      </span>
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

export default CreatorLeaderboard;