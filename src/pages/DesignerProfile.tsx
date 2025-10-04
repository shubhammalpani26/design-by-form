import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import chairHero from "@/assets/chair-hero.jpg";
import table1 from "@/assets/table-1.jpg";

const designerData: Record<string, any> = {
  tejal: {
    name: "Tejal Agarwal",
    bio: "Based in Mumbai, India, Tejal brings 8 years of experience in contemporary furniture design. Her philosophy centers on merging traditional Indian craftsmanship with modern minimalist aesthetics. Each piece is a conversation between heritage and innovation.",
    location: "Mumbai, India",
    joined: "2024",
    totalSales: 127,
    products: [
      {
        id: "1",
        name: "Luna Chair",
        designer: "Tejal Agarwal",
        designerId: "tejal",
        price: 899,
        image: chairHero,
      },
    ],
  },
  marcus: {
    name: "Marcus Chen",
    bio: "Marcus is a furniture designer and architect based in Vancouver, Canada. His work explores the intersection of function and sculpture, creating pieces that serve as both furniture and art. He's passionate about sustainable materials and timeless design.",
    location: "Vancouver, Canada",
    joined: "2024",
    totalSales: 203,
    products: [
      {
        id: "2",
        name: "Horizon Table",
        designer: "Marcus Chen",
        designerId: "marcus",
        price: 1299,
        image: table1,
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
        <div className="bg-accent py-16">
          <div className="container">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">{designer.name}</h1>
              <p className="text-lg text-muted-foreground mb-6">{designer.location}</p>
              <div className="flex flex-wrap gap-6 text-sm mb-6">
                <div>
                  <span className="text-muted-foreground">Joined:</span>{" "}
                  <span className="font-semibold">{designer.joined}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Sales:</span>{" "}
                  <span className="font-semibold">{designer.totalSales}</span>
                </div>
              </div>
              <Button variant="default">Follow Designer</Button>
            </div>
          </div>
        </div>

        <div className="container py-12">
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">About</h2>
            <p className="text-muted-foreground leading-relaxed max-w-3xl">
              {designer.bio}
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Collection</h2>
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
