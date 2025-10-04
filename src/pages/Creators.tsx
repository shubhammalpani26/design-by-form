import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const creators = [
  {
    id: "tejal",
    name: "Tejal Agarwal",
    location: "Mumbai, India",
    specialty: "Contemporary Fusion",
    sales: 127,
    designs: 2,
    featured: "Luna Chair",
  },
  {
    id: "marcus",
    name: "Marcus Chen",
    location: "Vancouver, Canada",
    specialty: "Sculptural Minimalism",
    sales: 203,
    designs: 2,
    featured: "Flow Coffee Table",
  },
  {
    id: "sarah",
    name: "Sarah Williams",
    location: "London, UK",
    specialty: "Organic Forms",
    sales: 89,
    designs: 2,
    featured: "Wave Vase",
  },
  {
    id: "priya",
    name: "Priya Sharma",
    location: "Bangalore, India",
    specialty: "Sustainable Design",
    sales: 156,
    designs: 1,
    featured: "Curve Bench",
  },
];

const Creators = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent py-16">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Meet Our Creators
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Talented designers from around the world bringing unique visions to life through Forma
            </p>
          </div>
        </section>

        {/* Creators Grid */}
        <section className="container py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {creators.map((creator) => (
              <Link key={creator.id} to={`/designer/${creator.id}`}>
                <Card className="border-border hover:shadow-medium transition-all duration-300 group h-full">
                  <CardContent className="p-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold text-white mb-4 group-hover:scale-110 transition-transform">
                      {creator.name.charAt(0)}
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                      {creator.name}
                    </h3>
                    <p className="text-muted-foreground mb-4">{creator.location}</p>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Specialty:</span>
                        <span className="font-semibold text-foreground">{creator.specialty}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Sales:</span>
                        <span className="font-semibold text-primary">{creator.sales}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Designs:</span>
                        <span className="font-semibold text-foreground">{creator.designs}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Featured:</span>
                        <span className="font-semibold text-foreground truncate ml-2">{creator.featured}</span>
                      </div>
                    </div>
                    
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container py-16">
          <div className="bg-primary rounded-3xl p-12 text-center text-primary-foreground">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Become a Creator
            </h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Join our community of talented designers and start earning from your creations
            </p>
            <Link to="/designer-signup">
              <Button variant="outline" size="lg" className="bg-background text-foreground hover:bg-background/90">
                Start Creating
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Creators;
