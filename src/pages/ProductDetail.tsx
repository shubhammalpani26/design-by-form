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
import chairSpiral from "@/assets/chair-spiral.jpg";
import tableFlow from "@/assets/table-flow.jpg";
import tableDining from "@/assets/table-dining.jpg";
import vaseCurvy from "@/assets/vase-curvy.jpg";
import vaseSculptural from "@/assets/vase-sculptural.jpg";
import benchCurvy from "@/assets/bench-curvy.jpg";
import benchFluid from "@/assets/bench-fluid.jpg";
import installation1 from "@/assets/installation-1.jpg";
import installation2 from "@/assets/installation-2.jpg";
import decorShelf from "@/assets/decor-shelf.jpg";
import decorBowl from "@/assets/decor-bowl.jpg";
import decorPlanter from "@/assets/decor-planter.jpg";

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
  "2": {
    name: "Flow Coffee Table",
    designer: "Marcus Chen",
    designerId: "marcus",
    price: 45999,
    weight: 5.8,
    image: tableFlow,
    description: "A sculptural coffee table featuring flowing organic lines and curves. 3D printed using sustainable PCR material, this piece serves as both functional furniture and modern art. Its unique design creates a stunning focal point in any living space.",
    dimensions: "48\"W × 28\"D × 18\"H",
    materials: "PCR (Post Consumer Recycled PP) - 75% recycled content",
    designerBio: "Marcus is a Vancouver-based designer who explores the intersection of function and sculpture through sustainable 3D printing.",
  },
  "3": {
    name: "Wave Vase",
    designer: "Sarah Williams",
    designerId: "sarah",
    price: 8999,
    weight: 1.1,
    image: vaseCurvy,
    description: "An elegant vase with undulating curves inspired by ocean waves. 3D printed with precision using recycled materials, perfect for displaying fresh flowers or as a standalone decorative piece.",
    dimensions: "8\"W × 8\"D × 12\"H",
    materials: "PCR (Post Consumer Recycled PP) - 75% recycled content",
    designerBio: "Sarah is a contemporary designer creating elegant home accessories that blend art with sustainability.",
  },
  "4": {
    name: "Curve Bench",
    designer: "Priya Sharma",
    designerId: "priya",
    price: 38999,
    weight: 4.9,
    image: benchCurvy,
    description: "A beautifully curved bench that combines comfort with artistic form. 3D printed on-demand with sustainable materials, ideal for entryways, bedrooms, or as statement seating.",
    dimensions: "52\"W × 18\"D × 18\"H",
    materials: "PCR (Post Consumer Recycled PP) - 75% recycled content",
    designerBio: "Priya creates innovative furniture designs that push the boundaries of 3D printing technology.",
  },
  "5": {
    name: "Organic Dining Table",
    designer: "James Park",
    designerId: "james",
    price: 65999,
    weight: 8.2,
    image: tableDining,
    description: "A large dining table featuring organic edges and a sculptural base. 3D printed with sustainable PCR material, this piece makes every meal feel special. Seats 6-8 people comfortably.",
    dimensions: "72\"W × 36\"D × 30\"H",
    materials: "PCR (Post Consumer Recycled PP) - 75% recycled content",
    designerBio: "James specializes in creating statement furniture pieces that merge architectural principles with sustainable manufacturing.",
  },
  "6": {
    name: "Spiral Chair",
    designer: "Marcus Chen",
    designerId: "marcus",
    price: 27999,
    weight: 3.5,
    image: chairSpiral,
    description: "A striking chair with a twisted spiral form that defies convention. 3D printed with precision, this sculptural seating combines comfort with contemporary aesthetics.",
    dimensions: "28\"W × 30\"D × 36\"H",
    materials: "PCR (Post Consumer Recycled PP) - 75% recycled content",
    designerBio: "Marcus is a Vancouver-based designer who explores the intersection of function and sculpture through sustainable 3D printing.",
  },
  "7": {
    name: "Fluid Bench",
    designer: "Tejal Agawane",
    designerId: "tejal",
    price: 42999,
    weight: 5.2,
    image: benchFluid,
    description: "A flowing bench design with wave-like curves throughout. 3D printed using sustainable materials, perfect for creating a unique statement in any interior space.",
    dimensions: "56\"W × 20\"D × 18\"H",
    materials: "PCR (Post Consumer Recycled PP) - 75% recycled content",
    designerBio: "Tejal is a furniture creator based in Mumbai, India. Her work focuses on merging innovation with sustainability through cutting-edge 3D printing technology.",
  },
  "8": {
    name: "Sculptural Vase",
    designer: "Sarah Williams",
    designerId: "sarah",
    price: 11999,
    weight: 1.4,
    image: vaseSculptural,
    description: "A contemporary vase with an organic twisted form. 3D printed with sustainable PCR material, this piece adds elegance and artistic flair to any surface.",
    dimensions: "10\"W × 10\"D × 14\"H",
    materials: "PCR (Post Consumer Recycled PP) - 75% recycled content",
    designerBio: "Sarah is a contemporary designer creating elegant home accessories that blend art with sustainability.",
  },
  "9": {
    name: "Abstract Flow Installation",
    designer: "James Park",
    designerId: "james",
    price: 125999,
    weight: 18.5,
    image: installation1,
    description: "A large-scale sculptural installation featuring abstract flowing forms. 3D printed in multiple sections using sustainable materials, perfect for creating a dramatic focal point in residential or commercial spaces.",
    dimensions: "96\"W × 48\"D × 72\"H",
    materials: "PCR (Post Consumer Recycled PP) - 75% recycled content",
    designerBio: "James specializes in creating statement furniture pieces that merge architectural principles with sustainable manufacturing.",
  },
  "10": {
    name: "Wave Sculpture",
    designer: "Priya Sharma",
    designerId: "priya",
    price: 89999,
    weight: 12.3,
    image: installation2,
    description: "A dramatic wave-like sculptural installation that brings movement and energy to interior spaces. 3D printed using sustainable PCR material, ideal for lobbies, living rooms, or galleries.",
    dimensions: "80\"W × 40\"D × 60\"H",
    materials: "PCR (Post Consumer Recycled PP) - 75% recycled content",
    designerBio: "Priya creates innovative furniture designs that push the boundaries of 3D printing technology.",
  },
  "11": {
    name: "Organic Wall Shelf",
    designer: "Marcus Chen",
    designerId: "marcus",
    price: 15999,
    weight: 2.1,
    image: decorShelf,
    description: "A floating wall shelf with organic curves and sculptural form. 3D printed using sustainable materials, perfect for displaying books, plants, or decorative objects.",
    dimensions: "36\"W × 10\"D × 8\"H",
    materials: "PCR (Post Consumer Recycled PP) - 75% recycled content",
    designerBio: "Marcus is a Vancouver-based designer who explores the intersection of function and sculpture through sustainable 3D printing.",
  },
  "12": {
    name: "Sculptural Bowl",
    designer: "Tejal Agawane",
    designerId: "tejal",
    price: 6999,
    weight: 0.8,
    image: decorBowl,
    description: "An elegant decorative bowl with flowing organic design. 3D printed using sustainable PCR material, perfect as a centerpiece or for holding small items.",
    dimensions: "12\"W × 12\"D × 6\"H",
    materials: "PCR (Post Consumer Recycled PP) - 75% recycled content",
    designerBio: "Tejal is a furniture creator based in Mumbai, India. Her work focuses on merging innovation with sustainability through cutting-edge 3D printing technology.",
  },
  "13": {
    name: "Geometric Planter",
    designer: "Sarah Williams",
    designerId: "sarah",
    price: 8499,
    weight: 1.2,
    image: decorPlanter,
    description: "A modern geometric planter with abstract design. 3D printed using sustainable materials, perfect for showcasing your favorite plants with contemporary style.",
    dimensions: "10\"W × 10\"D × 12\"H",
    materials: "PCR (Post Consumer Recycled PP) - 75% recycled content",
    designerBio: "Sarah is a contemporary designer creating elegant home accessories that blend art with sustainability.",
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
