import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
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

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"image" | "360" | "ar">("image");
  const [selectedFinish, setSelectedFinish] = useState("Natural");
  const [selectedSize, setSelectedSize] = useState("Standard");
  const [isSaved, setIsSaved] = useState(false);
  const [mainImage, setMainImage] = useState<string>("");
  const [isSharing, setIsSharing] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('designer_products')
        .select(`
          *,
          designer_profiles!inner(name, email)
        `)
        .eq('id', id)
        .eq('status', 'approved')
        .single();

      if (error) throw error;

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
              .eq('id', id);
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
        price: Number(data.designer_price),
        weight: productWeight,
        image: data.image_url || '',
        image_url: data.image_url || '',
        description: data.description || 'Beautiful piece crafted with sustainable materials.',
        dimensions: dimensionsStr,
        dimensionsObj: dims,
        category: data.category,
        materials: 'Crafted from premium FRP (Fibre-Reinforced Polymer) with 75% post-consumer recycled content. This sustainable, high-performance material offers exceptional durability and weather resistance while maintaining an elegant, refined finish.',
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
    if (!id) return;
    
    try {
      const customizations: any = {
        finish: selectedFinish,
        size: selectedSize
      };
      
      await addToCart(id, customizations);
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

  const handleRequestCustomization = () => {
    toast({
      title: "Customization Request",
      description: "Our design team will contact you within 24 hours to discuss your customization options.",
    });
  };

  const handleRequestCustomDesign = () => {
    toast({
      title: "Custom Design Request",
      description: "Our design team will reach out to you soon to create a personalized design.",
    });
  };

  const handleShare = async () => {
    setIsSharing(true);
    const shareUrl = window.location.href;
    const shareTitle = product?.name || 'Check out this product';
    const shareText = `${shareTitle} on Forma`;

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
      
      <main className="flex-1 container py-4 lg:py-6">
        <div className="grid md:grid-cols-2 gap-3 lg:gap-4">
          {/* Left Column - Image and AR Viewer */}
          <div className="space-y-2">
            <Tabs defaultValue="image" value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-9">
                <TabsTrigger value="image" className="text-xs">Gallery</TabsTrigger>
                <TabsTrigger value="360" className="text-xs">360° View</TabsTrigger>
                <TabsTrigger value="ar" className="text-xs">AR Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="image" className="mt-2">
                <div className="aspect-square rounded-xl overflow-hidden bg-accent">
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {product.angle_views && product.angle_views.length > 0 && (
                  <div className="mt-2 flex gap-2 overflow-x-auto">
                    {product.angle_views.map((view: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setMainImage(view.url)}
                        className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors"
                      >
                        <img
                          src={view.url}
                          alt={view.angle}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="360" className="mt-2">
                {product.model_url ? (
                  <div className="h-[500px]">
                    <ModelViewer3D
                      modelUrl={product.model_url}
                      productName={product.name}
                    />
                  </div>
                ) : product.angle_views && product.angle_views.length > 1 ? (
                  <AngleRotator images={product.angle_views} />
                ) : (
                  <div className="aspect-square rounded-xl bg-accent flex items-center justify-center">
                    <div className="text-center p-8">
                      <p className="text-muted-foreground">360° view not available</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Designer needs to generate angle views
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ar" className="mt-2">
                <ARViewer 
                  productName={product.name}
                  imageUrl={product.image_url}
                  modelUrl={product.model_url}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Product Details */}
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">{product.name}</h1>
              <Link
                to={`/designer/${product.designerId}`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Designed by {product.designer}
              </Link>
            </div>

            <p className="text-2xl font-bold text-primary">{formatPrice(product.price)}</p>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description.replace(/Made from premium Fibre-Reinforced Polymer with 75% post-consumer recycled content\. |Crafted from luxury-grade Fibre-Reinforced Polymer with 75% recycled content\. |Made from premium Fibre-Reinforced Polymer with 75% recycled content\. /g, '')}
            </p>

            {/* Quick Customization */}
            <Card className="bg-accent/50 border-primary/20">
              <CardContent className="p-3 lg:p-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Finish</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Natural', 'Matte Black', 'Glossy White', 'Walnut', 'Concrete'].map((finish) => (
                      <button
                        key={finish}
                        onClick={() => setSelectedFinish(finish)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          selectedFinish === finish
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-background border border-border hover:border-primary'
                        }`}
                      >
                        {finish}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Size</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Standard', 'Large', 'Extra Large'].map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          selectedSize === size
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-background border border-border hover:border-primary'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
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
                    <h4 className="font-semibold text-foreground mb-1">Premium Outdoor-Friendly Material</h4>
                    <p className="text-sm text-muted-foreground">Crafted from luxury-grade Fibre-Reinforced Polymer with 75% post-consumer recycled content. Weather-resistant, UV-stable, and built to withstand the elements while maintaining elegance.</p>
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

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[100px]">Weight:</span>
                <span className="text-muted-foreground">{Math.round(product.weight * 10) / 10} kg</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[100px]">Dimensions:</span>
                <span className="text-muted-foreground">{product.dimensions}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[100px]">Materials:</span>
                <span className="text-muted-foreground">{product.materials}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[100px]">Production:</span>
                <span className="text-muted-foreground">3D printed on-demand with expert hand-finishing, 2-3 weeks</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[100px]">Outdoor Use:</span>
                <span className="text-muted-foreground">Weather-resistant and UV-stable</span>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
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
                <Link to={`/designer/${product.designerId}`}>
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
