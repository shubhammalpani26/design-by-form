import { useEffect, useState } from 'react';
import { useComparison } from '@/contexts/ComparisonContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  image_url: string;
  designer_price: number;
  weight: number;
  dimensions: any;
  materials_description: string;
  lead_time_days: number;
  available_finishes: string[];
  available_sizes: string[];
  category: string;
  designer_id: string;
}

interface Designer {
  id: string;
  name: string;
}

export default function ProductComparison() {
  const { comparisonList, removeFromComparison, clearComparison } = useComparison();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [designers, setDesigners] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (comparisonList.length === 0) {
        setLoading(false);
        return;
      }

      const { data: productsData } = await supabase
        .from('designer_products')
        .select('*')
        .in('id', comparisonList)
        .eq('status', 'approved');

      if (productsData) {
        const typedProducts: Product[] = productsData.map(p => ({
          id: p.id,
          name: p.name,
          image_url: p.image_url,
          designer_price: p.designer_price,
          weight: p.weight,
          dimensions: p.dimensions,
          materials_description: p.materials_description,
          lead_time_days: p.lead_time_days,
          available_finishes: Array.isArray(p.available_finishes) 
            ? p.available_finishes.filter((f): f is string => typeof f === 'string')
            : [],
          available_sizes: Array.isArray(p.available_sizes)
            ? p.available_sizes.filter((s): s is string => typeof s === 'string')
            : [],
          category: p.category,
          designer_id: p.designer_id,
        }));
        
        setProducts(typedProducts);

        const designerIds = [...new Set(productsData.map(p => p.designer_id))];
        const { data: designersData } = await supabase
          .from('designer_profiles')
          .select('id, name')
          .in('id', designerIds);

        if (designersData) {
          const designerMap = designersData.reduce((acc, d) => {
            acc[d.id] = d.name;
            return acc;
          }, {} as Record<string, string>);
          setDesigners(designerMap);
        }
      }

      setLoading(false);
    };

    fetchProducts();
  }, [comparisonList]);

  const handleAddToCart = (product: Product) => {
    addToCart(product.id, {
      finish: product.available_finishes[0],
      size: product.available_sizes[0],
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading comparison...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (comparisonList.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-xl font-semibold mb-4">No products to compare</p>
            <p className="text-muted-foreground mb-6">Add products from the browse page to start comparing</p>
            <Button onClick={() => navigate('/browse')}>Browse Products</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const lowestPrice = Math.min(...products.map(p => p.designer_price));
  const highestWeight = Math.max(...products.map(p => p.weight));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Product Comparison</h1>
          <Button variant="outline" onClick={clearComparison}>
            Clear All
          </Button>
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="p-4 relative max-w-sm">
                <button
                  onClick={() => removeFromComparison(product.id)}
                  className="absolute top-2 right-2 z-10 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="space-y-4">
                  <div className="aspect-square rounded-lg overflow-hidden bg-accent relative">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      by {designers[product.designer_id] || 'Unknown'}
                    </p>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className={`font-semibold ${product.designer_price === lowestPrice ? 'text-green-600' : ''}`}>
                        ₹{product.designer_price.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Weight:</span>
                      <span className={product.weight === highestWeight ? 'font-semibold' : ''}>
                        {product.weight} kg
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span>{product.category}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lead Time:</span>
                      <span>{product.lead_time_days} days</span>
                    </div>

                    {product.dimensions && (
                      <div>
                        <span className="text-muted-foreground">Dimensions:</span>
                        <p className="text-xs mt-1">
                          {product.dimensions.width} × {product.dimensions.depth} × {product.dimensions.height} cm
                        </p>
                      </div>
                    )}

                    <div>
                      <span className="text-muted-foreground">Materials:</span>
                      <p className="text-xs mt-1">Glass Fibre Reinforced Resin + premium finishing as per customized option selected</p>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Finishes:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.available_finishes.map((finish, idx) => (
                          <span key={idx} className="text-xs bg-accent px-2 py-1 rounded">
                            {finish}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Sizes:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.available_sizes.map((size, idx) => (
                          <span key={idx} className="text-xs bg-accent px-2 py-1 rounded">
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Button
                      className="w-full"
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
