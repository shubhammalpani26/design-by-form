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
      setFilteredProducts(products.filter(p => p.category === category));
    } else {
      setFilteredProducts(products);
    }
  }, [category, products]);

  const fetchProducts = async () => {
    try {
      const { data: productsData, error } = await supabase
        .from('designer_products')
        .select(`
          id,
          name,
          designer_price,
          weight,
          image_url,
          category,
          designer_id,
          designer_profiles!inner(name)
        `)
        .eq('status', 'approved');

      if (error) throw error;

      const formattedProducts: Product[] = (productsData || []).map(p => ({
        id: p.id,
        name: p.name,
        designer: p.designer_profiles?.name || 'Unknown Designer',
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
    if (!category) return "Browse Products";
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">{getCategoryTitle()}</h1>
          <p className="text-lg text-muted-foreground">
            {category 
              ? `Explore our collection of ${getCategoryTitle().toLowerCase()}`
              : "Explore unique furniture pieces designed by creators worldwide"
            }
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">No products found in this category yet.</p>
              </div>
            )}
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Browse;
