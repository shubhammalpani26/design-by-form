import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DesignerSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    portfolio: "",
    background: "",
    interests: "",
    termsAccepted: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to continue.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to submit your application.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("designer_profiles").insert({
        user_id: user.id,
        name: formData.name,
        email: formData.email,
        portfolio_url: formData.portfolio,
        design_background: formData.background,
        furniture_interests: formData.interests,
        terms_accepted: formData.termsAccepted,
        terms_accepted_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Welcome to Forma!",
        description: "Your creator account is ready. Start designing now!",
      });

      navigate("/design-studio");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent py-16">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Join as a Creator
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Turn your creative vision into income. No upfront costs, no inventory, no hassle.
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="container py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Perpetual Commissions</h3>
                <p className="text-muted-foreground">Earn 10-15% on every sale of your designs, forever</p>
              </CardContent>
            </Card>

            <Card className="border-secondary/20">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">AI-Powered Tools</h3>
                <p className="text-muted-foreground">Use our AI studio to transform ideas into designs quickly</p>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Zero Risk</h3>
                <p className="text-muted-foreground">No manufacturing costs, no inventory, we handle everything</p>
              </CardContent>
            </Card>
          </div>

          {/* Application Form */}
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6 text-foreground">Creator Application</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-foreground">Full Name</label>
                    <Input 
                      placeholder="Your name" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block text-foreground">Email</label>
                    <Input 
                      type="email" 
                      placeholder="designer@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block text-foreground">Portfolio URL (optional)</label>
                    <Input 
                      placeholder="https://yourportfolio.com"
                      value={formData.portfolio}
                      onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block text-foreground">Tell us about your design background</label>
                    <Textarea 
                      placeholder="Share your experience, style, and what inspires your designs..."
                      className="min-h-[120px]"
                      value={formData.background}
                      onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block text-foreground">What type of furniture do you want to design?</label>
                    <Textarea 
                      placeholder="Chairs, tables, home decor..."
                      className="min-h-[80px]"
                      value={formData.interests}
                      onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex items-start space-x-3 py-4 border-t border-b">
                    <Checkbox 
                      id="terms" 
                      checked={formData.termsAccepted}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, termsAccepted: checked as boolean })
                      }
                      required
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm leading-relaxed cursor-pointer"
                    >
                      I accept the{" "}
                      <Link to="/terms" className="text-primary hover:underline" target="_blank">
                        Terms & Conditions
                      </Link>
                      {" "}including intellectual property policies and commission structure
                    </label>
                  </div>

                  <Button variant="hero" className="w-full" type="submit" disabled={loading}>
                    {loading ? "Submitting..." : "Submit Application"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/auth" className="text-primary hover:underline">Sign in</Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default DesignerSignup;
