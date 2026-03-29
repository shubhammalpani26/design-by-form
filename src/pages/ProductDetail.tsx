import { useParams, Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModelViewer3D } from "@/components/ModelViewer3D";
import { ARViewer } from "@/components/ARViewer";
import { AngleRotator } from "@/components/AngleRotator";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ShareButton } from "@/components/ShareButton";
import { SEOHead } from "@/components/SEOHead";

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
  const [isSharing, setIsSharing] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const fetchProduct = async () => {
    try {
      // Try fetching by slug first, fallback to UUID for backward compatibility
      let data: any = null;
      let error: any = null;

      const slugQuery = supabase
        .from('designer_products')
        .select('*, designer_profiles!inner(name, email)');
      const { data: slugData } = await (slugQuery as any)
        .eq('slug', slug)
        .eq('status', 'approved')
        .maybeSingle();

      if (slugData) {
        data = slugData;
      } else {
        const { data: idData, error: idError } = await supabase
          .from('designer_products')
          .select(`
            *,
            designer_profiles!inner(name, email)
          `)
          .eq('id', slug!)
          .eq('status', 'approved')
          .maybeSingle();
        data = idData;
        error = idError;
      }

      if (!data) throw error || new Error('Product not found');

      const dims = data.dimensions as any;
      
      // Calculate weight using AI if we have dimensions and weight is not realistic
      let productWeight = Number(data.weight || 15);
      const needsWeightCalculation = !data.weight || data.weight < 10; // Recalculate if weight is missing or too low
      
      if (dims && typeof dims === 'object' && dims.width && dims.depth && dims.height && needsWeightCalculation) {
        try {
          console.log('Calculating weight for product:', data.name);
          const { data: weightData, error: weightError } = await supabase.functions.invoke('calculate-weight', {
            body: {
              dimensions: dims,
              category: data.category,
              productName: data.name
            }
          });
          
          console.log('Weight calculation result:', weightData, weightError);
          
          if (!weightError && weightData?.weight) {
            productWeight = weightData.weight;
            console.log('Updating product weight to:', productWeight);
            
            // Update the product in database with calculated weight
            await supabase
              .from('designer_products')
              .update({ weight: productWeight })
              .eq('id', data.id);
          } else {
            console.error('Weight calculation error:', weightError);
          }
        } catch (error) {
          console.error('Error calculating weight:', error);
        }
      }

      // Parse angle views - use all available images
      const views = [];
      if (data.image_url) views.push(data.image_url);
      
      // Add angle views from database if available
      if (data.angle_views && Array.isArray(data.angle_views)) {
        const angleUrls = data.angle_views.map((v: any) => v.url || v);
        views.push(...angleUrls);
      }

      setMainImage(data.image_url || '');

      const dimensionsStr = dims && typeof dims === 'object' && dims.width && dims.depth && dims.height
        ? `${dims.width}"W × ${dims.depth}"D × ${dims.height}"H`
        : 'Dimensions available upon request';

      setProduct({
        id: data.id,
        name: data.name,
        designer: data.designer_profiles?.name || 'Unknown Designer',
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
        materials: 'Crafted using high-grade resin reinforced with composite fibre, engineered for lasting strength and a refined finish. Material composition may vary to suit each design\'s form and function.',
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
      const customizations: any = {
        finish: selectedFinish,
        size: selectedSize
      };
      
      await addToCart(product.id, customizations);
    } catch (error) {
      console.error('Add to cart error:', error);
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? "Removed from Saved" : "Saved!",
      description: isSaved ? "Product removed from your saved items" : "Product saved for later",
    });
  };

  const handleRequestCustomization = async () => {
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Login Required",
          description: "Please log in to request customization options.",
          variant: "destructive",
        });
        return;
      }

      // Send customization request to admin
      const { error } = await supabase.functions.invoke('send-customization-request', {
        body: {
          productId: product.id,
          productName: product.name,
          customizationDetails: {
            selectedFinish,
            selectedSize,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Request Sent",
        description: "Our design team will contact you within 24 hours to discuss your customization options.",
      });
    } catch (error) {
      console.error('Error sending customization request:', error);
      toast({
        title: "Error",
        description: "Failed to send customization request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRequestCustomDesign = async () => {
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Login Required",
          description: "Please log in to request a custom design.",
          variant: "destructive",
        });
        return;
      }

      // Send custom design request to admin
      const { error } = await supabase.functions.invoke('send-customization-request', {
        body: {
          productId: product.id,
          productName: product.name,
          customizationDetails: {
            type: 'custom_design_request',
            message: 'User requested a completely custom design based on this product'
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Custom Design Request Sent",
        description: "Our design team will reach out to you soon to create a personalized design.",
      });
    } catch (error) {
      console.error('Error sending custom design request:', error);
      toast({
        title: "Error",
        description: "Failed to send custom design request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    const shareUrl = window.location.href;
    const shareTitle = product?.name || 'Check out this product';
    const shareText = `${shareTitle} on Formo`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        toast({
          title: "Shared successfully!",
          description: "Product shared successfully",
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied!",
          description: "Product link copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      // Try clipboard fallback
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied!",
          description: "Product link copied to clipboard",
        });
      } catch (clipboardError) {
        toast({
          title: "Unable to share",
          description: "Please copy the URL manually",
          variant: "destructive",
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  // In-memory cache for finish images within this session
  const finishCacheRef = React.useRef<Record<string, string>>({});

  useEffect(() => {
    if (selectedFinish === 'Natural' || !product?.id) {
      setFinishImage('');
      return;
    }

    const cacheKey = `${product.id}_${selectedFinish}`;

    // Check in-memory cache first
    if (finishCacheRef.current[cacheKey]) {
      setFinishImage(finishCacheRef.current[cacheKey]);
      return;
    }

    let cancelled = false;
    setIsApplyingFinish(true);

    const generateFinish = async () => {
      try {
        // Ensure we have a full URL for the AI gateway
        let fullImageUrl = mainImage;
        if (fullImageUrl && !fullImageUrl.startsWith('http')) {
          fullImageUrl = `${window.location.origin}${fullImageUrl.startsWith('/') ? '' : '/'}${fullImageUrl}`;
        }

        const { data, error } = await supabase.functions.invoke('generate-finish-preview', {
          body: {
            productId: product.id,
            productImageUrl: fullImageUrl,
            productName: product.name,
            finishName: selectedFinish,
          },
        });

        if (cancelled) return;

        if (error) {
          console.error('Finish generation error:', error);
          toast({
            title: "Finish preview unavailable",
            description: "Could not generate finish preview. Try again later.",
            variant: "destructive",
          });
          setFinishImage('');
        } else if (data?.imageUrl) {
          finishCacheRef.current[cacheKey] = data.imageUrl;
          setFinishImage(data.imageUrl);
          if (!data.cached) {
            toast({
              title: "Finish preview generated",
              description: `${selectedFinish} finish preview is now cached for all visitors.`,
            });
          }
        } else {
          setFinishImage('');
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Finish preview error:', err);
          setFinishImage('');
        }
      } finally {
        if (!cancelled) setIsApplyingFinish(false);
      }
    };

    generateFinish();
    return () => { cancelled = true; };
  }, [selectedFinish, product?.id, mainImage]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <Skeleton className="aspect-square w-full rounded-2xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-32 w-full" />
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
      {product && (
        <SEOHead
          title={product.name}
          description={product.description || `${product.name} by ${product.designer}. ${product.materials}`}
          image={product.image_url}
          url={window.location.href}
          type="product"
          author={product.designer}
          keywords={[product.name, product.designer, product.category, 'furniture', 'sustainable furniture']}
        />
      )}
      <Header />
        <main className="flex-1 container py-12">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
            <p className="text-muted-foreground mb-8">This product may have been removed or doesn't exist.</p>
            <Link to="/browse">
              <Button>Browse Products</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {product && (
        <SEOHead
          title={product.name}
          description={product.description || `${product.name} by ${product.designer}. Premium furniture with sustainable materials.`}
          image={product.image_url}
          url={window.location.href}
          type="product"
          author={product.designer}
          keywords={[product.name, product.designer, product.category, 'furniture', 'sustainable furniture', 'custom furniture']}
        />
      )}
      <Header />
      
      <main className="flex-1 container px-3 sm:px-4 lg:px-8 py-4 lg:py-6 overflow-x-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {/* Left Column - Image and AR Viewer */}
          <div className="space-y-2">
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
                      if (url && url !== product.image_url) {
                        allImages.push({ url, label: view.angle || `View ${i + 1}` });
                      }
                    });
                  }
                  const currentIdx = allImages.findIndex(img => img.url === mainImage);
                  const hasPrev = currentIdx > 0;
                  const hasNext = currentIdx < allImages.length - 1;

                  return (
                    <>
                      <div className="aspect-square rounded-xl overflow-hidden bg-accent relative group">
                        <img
                          src={finishImage || mainImage}
                          alt={product.name}
                          className="w-full h-full object-cover transition-all duration-500"
                        />
                        {/* Navigation arrows */}
                        {allImages.length > 1 && (
                          <>
                            {hasPrev && (
                              <button
                                onClick={() => setMainImage(allImages[currentIdx - 1].url)}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                              >
                                <ChevronLeft className="w-4 h-4 text-foreground" />
                              </button>
                            )}
                            {hasNext && (
                              <button
                                onClick={() => setMainImage(allImages[currentIdx + 1].url)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                              >
                                <ChevronRight className="w-4 h-4 text-foreground" />
                              </button>
                            )}
                            {/* Image counter */}
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
                            Preview: {selectedFinish} finish
                          </div>
                        )}
                      </div>
                      {/* Thumbnail strip */}
                      {allImages.length > 1 && (
                        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                          {allImages.map((img, idx) => (
                            <button
                              key={idx}
                              onClick={() => setMainImage(img.url)}
                              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                                mainImage === img.url ? 'border-primary' : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <img
                                src={img.url}
                                alt={img.label}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </TabsContent>

              <TabsContent value="ar" className="mt-2">
                <ARViewer 
                  productName={product.name}
                  productId={product.id}
                  imageUrl={product.image_url}
                  modelUrl={product.model_url}
                  category={product.category}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Product Details */}
          <div className="space-y-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">{product.name}</h1>
              <Link
                to={`/designer/${product.designerSlug}`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Designed by {product.designer}
              </Link>
            </div>

            <p className="text-xl sm:text-2xl font-bold text-primary">{formatPrice(product.price)}</p>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description.replace(/Made from premium Fibre-Reinforced Polymer with 75% post-consumer recycled content\. |Crafted from luxury-grade Fibre-Reinforced Polymer with 75% recycled content\. |Made from premium Fibre-Reinforced Polymer with 75% recycled content\. /g, '')}
            </p>

            {/* Quick Customization */}
            <Card className="bg-accent/50 border-primary/20">
              <CardContent className="p-3 lg:p-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Finish</label>
                  <p className="text-[10px] text-muted-foreground mb-1.5">Select a finish to preview how it looks</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'Natural', color: '#D4A574', desc: 'Original material tone' },
                      { name: 'Matte Black', color: '#2D2D2D', desc: 'Sleek, non-reflective dark' },
                      { name: 'Glossy White', color: '#F5F5F0', desc: 'Clean, reflective bright' },
                      { name: 'Walnut', color: '#5C3A1E', desc: 'Rich, warm brown wood' },
                      { name: 'Concrete', color: '#A0A09B', desc: 'Industrial raw grey' },
                    ].map((finish) => (
                      <button
                        key={finish.name}
                        onClick={() => setSelectedFinish(finish.name)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                          selectedFinish === finish.name
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-background border border-border hover:border-primary'
                        }`}
                        title={finish.desc}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-border/50 flex-shrink-0"
                          style={{ backgroundColor: finish.color }}
                        />
                        {finish.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Size</label>
                  <p className="text-[10px] text-muted-foreground mb-1.5">Affects overall dimensions proportionally</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'Standard', scale: '1×', desc: 'Original designer dimensions' },
                      { name: 'Large', scale: '1.2×', desc: '20% larger than standard' },
                      { name: 'Extra Large', scale: '1.5×', desc: '50% larger than standard' },
                    ].map((size) => (
                      <button
                        key={size.name}
                        onClick={() => setSelectedSize(size.name)}
                        className={`flex flex-col items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          selectedSize === size.name
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-background border border-border hover:border-primary'
                        }`}
                      >
                        <span>{size.name}</span>
                        <span className={`text-[10px] font-normal ${
                          selectedSize === size.name ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>{size.scale} scale</span>
                      </button>
                    ))}
                  </div>
                  {product.dimensionsObj && (
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {selectedSize === 'Standard' && `Approx. ${product.dimensionsObj.depth || '—'}L × ${product.dimensionsObj.width || '—'}W × ${product.dimensionsObj.height || '—'}H cm`}
                      {selectedSize === 'Large' && `Approx. ${Math.round((product.dimensionsObj.depth || 0) * 1.2)}L × ${Math.round((product.dimensionsObj.width || 0) * 1.2)}W × ${Math.round((product.dimensionsObj.height || 0) * 1.2)}H cm`}
                      {selectedSize === 'Extra Large' && `Approx. ${Math.round((product.dimensionsObj.depth || 0) * 1.5)}L × ${Math.round((product.dimensionsObj.width || 0) * 1.5)}W × ${Math.round((product.dimensionsObj.height || 0) * 1.5)}H cm`}
                    </p>
                  )}
                </div>

                <Button variant="outline" className="w-full text-xs h-8" onClick={handleRequestCustomization}>
                  Request More Customizations
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-secondary/10 border-secondary/20">
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Premium Outdoor-Friendly Material as well</h4>
                    <p className="text-sm text-muted-foreground">Crafted using high-grade resin reinforced with composite fibre, engineered for lasting strength and a refined finish. Weather-resistant and built to withstand the elements while maintaining elegance - perfect for any space, indoors or outdoors.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-accent border-border">
              <CardContent className="p-4 lg:p-5">
                <h3 className="font-semibold text-lg mb-4">Customization Options</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Work with our design team to customize this piece in different colors, finishes, and sizes to match your vision perfectly.
                </p>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-semibold text-foreground">Sheen Finishes:</span>
                    <span className="text-muted-foreground ml-2">Matte, Satin, Glossy, High-Gloss</span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Textural Finishes:</span>
                    <span className="text-muted-foreground ml-2">Brushed, Pebbled, Embossed, Sandblasted, Bouclé</span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Stone & Mineral Effects:</span>
                    <span className="text-muted-foreground ml-2">Marble, Onyx, Concrete, Terrazzo, Granite-like</span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Wood & Organic Effects:</span>
                    <span className="text-muted-foreground ml-2">Faux Woodgrain, Bamboo/Straw, Leaf Imprints</span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Metallic & Reflective:</span>
                    <span className="text-muted-foreground ml-2">Gold, Silver, Bronze, Copper, Chrome, Patina</span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Artistic & Decorative:</span>
                    <span className="text-muted-foreground ml-2">Gradient/Ombre, Speckled, Splatter-paint, Hand-painted motifs</span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Sustainable & Raw:</span>
                    <span className="text-muted-foreground ml-2">Raw/Unfinished, Earth Pigment tones, Clay-like textures</span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Specialty:</span>
                    <span className="text-muted-foreground ml-2">Iridescent, Pearlescent, Glow-in-the-dark, Custom Designer Artwork</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" onClick={handleRequestCustomDesign}>
                  Request Custom Design
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                <span className="font-semibold text-foreground">Weight:</span>
                <span className="text-muted-foreground">{Math.round(product.weight * 10) / 10} kg</span>
              </div>
              <div className="flex justify-between items-start py-1.5 border-b border-border/50">
                <span className="font-semibold text-foreground">Dimensions:</span>
                <span className="text-muted-foreground text-right">{product.dimensions}</span>
              </div>
              <div className="flex justify-between items-start py-1.5 border-b border-border/50">
                <span className="font-semibold text-foreground">Materials:</span>
                <span className="text-muted-foreground text-right max-w-[65%]">{product.materials}</span>
              </div>
              <div className="flex justify-between items-start py-1.5 border-b border-border/50">
                <span className="font-semibold text-foreground">Production:</span>
                <span className="text-muted-foreground text-right max-w-[65%]">Produced through a hybrid fabrication process and completed with meticulous hand-finishing, ensuring every piece has its own distinct character.</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="font-semibold text-foreground">Outdoor Use:</span>
                <span className="text-muted-foreground">Weather-resistant as well</span>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-4 pt-4">
              <Button variant="hero" size="lg" className="flex-1" onClick={handleAddToCart}>
                Add to Cart
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={handleSave}
                className={isSaved ? 'bg-primary/10 border-primary' : ''}
              >
                {isSaved ? (
                  <>
                    <svg className="w-5 h-5 mr-2 fill-current" viewBox="0 0 20 20">
                      <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                    </svg>
                    Saved
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Save
                  </>
                )}
              </Button>
              <ShareButton
                url={window.location.href}
                title={product.name}
                description={`${product.description} - Designed by ${product.designer}`}
                variant="outline"
                size="lg"
              />
            </div>

            <Card className="bg-accent border-border">
              <CardContent className="p-4 lg:p-5">
                <h3 className="font-semibold text-lg mb-2">About the Designer</h3>
                <p className="text-muted-foreground mb-4">{product.designerBio}</p>
                <Link to={`/designer/${product.designerSlug}`}>
                  <Button variant="link" className="p-0 h-auto">
                    View {product.designer}'s Collection →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProductDetail;
