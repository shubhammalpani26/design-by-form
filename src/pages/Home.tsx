import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import chairHero from "@/assets/chair-hero.jpg";
import table1 from "@/assets/table-1.jpg";
import shelf1 from "@/assets/shelf-1.jpg";
import armchair1 from "@/assets/armchair-1.jpg";

const featuredProducts = [
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
];

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-accent to-background py-20 md:py-32">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight text-foreground">
                  Unique, sustainable furniture{" "}
                  <span className="text-primary">designed by creators</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl">
                  Every piece tells a story. Discover handcrafted furniture from talented designers worldwide, manufactured on-demand with care for our planet.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to="/browse">
                    <Button variant="hero" size="lg">
                      Explore Collection
                    </Button>
                  </Link>
                  <Link to="/designer-signup">
                    <Button variant="outline" size="lg">
                      Join as Designer
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="relative">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-medium">
                  <img
                    src={chairHero}
                    alt="Featured furniture"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="container py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Featured Designs</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover pieces crafted by our community of talented designers
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/browse">
              <Button variant="outline" size="lg">
                View All Products
              </Button>
            </Link>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-accent py-20">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">How Forma Works</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
                  1
                </div>
                <h3 className="text-xl font-semibold text-foreground">Designers Create</h3>
                <p className="text-muted-foreground">
                  Talented creators upload their unique furniture designs to our platform
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
                  2
                </div>
                <h3 className="text-xl font-semibold text-foreground">We Manufacture</h3>
                <p className="text-muted-foreground">
                  Each piece is crafted on-demand through our verified sustainable network
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
                  3
                </div>
                <h3 className="text-xl font-semibold text-foreground">Everyone Wins</h3>
                <p className="text-muted-foreground">
                  Designers earn perpetual commissions while you get unique, sustainable furniture
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container py-20">
          <div className="bg-primary rounded-3xl p-12 text-center text-primary-foreground shadow-medium">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Space?
            </h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of customers who've discovered the perfect blend of style, sustainability, and story
            </p>
            <Link to="/browse">
              <Button variant="outline" size="lg" className="bg-background text-foreground hover:bg-background/90">
                Start Shopping
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
