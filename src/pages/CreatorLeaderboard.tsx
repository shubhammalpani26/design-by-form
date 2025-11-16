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
        .select('id, name, email, design_background, furniture_interests, portfolio_url, profile_picture_url')
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
            totalSales,
            totalProducts: products?.length || 0,
          };
        })
      );

      creatorsWithStats.sort((a, b) => b.totalSales - a.totalSales);
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
                <Card key={creator.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                  {index < 3 && (
                    <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                      #{index + 1}
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                        {creator.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-foreground">{creator.name}</h3>
                        <p className="text-sm text-muted-foreground">{creator.email}</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Sales</span>
                        <span className="font-bold text-primary">{creator.totalSales}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Products Listed</span>
                        <span className="font-bold text-secondary">{creator.totalProducts}</span>
                      </div>
                    </div>

                    {creator.design_background && (
                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {creator.design_background}
                        </p>
                      </div>
                    )}

                    {creator.furniture_interests && (
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground">
                          <strong>Interests:</strong> {creator.furniture_interests}
                        </p>
                      </div>
                    )}

                    {creator.portfolio_url && (
                      <a
                        href={creator.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View Portfolio →
                      </a>
                    )}
                  </CardContent>
                </Card>
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