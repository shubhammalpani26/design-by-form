import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";

const Sustainability = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent py-16">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Sustainability at Forma
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Beautiful furniture shouldn't cost the Earth
            </p>
          </div>
        </section>

        {/* Core Principles */}
        <section className="container py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center text-foreground">
              Our Commitment
            </h2>

            <div className="space-y-12">
              {/* On-Demand Manufacturing */}
              <div className="flex gap-8 items-start">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 text-foreground">On-Demand Manufacturing</h3>
                  <p className="text-muted-foreground mb-4">
                    Traditional furniture manufacturing creates massive waste through overproduction. 
                    Forma eliminates this entirely—we only manufacture what customers order.
                  </p>
                  <Card className="bg-accent border-border">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-3xl font-bold text-primary mb-1">89%</div>
                          <div className="text-muted-foreground">Less waste vs traditional</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-primary mb-1">0</div>
                          <div className="text-muted-foreground">Unsold inventory</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Sustainable Materials */}
              <div className="flex gap-8 items-start">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 text-foreground">Responsibly Sourced Materials</h3>
                  <p className="text-muted-foreground mb-4">
                    Crafted using high-grade resin reinforced with glass fibre. This advanced composite offers sculptural freedom, lasting durability, and a refined artistic finish. Material selection and ratios may vary based on the design's intended form and structural needs.
                  </p>
                  <Card className="bg-accent border-border">
                    <CardContent className="p-4">
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">✓</span>
                          <span><strong>High-grade resin composite:</strong> Advanced material engineering</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">✓</span>
                          <span><strong>Glass fibre reinforcement:</strong> Enhanced strength and durability</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">✓</span>
                          <span><strong>Weather-resistant:</strong> Built to withstand outdoor elements</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Local Production */}
              <div className="flex gap-8 items-start">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 text-foreground">Regional Manufacturing</h3>
                  <p className="text-muted-foreground mb-4">
                    Our network of regional manufacturers means furniture is made closer to where you live, 
                    dramatically reducing shipping emissions and supporting local economies.
                  </p>
                  <Card className="bg-accent border-border">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-3xl font-bold text-primary mb-1">67%</div>
                          <div className="text-muted-foreground">Lower carbon footprint</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-primary mb-1">15</div>
                          <div className="text-muted-foreground">Regional facilities</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Longevity */}
              <div className="flex gap-8 items-start">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 text-foreground">Built to Last</h3>
                  <p className="text-muted-foreground mb-4">
                    The most sustainable furniture is furniture that lasts. Our quality standards ensure 
                    every piece is durable, repairable, and designed for decades of use.
                  </p>
                  <Card className="bg-accent border-border">
                    <CardContent className="p-4">
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">✓</span>
                          <span><strong>2-year warranty:</strong> We stand behind our quality</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">✓</span>
                          <span><strong>Repair-friendly:</strong> Modular designs, replacement parts available</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">✓</span>
                          <span><strong>Timeless design:</strong> Won't look dated in 5 years</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Impact */}
        <section className="bg-gradient-to-br from-primary/5 to-secondary/5 py-16">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center text-foreground">
                Our Environmental Impact
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold text-primary mb-2">1.2M kg</div>
                    <div className="text-sm text-muted-foreground mb-2">CO₂ emissions prevented</div>
                    <div className="text-xs text-muted-foreground">vs traditional manufacturing</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold text-primary mb-2">830K kg</div>
                    <div className="text-sm text-muted-foreground mb-2">Material waste eliminated</div>
                    <div className="text-xs text-muted-foreground">through on-demand production</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold text-primary mb-2">2.8M km</div>
                    <div className="text-sm text-muted-foreground mb-2">Shipping miles saved</div>
                    <div className="text-xs text-muted-foreground">via regional manufacturing</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Transparency */}
        <section className="bg-accent py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6 text-foreground">
                Transparency & Accountability
              </h2>
              <p className="text-muted-foreground mb-6">
                We publish annual sustainability reports detailing our environmental impact, 
                material sourcing, manufacturing practices, and progress toward our goals. 
                We believe transparency drives improvement.
              </p>
              <p className="text-sm text-muted-foreground">
                Last updated: October 2025 • Next report: January 2026
              </p>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Sustainability;
