import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { slugify } from "@/lib/slugify";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/hooks/useScrollReveal";

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
      const { data: profiles, error: profilesError } = await supabase
        .from('designer_profiles')
        .select(`id, name, portfolio_url, furniture_interests`);

      if (profilesError) throw profilesError;

      // Fetch sales counts via public RPC (RLS on product_sales blocks anon reads)
      const { data: salesCounts } = await supabase.rpc('get_designer_sales_counts');
      const salesMap = new Map<string, number>(
        (salesCounts || []).map((row: any) => [row.designer_id, Number(row.sales_count)])
      );

      const creatorsWithStats = await Promise.all(
        profiles.map(async (profile) => {
          const { data: products } = await supabase
            .from('designer_products')
            .select('id, status')
            .eq('designer_id', profile.id);

          const approvedDesigns = products?.filter(p => p.status === 'approved').length || 0;
          
          return {
            id: profile.id,
            name: profile.name,
            portfolio_url: profile.portfolio_url,
            furniture_interests: profile.furniture_interests,
            total_designs: products?.length || 0,
            approved_designs: approvedDesigns,
            total_sales: salesMap.get(profile.id) || 0,
          };
        })
      );

      const activeCreators = creatorsWithStats
        .filter(c => c.approved_designs > 0)
        .sort((a, b) => b.total_sales - a.total_sales);
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
        <section className="relative py-24 md:py-36 overflow-hidden">
          <div className="absolute inset-0 bg-[hsl(var(--primary))]" />
          <div className="container relative z-10">
            <ScrollReveal animation="fade-up">
              <div className="max-w-3xl">
                <p className="text-primary-foreground/40 text-xs font-medium uppercase tracking-[0.3em] mb-6">
                  The People Behind the Pieces
                </p>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-[0.95] tracking-tight mb-8">
                  Our<br />
                  <span className="font-light italic">Creators</span>
                </h1>
                <p className="text-primary-foreground/50 text-base md:text-lg max-w-lg leading-relaxed">
                  Talented creators from around the world bringing unique visions to life — each design exclusive to Nyzora.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Creators — Card grid */}
        <section className="py-16 md:py-24">
          <div className="container">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl border border-border p-8 space-y-4">
                    <Skeleton className="w-16 h-16 rounded-full" />
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            ) : creators.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">No creators with live designs yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {creators.map((creator) => (
                  <Link
                    key={creator.id}
                    to={`/designer/${slugify(creator.name)}`}
                    className="group"
                  >
                    <div className="rounded-2xl border border-border/40 bg-card p-8 md:p-10 hover:border-border transition-all duration-300 hover:shadow-sm h-full flex flex-col">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-full bg-primary/8 flex items-center justify-center text-2xl font-semibold text-primary mb-6">
                        {creator.name.charAt(0)}
                      </div>

                      {/* Name & interests */}
                      <h2 className="text-lg md:text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300 tracking-tight">
                        {creator.name}
                      </h2>
                      {creator.furniture_interests && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                          {creator.furniture_interests}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-6 mt-auto pt-6 border-t border-border/20">
                        <div>
                          <p className="text-lg font-semibold text-foreground">{creator.approved_designs}</p>
                          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Designs</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-foreground">{creator.total_sales}</p>
                          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Sales</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 ml-auto" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20 border-t border-border">
          <div className="container">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                  Become a Creator
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Design, list, and earn — we handle everything else.
                </p>
              </div>
              <Link
                to="/designer-signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
              >
                Join as Creator <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Creators;
