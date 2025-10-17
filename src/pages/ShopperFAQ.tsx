import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
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
              Everything you need to know about shopping at Forma
            </p>
          </div>
        </section>

        <section className="container py-16 max-w-4xl">
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left font-semibold">
                What is Forma and how does it work?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Forma is a marketplace for unique, 3D-printed furniture designed by creators worldwide. Each piece is manufactured on-demand using sustainable materials and advanced 3D printing technology. You browse designs, customize them to your needs, and we produce and deliver them to you.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left font-semibold">
                How long does shipping take?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Production takes 2-3 weeks as each piece is made to order. After production, shipping typically takes 5-10 business days depending on your location. You'll receive tracking information once your order ships.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left font-semibold">
                Can I customize the products?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! Most products can be customized in terms of size, color, and finish. Click "Request Custom Design" on any product page to discuss customization options with our team. Additional fees may apply depending on modifications.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left font-semibold">
                What materials are used?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                All furniture is made from premium Fibre-Reinforced Polymer (FRP) with 75% post-consumer recycled content. The material is weather-resistant, UV-stable, durable, and can be finished to mimic various textures like marble, wood, or metal.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left font-semibold">
                Is the furniture suitable for outdoor use?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! Our FRP material is specifically designed to be weather-resistant and UV-stable, making it perfect for both indoor and outdoor use. It won't warp, crack, or fade in sunlight and rain.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left font-semibold">
                What is your return policy?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We offer a 30-day return policy for standard products. Items must be in original condition with no damage. Custom-made pieces may have different return policies due to their personalized nature. Please contact us within 30 days of delivery to initiate a return.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger className="text-left font-semibold">
                How do I care for my Forma furniture?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Maintenance is simple! Clean with mild soap and water. Avoid harsh chemicals or abrasive cleaners. The material is resistant to stains and scratches, but we recommend using coasters and placemats for added protection.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger className="text-left font-semibold">
                Do you ship internationally?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! We ship to most countries worldwide. Shipping costs and delivery times vary by location. International orders may be subject to customs duties and taxes, which are the responsibility of the buyer.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9">
              <AccordionTrigger className="text-left font-semibold">
                What if my furniture arrives damaged?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We pack each piece carefully, but if damage occurs during shipping, please contact us within 48 hours with photos. We'll arrange for a replacement or refund immediately at no cost to you.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10">
              <AccordionTrigger className="text-left font-semibold">
                Can I track my order?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! Once your piece is manufactured and shipped, you'll receive a tracking number via email. You can also check your order status by logging into your Forma account.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-11">
              <AccordionTrigger className="text-left font-semibold">
                What payment methods do you accept?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We accept all major credit cards, debit cards, UPI, net banking, and various digital wallets. All payments are processed securely through encrypted channels.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-12">
              <AccordionTrigger className="text-left font-semibold">
                How does the AR preview feature work?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Our AR (Augmented Reality) feature lets you visualize furniture in your space before buying. Using your smartphone camera, you can place virtual 3D models in your room to see how they look and fit. Available on compatible iOS and Android devices.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default ShopperFAQ;
