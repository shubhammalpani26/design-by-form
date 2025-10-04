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
              Reimagining Furniture Design
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Empowering creators to design the future of sustainable, unique furniture
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="container py-16">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We believe everyone has the potential to create beautiful, functional furniture. 
              Forma democratizes furniture design by combining AI technology with sustainable manufacturing, 
              enabling creators worldwide to bring their visions to life without the traditional barriers 
              of capital, expertise, or manufacturing connections.
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
                  Designers deserve ongoing recognition. Our perpetual commission model ensures 
                  creators earn from every sale, forever.
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
                  Forma was born from a simple frustration: talented designers were creating 
                  beautiful furniture concepts that never made it to production. The barriers 
                  were too high—manufacturing minimums, upfront capital, complex logistics.
                </p>
                <p>
                  Meanwhile, consumers were stuck choosing between mass-produced furniture that 
                  lacked character or expensive custom pieces they couldn't afford. The market 
                  needed a middle ground.
                </p>
                <p>
                  We built Forma to solve both problems. By combining AI-powered design tools 
                  with on-demand manufacturing, we created a platform where anyone can design 
                  furniture and earn from it, while customers get unique, sustainably-made pieces 
                  at accessible prices.
                </p>
                <p className="font-semibold text-foreground">
                  Today, hundreds of designers from 30+ countries have listed designs on Forma, 
                  earning commissions while bringing fresh creativity to the furniture industry.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="container py-16">
          <h2 className="text-3xl font-bold mb-12 text-center text-foreground">Impact by Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Active Designers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">2.3K</div>
              <div className="text-sm text-muted-foreground">Unique Designs</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">89%</div>
              <div className="text-sm text-muted-foreground">Waste Reduction</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">30+</div>
              <div className="text-sm text-muted-foreground">Countries</div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="bg-gradient-to-br from-primary/5 to-secondary/5 py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6 text-foreground">Built by Creators, for Creators</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our team combines expertise in furniture design, sustainable manufacturing, 
                AI technology, and marketplace economics. We're designers, engineers, and 
                furniture enthusiasts building the platform we wish existed.
              </p>
              <Link to="/contact">
                <Button variant="outline" size="lg">
                  Get in Touch
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container py-16">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Join the Movement</h2>
              <p className="text-lg mb-6 opacity-90">
                Whether you're a designer or a shopper, be part of furniture's sustainable future
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
