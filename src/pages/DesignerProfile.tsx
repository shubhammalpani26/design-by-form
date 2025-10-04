import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import chairHero from "@/assets/chair-hero.jpg";
import chairCurvy from "@/assets/chair-curvy.jpg";
import tableCurvy from "@/assets/table-curvy.jpg";
import vaseCurvy from "@/assets/vase-curvy.jpg";
import benchCurvy from "@/assets/bench-curvy.jpg";

const designerData: Record<string, any> = {
  tejal: {
    name: "Tejal Agawane",
    bio: "Based in Mumbai, India, Tejal brings 8 years of experience in contemporary furniture design. Her philosophy centers on merging traditional Indian craftsmanship with modern minimalist aesthetics. Each piece is a conversation between heritage and innovation.",
    story: "Tejal's journey began in her grandmother's workshop in Mumbai, where she learned the art of traditional Indian woodworking. After studying industrial design in Milan, she returned home with a mission: to bring centuries-old craftsmanship into contemporary homes worldwide. Her Luna Chair became an instant bestseller, earning her recognition as one of India's most promising furniture creators.",
    location: "Mumbai, India",
    joined: "March 2024",
    totalSales: 127,
    totalRevenue: 114273,
    topProduct: "Luna Chair",
    socialMedia: {
      instagram: "@tejal.designs",
      portfolio: "tejalagarwal.design"
    },
    products: [
      {
        id: "1",
        name: "Luna Chair",
        designer: "Tejal Agawane",
        designerId: "tejal",
        price: 24999,
        weight: 3.2,
        image: chairHero,
      },
      {
        id: "7",
        name: "Fluid Bench",
        designer: "Tejal Agawane",
        designerId: "tejal",
        price: 42999,
        weight: 5.2,
        image: benchCurvy,
      },
    ],
  },
  marcus: {
    name: "Marcus Chen",
    bio: "Marcus is a furniture designer and architect based in Vancouver, Canada. His work explores the intersection of function and sculpture, creating pieces that serve as both furniture and art. He's passionate about sustainable materials and timeless design.",
    story: "A former architect turned furniture creator, Marcus discovered his passion for sustainable design during a sabbatical in Scandinavia. His signature curved tables are now found in boutique hotels and modern homes across North America. Each piece tells a story of form meeting function, crafted with locally-sourced materials and minimal environmental impact.",
    location: "Vancouver, Canada",
    joined: "February 2024",
    totalSales: 203,
    totalRevenue: 263597,
    topProduct: "Flow Coffee Table",
    socialMedia: {
      instagram: "@marcuschen.studio",
      portfolio: "marcuschen.co"
    },
    products: [
      {
        id: "2",
        name: "Flow Coffee Table",
        designer: "Marcus Chen",
        designerId: "marcus",
        price: 45999,
        weight: 5.8,
        image: tableCurvy,
      },
      {
        id: "6",
        name: "Spiral Chair",
        designer: "Marcus Chen",
        designerId: "marcus",
        price: 27999,
        weight: 3.5,
        image: chairCurvy,
      },
    ],
  },
  sarah: {
    name: "Sarah Williams",
    bio: "An emerging creator specializing in sculptural home accessories and organic forms.",
    story: "Sarah's transition from ceramic artist to furniture creator happened organically. Her Wave Vase collection caught the attention of interior designers worldwide, leading her to expand into larger sculptural pieces. She now splits her time between her London studio and collaborating with artisans in Portugal.",
    location: "London, UK",
    joined: "April 2024",
    totalSales: 89,
    totalRevenue: 51421,
    topProduct: "Wave Vase",
    socialMedia: {
      instagram: "@sarah.creates",
      portfolio: "sarahwilliams.art"
    },
    products: [
      {
        id: "3",
        name: "Wave Vase",
        designer: "Sarah Williams",
        designerId: "sarah",
        price: 8999,
        weight: 1.1,
        image: vaseCurvy,
      },
      {
        id: "8",
        name: "Sculptural Vase",
        designer: "Sarah Williams",
        designerId: "sarah",
        price: 11999,
        weight: 1.4,
        image: vaseCurvy,
      },
    ],
  },
  priya: {
    name: "Priya Sharma",
    bio: "Sustainable design advocate creating bold, functional pieces for modern living.",
    story: "After a decade in tech, Priya pivoted to furniture design with a focus on sustainability. Her Curve Bench series uses recycled materials and biomimicry principles, proving that eco-conscious design can be both beautiful and accessible.",
    location: "Bangalore, India",
    joined: "January 2024",
    totalSales: 156,
    totalRevenue: 171444,
    topProduct: "Curve Bench",
    socialMedia: {
      instagram: "@priya.sustainable",
      portfolio: "priyasharma.eco"
    },
    products: [
      {
        id: "4",
        name: "Curve Bench",
        designer: "Priya Sharma",
        designerId: "priya",
        price: 38999,
        weight: 4.9,
        image: benchCurvy,
      },
    ],
  },
};

const DesignerProfile = () => {
  const { id } = useParams();
  const designer = designerData[id || "tejal"] || designerData.tejal;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Banner */}
        <div className="relative bg-gradient-to-br from-primary/10 via-secondary/5 to-accent py-20">
          <div className="container">
            <div className="max-w-4xl">
              <div className="flex items-start gap-6 mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-bold text-white flex-shrink-0">
                  {designer.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl md:text-5xl font-bold mb-3 text-foreground">{designer.name}</h1>
                  <p className="text-lg text-muted-foreground mb-4">{designer.location}</p>
                  <div className="flex items-center gap-4 text-sm mb-4">
                    {designer.socialMedia && (
                      <>
                        <a href="#" className="text-primary hover:underline">{designer.socialMedia.instagram}</a>
                        <span className="text-border">•</span>
                        <a href="#" className="text-primary hover:underline">{designer.socialMedia.portfolio}</a>
                      </>
                    )}
                  </div>
                  <Button variant="default" size="lg">Follow Creator</Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="border-b border-border">
          <div className="container py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="border-border">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-primary mb-1">{designer.totalSales}</p>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-secondary mb-1">${(designer.totalRevenue / 1000).toFixed(1)}K</p>
                  <p className="text-sm text-muted-foreground">Revenue Generated</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-foreground mb-1">{designer.products.length}</p>
                  <p className="text-sm text-muted-foreground">Designs Listed</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-6 text-center">
                  <p className="text-sm font-semibold text-foreground mb-1 truncate">{designer.topProduct}</p>
                  <p className="text-sm text-muted-foreground">Top Seller</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="container py-16">
          {/* Creator Story */}
          <div className="mb-16 max-w-4xl">
            <h2 className="text-3xl font-bold mb-6 text-foreground">The Creator's Story</h2>
            <div className="bg-accent rounded-2xl p-8 border border-border">
              <p className="text-muted-foreground leading-relaxed mb-6">
                {designer.bio}
              </p>
              <p className="text-foreground leading-relaxed">
                {designer.story}
              </p>
            </div>
          </div>

          {/* Design Philosophy */}
          <div className="mb-16 max-w-4xl">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Design Philosophy</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2 text-foreground">Craftsmanship</h3>
                  <p className="text-sm text-muted-foreground">Honoring traditional techniques with modern innovation</p>
                </CardContent>
              </Card>
              <Card className="border-secondary/20 bg-secondary/5">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2 text-foreground">Sustainability</h3>
                  <p className="text-sm text-muted-foreground">Eco-conscious materials and on-demand production</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2 text-foreground">Innovation</h3>
                  <p className="text-sm text-muted-foreground">Pushing boundaries with AI-assisted design</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Collection */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-foreground">Design Collection</h2>
              <p className="text-muted-foreground">{designer.products.length} pieces</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {designer.products.map((product: any) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DesignerProfile;
