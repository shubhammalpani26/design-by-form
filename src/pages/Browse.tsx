import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import chairHero from "@/assets/chair-hero.jpg";
import chairCurvy from "@/assets/chair-curvy.jpg";
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

const products = [
  {
    id: "1",
    name: "Luna Chair",
    designer: "Tejal Agawane",
    designerId: "tejal",
    price: 24999,
    weight: 3.2,
    image: chairHero,
    category: "chairs",
  },
  {
    id: "2",
    name: "Flow Coffee Table",
    designer: "Marcus Chen",
    designerId: "marcus",
    price: 45999,
    weight: 5.8,
    image: tableFlow,
    category: "coffee-tables",
  },
  {
    id: "3",
    name: "Wave Vase",
    designer: "Sarah Williams",
    designerId: "sarah",
    price: 8999,
    weight: 1.1,
    image: vaseCurvy,
    category: "vases",
  },
  {
    id: "4",
    name: "Curve Bench",
    designer: "Priya Sharma",
    designerId: "priya",
    price: 38999,
    weight: 4.9,
    image: benchCurvy,
    category: "benches",
  },
  {
    id: "5",
    name: "Organic Dining Table",
    designer: "James Park",
    designerId: "james",
    price: 65999,
    weight: 8.2,
    image: tableDining,
    category: "dining-tables",
  },
  {
    id: "6",
    name: "Spiral Chair",
    designer: "Marcus Chen",
    designerId: "marcus",
    price: 27999,
    weight: 3.5,
    image: chairSpiral,
    category: "chairs",
  },
  {
    id: "7",
    name: "Fluid Bench",
    designer: "Tejal Agawane",
    designerId: "tejal",
    price: 42999,
    weight: 5.2,
    image: benchFluid,
    category: "benches",
  },
  {
    id: "8",
    name: "Sculptural Vase",
    designer: "Sarah Williams",
    designerId: "sarah",
    price: 11999,
    weight: 1.4,
    image: vaseSculptural,
    category: "vases",
  },
  {
    id: "9",
    name: "Abstract Flow Installation",
    designer: "James Park",
    designerId: "james",
    price: 125999,
    weight: 18.5,
    image: installation1,
    category: "installations",
  },
  {
    id: "10",
    name: "Wave Sculpture",
    designer: "Priya Sharma",
    designerId: "priya",
    price: 89999,
    weight: 12.3,
    image: installation2,
    category: "installations",
  },
  {
    id: "11",
    name: "Organic Wall Shelf",
    designer: "Marcus Chen",
    designerId: "marcus",
    price: 15999,
    weight: 2.1,
    image: decorShelf,
    category: "home-decor",
  },
  {
    id: "12",
    name: "Sculptural Bowl",
    designer: "Tejal Agawane",
    designerId: "tejal",
    price: 6999,
    weight: 0.8,
    image: decorBowl,
    category: "home-decor",
  },
  {
    id: "13",
    name: "Geometric Planter",
    designer: "Sarah Williams",
    designerId: "sarah",
    price: 8499,
    weight: 1.2,
    image: decorPlanter,
    category: "home-decor",
  },
];

const Browse = () => {
  const [searchParams] = useSearchParams();
  const [filteredProducts, setFilteredProducts] = useState(products);
  const category = searchParams.get('category');

  useEffect(() => {
    if (category) {
      setFilteredProducts(products.filter(p => p.category === category));
    } else {
      setFilteredProducts(products);
    }
  }, [category]);

  const getCategoryTitle = () => {
    if (!category) return "Browse Products";
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">{getCategoryTitle()}</h1>
          <p className="text-lg text-muted-foreground">
            {category 
              ? `Explore our collection of ${getCategoryTitle().toLowerCase()}`
              : "Explore unique furniture pieces designed by creators worldwide"
            }
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No products found in this category yet.</p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Browse;
