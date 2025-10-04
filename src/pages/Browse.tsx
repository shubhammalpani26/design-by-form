import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import chairHero from "@/assets/chair-hero.jpg";
import chairCurvy from "@/assets/chair-curvy.jpg";
import tableCurvy from "@/assets/table-curvy.jpg";
import vaseCurvy from "@/assets/vase-curvy.jpg";
import benchCurvy from "@/assets/bench-curvy.jpg";

const products = [
  {
    id: "1",
    name: "Luna Chair",
    designer: "Tejal Agawane",
    designerId: "tejal",
    price: 18750,
    weight: 3.2,
    image: chairHero,
  },
  {
    id: "2",
    name: "Flow Coffee Table",
    designer: "Marcus Chen",
    designerId: "marcus",
    price: 32500,
    weight: 5.8,
    image: tableCurvy,
  },
  {
    id: "3",
    name: "Wave Vase",
    designer: "Sarah Williams",
    designerId: "sarah",
    price: 6225,
    weight: 1.1,
    image: vaseCurvy,
  },
  {
    id: "4",
    name: "Curve Bench",
    designer: "Priya Sharma",
    designerId: "priya",
    price: 27475,
    weight: 4.9,
    image: benchCurvy,
  },
  {
    id: "5",
    name: "Organic Dining Table",
    designer: "James Park",
    designerId: "james",
    price: 47475,
    weight: 8.2,
    image: tableCurvy,
  },
  {
    id: "6",
    name: "Spiral Chair",
    designer: "Marcus Chen",
    designerId: "marcus",
    price: 19975,
    weight: 3.5,
    image: chairCurvy,
  },
  {
    id: "7",
    name: "Fluid Bench",
    designer: "Tejal Agawane",
    designerId: "tejal",
    price: 29975,
    weight: 5.2,
    image: benchCurvy,
  },
  {
    id: "8",
    name: "Sculptural Vase",
    designer: "Sarah Williams",
    designerId: "sarah",
    price: 8225,
    weight: 1.4,
    image: vaseCurvy,
  },
];

const Browse = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">Browse Products</h1>
          <p className="text-lg text-muted-foreground">
            Explore unique furniture pieces designed by creators worldwide
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Browse;
