import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const Contact = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent py-16">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Get in Touch
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </section>

        {/* Contact Form & Info */}
        <section className="container py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-6 text-foreground">Send us a message</h2>
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block text-foreground">First Name</label>
                        <Input placeholder="John" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block text-foreground">Last Name</label>
                        <Input placeholder="Doe" />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">Email</label>
                      <Input type="email" placeholder="you@example.com" />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">Subject</label>
                      <Input placeholder="What's this about?" />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">Message</label>
                      <Textarea 
                        placeholder="Tell us more..."
                        className="min-h-[150px]"
                      />
                    </div>

                    <Button variant="hero" className="w-full">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-foreground">Contact Information</h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <div className="font-medium text-foreground mb-1">Email</div>
                      <a href="mailto:hello@forma.design" className="text-primary hover:underline">
                        hello@forma.design
                      </a>
                    </div>
                    <div>
                      <div className="font-medium text-foreground mb-1">Phone</div>
                      <a href="tel:+919082582002" className="text-primary hover:underline">
                        +91 90825 82002
                      </a>
                    </div>
                    <div>
                      <div className="font-medium text-foreground mb-1">Address</div>
                      <p className="text-muted-foreground">
                        Mumbai, Maharashtra<br />
                        India
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-foreground">Support</h3>
                  <div className="space-y-3 text-sm">
                    <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Help Center
                    </a>
                    <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Live Chat
                    </a>
                    <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Creator FAQs
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-foreground">Business Hours</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monday - Friday</span>
                      <span className="font-medium">9am - 6pm PST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Saturday</span>
                      <span className="font-medium">10am - 4pm PST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sunday</span>
                      <span className="font-medium">Closed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-accent py-16">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center text-foreground">
                Frequently Asked Questions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-2 text-foreground">How long does shipping take?</h4>
                    <p className="text-sm text-muted-foreground">
                      Most items ship within 2-3 weeks as they're made to order. Shipping takes an additional 5-10 business days depending on location.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-2 text-foreground">What's your return policy?</h4>
                    <p className="text-sm text-muted-foreground">
                      We offer a 30-day return policy. Items must be in original condition. Custom pieces may have different policies.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-2 text-foreground">Can I request custom modifications?</h4>
                    <p className="text-sm text-muted-foreground">
                      Yes! Contact us to discuss customizations. Additional fees may apply depending on the modifications.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-2 text-foreground">How do I become a creator?</h4>
                    <p className="text-sm text-muted-foreground">
                      Apply through our Creator Signup page. Get instant access and start designing in minutes!
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;
