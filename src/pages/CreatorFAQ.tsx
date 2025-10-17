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

const CreatorFAQ = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent py-16">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Creator FAQs
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about becoming a Forma creator
            </p>
          </div>
        </section>

        <section className="container py-16 max-w-4xl">
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left font-semibold">
                Who can become a Forma creator?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Anyone with creative ideas! We welcome students, architects, hobbyists, and professional designers from around the world. No formal design degree required—just creativity and passion for furniture design.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left font-semibold">
                How do I get started as a creator?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Simply visit our Design Studio and start creating with AI, or fill out the creator application form. Once approved (usually within 24-48 hours), you can start uploading designs immediately. You can also use our AI studio to generate designs from text descriptions or sketches.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left font-semibold">
                How much can I earn as a creator?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                You earn in two ways: (1) 100% of the markup you set above our base manufacturing cost, and (2) 5-20% commission on the base cost based on your sales volume. For example, if the base cost is ₹50,000 and you price it at ₹75,000, you earn ₹25,000 markup + ₹2,500-10,000 commission per sale. This gives you full control over your earnings!
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left font-semibold">
                Can I set my own prices?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! While we calculate a base manufacturing cost, you can price your designs higher. All the differential between your price and our base cost comes to you (100%), plus you earn your commission tier percentage on the base cost. This gives you full control over your earnings potential.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left font-semibold">
                Do I need to provide 3D models?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Not necessarily! You can use our AI Design Studio to generate designs from text descriptions or sketches. However, if you have 3D modeling skills, you can also upload your own .STL, .OBJ, or .FBX files directly for review.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left font-semibold">
                How long do I earn commissions?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Forever! As long as your design is being manufactured and sold on Forma, you continue earning commissions with no expiration date. This creates a true passive income stream.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger className="text-left font-semibold">
                Can I sell my designs on other platforms?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Forma requires exclusivity for furniture designs listed on our platform. However, you retain full intellectual property rights and can use design elements in other creative work like prints, renders, or portfolios.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger className="text-left font-semibold">
                When and how do I get paid?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Payments are processed monthly in the first week of each month for the previous month's sales. Minimum payout is ₹4,000 (amounts under this roll over). We support bank transfer, UPI, and international payments in USD, EUR, and GBP for global creators.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9">
              <AccordionTrigger className="text-left font-semibold">
                What marketing support do you provide?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We provide Instagrammable product photography, lifestyle shots, email templates, and social media content for free to help you promote your designs. You're also welcome to create your own unique marketing materials—the more creative, the better!
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10">
              <AccordionTrigger className="text-left font-semibold">
                What happens if my design doesn't sell?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                There's no cost to list designs, so there's no risk. If a design underperforms, you can enable smart pricing (auto-pricing), which gradually reduces your price by 10% monthly until sales pick up. This protects against overpricing while you keep trying to find the right market fit. Your price will never go below the base manufacturing cost.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-11">
              <AccordionTrigger className="text-left font-semibold">
                Are there any upfront costs or fees?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                No! It's completely free to join as a creator and list your designs. We only earn when you earn through sales commissions. There are no listing fees, subscription costs, or hidden charges.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-12">
              <AccordionTrigger className="text-left font-semibold">
                Can I track my sales and earnings?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! Your creator dashboard provides real-time sales tracking, earnings reports, customer demographics, and analytics. You'll also receive monthly detailed reports and annual tax documents.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-13">
              <AccordionTrigger className="text-left font-semibold">
                What design guidelines should I follow?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Focus on single-piece forms (tables, chairs, shelves, decorative items) that can be 3D printed. Avoid designs requiring wheels, hinges, metal inserts, or multi-material assemblies. Our AI studio will guide you on what's manufacturable.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-14">
              <AccordionTrigger className="text-left font-semibold">
                How do you prevent plagiarism between creators?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We use AI-powered image similarity detection to flag potential duplicates before publishing. Creators must confirm original ownership. We have a DMCA takedown process for reported infringement. Transparency features like visible designer profiles and sketch references help establish authenticity.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-15">
              <AccordionTrigger className="text-left font-semibold">
                Do you support creators from outside India?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely! We welcome global creators and support international payments in USD, EUR, and GBP. Commission structures and marketing support are identical for creators worldwide.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-16 text-center bg-accent rounded-2xl p-12">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Ready to Start Creating?</h2>
            <p className="text-muted-foreground mb-6">Join our community of creators and turn your designs into income</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/designer-signup">
                <Button variant="hero" size="lg">
                  Apply as Creator
                </Button>
              </Link>
              <Link to="/design-studio">
                <Button variant="outline" size="lg">
                  Try AI Studio
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

export default CreatorFAQ;
