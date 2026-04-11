import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent py-16">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Where Digital Ideas Become Physical Objects
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A new era of creation—where the tools of design and the engines of manufacturing finally speak the same language
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="container py-16">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Nyzora was built to bridge the gap between a digital idea and a physical object. 
              We democratize furniture design by combining AI-powered tools with sustainable, on-demand 
              manufacturing—enabling creators worldwide to bring their visions to life without capital, 
              expertise, or factory connections. Every design is carefully curated for quality, 
              craftsmanship, and uniqueness.
            </p>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Sustainability First</h3>
                <p className="text-muted-foreground">
                  On-demand manufacturing eliminates waste. Every piece is made only when ordered, 
                  using responsibly sourced materials from verified partners.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Creator-Centric</h3>
                <p className="text-muted-foreground">
                  Creators deserve ongoing recognition. Our transparent earnings model ensures 
                  creators earn 70% of their markup from every sale, forever.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">AI-Augmented</h3>
                <p className="text-muted-foreground">
                  Technology should empower, not replace. Our AI tools enhance human creativity, 
                  making design accessible while preserving artistic vision.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Story */}
        <section className="bg-accent py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-foreground">The Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Our name reflects a new era of creation. "Nyzora" is the idea that design 
                  and manufacturing should finally speak the same language—that a sketch on a 
                  screen deserves a clear, affordable path to becoming a real object in someone's home.
                </p>
                <p>
                  The gap was clear: talented creators had beautiful concepts that never made it 
                  to production. Manufacturing minimums, upfront capital, complex logistics—the 
                  barriers were too high. Meanwhile, consumers chose between mass-produced 
                  furniture that lacked character or custom pieces they couldn't afford.
                </p>
                <p>
                  We built Nyzora to close that gap. AI-powered design tools meet on-demand 
                  manufacturing, so anyone can design furniture and earn from it—while customers 
                  get unique, sustainably-made pieces at accessible prices.
                </p>
                <p className="font-semibold text-foreground">
                  Today, we're curating a community of creators and helping them earn perpetual 
                  income—bringing fresh creativity to an industry ready for change.
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* Team & Parent Company */}
        <section className="bg-gradient-to-br from-primary/5 to-secondary/5 py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6 text-foreground">Built by Creators, for Creators</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Our team combines expertise in furniture design, sustainable manufacturing, 
                AI technology, and marketplace economics. We're creators, engineers, and 
                furniture enthusiasts building the platform we wish existed.
              </p>
              
              {/* Website */}
              <div className="mt-8 pt-8 border-t border-border/50">
                <div className="flex justify-center items-center gap-6 text-sm">
                  <a 
                    href="https://nyzora.ai" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    nyzora.ai
                  </a>
                </div>
              </div>
              
              <div className="mt-8">
                <Link to="/contact">
                  <Button variant="outline" size="lg">
                    Get in Touch
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container py-16">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Join the Movement</h2>
              <p className="text-lg mb-6 opacity-90">
                Whether you're a creator or a shopper, be part of furniture's sustainable future
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link to="/design-studio">
                  <Button variant="outline" size="lg" className="bg-background text-foreground hover:bg-background/90">
                    Start Designing
                  </Button>
                </Link>
                <Link to="/browse">
                  <Button variant="outline" size="lg" className="bg-background text-foreground hover:bg-background/90">
                    Browse Designs
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
