import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TrendingUp, Flame, Sparkles, Clock, Grid3X3, LayoutGrid } from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All", icon: Grid3X3 },
  { id: "chairs", label: "Chairs", icon: null },
  { id: "tables", label: "Tables", icon: null },
  { id: "benches", label: "Benches", icon: null },
  { id: "consoles", label: "Consoles", icon: null },
  { id: "installations", label: "Installations", icon: null },
  { id: "vases", label: "Vases", icon: null },
  { id: "home-decor", label: "Home Decor", icon: null },
];

const Explore = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "large">("grid");
  const { formatPrice } = useCurrency();

  const { data: products, isLoading } = useQuery({
    queryKey: ["explore-products", selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("designer_products")
        .select(`
          id,
          name,
          designer_price,
          image_url,
          category,
          total_sales,
          created_at,
          designer_profiles!inner(id, name, profile_picture_url)
        `)
        .eq("status", "approved")
        .not("image_url", "is", null);

      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }

      const { data, error } = await query.order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data;
    },
  });

  const { data: trendingProducts } = useQuery({
    queryKey: ["trending-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("designer_products")
        .select(`
          id,
          name,
          designer_price,
          image_url,
          category,
          total_sales,
          designer_profiles!inner(id, name, profile_picture_url)
        `)
        .eq("status", "approved")
        .not("image_url", "is", null)
        .order("total_sales", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const { data: newProducts } = useQuery({
    queryKey: ["new-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("designer_products")
        .select(`
          id,
          name,
          designer_price,
          image_url,
          category,
          designer_profiles!inner(id, name, profile_picture_url)
        `)
        .eq("status", "approved")
        .not("image_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Explore Designs | Formo"
        description="Discover unique furniture designs from talented creators. Browse by category and find trending pieces."
      />
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explore</h1>
          <p className="text-muted-foreground">Discover unique designs from talented creators</p>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="whitespace-nowrap rounded-full"
            >
              {cat.icon && <cat.icon className="h-4 w-4 mr-1" />}
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Trending Section */}
        {selectedCategory === "all" && trendingProducts && trendingProducts.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Trending Now</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {trendingProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-muted"
                >
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm font-medium truncate">{product.name}</p>
                    <p className="text-white/80 text-xs">{formatPrice(product.designer_price)}</p>
                  </div>
                  <Badge className="absolute top-2 left-2 bg-primary/90 text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Hot
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* New Arrivals Section */}
        {selectedCategory === "all" && newProducts && newProducts.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-secondary" />
              <h2 className="text-xl font-semibold">New Arrivals</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {newProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-muted"
                >
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm font-medium truncate">{product.name}</p>
                    <p className="text-white/80 text-xs">{formatPrice(product.designer_price)}</p>
                  </div>
                  <Badge className="absolute top-2 left-2 bg-secondary/90 text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    New
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Main Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {selectedCategory === "all" ? "All Designs" : CATEGORIES.find(c => c.id === selectedCategory)?.label}
            </h2>
            <div className="flex gap-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "large" ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("large")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className={`grid gap-3 ${viewMode === "grid" ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-5" : "grid-cols-2 md:grid-cols-3"}`}>
              {Array.from({ length: 15 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className={`grid gap-3 ${viewMode === "grid" ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-5" : "grid-cols-2 md:grid-cols-3"}`}>
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-muted"
                >
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm font-medium truncate">{product.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-white/80 text-xs">{formatPrice(product.designer_price)}</p>
                      <span className="text-white/60 text-xs">by {(product.designer_profiles as any)?.name}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No designs found in this category yet.</p>
              <Button variant="outline" className="mt-4" onClick={() => setSelectedCategory("all")}>
                View All Designs
              </Button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Explore;
