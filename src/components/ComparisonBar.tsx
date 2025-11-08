import { useComparison } from '@/contexts/ComparisonContext';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  image_url: string;
  designer_price: number;
}

export const ComparisonBar = () => {
  const { comparisonList, removeFromComparison, clearComparison } = useComparison();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (comparisonList.length === 0) return;
      
      const { data } = await supabase
        .from('designer_products')
        .select('id, name, image_url, designer_price')
        .in('id', comparisonList);
      
      if (data) {
        setProducts(data);
      }
    };

    fetchProducts();
  }, [comparisonList]);

  if (comparisonList.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50 p-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 overflow-x-auto">
            <span className="text-sm font-semibold whitespace-nowrap">
              Compare ({comparisonList.length}/4)
            </span>
            
            <div className="flex gap-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border"
                >
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeFromComparison(product.id)}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:bg-destructive/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearComparison}
            >
              Clear All
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/compare')}
              disabled={comparisonList.length < 2}
            >
              Compare Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
