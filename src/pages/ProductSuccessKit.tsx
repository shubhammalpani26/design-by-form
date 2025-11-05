import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Copy, Download, Sparkles, Share2, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  id: string;
  name: string;
  image_url: string;
  base_price: number;
}

interface AngleShot {
  angle: string;
  url: string;
  loading: boolean;
}

const ProductSuccessKit = () => {
  const { productId } = useParams();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedText, setCopiedText] = useState('');
  const [angleShots, setAngleShots] = useState<AngleShot[]>([
    { angle: 'Front View', url: '', loading: false },
    { angle: '45° Angle', url: '', loading: false },
    { angle: 'Side Profile', url: '', loading: false },
    { angle: 'Top View', url: '', loading: false },
    { angle: 'Close-up Detail', url: '', loading: false },
    { angle: 'Lifestyle Context', url: '', loading: false },
  ]);

  const productUrl = `${window.location.origin}/product/${productId}`;

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('designer_products')
        .select('id, name, image_url, base_price')
        .eq('id', productId)
        .single();

      if (error) throw error;
      setProduct(data);
      
      // Set the original image as front view
      setAngleShots(prev => prev.map((shot, idx) => 
        idx === 0 ? { ...shot, url: data.image_url } : shot
      ));
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: 'Error',
        description: 'Failed to load product details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAngleShot = async (index: number, angle: string) => {
    if (!product) return;

    setAngleShots(prev => prev.map((shot, idx) => 
      idx === index ? { ...shot, loading: true } : shot
    ));

    try {
      const { data, error } = await supabase.functions.invoke('generate-angle-view', {
        body: {
          imageUrl: product.image_url,
          angle: angle,
          productName: product.name
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to generate angle view');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.imageUrl) {
        setAngleShots(prev => prev.map((shot, idx) => 
          idx === index ? { ...shot, url: data.imageUrl, loading: false } : shot
        ));
        toast({
          title: 'Success',
          description: `${angle} generated successfully!`,
        });
      } else {
        throw new Error('No image URL returned');
      }
    } catch (error) {
      console.error('Error generating angle:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate angle view',
        variant: 'destructive',
      });
      setAngleShots(prev => prev.map((shot, idx) => 
        idx === index ? { ...shot, loading: false } : shot
      ));
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
    setTimeout(() => setCopiedText(''), 2000);
  };

  const captionTemplates = [
    {
      category: 'Product Launch',
      captions: [
        `🎉 Introducing ${product?.name}! Now available on Forma Marketplace.\n\nBuy now: ${productUrl}\n\n#FormaDesign #FurnitureDesign #ModernLiving`,
        `✨ ${product?.name} is here! Transform your space with this stunning piece.\n\n🛒 Shop now: ${productUrl}\n\n#InteriorDesign #HomeDecor #ShopNow`,
      ],
    },
    {
      category: 'Behind the Scenes',
      captions: [
        `From concept to reality 💭✨\n\nThe ${product?.name} journey. Every curve, every detail crafted with passion.\n\nAvailable now: ${productUrl}\n\n#DesignProcess #FurnitureDesigner`,
        `Designing ${product?.name} was a labor of love ❤️\n\nGet yours today: ${productUrl}\n\n#CreativeProcess #DesignStudio`,
      ],
    },
    {
      category: 'Social Proof',
      captions: [
        `⭐️ Customers are loving ${product?.name}!\n\nJoin the Forma community and elevate your space.\n\nOrder yours: ${productUrl}\n\n#CustomerLove #QualityFurniture`,
        `Why people choose ${product?.name}:\n✓ Premium quality\n✓ Unique design\n✓ Sustainable materials\n\nShop now: ${productUrl}\n\n#SustainableDesign #QualityMatters`,
      ],
    },
    {
      category: 'Call to Action',
      captions: [
        `🔥 Don't miss out on ${product?.name}!\n\n👉 Buy now: ${productUrl}\n\nLimited availability. Free shipping on orders over ₹50,000!\n\n#ShopNow #FreeShipping #FormaMarketplace`,
        `Ready to transform your space? 🏡\n\n${product?.name} is waiting for you!\n\n🛍️ Get it now: ${productUrl}\n\n#HomeTransformation #ShopTheLook`,
      ],
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <Skeleton className="h-96 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Product not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link to="/creator/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Success Kit: {product.name}</h1>
          <p className="text-muted-foreground">
            Everything you need to market and sell {product.name} successfully
          </p>
        </div>

        <Tabs defaultValue="photos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="photos">Photo Pack</TabsTrigger>
            <TabsTrigger value="captions">Social Captions</TabsTrigger>
            <TabsTrigger value="links">Trackable Links</TabsTrigger>
          </TabsList>

          <TabsContent value="photos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI-Generated Product Views
                </CardTitle>
                <CardDescription>
                  Generate professional product shots from multiple angles using AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {angleShots.map((shot, index) => (
                    <div key={shot.angle} className="space-y-2">
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                        {shot.loading ? (
                          <div className="flex flex-col items-center gap-2">
                            <Sparkles className="w-8 h-8 animate-pulse text-primary" />
                            <p className="text-sm text-muted-foreground">Generating...</p>
                          </div>
                        ) : shot.url ? (
                          <img 
                            src={shot.url} 
                            alt={shot.angle}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <p className="text-sm text-muted-foreground mb-2">Not generated yet</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{shot.angle}</p>
                        <div className="flex gap-2">
                          {shot.url && !shot.loading && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = shot.url;
                                link.download = `${product.name}-${shot.angle}.png`;
                                link.click();
                              }}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => generateAngleShot(index, shot.angle)}
                            disabled={shot.loading}
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            {shot.url ? 'Regenerate' : 'Generate'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="captions" className="space-y-6">
            {captionTemplates.map((template) => (
              <Card key={template.category}>
                <CardHeader>
                  <CardTitle>{template.category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {template.captions.map((caption, idx) => (
                    <div key={idx} className="p-4 bg-muted rounded-lg">
                      <p className="whitespace-pre-line mb-3">{caption}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(caption, `${template.category} caption ${idx + 1}`)}
                      >
                        <Copy className="w-3 h-3 mr-2" />
                        {copiedText === `${template.category} caption ${idx + 1}` ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="links" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  Product Link
                </CardTitle>
                <CardDescription>
                  Direct link to your product on Forma Marketplace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-mono text-sm mb-3 break-all">{productUrl}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleCopy(productUrl, 'Product link')}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {copiedText === 'Product link' ? 'Copied!' : 'Copy Link'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(productUrl, '_blank')}
                    >
                      Preview
                    </Button>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">💡 Pro Tip</h4>
                  <p className="text-sm text-muted-foreground">
                    Share this link on your social media, email, or website. Track your sales in the Earnings dashboard!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default ProductSuccessKit;
