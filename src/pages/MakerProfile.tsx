import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { JsonLd } from "@/components/JsonLd";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, CheckCircle2, ArrowLeft, Factory } from "lucide-react";
import { ScrollReveal, StaggerReveal } from "@/hooks/useScrollReveal";
import { getMakerBySlug, getMakerForProduct, Maker } from "@/data/makers";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/slugify";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Skeleton } from "@/components/ui/skeleton";

const MakerProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const maker = slug ? getMakerBySlug(slug) : undefined;
  const { formatPrice } = useCurrency();

  const { data: products, isLoading } = useQuery({
    queryKey: ["maker-products", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("designer_products")
        .select("id, name, image_url, designer_price, slug, designer_id, category, designer_profiles!inner(name)")
        .eq("status", "approved")
        .limit(50);
      if (error) throw error;
      // Filter to only products assigned to this maker
      return (data || []).filter((p) => getMakerForProduct(p.id, p.category).slug === slug);
    },
    enabled: !!maker,
  });

  if (!maker) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Maker Not Found</h1>
            <Link to="/verified-makers" className="text-primary hover:underline">
              ← Back to Verified Makers
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={`${maker.name} — Verified Maker | Nyzora`}
        description={maker.shortDescription}
      />
      <JsonLd
        id="maker"
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: maker.name,
          url: typeof window !== "undefined" ? window.location.href : undefined,
          description: maker.shortDescription,
          address: { "@type": "PostalAddress", addressLocality: maker.location },
          knowsAbout: maker.tags,
        }}
      />
      <Header />

      <main className="flex-1">
        {/* Back link */}
        <div className="container pt-6">
          <Link to="/verified-makers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            All Verified Makers
          </Link>
        </div>

        {/* Hero */}
        <section className="py-12 md:py-20">
          <div className="container max-w-4xl">
            <ScrollReveal animation="fade-up">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  <Shield className="h-3.5 w-3.5" />
                  Verified by Nyzora
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-2">{maker.name}</h1>
              <p className="text-muted-foreground mb-6">{maker.location} · {maker.yearsActive} years of expertise</p>
              <p className="text-lg text-foreground/90 leading-relaxed max-w-2xl">{maker.expertise}</p>

              <div className="flex flex-wrap gap-2 mt-6">
                {maker.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Specialties */}
        <section className="py-10 border-y border-border bg-muted/30">
          <div className="container max-w-4xl">
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
              {maker.specialties.map((s) => (
                <div key={s} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Manufacturing Process */}
        <section className="py-12 md:py-20">
          <div className="container max-w-4xl">
            <ScrollReveal animation="fade-up">
              <div className="flex items-center gap-2 mb-3">
                <Factory className="h-5 w-5 text-primary" />
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Manufacturing Process</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed max-w-3xl">{maker.process}</p>
            </ScrollReveal>
          </div>
        </section>

        {/* Products */}
        <section className="py-12 md:py-20 bg-muted/30">
          <div className="container max-w-5xl">
            <ScrollReveal animation="fade-up">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Products Crafted by {maker.name}
              </h2>
              <p className="text-muted-foreground mb-8">
                Designs brought to life by creators worldwide, manufactured with precision by {maker.name}.
              </p>
            </ScrollReveal>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-xl" />
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <StaggerReveal className="grid grid-cols-2 md:grid-cols-3 gap-4" staggerDelay={80} animation="fade-up">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.slug || slugify(product.name)}`}
                    className="group"
                  >
                    <Card className="overflow-hidden border-border hover:border-primary/30 hover:shadow-medium transition-all duration-300">
                      <div className="aspect-square overflow-hidden bg-accent">
                        <img
                          src={product.image_url && product.image_url.length < 50000 ? product.image_url : "/placeholder.svg"}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <CardContent className="p-3">
                        <h3 className="text-sm font-semibold text-foreground truncate">{product.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          by {(product.designer_profiles as any)?.name || "Creator"}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm font-semibold text-primary">{formatPrice(product.designer_price)}</p>
                          <div className="flex items-center gap-0.5 text-[9px] text-primary/70">
                            <Shield className="h-2.5 w-2.5" />
                            Verified
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </StaggerReveal>
            ) : (
              <p className="text-muted-foreground text-center py-8">Products coming soon.</p>
            )}
          </div>
        </section>

        {/* Trust footer */}
        <section className="py-10 border-t border-border">
          <div className="container text-center">
            <p className="text-sm text-muted-foreground">
              Custom-made for your space. Built by real manufacturers. <span className="text-primary font-medium">Verified by Nyzora.</span>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default MakerProfile;
