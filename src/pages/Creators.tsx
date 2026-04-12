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

        {/* Creators — Editorial list */}
        <section className="py-0">
          {loading ? (
            <div className="container py-16 space-y-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-8">
                  <Skeleton className="w-16 h-16 rounded-full shrink-0" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : creators.length === 0 ? (
            <div className="container py-20 text-center">
              <p className="text-muted-foreground text-sm">No creators with live designs yet.</p>
            </div>
          ) : (
            creators.map((creator, index) => (
              <Link
                key={creator.id}
                to={`/designer/${slugify(creator.name)}`}
                className="group block border-b border-border last:border-b-0"
              >
                <div className="container">
                  <div className="py-10 md:py-14 flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
                    {/* Index */}
                    <div className="hidden md:block">
                      <span className="text-5xl font-light text-muted-foreground/15 tabular-nums tracking-tight">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full bg-primary/8 flex items-center justify-center text-xl font-semibold text-primary shrink-0">
                      {creator.name.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl md:text-2xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300 tracking-tight">
                        {creator.name}
                      </h2>
                      {creator.furniture_interests && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{creator.furniture_interests}</p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-foreground">{creator.approved_designs}</p>
                        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Designs</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-foreground">{creator.total_sales}</p>
                        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Sales</p>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="hidden md:flex items-center">
                      <ArrowRight className="h-5 w-5 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
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
