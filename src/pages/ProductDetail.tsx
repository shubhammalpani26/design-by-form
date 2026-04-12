import { useParams, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Shield } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { getMakerForProduct } from "@/data/makers";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ARViewer } from "@/components/ARViewer";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ShareButton } from "@/components/ShareButton";
import { SEOHead } from "@/components/SEOHead";
import { ProductChat } from "@/components/ProductChat";
import { slugify } from "@/lib/slugify";

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"image" | "ar">("image");
  const [selectedFinish, setSelectedFinish] = useState("Natural");
  const [selectedSize, setSelectedSize] = useState("Standard");
  const [isSaved, setIsSaved] = useState(false);
  const [mainImage, setMainImage] = useState<string>("");
  const [finishImage, setFinishImage] = useState<string>("");
  const [isApplyingFinish, setIsApplyingFinish] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    if (slug) fetchProduct();
  }, [slug]);

  useEffect(() => {
    if (!product?.angle_views) return;
    const views = Array.isArray(product.angle_views) ? product.angle_views : [];
    views.forEach((view: any) => {
      const url = view.url || view;
      if (url) { const img = new Image(); img.src = url; }
    });
  }, [product?.angle_views]);

  const fetchProduct = async () => {
    try {
      let data: any = null;
      let error: any = null;

      const slugQuery = supabase.from('designer_products').select('*, designer_profiles!inner(name, email, slug)');
      const { data: slugData } = await (slugQuery as any).eq('slug', slug).eq('status', 'approved').maybeSingle();

      if (slugData) {
        data = slugData;
      } else {
        const { data: idData, error: idError } = await supabase
          .from('designer_products')
          .select('*, designer_profiles!inner(name, email, slug)')
          .eq('id', slug!)
          .eq('status', 'approved')
          .maybeSingle();
        data = idData;
        error = idError;
      }

      if (!data) throw error || new Error('Product not found');

      const dims = data.dimensions as any;
      let productWeight = Number(data.weight || 15);
      const needsWeightCalculation = !data.weight || data.weight < 10;

      if (dims && typeof dims === 'object' && dims.width && dims.depth && dims.height && needsWeightCalculation) {
        try {
          const { data: weightData, error: weightError } = await supabase.functions.invoke('calculate-weight', {
            body: { dimensions: dims, category: data.category, productName: data.name }
          });
          if (!weightError && weightData?.weight) {
            productWeight = weightData.weight;
            await supabase.from('designer_products').update({ weight: productWeight }).eq('id', data.id);
          }
        } catch (error) { console.error('Error calculating weight:', error); }
      }

      setMainImage(data.image_url || '');

      const dimensionsStr = dims && typeof dims === 'object' && dims.width && dims.depth && dims.height
        ? `${dims.width}"W × ${dims.depth}"D × ${dims.height}"H`
        : 'Dimensions available upon request';

      setProduct({
        id: data.id,
        name: data.name,
        designer: data.designer_profiles?.name || 'Unknown Creator',
        designerId: data.designer_id,
        designerSlug: (data.designer_profiles as any)?.slug || slugify(data.designer_profiles?.name || ''),
        price: Number(data.designer_price),
        weight: productWeight,
        image: data.image_url || '',
        image_url: data.image_url || '',
        description: data.description || 'Beautiful piece crafted with sustainable materials.',
        dimensions: dimensionsStr,
        dimensionsObj: dims,
        category: data.category,
        materials: 'High-grade resin reinforced with composite fibre. Weather-resistant.',
        designerBio: `${data.designer_profiles?.name} creates innovative designs with sustainability in mind.`,
        model_url: data.model_url,
        angle_views: data.angle_views || []
      });
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product?.id) return;
    try {
      await addToCart(product.id, { finish: selectedFinish, size: selectedSize });
    } catch (error) { console.error('Add to cart error:', error); }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? "Removed from Saved" : "Saved!",
      description: isSaved ? "Product removed from your saved items" : "Product saved for later",
    });
  };

  const finishCacheRef = React.useRef<Record<string, string>>({});

  useEffect(() => {
    if (selectedFinish === 'Natural' || !product?.id) { setFinishImage(''); return; }
    const cacheKey = `${product.id}_${selectedFinish}`;
    if (finishCacheRef.current[cacheKey]) { setFinishImage(finishCacheRef.current[cacheKey]); return; }
    let cancelled = false;
    setIsApplyingFinish(true);
    const generateFinish = async () => {
      try {
        let fullImageUrl = product.image_url || product.image;
        if (fullImageUrl && !fullImageUrl.startsWith('http')) {
          fullImageUrl = `${window.location.origin}${fullImageUrl.startsWith('/') ? '' : '/'}${fullImageUrl}`;
        }
        const { data, error } = await supabase.functions.invoke('generate-finish-preview', {
          body: { productId: product.id, productImageUrl: fullImageUrl, productName: product.name, finishName: selectedFinish },
        });
        if (cancelled) return;
        if (error) { setFinishImage(''); }
        else if (data?.imageUrl) { finishCacheRef.current[cacheKey] = data.imageUrl; setFinishImage(data.imageUrl); }
        else { setFinishImage(''); }
      } catch { if (!cancelled) setFinishImage(''); }
      finally { if (!cancelled) setIsApplyingFinish(false); }
    };
    generateFinish();
    return () => { cancelled = true; };
  }, [selectedFinish, product?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-8 w-1/4" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-12">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
            <p className="text-muted-foreground mb-8">This product may have been removed or doesn't exist.</p>
            <Link to="/browse"><Button>Browse Products</Button></Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const maker = getMakerForProduct(product.id);

  const finishes = [
    { name: 'Natural', color: '#D4A574' },
    { name: 'Matte Black', color: '#2D2D2D' },
    { name: 'Glossy White', color: '#F5F5F0' },
    { name: 'Walnut', color: '#5C3A1E' },
    { name: 'Concrete', color: '#A0A09B' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={product.name}
        description={product.description || `${product.name} by ${product.designer}. Premium furniture.`}
        image={product.image_url}
        url={window.location.href}
        type="product"
        author={product.designer}
        keywords={[product.name, product.designer, product.category, 'furniture']}
      />
      <Header />

      <main className="flex-1 container px-3 sm:px-4 lg:px-8 py-4 lg:py-6 overflow-x-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
          {/* Left — Image */}
          <div>
            <Tabs defaultValue="image" value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-9">
                <TabsTrigger value="image" className="text-xs">Gallery</TabsTrigger>
                <TabsTrigger value="ar" className="text-xs">AR Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="image" className="mt-2">
                {(() => {
                  const allImages: { url: string; label: string }[] = [];
                  if (product.image_url) allImages.push({ url: product.image_url, label: 'Main' });
                  if (product.angle_views && Array.isArray(product.angle_views)) {
                    product.angle_views.forEach((view: any, i: number) => {
                      const url = view.url || view;
                      if (url && url !== product.image_url) allImages.push({ url, label: view.angle || `View ${i + 1}` });
                    });
                  }
                  const currentIdx = allImages.findIndex(img => img.url === mainImage);
                  const hasPrev = currentIdx > 0;
                  const hasNext = currentIdx < allImages.length - 1;

                  return (
                    <>
                      <div className="aspect-square rounded-xl overflow-hidden bg-accent relative group">
                        <img src={finishImage || mainImage} alt={product.name} className="w-full h-full object-cover transition-opacity duration-200" />
                        {allImages.length > 1 && (
                          <>
                            {hasPrev && (
                              <button onClick={() => { setMainImage(allImages[currentIdx - 1].url); setFinishImage(''); }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background">
                                <ChevronLeft className="w-4 h-4 text-foreground" />
                              </button>
                            )}
                            {hasNext && (
                              <button onClick={() => { setMainImage(allImages[currentIdx + 1].url); setFinishImage(''); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background">
                                <ChevronRight className="w-4 h-4 text-foreground" />
                              </button>
                            )}
                            <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm text-[10px] font-medium px-2 py-1 rounded-full border border-border shadow-sm">
                              {currentIdx + 1} / {allImages.length}
                            </div>
                          </>
                        )}
                        {isApplyingFinish && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-xl">
                            <div className="flex items-center gap-2 bg-background/90 px-3 py-2 rounded-full border border-border shadow-sm">
                              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs font-medium text-foreground">Applying finish...</span>
                            </div>
                          </div>
                        )}
                        {selectedFinish !== 'Natural' && !isApplyingFinish && (
                          <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm text-xs font-medium px-2.5 py-1 rounded-full border border-border shadow-sm">
                            Preview: {selectedFinish}
                          </div>
                        )}
                      </div>
                      {allImages.length > 1 && (
                        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                          {allImages.map((img, idx) => (
                            <button key={idx} onClick={() => { setMainImage(img.url); setFinishImage(''); }}
                              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${mainImage === img.url ? 'border-primary' : 'border-border hover:border-primary/50'}`}>
                              <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </TabsContent>

              <TabsContent value="ar" className="mt-2">
                <ARViewer productName={product.name} productId={product.id} imageUrl={product.image_url} modelUrl={product.model_url} category={product.category} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right — Product Info */}
          <div className="space-y-4">
            {/* Name + Price */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">{product.name}</h1>
              <p className="text-xl sm:text-2xl font-bold text-primary">{formatPrice(product.price)}</p>
            </div>

            {/* Creator + Maker — right below */}
            <div className="flex items-center gap-4 text-sm">
              <Link to={`/designer/${product.designerSlug}`} className="text-muted-foreground hover:text-primary transition-colors">
                by <span className="font-medium text-foreground">{product.designer}</span>
              </Link>
              <span className="text-border">|</span>
              <Link to={`/maker/${maker.slug}`} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                <Shield className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">{maker.name}</span>
              </Link>
            </div>

            {/* Description — truncated with "more" */}
            {(() => {
              const fullDesc = product.description.replace(/Made from premium Fibre-Reinforced Polymer with 75% post-consumer recycled content\. |Crafted from luxury-grade Fibre-Reinforced Polymer with 75% recycled content\. |Made from premium Fibre-Reinforced Polymer with 75% recycled content\. /g, '');
              const SHORT_LIMIT = 150;
              const isLong = fullDesc.length > SHORT_LIMIT;
              const [expanded, setExpanded] = React.useState(false);
              return (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isLong && !expanded ? fullDesc.slice(0, SHORT_LIMIT).trimEnd() + '… ' : fullDesc + ' '}
                  {isLong && (
                    <button
                      onClick={() => setExpanded(!expanded)}
                      className="text-primary font-medium hover:underline"
                    >
                      {expanded ? 'less' : 'more'}
                    </button>
                  )}
                </p>
              );
            })()}

            {/* Finish selector — compact */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Finish</label>
              <div className="flex flex-wrap gap-1.5">
                {finishes.map((finish) => (
                  <button key={finish.name} onClick={() => setSelectedFinish(finish.name)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${selectedFinish === finish.name ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-background border border-border hover:border-primary'}`}>
                    <span className="w-3 h-3 rounded-full border border-border/50 flex-shrink-0" style={{ backgroundColor: finish.color }} />
                    {finish.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Size selector — compact */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Size</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'Standard', scale: '1×' },
                  { name: 'Large', scale: '1.2×' },
                  { name: 'Extra Large', scale: '1.5×' },
                ].map((size) => (
                  <button key={size.name} onClick={() => setSelectedSize(size.name)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${selectedSize === size.name ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-background border border-border hover:border-primary'}`}>
                    {size.name} <span className="text-[10px] opacity-70">{size.scale}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Key specs — compact inline */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm py-2 border-t border-b border-border/50">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Weight</span>
                <span className="font-medium text-foreground">{Math.round(product.weight * 10) / 10} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Outdoor</span>
                <span className="font-medium text-foreground">Yes</span>
              </div>
              <div className="col-span-2 flex justify-between">
                <span className="text-muted-foreground">Dimensions</span>
                <span className="font-medium text-foreground text-right">{product.dimensions}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
              <Button variant="hero" size="lg" className="flex-1" onClick={handleAddToCart}>
                Add to Cart
              </Button>
              <Button variant="outline" size="lg" onClick={handleSave}
                className={isSaved ? 'bg-primary/10 border-primary' : ''}>
                {isSaved ? (
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
              </Button>
              <ShareButton url={window.location.href} title={product.name} description={`${product.name} by ${product.designer}`} variant="outline" size="lg" />
            </div>

            {/* Exclusively on Nyzora badge */}
            <div className="flex items-center justify-center gap-2 py-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent border border-border/40 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Exclusively on Nyzora
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Product Chat */}
      <ProductChat
        product={{
          id: product.id,
          name: product.name,
          designer: product.designer,
          price: formatPrice(product.price),
          category: product.category,
          description: product.description,
          dimensions: product.dimensions,
          weight: product.weight,
          makerName: maker.name,
          makerLocation: maker.location,
        }}
      />

      <Footer />
    </div>
  );
};

export default ProductDetail;
