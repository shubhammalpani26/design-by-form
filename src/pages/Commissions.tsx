import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Commissions = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent py-16">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Creator Commission Structure
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transparent, fair, and designed to reward creativity
            </p>
          </div>
        </section>

        {/* Commission Rates */}
        <section className="container py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center text-foreground">Commission Tiers</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <Card className="border-border">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">10%</div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Standard</h3>
                  <p className="text-sm text-muted-foreground mb-4">For all creators</p>
                  <ul className="space-y-2 text-sm text-left">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>Base commission rate</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>Perpetual earnings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>Monthly payouts</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-primary shadow-medium scale-105">
                <CardContent className="p-6 text-center">
                  <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
                    MOST POPULAR
                  </div>
                  <div className="text-4xl font-bold text-primary mb-2">12%</div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Premium</h3>
                  <p className="text-sm text-muted-foreground mb-4">₹4,15,000+ in sales</p>
                  <ul className="space-y-2 text-sm text-left">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>12% on all designs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>Priority review</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>Featured placement</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-secondary/20">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-secondary mb-2">15%</div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Elite</h3>
                  <p className="text-sm text-muted-foreground mb-4">₹12,45,000+ in sales</p>
                  <ul className="space-y-2 text-sm text-left">
                    <li className="flex items-start gap-2">
                      <span className="text-secondary mt-1">✓</span>
                      <span>15% on all designs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary mt-1">✓</span>
                      <span>Dedicated support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary mt-1">✓</span>
                      <span>Marketing partnership</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Earnings Example */}
            <Card className="mb-16 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6 text-center text-foreground">
                  Earnings Example
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-foreground">Scenario</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Your Design Price:</span>
                        <span className="font-medium">₹74,999</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sales per Month:</span>
                        <span className="font-medium">20 units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Commission Rate:</span>
                        <span className="font-medium">10%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-foreground">Your Earnings</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per Sale:</span>
                        <span className="font-medium">₹7,500</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per Month:</span>
                        <span className="font-medium text-primary">₹1,50,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per Year:</span>
                        <span className="font-medium text-primary text-lg">₹18,00,000</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <h2 className="text-3xl font-bold mb-8 text-center text-foreground">Payment Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-foreground">Payment Schedule</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Monthly payments:</strong> First week of each month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Minimum payout:</strong> ₹4,000 (rolls over if under)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Payment methods:</strong> Bank transfer, UPI</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Currency:</strong> INR</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-foreground">Tracking & Reporting</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Real-time dashboard:</strong> Track sales and earnings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Detailed reports:</strong> Monthly sales breakdowns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Analytics:</strong> View customer demographics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong>Tax documents:</strong> Annual GST reports</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* FAQ */}
            <Card className="bg-accent border-border">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6 text-foreground">Common Questions</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">How long do I earn commissions?</h4>
                    <p className="text-sm text-muted-foreground">
                      Forever. As long as your design is being manufactured and sold on Forma, you continue earning commissions with no expiration date.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">Can I sell my designs elsewhere?</h4>
                    <p className="text-sm text-muted-foreground">
                      Forma requires exclusivity for furniture designs. However, you retain full IP rights and can use design elements in other creative work.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">What if my design doesn't sell?</h4>
                    <p className="text-sm text-muted-foreground">
                      There's no cost to list designs. If a design underperforms, you can work with our team to refine it or create new designs at no additional cost.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="container py-16">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Start Earning Today</h2>
              <p className="text-lg mb-6 opacity-90">
                Join Forma and turn your creativity into perpetual income
              </p>
              <Link to="/designer-signup">
                <Button variant="outline" size="lg" className="bg-background text-foreground hover:bg-background/90">
                  Apply as Creator
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Commissions;
