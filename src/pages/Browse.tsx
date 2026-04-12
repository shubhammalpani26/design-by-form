import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  id: string;
  name: string;
  designer: string;
  designerId: string;
  price: number;
  weight: number;
  image: string;
  category: string;
}

const Browse = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const category = searchParams.get('category');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (category) {
      const categoryMapping: Record<string, string[]> = {
        'chairs': ['chairs'],
        'coffee-tables': ['coffee-tables', 'tables'],
        'dining-tables': ['dining-tables', 'tables'],
        'tables': ['tables', 'coffee-tables', 'dining-tables'],
        'benches': ['benches'],
        'consoles': ['consoles'],
        'vases': ['vases', 'home-decor', 'decor'],
        'home-decor': ['home-decor', 'vases', 'decor'],
        'decor': ['decor', 'home-decor', 'vases'],
        'installations': ['installations'],
        'lighting': ['lighting'],
        'storage': ['storage'],
      };
      
      const matchingCategories = categoryMapping[category] || [category];
      const filtered = products.filter(p => matchingCategories.includes(p.category));
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [category, products]);

  const fetchProducts = async () => {
    try {
      const { data: productsData, error } = await supabase
        .from('designer_products')
        .select(`
          id, name, designer_price, weight, image_url, category, designer_id,
          designer_profiles!inner(name)
        `)
        .eq('status', 'approved');

      if (error) throw error;

      const formattedProducts: Product[] = (productsData || []).map(p => ({
        id: p.id,
        name: p.name,
        designer: p.designer_profiles?.name || 'Unknown Creator',
        designerId: p.designer_id,
        price: Number(p.designer_price),
        weight: Number(p.weight || 5),
        image: p.image_url || '',
        category: p.category || 'other'
      }));

      setProducts(formattedProducts);
      setFilteredProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryTitle = () => {
    if (!category) return "All Products";
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Premium hero */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[hsl(var(--primary))]" />
          <div className="container relative z-10">
            <p className="text-primary-foreground/40 text-xs font-medium uppercase tracking-[0.3em] mb-4">
              {category ? 'Collection' : 'Browse'}
            </p>
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground leading-[0.95] tracking-tight">
              {getCategoryTitle().split(' ')[0]}<br />
              <span className="font-light italic">{getCategoryTitle().split(' ').slice(1).join(' ') || 'Collection'}</span>
            </h1>
            <p className="text-primary-foreground/50 text-sm mt-4 max-w-md">
              Original designs by creators worldwide — each piece exclusive to Nyzora.
            </p>
          </div>
        </section>

        {/* Products */}
        <section className="container py-12 md:py-16">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground/50 uppercase tracking-[0.2em] mb-8">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'}
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-sm">No products found in this category yet.</p>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Browse;
