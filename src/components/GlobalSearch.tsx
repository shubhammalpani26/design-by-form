import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";

interface SearchResult {
  type: 'product' | 'designer' | 'page';
  id?: string;
  title: string;
  subtitle?: string;
  path: string;
  image?: string;
}

export const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const searchQuery = query.toLowerCase();
        const allResults: SearchResult[] = [];

        // Search products
        const { data: products } = await supabase
          .from('designer_products')
          .select('id, name, description, category, image_url, designer_profiles!inner(name)')
          .eq('status', 'approved')
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
          .limit(5);

        if (products) {
          products.forEach(product => {
            allResults.push({
              type: 'product',
              id: product.id,
              title: product.name,
              subtitle: `by ${product.designer_profiles.name}`,
              path: `/product/${product.id}`,
              image: product.image_url
            });
          });
        }

        // Search designers
        const { data: designers } = await supabase
          .from('designer_profiles')
          .select('id, name, email, design_background')
          .or(`name.ilike.%${searchQuery}%,design_background.ilike.%${searchQuery}%`)
          .limit(3);

        if (designers) {
          designers.forEach(designer => {
            allResults.push({
              type: 'designer',
              id: designer.id,
              title: designer.name,
              subtitle: designer.email,
              path: `/designer/${designer.id}`
            });
          });
        }

        // Static pages
        const pages = [
          { title: 'About Us', path: '/about', keywords: ['about', 'company', 'story'] },
          { title: 'How It Works', path: '/how-it-works', keywords: ['how', 'works', 'process'] },
          { title: 'Browse Products', path: '/browse', keywords: ['browse', 'shop', 'products', 'catalog'] },
          { title: 'Creators', path: '/creators', keywords: ['creators', 'designers', 'artists'] },
          { title: 'Become a Creator', path: '/designer-signup', keywords: ['become', 'join', 'creator', 'designer', 'signup'] },
          { title: 'Creator Dashboard', path: '/creator/dashboard', keywords: ['dashboard', 'portal'] },
          { title: 'Design Studio', path: '/design-studio', keywords: ['studio', 'create', 'ai', 'generate'] },
          { title: 'Sustainability', path: '/sustainability', keywords: ['sustainability', 'eco', 'green', 'environment'] },
          { title: 'Contact', path: '/contact', keywords: ['contact', 'support', 'help'] },
        ];

        pages.forEach(page => {
          const matches = page.keywords.some(keyword => keyword.includes(searchQuery));
          if (matches) {
            allResults.push({
              type: 'page',
              title: page.title,
              path: page.path
            });
          }
        });

        setResults(allResults.slice(0, 8));
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleResultClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery("");
    setResults([]);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="relative w-64 justify-start text-sm text-muted-foreground"
        onClick={() => setIsOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Search...
        <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Search Forma</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search products, designers, or pages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full"
            />

            {loading && (
              <div className="text-center text-sm text-muted-foreground py-8">
                Searching...
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleResultClick(result.path)}
                    className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors flex items-center gap-3"
                  >
                    {result.image && (
                      <img
                        src={result.image}
                        alt={result.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {result.title}
                      </div>
                      {result.subtitle && (
                        <div className="text-sm text-muted-foreground truncate">
                          {result.subtitle}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground capitalize">
                        {result.type}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                No results found for "{query}"
              </div>
            )}

            {!query && (
              <div className="text-center text-sm text-muted-foreground py-8">
                Start typing to search products, designers, or pages
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
