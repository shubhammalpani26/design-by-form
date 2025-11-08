import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Upload, User, Mail, Phone, Globe, Briefcase } from "lucide-react";

export default function DesignerOnboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    portfolioUrl: "",
    designBackground: "",
    furnitureInterests: "",
    termsAccepted: false,
  });

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to become a designer",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Check if already a designer
      supabase
        .from('designer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (data && !error) {
            toast({
              title: "Already a Designer",
              description: "You're already registered as a designer",
            });
            navigate("/creator-dashboard");
          }
        });
    });
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }

      // Auto-approve designers and assign designer role
      const { data: newProfile, error } = await supabase
        .from('designer_profiles')
        .insert({
          user_id: user.id,
          name: formData.name,
          email: formData.email,
          phone_number: formData.phoneNumber,
          portfolio_url: formData.portfolioUrl || null,
          design_background: formData.designBackground,
          furniture_interests: formData.furnitureInterests,
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
          status: 'approved' // Auto-approve designers
        })
        .select()
        .single();

      if (error) throw error;

      // Assign designer role
      if (newProfile) {
        await supabase.from('user_roles').insert({
          user_id: user.id,
          role: 'designer'
        });
      }

      toast({
        title: "Welcome to the Designer Program!",
        description: "Your designer account is now active. Start creating designs!",
      });

      navigate("/design-studio");
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Welcome to the Designer Program</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Join thousands of designers earning money by creating beautiful, manufacturable furniture designs
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-2xl">💰</span>
                    </div>
                    <h3 className="font-semibold">Earn Per Sale</h3>
                    <p className="text-sm text-muted-foreground">
                      Set your own markup + earn 10% commission on production costs
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-2xl">🎨</span>
                    </div>
                    <h3 className="font-semibold">AI-Powered Tools</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate designs with AI, preview in 3D and AR
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-2xl">🌍</span>
                    </div>
                    <h3 className="font-semibold">Global Marketplace</h3>
                    <p className="text-sm text-muted-foreground">
                      Your designs reach customers worldwide
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button onClick={() => setCurrentStep(2)} className="w-full" size="lg">
              Start Application
            </Button>
          </div>
        );

      case 2:
        return (
          <form onSubmit={(e) => { e.preventDefault(); setCurrentStep(3); }} className="space-y-6">
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-2xl font-bold">Your Information</h2>
              <p className="text-muted-foreground">Tell us about yourself</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <User className="w-4 h-4" />
                  Full Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Mail className="w-4 h-4" />
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="designer@example.com"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Phone className="w-4 h-4" />
                  Phone Number with Country Code *
                </label>
                <Input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+91 98765 43210 (include country code)"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Include country code (e.g., +91 for India, +1 for US)</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Globe className="w-4 h-4" />
                  Portfolio URL (Optional)
                </label>
                <Input
                  type="url"
                  value={formData.portfolioUrl}
                  onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                  placeholder="https://yourportfolio.com"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                Back
              </Button>
              <Button type="submit" className="flex-1">
                Continue
              </Button>
            </div>
          </form>
        );

      case 3:
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-2xl font-bold">Design Experience</h2>
              <p className="text-muted-foreground">Help us understand your background</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Design Background *
                </label>
                <Textarea
                  value={formData.designBackground}
                  onChange={(e) => setFormData({ ...formData, designBackground: e.target.value })}
                  placeholder="Tell us about your design experience, education, and skills..."
                  className="min-h-[100px]"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Furniture Design Interests *
                </label>
                <Textarea
                  value={formData.furnitureInterests}
                  onChange={(e) => setFormData({ ...formData, furnitureInterests: e.target.value })}
                  placeholder="What types of furniture do you want to design? (chairs, tables, storage, etc.)"
                  className="min-h-[100px]"
                  required
                />
              </div>

              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={formData.termsAccepted}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, termsAccepted: checked as boolean })
                      }
                    />
                    <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                      I accept the <a href="/terms" className="text-primary hover:underline">Designer Terms & Conditions</a>, 
                      including the ₹1,000 listing fee per design (international designers: $15 USD) and 
                      commission structure (10% on production costs + my markup)
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.termsAccepted} className="flex-1">
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-accent/20">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <Card>
            <CardContent className="p-8">
              {/* Progress Steps */}
              <div className="flex items-center justify-center mb-8">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      step < currentStep 
                        ? "bg-primary text-primary-foreground"
                        : step === currentStep
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {step < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step}
                    </div>
                    {step < 3 && (
                      <div className={`w-16 h-1 mx-2 transition-all ${
                        step < currentStep ? "bg-primary" : "bg-muted"
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {renderStep()}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
