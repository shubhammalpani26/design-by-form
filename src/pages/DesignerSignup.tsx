import { useState, useEffect } from "react";
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
import { designerSignupSchema } from "@/lib/validations";

const DesignerSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    portfolio: "",
    background: "",
    interests: "",
    termsAccepted: false,
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      // If user is logged in and already has a designer profile, redirect to dashboard
      if (user) {
        const { data: profile } = await supabase
          .from("designer_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();
        
        if (profile) {
          toast({
            title: "Already a Creator",
            description: "You're already registered as a creator!",
          });
          navigate("/creator-dashboard");
        }
      }
    };
    
    checkAuth();
  }, [navigate, toast]);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input with zod
      const validatedData = designerSignupSchema.parse(formData);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to submit your application.",
          variant: "destructive",
        });
        return;
      }

      let profilePictureUrl = null;

      // Upload profile picture if provided
      if (profilePicture) {
        const fileExt = profilePicture.name.split('.').pop();
        const fileName = `${user.id}/profile.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('creator-profiles')
          .upload(fileName, profilePicture, {
            upsert: true,
            contentType: profilePicture.type
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('creator-profiles')
          .getPublicUrl(fileName);
        
        profilePictureUrl = publicUrl;
      }

      const { error } = await supabase.from("designer_profiles").insert({
        user_id: user.id,
        name: validatedData.name,
        email: validatedData.email,
        phone_number: validatedData.phone,
        portfolio_url: validatedData.portfolio || null,
        design_background: validatedData.background,
        furniture_interests: validatedData.interests,
        terms_accepted: validatedData.termsAccepted,
        terms_accepted_at: new Date().toISOString(),
        profile_picture_url: profilePictureUrl,
      });

      if (error) throw error;

      toast({
        title: "Welcome to Forma!",
        description: "Your creator account is ready. Start designing now!",
      });

      navigate("/design-studio");
    } catch (error: any) {
      if (error.name === 'ZodError') {
        toast({
          title: "Validation Error",
          description: error.errors[0]?.message || "Please check your input.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to submit application. Please try again.",
          variant: "destructive",
        });
      }
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
                <h3 className="text-xl font-semibold mb-2 text-foreground">Ongoing Income</h3>
                <p className="text-muted-foreground">Set your own prices and earn perpetual income from every sale</p>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      You'll receive order notifications at this email
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block text-foreground">Phone Number</label>
                    <Input 
                      type="tel" 
                      placeholder="+1 234 567 8900"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      You'll receive order notifications via SMS
                    </p>
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
                    <label className="text-sm font-medium mb-2 block text-foreground">Profile Picture (optional)</label>
                    <Input 
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="cursor-pointer"
                    />
                    {profilePicturePreview && (
                      <div className="mt-3">
                        <img 
                          src={profilePicturePreview} 
                          alt="Profile preview" 
                          className="w-24 h-24 rounded-full object-cover border-2 border-border"
                        />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a professional photo (recommended: square image, at least 400x400px)
                    </p>
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

            {!isAuthenticated && (
              <div className="mt-8 text-center text-sm text-muted-foreground">
                Already have an account? <Link to="/auth" className="text-primary hover:underline">Sign in</Link>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default DesignerSignup;
