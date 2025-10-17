import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModelViewer3D } from "@/components/ModelViewer3D";
import { ARViewer } from "@/components/ARViewer";
import { useCart } from "@/contexts/CartContext";
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
    weight: 11.2,
    image: chairHero,
    description: "The Luna Chair combines organic curves with minimalist design philosophy. Expertly crafted using advanced 3D printing and meticulously hand-finished for perfection. Made from premium Fibre-Reinforced Polymer with 75% post-consumer recycled content. Weather-resistant and outdoor-friendly, perfect for modern living spaces that value both comfort and sustainable luxury.",
    dimensions: "32\"W × 30\"D × 34\"H",
    materials: "Premium FRP (Fibre-Reinforced Polymer) with 75% PCR",
    designerBio: "Tejal is a furniture creator based in Mumbai, India. Her work focuses on merging innovation with sustainability through cutting-edge 3D printing technology.",
  },
  "2": {
    name: "Flow Coffee Table",
    designer: "Marcus Chen",
    designerId: "marcus",
    price: 45999,
    weight: 20.3,
    image: tableFlow,
    description: "A sculptural coffee table featuring flowing organic lines and curves. Precision-crafted through 3D printing with expert hand-finishing. Made from luxury-grade Fibre-Reinforced Polymer with 75% recycled content. Built for both indoor elegance and outdoor durability, this piece serves as functional furniture and modern art.",
    dimensions: "48\"W × 28\"D × 18\"H",
    materials: "Premium FRP (Fibre-Reinforced Polymer) with 75% PCR",
    designerBio: "Marcus is a Vancouver-based designer who explores the intersection of function and sculpture through sustainable 3D printing.",
  },
  "3": {
    name: "Wave Vase",
    designer: "Sarah Williams",
    designerId: "sarah",
    price: 8999,
    weight: 3.9,
    image: vaseCurvy,
    description: "An elegant vase with undulating curves inspired by ocean waves. 3D printed with precision and artisan hand-finished. Crafted from premium Fibre-Reinforced Polymer with 75% recycled content. Weather-resistant design perfect for displaying fresh flowers indoors or outdoors.",
    dimensions: "8\"W × 8\"D × 12\"H",
    materials: "Premium FRP (Fibre-Reinforced Polymer) with 75% PCR",
    designerBio: "Sarah is a contemporary designer creating elegant home accessories that blend art with sustainability.",
  },
  "4": {
    name: "Curve Bench",
    designer: "Priya Sharma",
    designerId: "priya",
    price: 38999,
    weight: 17.2,
    image: benchCurvy,
    description: "A beautifully curved bench combining comfort with artistic form. Expertly 3D printed and hand-finished with exceptional attention to detail. Made from premium Fibre-Reinforced Polymer with 75% recycled content. Outdoor-friendly construction ideal for entryways, patios, or as statement seating.",
    dimensions: "52\"W × 18\"D × 18\"H",
    materials: "Premium FRP (Fibre-Reinforced Polymer) with 75% PCR",
    designerBio: "Priya creates innovative furniture designs that push the boundaries of 3D printing technology.",
  },
  "5": {
    name: "Organic Dining Table",
    designer: "James Park",
    designerId: "james",
    price: 65999,
    weight: 28.7,
    image: tableDining,
    description: "A large dining table featuring organic edges and sculptural base. Advanced 3D printing with meticulous hand-finishing creates perfection. Crafted from luxury-grade Fibre-Reinforced Polymer with 75% recycled content. Weather-resistant for outdoor dining, seats 6-8 people comfortably.",
    dimensions: "72\"W × 36\"D × 30\"H",
    materials: "Premium FRP (Fibre-Reinforced Polymer) with 75% PCR",
    designerBio: "James specializes in creating statement furniture pieces that merge architectural principles with sustainable manufacturing.",
  },
  "6": {
    name: "Spiral Chair",
    designer: "Marcus Chen",
    designerId: "marcus",
    price: 27999,
    weight: 12.3,
    image: chairSpiral,
    description: "A striking chair with twisted spiral form that defies convention. Precision 3D printed and expertly hand-finished. Made from premium Fibre-Reinforced Polymer with 75% recycled content. Outdoor-ready sculptural seating that combines comfort with contemporary aesthetics.",
    dimensions: "28\"W × 30\"D × 36\"H",
    materials: "Premium FRP (Fibre-Reinforced Polymer) with 75% PCR",
    designerBio: "Marcus is a Vancouver-based designer who explores the intersection of function and sculpture through sustainable 3D printing.",
  },
  "7": {
    name: "Fluid Bench",
    designer: "Tejal Agawane",
    designerId: "tejal",
    price: 42999,
    weight: 18.2,
    image: benchFluid,
    description: "A flowing bench design with wave-like curves throughout. Advanced 3D printing with artisan hand-finishing. Crafted from luxury-grade Fibre-Reinforced Polymer with 75% recycled content. Weather-resistant construction perfect for creating unique statements in any indoor or outdoor space.",
    dimensions: "56\"W × 20\"D × 18\"H",
    materials: "Premium FRP (Fibre-Reinforced Polymer) with 75% PCR",
    designerBio: "Tejal is a furniture creator based in Mumbai, India. Her work focuses on merging innovation with sustainability through cutting-edge 3D printing technology.",
  },
  "8": {
    name: "Sculptural Vase",
    designer: "Sarah Williams",
    designerId: "sarah",
    price: 11999,
    weight: 4.9,
    image: vaseSculptural,
    description: "A contemporary vase with organic twisted form. Precision 3D printed and hand-finished to perfection. Made from premium Fibre-Reinforced Polymer with 75% recycled content. Outdoor-friendly design adds elegance and artistic flair to any surface.",
    dimensions: "10\"W × 10\"D × 14\"H",
    materials: "Premium FRP (Fibre-Reinforced Polymer) with 75% PCR",
    designerBio: "Sarah is a contemporary designer creating elegant home accessories that blend art with sustainability.",
  },
  "9": {
    name: "Abstract Flow Installation",
    designer: "James Park",
    designerId: "james",
    price: 125999,
    weight: 64.8,
    image: installation1,
    description: "A large-scale sculptural installation featuring abstract flowing forms. Expertly 3D printed in sections with meticulous hand-finishing. Crafted from luxury-grade Fibre-Reinforced Polymer with 75% recycled content. Weather-resistant construction perfect for creating dramatic focal points in residential or commercial spaces, indoors or outdoors.",
    dimensions: "96\"W × 48\"D × 72\"H",
    materials: "Premium FRP (Fibre-Reinforced Polymer) with 75% PCR",
    designerBio: "James specializes in creating statement furniture pieces that merge architectural principles with sustainable manufacturing.",
  },
  "10": {
    name: "Wave Sculpture",
    designer: "Priya Sharma",
    designerId: "priya",
    price: 89999,
    weight: 43.1,
    image: installation2,
    description: "A dramatic wave-like sculptural installation bringing movement and energy to spaces. Advanced 3D printing with expert hand-finishing. Made from premium Fibre-Reinforced Polymer with 75% recycled content. Outdoor-friendly design ideal for lobbies, living rooms, patios, or galleries.",
    dimensions: "80\"W × 40\"D × 60\"H",
    materials: "Premium FRP (Fibre-Reinforced Polymer) with 75% PCR",
    designerBio: "Priya creates innovative furniture designs that push the boundaries of 3D printing technology.",
  },
  "11": {
    name: "Organic Wall Shelf",
    designer: "Marcus Chen",
    designerId: "marcus",
    price: 15999,
    weight: 7.4,
    image: decorShelf,
    description: "A floating wall shelf with organic curves and sculptural form. Precision 3D printed and hand-finished with care. Crafted from premium Fibre-Reinforced Polymer with 75% recycled content. Weather-resistant, perfect for displaying books, plants, or decorative objects indoors or on covered patios.",
    dimensions: "36\"W × 10\"D × 8\"H",
    materials: "Premium FRP (Fibre-Reinforced Polymer) with 75% PCR",
    designerBio: "Marcus is a Vancouver-based designer who explores the intersection of function and sculpture through sustainable 3D printing.",
  },
  "12": {
    name: "Sculptural Bowl",
    designer: "Tejal Agawane",
    designerId: "tejal",
    price: 6999,
    weight: 2.8,
    image: decorBowl,
    description: "An elegant decorative bowl with flowing organic design. 3D printed and artisan hand-finished. Made from luxury-grade Fibre-Reinforced Polymer with 75% recycled content. Outdoor-friendly construction perfect as a centerpiece or for holding small items.",
    dimensions: "12\"W × 12\"D × 6\"H",
    materials: "Premium FRP (Fibre-Reinforced Polymer) with 75% PCR",
    designerBio: "Tejal is a furniture creator based in Mumbai, India. Her work focuses on merging innovation with sustainability through cutting-edge 3D printing technology.",
  },
  "13": {
    name: "Geometric Planter",
    designer: "Sarah Williams",
    designerId: "sarah",
    price: 8499,
    weight: 4.2,
    image: decorPlanter,
    description: "A modern geometric planter with abstract design. Precision 3D printed and hand-finished. Crafted from premium Fibre-Reinforced Polymer with 75% recycled content. Weather-resistant design perfect for showcasing plants with contemporary style, indoors or outdoors.",
    dimensions: "10\"W × 10\"D × 12\"H",
    materials: "Premium FRP (Fibre-Reinforced Polymer) with 75% PCR",
    designerBio: "Sarah is a contemporary designer creating elegant home accessories that blend art with sustainability.",
  },
};

const ProductDetail = () => {
  const { id } = useParams();
  const product = productData[id || "1"] || productData["1"];
  const [viewMode, setViewMode] = useState<"image" | "ar">("image");
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    // In a real implementation, this would use the actual product ID from database
    addToCart(id || "1");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="image">Image</TabsTrigger>
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

            <Card className="bg-accent border-border mb-6">
              <CardContent className="p-6">
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
                <Button variant="outline" className="w-full mt-4">
                  Request Custom Design
                </Button>
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
                <span className="text-muted-foreground">3D printed on-demand with expert hand-finishing, 2-3 weeks</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[120px]">Outdoor Use:</span>
                <span className="text-muted-foreground">Weather-resistant and UV-stable</span>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="hero" size="lg" className="flex-1" onClick={handleAddToCart}>
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
