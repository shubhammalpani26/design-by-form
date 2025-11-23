import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CreatorEarnings = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent py-16">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              How You Earn as a Creator
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Set your price, keep 100% of markup*, plus earn commission on every sale
            </p>
            <p className="text-xs text-muted-foreground max-w-2xl mx-auto mt-2">
              *Platform fees currently waived during our initial phase
            </p>
          </div>
        </section>

        {/* Two Income Streams */}
        <section className="container py-12">
          <div className="max-w-5xl mx-auto mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-foreground">Your Price Markup</h3>
                  <p className="text-4xl font-bold text-primary mb-4">100%*</p>
                  <p className="text-muted-foreground text-sm">
                    Set your price above our base manufacturing cost. <strong className="text-foreground">You keep 100% of the difference.*</strong> This is your primary income source and you have full control.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    *Platform fees currently waived during our initial phase
                  </p>
                </CardContent>
              </Card>

              <Card className="border-secondary/30 bg-gradient-to-br from-secondary/5 to-transparent">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-foreground">Commission Bonus</h3>
                  <p className="text-4xl font-bold text-secondary mb-4">Up to 10%</p>
                  <p className="text-muted-foreground text-sm">
                    <strong className="text-foreground">Plus</strong> earn 5-10% commission on the base manufacturing cost based on your total sales volume. This rewards your success and grows with you.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center text-foreground">Commission Tiers</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <Card className="border-border">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">5%</div>
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
                  <div className="text-4xl font-bold text-primary mb-2">8%</div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Premium</h3>
                  <p className="text-sm text-muted-foreground mb-4">₹4,15,000+ in sales</p>
                  <ul className="space-y-2 text-sm text-left">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>8% on all designs</span>
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
                  <div className="text-4xl font-bold text-secondary mb-2">10%</div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Elite</h3>
                  <p className="text-sm text-muted-foreground mb-4">₹12,45,000+ in sales</p>
                  <ul className="space-y-2 text-sm text-left">
                    <li className="flex items-start gap-2">
                      <span className="text-secondary mt-1">✓</span>
                      <span>10% on all designs</span>
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
                  Real Earnings Example
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-foreground">Scenario</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base Manufacturing Cost:</span>
                        <span className="font-medium">₹50,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Your Selling Price:</span>
                        <span className="font-medium">₹75,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sales per Month:</span>
                        <span className="font-medium">20 units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Commission Tier:</span>
                        <span className="font-medium">5% (Starter)</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-foreground">Your Earnings</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Markup per sale:</span>
                        <span className="font-medium">₹25,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Commission per sale:</span>
                        <span className="font-medium">₹2,500</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground/60">
                        <span>Platform Fee (0%):</span>
                        <span>₹0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total per sale:</span>
                        <span className="font-medium text-primary">₹27,500</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-primary/20">
                        <span className="text-muted-foreground">Per Month:</span>
                        <span className="font-medium text-primary text-lg">₹5,50,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per Year:</span>
                        <span className="font-bold text-primary text-xl">₹66,00,000</span>
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
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">Are there any platform fees?</h4>
                    <p className="text-sm text-muted-foreground">
                      Currently, we charge 0% platform fees during our launch phase. You keep 100% of your markup plus commission. This allows us to grow together and build a strong creator community.
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

export default CreatorEarnings;
