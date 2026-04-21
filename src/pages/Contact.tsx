import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Mail, Phone, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollReveal } from "@/hooks/useScrollReveal";

const Contact = () => {
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    const subject = searchParams.get("subject");
    const message = searchParams.get("message");
    if (subject || message) {
      setFormData((prev) => ({
        ...prev,
        ...(subject ? { subject } : {}),
        ...(message ? { message } : {}),
      }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.subject || !formData.message) {
      toast({ title: "Missing Information", description: "Please fill in all fields", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('submit-contact-form', { body: formData });
      if (error) throw error;

      toast({ title: "Message Sent!", description: "We'll get back to you within 24 hours." });
      setFormData({ firstName: "", lastName: "", email: "", subject: "", message: "" });
    } catch {
      toast({ title: "Error", description: "Failed to send message. Please try again later.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Contact — Nyzora"
        description="Get in touch with Nyzora. We'd love to hear from you."
        url="https://nyzora.ai/contact"
      />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-24 md:py-36 overflow-hidden">
          <div className="absolute inset-0 bg-[hsl(var(--primary))]" />
          <div className="container relative z-10">
            <ScrollReveal animation="fade-up">
              <div className="max-w-3xl">
                <p className="text-primary-foreground/40 text-xs font-medium uppercase tracking-[0.3em] mb-6">
                  Contact
                </p>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-[0.95] tracking-tight mb-8">
                  Get in<br />
                  <span className="font-light italic">Touch</span>
                </h1>
                <p className="text-primary-foreground/50 text-base md:text-lg max-w-lg leading-relaxed">
                  Have a question or want to collaborate? We'd love to hear from you.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Form + Info */}
        <section className="py-20 md:py-28">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 max-w-5xl mx-auto">
              {/* Form */}
              <div className="lg:col-span-3">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground/60 mb-2 block">First Name</label>
                      <Input
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                        className="border-border"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground/60 mb-2 block">Last Name</label>
                      <Input
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                        className="border-border"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground/60 mb-2 block">Email</label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="border-border"
                    />
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground/60 mb-2 block">Subject</label>
                    <Input
                      placeholder="What's this about?"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      className="border-border"
                    />
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground/60 mb-2 block">Message</label>
                    <Textarea
                      placeholder="Tell us more..."
                      className="min-h-[150px] border-border"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>

                  <Button type="submit" className="rounded-full" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send Message"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </div>

              {/* Info */}
              <div className="lg:col-span-2 space-y-8 lg:pt-8">
                <div>
                  <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.2em] mb-4">Contact Info</p>
                  <div className="space-y-5">
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground/40 mt-0.5" />
                      <a href="mailto:contact@nyzora.ai" className="text-sm text-foreground hover:text-primary transition-colors">
                        contact@nyzora.ai
                      </a>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground/40 mt-0.5" />
                      <a href="tel:+919082582002" className="text-sm text-foreground hover:text-primary transition-colors">
                        +91 90825 82002
                      </a>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground/40 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        Mumbai, Maharashtra, India
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-8">
                  <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.2em] mb-4">Support Hours</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mon – Fri</span>
                      <span className="text-foreground">9 AM – 6 PM IST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Saturday</span>
                      <span className="text-foreground">10 AM – 4 PM IST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sunday</span>
                      <span className="text-foreground">Closed</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground/50 mt-4">
                    We aim to respond within 24 hours on business days.
                  </p>
                </div>
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
