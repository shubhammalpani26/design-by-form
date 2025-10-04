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
    designer: "Tejal Agarwal",
    designerId: "tejal",
    price: 899,
    image: chairHero,
  },
  {
    id: "2",
    name: "Flow Coffee Table",
    designer: "Marcus Chen",
    designerId: "marcus",
    price: 1299,
    image: tableCurvy,
  },
  {
    id: "3",
    name: "Wave Vase",
    designer: "Sarah Williams",
    designerId: "sarah",
    price: 249,
    image: vaseCurvy,
  },
  {
    id: "4",
    name: "Curve Bench",
    designer: "Priya Sharma",
    designerId: "priya",
    price: 1099,
    image: benchCurvy,
  },
  {
    id: "5",
    name: "Organic Dining Table",
    designer: "James Park",
    designerId: "james",
    price: 1899,
    image: tableCurvy,
  },
  {
    id: "6",
    name: "Spiral Chair",
    designer: "Marcus Chen",
    designerId: "marcus",
    price: 799,
    image: chairCurvy,
  },
  {
    id: "7",
    name: "Fluid Bench",
    designer: "Tejal Agarwal",
    designerId: "tejal",
    price: 1199,
    image: benchCurvy,
  },
  {
    id: "8",
    name: "Sculptural Vase",
    designer: "Sarah Williams",
    designerId: "sarah",
    price: 329,
    image: vaseCurvy,
  },
];

const Browse = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">Browse Collection</h1>
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
