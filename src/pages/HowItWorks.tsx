import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const HowItWorks = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent py-16">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              How Forma Works
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From idea to earnings in 5 simple steps
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="container py-16">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Step 1 */}
            <div className="flex gap-8 items-start">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-medium">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-3 text-foreground">Create Your Design</h3>
                <p className="text-muted-foreground mb-4">
                  Use our AI Design Studio to transform your ideas into manufacturable designs. Simply describe your vision, upload a sketch, or both. No CAD experience required.
                </p>
                <Card className="bg-accent border-border">
                  <CardContent className="p-4">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Text descriptions: "A mid-century modern chair with curved oak legs"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Upload sketches or reference images</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>View designs in 2D, 3D, and AR before finalizing</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-8 items-start">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-medium">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-3 text-foreground">AI Transforms & Optimizes</h3>
                <p className="text-muted-foreground mb-4">
                  Our AI generates multiple design variations optimized for manufacturing. It ensures structural integrity, material efficiency, and production feasibility.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-secondary/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-secondary mb-1">~30s</div>
                      <div className="text-sm text-muted-foreground">Generation Time</div>
                    </CardContent>
                  </Card>
                  <Card className="border-secondary/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-secondary mb-1">3-5</div>
                      <div className="text-sm text-muted-foreground">Design Variations</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-8 items-start">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-medium">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-3 text-foreground">Review & Validate</h3>
                <p className="text-muted-foreground mb-4">
                  Our team reviews your design for manufacturability and sustainability standards. We work with you to refine any technical aspects while preserving your creative vision.
                </p>
                <Card className="bg-accent border-border">
                  <CardContent className="p-4">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Review Time:</span>
                        <span className="font-medium">1-3 business days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Approval Rate:</span>
                        <span className="font-medium text-primary">94%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-8 items-start">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-medium">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-3 text-foreground">List on Marketplace</h3>
                <p className="text-muted-foreground mb-4">
                  Your design renders go live on the Forma marketplace. We handle product photography, product pages, and customer service. You focus on what you do best - creating and sharing your designs.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <Card className="border-primary/20">
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl font-bold text-primary mb-1">0</div>
                      <div className="text-xs text-muted-foreground">Listing Fee</div>
                    </CardContent>
                  </Card>
                  <Card className="border-primary/20">
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl font-bold text-primary mb-1">0</div>
                      <div className="text-xs text-muted-foreground">Inventory Cost</div>
                    </CardContent>
                  </Card>
                  <Card className="border-primary/20">
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl font-bold text-primary mb-1">∞</div>
                      <div className="text-xs text-muted-foreground">Earning Period</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-8 items-start">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-medium">
                5
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-3 text-foreground">Earn Perpetual Income</h3>
                <p className="text-muted-foreground mb-4">
                  Set your own price above our Manufacturing Base Price. You earn 70% of the markup on every sale. Payments are automatic, monthly, and continue forever as long as your design is being manufactured.
                </p>
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Your Share:</span>
                        <span className="font-medium">70% of markup</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Schedule:</span>
                        <span className="font-medium">Monthly, automatic</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium text-primary">Forever ∞</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container py-16">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Creating?</h2>
              <p className="text-lg mb-6 opacity-90">
                Join hundreds of designers already earning on Forma
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/design-studio">
                  <Button variant="outline" size="lg" className="bg-background text-foreground hover:bg-background/90">
                    Start Designing
                  </Button>
                </Link>
                <Link to="/designer-signup">
                  <Button variant="outline" size="lg" className="bg-background text-foreground hover:bg-background/90">
                    Join as Designer
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

export default HowItWorks;
