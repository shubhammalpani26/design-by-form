import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Search, Wand2, Camera } from "lucide-react";
import { slugify } from "@/lib/slugify";

interface SearchResult {
  type: 'product' | 'creator' | 'page';
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
              path: `/product/${slugify(product.name)}`,
              image: product.image_url
            });
          });
        }

        const { data: creators } = await supabase
          .from('designer_profiles')
          .select('id, name, email, design_background')
          .or(`name.ilike.%${searchQuery}%,design_background.ilike.%${searchQuery}%`)
          .limit(3);

        if (creators) {
          creators.forEach(creator => {
            allResults.push({
              type: 'creator',
              id: creator.id,
              title: creator.name,
              subtitle: creator.email,
              path: `/designer/${slugify(creator.name)}`
            });
          });
        }

        const pages = [
          { title: 'About Us', path: '/about', keywords: ['about', 'company', 'story'] },
          { title: 'How It Works', path: '/how-it-works', keywords: ['how', 'works', 'process'] },
          { title: 'Browse Products', path: '/browse', keywords: ['browse', 'shop', 'products', 'catalog'] },
          { title: 'Creators', path: '/creators', keywords: ['creators', 'artists'] },
          { title: 'Become a Creator', path: '/designer-signup', keywords: ['become', 'join', 'creator', 'signup'] },
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
      {/* Desktop: Search + Create combo bar */}
      <div className="hidden md:flex items-center gap-0 rounded-full border border-border bg-muted/40 hover:bg-muted/60 transition-colors h-9 overflow-hidden flex-shrink min-w-0">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-2.5 h-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="text-sm hidden lg:inline">Search...</span>
          <kbd className="pointer-events-none hidden xl:inline-flex h-5 select-none items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-auto">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
        <div className="w-px h-5 bg-border/60" />
        <button
          onClick={() => navigate('/design-studio')}
          className="flex items-center gap-1.5 px-3 h-full text-sm font-semibold text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Create
        </button>
      </div>

      {/* Mobile: icon-only search button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-8 w-8"
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Search Nyzora</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search products, creators, or pages..."
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
              <div className="text-center text-sm text-muted-foreground py-4">
                <p className="mb-4">Start typing to search products, creators, or pages</p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/design-studio');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm hover:bg-primary/20 transition-colors"
                >
                  <Wand2 className="h-4 w-4" />
                  Or create something new with AI
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
