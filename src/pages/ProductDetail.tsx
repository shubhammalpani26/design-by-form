import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModelViewer3D } from "@/components/ModelViewer3D";
import { ARViewer } from "@/components/ARViewer";
import chairHero from "@/assets/chair-hero.jpg";

const productData: Record<string, any> = {
  "1": {
    name: "Luna Chair",
    designer: "Tejal Agawane",
    designerId: "tejal",
    price: 24999,
    weight: 3.2,
    image: chairHero,
    description: "The Luna Chair combines organic curves with minimalist design philosophy. 3D printed on-demand using Post Consumer Recycled PP (PCR), making it both sustainable and beautiful. Perfect for modern living spaces that value both comfort and eco-conscious design.",
    dimensions: "32\"W × 30\"D × 34\"H",
    materials: "PCR (Post Consumer Recycled PP) - 75% recycled content",
    designerBio: "Tejal is a furniture creator based in Mumbai, India. Her work focuses on merging innovation with sustainability through cutting-edge 3D printing technology.",
  },
};

const ProductDetail = () => {
  const { id } = useParams();
  const product = productData[id || "1"] || productData["1"];
  const [viewMode, setViewMode] = useState<"image" | "3d" | "ar">("image");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="image">Image</TabsTrigger>
                <TabsTrigger value="3d">3D View</TabsTrigger>
                <TabsTrigger value="ar">AR Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="image" className="mt-0">
                <div className="aspect-square rounded-2xl overflow-hidden bg-accent shadow-medium">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="3d" className="mt-0">
                <ModelViewer3D productName={product.name} />
              </TabsContent>
              
              <TabsContent value="ar" className="mt-0">
                <ARViewer productName={product.name} />
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 text-foreground">{product.name}</h1>
              <Link
                to={`/designer/${product.designerId}`}
                className="text-lg text-muted-foreground hover:text-primary transition-colors"
              >
                Designed by {product.designer}
              </Link>
            </div>

            <p className="text-3xl font-bold text-primary">₹{product.price.toLocaleString()}</p>

            <p className="text-muted-foreground leading-relaxed">{product.description}</p>

            <Card className="bg-secondary/10 border-secondary/20 mb-6">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Circular Economy</h4>
                    <p className="text-sm text-muted-foreground">Made with 75% Post Consumer Recycled PP (PCR), giving plastic waste new life while reducing environmental impact.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[120px]">Weight:</span>
                <span className="text-muted-foreground">{product.weight} kg</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[120px]">Dimensions:</span>
                <span className="text-muted-foreground">{product.dimensions}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[120px]">Materials:</span>
                <span className="text-muted-foreground">{product.materials}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[120px]">Production:</span>
                <span className="text-muted-foreground">3D printed on-demand, 2-3 weeks</span>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="hero" size="lg" className="flex-1">
                Add to Cart
              </Button>
              <Button variant="outline" size="lg">
                Save
              </Button>
            </div>

            <Card className="bg-accent border-border">
              <CardContent className="p-6">
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
