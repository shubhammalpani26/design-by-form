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

const MakerFAQ = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent py-16">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Maker FAQs
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about manufacturing with Nyzora
            </p>
          </div>
        </section>

        <section className="container py-16 max-w-4xl">
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left font-semibold">
                What is a Verified Maker on Nyzora?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                A Verified Maker is a vetted manufacturer or artisan who produces creator-designed products on the Nyzora platform. Verified Makers receive a "Verified by Nyzora" badge, featured placement in our maker directory, and a steady stream of on-demand production orders.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left font-semibold">
                Who can apply to become a Verified Maker?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We welcome workshops, fabrication studios, and individual artisans specialising in wood, metal, composite, resin, or 3D printing / additive manufacturing. A minimum of 3 years of production experience and the ability to produce consistent, high-quality pieces is required.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left font-semibold">
                How does the order flow work?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                When a customer purchases a product on Nyzora, we match the order to a Verified Maker based on material expertise and capacity. You receive the design files, specifications, and shipping details. You manufacture the piece, and our logistics team handles pickup and delivery to the customer.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left font-semibold">
                How am I paid for production orders?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                The Manufacturing Base Price (MBP) is agreed upon during your onboarding process, based on your production capabilities, material costs, and craftsmanship level. Payment is released within 7 days of the customer confirming delivery and quality. We support bank transfer and UPI for Indian makers, and international wire transfers for global workshops.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left font-semibold">
                Do I need to find my own customers?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                No! That's the biggest advantage. Nyzora handles all marketing, sales, and customer acquisition. You focus purely on manufacturing. Orders come to you — no cold calls, no pitching, no advertising spend.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left font-semibold">
                What quality standards are expected?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Every piece must match the approved design specifications within acceptable tolerances. We conduct quality inspections before shipping. Makers with consistently high quality ratings receive priority order allocation and featured placement in our directory.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger className="text-left font-semibold">
                What is the typical lead time for orders?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Lead times vary by product complexity, but typically range from 2–6 weeks. You set your own lead times during onboarding, and we communicate these to customers at checkout. Consistent on-time delivery improves your maker rating and order priority.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger className="text-left font-semibold">
                Are there any fees to join as a maker?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                No upfront fees. There are no listing charges, subscription costs, or platform fees for makers. You earn the full Manufacturing Base Price on every order you fulfil. Nyzora earns from the creator markup — your revenue is separate and guaranteed.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9">
              <AccordionTrigger className="text-left font-semibold">
                Can I manufacture for multiple product categories?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely. During onboarding, you specify your material capabilities and product expertise (chairs, tables, vases, installations, etc.). Orders are matched accordingly. The more categories you can handle, the more orders you'll receive.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10">
              <AccordionTrigger className="text-left font-semibold">
                How does shipping and logistics work?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Nyzora arranges pickup from your workshop once a piece passes quality inspection. We handle all packaging guidelines, shipping logistics, and last-mile delivery to the customer. You simply need to have the product ready at your location.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-11">
              <AccordionTrigger className="text-left font-semibold">
                Do you accept makers from outside India?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, we're building a global maker network. International makers are welcome, and we support cross-border payments. Logistics for international orders are coordinated on a case-by-case basis depending on the destination market.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-12">
              <AccordionTrigger className="text-left font-semibold">
                How is the Manufacturing Base Price (MBP) determined?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                The MBP is mutually agreed upon during your onboarding process. We work with you to understand your material costs, production complexity, and craftsmanship standards. Once finalised, our AI pricing model is trained on your specific customisations, capabilities, and pricing — so future orders are automatically priced accurately based on your workshop's profile.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-13">
              <AccordionTrigger className="text-left font-semibold">
                Does Nyzora take a commission on sales?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, Nyzora earns a commission on each sale to cover platform operations, marketing, logistics coordination, and customer acquisition. The exact commission structure is discussed and agreed upon during the onboarding and partnership agreement — ensuring full transparency before you start receiving orders.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-16 text-center bg-accent rounded-2xl p-12">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Ready to Partner with Nyzora?</h2>
            <p className="text-muted-foreground mb-6">Join our network of verified makers and grow your workshop with consistent orders</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/contact">
                <Button variant="hero" size="lg">
                  Apply as a Maker
                </Button>
              </Link>
              <Link to="/verified-makers">
                <Button variant="outline" size="lg">
                  View Verified Makers
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

export default MakerFAQ;
