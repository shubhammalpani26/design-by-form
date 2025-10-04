import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import chairHero from "@/assets/chair-hero.jpg";
import table1 from "@/assets/table-1.jpg";
import shelf1 from "@/assets/shelf-1.jpg";
import armchair1 from "@/assets/armchair-1.jpg";
import desk1 from "@/assets/desk-1.jpg";

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
    name: "Horizon Table",
    designer: "Marcus Chen",
    designerId: "marcus",
    price: 1299,
    image: table1,
  },
  {
    id: "3",
    name: "Cascade Shelf",
    designer: "Sarah Williams",
    designerId: "sarah",
    price: 749,
    image: shelf1,
  },
  {
    id: "4",
    name: "Solace Armchair",
    designer: "Priya Sharma",
    designerId: "priya",
    price: 1099,
    image: armchair1,
  },
  {
    id: "5",
    name: "Focus Desk",
    designer: "James Park",
    designerId: "james",
    price: 1499,
    image: desk1,
  },
  {
    id: "6",
    name: "Vista Coffee Table",
    designer: "Marcus Chen",
    designerId: "marcus",
    price: 899,
    image: table1,
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
