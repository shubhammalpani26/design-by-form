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
              Set your own markup on top of our base manufacturing cost and earn 70% of it on every sale
            </p>
          </div>
        </section>

        {/* Single Income Stream */}
        <section className="container py-12">
          <div className="max-w-5xl mx-auto mb-16">
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">Your Markup Earnings</h3>
                <p className="text-4xl font-bold text-primary mb-4">70%</p>
                <p className="text-muted-foreground text-sm mb-4">
                  Set your own selling price above our Manufacturing Base Price (MBP). <strong className="text-foreground">You earn 70% of the markup</strong> (the difference between your price and MBP). This is your direct earnings from every sale.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong className="text-foreground">Full pricing control:</strong> You set your own selling price</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong className="text-foreground">Simple & transparent:</strong> 70% of markup goes to you, 30% to platform</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong className="text-foreground">Platform fees waived initially*:</strong> No additional fees on final price right now</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong className="text-foreground">Perpetual earnings:</strong> Earn forever on every sale</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center text-foreground">How It Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <Card className="border-primary/20">
                <CardContent className="p-6 text-center">
                  <div className="text-5xl font-bold text-primary mb-4">1</div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">We Calculate MBP</h3>
                  <p className="text-sm text-muted-foreground">
                    Our Manufacturing Base Price (MBP) is calculated based on production requirements
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="p-6 text-center">
                  <div className="text-5xl font-bold text-primary mb-4">2</div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">You Set Your Price</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose your selling price above MBP. The difference is your markup
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="p-6 text-center">
                  <div className="text-5xl font-bold text-primary mb-4">3</div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Earn 70% of Markup</h3>
                  <p className="text-sm text-muted-foreground">
                    Get 70% of your markup on every sale. We keep 30% to run the platform
                  </p>
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
                        <span className="text-muted-foreground">Manufacturing Base Price (MBP):</span>
                        <span className="font-medium">₹50,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Your Selling Price:</span>
                        <span className="font-medium">₹75,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Your Markup:</span>
                        <span className="font-medium">₹25,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sales per Month:</span>
                        <span className="font-medium">20 units</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-foreground">Your Earnings</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Your markup:</span>
                        <span className="font-medium">₹25,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Your share (70% of markup):</span>
                        <span className="font-medium">₹17,500</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground/60">
                        <span>Platform share (30% of markup):</span>
                        <span>₹7,500</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-primary/20">
                        <span className="text-muted-foreground">Your earnings per sale:</span>
                        <span className="font-medium text-primary text-lg">₹17,500</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per Month (20 sales):</span>
                        <span className="font-medium text-primary text-lg">₹3,50,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per Year:</span>
                        <span className="font-bold text-primary text-xl">₹42,00,000</span>
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
                    <h4 className="font-semibold mb-2 text-foreground">How long do I earn?</h4>
                    <p className="text-sm text-muted-foreground">
                      Forever. As long as your design is being manufactured and sold on Forma, you continue earning 70% of the markup with no expiration date.
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
                      There's no cost to list designs. If a design underperforms, you can work with our team to adjust pricing, refine the design, or create new designs at no additional cost. In cases where dynamic pricing brings a product down to the Manufacturing Base Price, you'll still earn 5-8% commission on base price sales.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">Are there any platform fees?</h4>
                    <p className="text-sm text-muted-foreground">
                      Platform fees are waived initially. Our revenue comes from 30% of your markup. No hidden charges, simple and transparent pricing.
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
