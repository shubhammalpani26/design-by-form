import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ShopperFAQ = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent py-16">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Shopper FAQs
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about shopping on Forma
            </p>
          </div>
        </section>

        <section className="container py-16 max-w-4xl">
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left font-semibold">
                What makes Forma furniture unique?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Every piece on Forma is designed by independent creators and manufactured using advanced 3D printing technology with 75% recycled materials. Each piece is unique, sustainable, and directly supports creative talent worldwide.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left font-semibold">
                How is Forma furniture manufactured?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We use industrial-grade 3D printing with premium Fibre-Reinforced Polymer (FRP) containing 75% post-consumer recycled content. Each piece is precision-printed and hand-finished by artisans for a perfect finish.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left font-semibold">
                Is Forma furniture durable and weather-resistant?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! All our pieces are made from high-strength FRP that's UV-stable and weather-resistant. They're designed for both indoor and outdoor use, withstanding rain, sun, and temperature variations while maintaining their beauty.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left font-semibold">
                What is the typical lead time for orders?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Standard pieces are manufactured on-demand with a typical lead time of 21 days. Custom-sized or specially finished pieces may take 28-35 days. We'll provide an accurate timeline when you place your order.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left font-semibold">
                Can I customize the colors, finishes, or sizes?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely! Each product page offers basic customization options like finish and size. For deeper customizations (specific colors, dimensions, or modifications), use the "Request More Customizations" button to work directly with our design team.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left font-semibold">
                How do I use the AR preview feature?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                On product pages, tap the "AR Preview" tab to see the furniture in your own space using your phone or tablet camera. This helps visualize size, placement, and style before purchasing. (Note: AR feature works best on iOS 12+ and Android 8+)
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger className="text-left font-semibold">
                What are your shipping and delivery options?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Shipping costs are calculated separately and added to your order based on size, weight, and destination. We offer worldwide shipping to all countries. Smaller items ship via courier, while larger furniture pieces are white-glove delivered with setup assistance.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger className="text-left font-semibold">
                What is your return and refund policy?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Since each piece is made-to-order, we don't accept returns on standard orders unless there's a manufacturing defect or shipping damage. We offer a 14-day quality guarantee. Customized pieces are final sale but we ensure you're happy before manufacturing begins.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9">
              <AccordionTrigger className="text-left font-semibold">
                How do I care for my Forma furniture?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                FRP furniture is very low-maintenance. Simply wipe with a damp cloth and mild soap for cleaning. Avoid abrasive cleaners or harsh chemicals. While weather-resistant, storing outdoor pieces indoors during extreme weather extends their lifespan. Detailed care instructions come with each piece.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10">
              <AccordionTrigger className="text-left font-semibold">
                Are the materials eco-friendly?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! Our FRP contains 75% post-consumer recycled content. 3D printing generates minimal waste compared to traditional manufacturing. Each piece's lightweight design also reduces shipping emissions. Plus, the durability means less frequent replacement.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-11">
              <AccordionTrigger className="text-left font-semibold">
                Can businesses or designers order in bulk?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! We work with interior designers, architects, hotels, and commercial spaces. Contact our team for bulk pricing, custom specifications, and project consultation. We can also white-label designs for exclusive collections.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-12">
              <AccordionTrigger className="text-left font-semibold">
                Who designed the furniture I'm buying?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Each product page displays the creator's name and profile. Click through to learn about their design philosophy, see their other work, and read their story. By purchasing from Forma, you directly support independent designers earning from every sale.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-13">
              <AccordionTrigger className="text-left font-semibold">
                What payment methods do you accept?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We accept all major credit/debit cards, UPI, net banking, and digital wallets. For large orders, we also offer bank transfer and EMI options. All transactions are secured with industry-standard encryption.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-14">
              <AccordionTrigger className="text-left font-semibold">
                Do you have a showroom or physical store?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We're primarily online, but we're working on opening experience centers in major cities. You can use our AR feature to visualize pieces in your space, and we're happy to schedule video calls to discuss specific pieces with our design consultants.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-15">
              <AccordionTrigger className="text-left font-semibold">
                How can I stay updated on new designs?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Follow us on social media (@forma.design), subscribe to our newsletter, or check the "Browse" page regularly. We add new creator designs weekly and send curated design drops to subscribers first.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-16 text-center bg-accent rounded-2xl p-12">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Ready to Shop?</h2>
            <p className="text-muted-foreground mb-6">Discover unique, sustainable furniture designed by creators worldwide</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/browse">
                <Button variant="hero" size="lg">
                  Browse Collection
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default ShopperFAQ;