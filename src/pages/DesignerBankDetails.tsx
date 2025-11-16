import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DesignerBankDetails = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [designerId, setDesignerId] = useState<string | null>(null);
  const [bankCountry, setBankCountry] = useState<"India" | "International">("India");
  const [formData, setFormData] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    swiftCode: "",
    iban: "",
  });

  useEffect(() => {
    loadBankDetails();
  }, []);

  const loadBankDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get designer profile first
      const { data: profile } = await supabase
        .from("designer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;
      setDesignerId(profile.id);

      // Get bank details from separate table
      const { data: bankDetails } = await supabase
        .from("designer_bank_details")
        .select("bank_account_holder_name, bank_account_number, bank_ifsc_code, bank_swift_code, bank_iban, bank_country")
        .eq("designer_id", profile.id)
        .single();

      if (bankDetails) {
        setFormData({
          accountHolderName: bankDetails.bank_account_holder_name || "",
          accountNumber: bankDetails.bank_account_number || "",
          ifscCode: bankDetails.bank_ifsc_code || "",
          swiftCode: bankDetails.bank_swift_code || "",
          iban: bankDetails.bank_iban || "",
        });
        if (bankDetails.bank_country) {
          setBankCountry(bankDetails.bank_country as "India" | "International");
        }
      }
    } catch (error) {
      console.error("Error loading bank details:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !designerId) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to update your bank details.",
          variant: "destructive",
        });
        return;
      }

      const updateData: any = {
        designer_id: designerId,
        bank_account_holder_name: formData.accountHolderName,
        bank_account_number: formData.accountNumber,
        bank_country: bankCountry,
      };

      if (bankCountry === "India") {
        updateData.bank_ifsc_code = formData.ifscCode;
        updateData.bank_swift_code = null;
        updateData.bank_iban = null;
      } else {
        updateData.bank_swift_code = formData.swiftCode;
        updateData.bank_iban = formData.iban;
        updateData.bank_ifsc_code = null;
      }

      const { error } = await supabase
        .from("designer_bank_details")
        .upsert(updateData, { onConflict: 'designer_id' });

      if (error) throw error;

      toast({
        title: "Bank Details Updated",
        description: "Your payment information has been saved successfully.",
      });

      navigate("/creator-dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update bank details. Please try again.",
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
        <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent py-16">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Bank Details
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Add your bank details to receive payments for your designs
            </p>
          </div>
        </section>

        <section className="container py-16">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Tabs value={bankCountry} onValueChange={(v) => setBankCountry(v as "India" | "International")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="India">India</TabsTrigger>
                      <TabsTrigger value="International">International</TabsTrigger>
                    </TabsList>

                    <TabsContent value="India" className="space-y-6 mt-6">
                      <div>
                        <label className="text-sm font-medium mb-2 block text-foreground">Account Holder Name *</label>
                        <Input 
                          placeholder="Full name as per bank account" 
                          value={formData.accountHolderName}
                          onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block text-foreground">Account Number *</label>
                        <Input 
                          placeholder="Your bank account number"
                          value={formData.accountNumber}
                          onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block text-foreground">IFSC Code *</label>
                        <Input 
                          placeholder="e.g., SBIN0001234"
                          value={formData.ifscCode}
                          onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Indian Financial System Code for domestic transfers
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="International" className="space-y-6 mt-6">
                      <div>
                        <label className="text-sm font-medium mb-2 block text-foreground">Account Holder Name *</label>
                        <Input 
                          placeholder="Full name as per bank account" 
                          value={formData.accountHolderName}
                          onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block text-foreground">IBAN *</label>
                        <Input 
                          placeholder="e.g., GB29NWBK60161331926819"
                          value={formData.iban}
                          onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          International Bank Account Number
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block text-foreground">SWIFT/BIC Code *</label>
                        <Input 
                          placeholder="e.g., NWBKGB2L"
                          value={formData.swiftCode}
                          onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value.toUpperCase() })}
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Bank identifier for international transfers
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block text-foreground">Account Number *</label>
                        <Input 
                          placeholder="Your international bank account number"
                          value={formData.accountNumber}
                          onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                          required
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/20">
                    <h4 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                      <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Secure & Confidential
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Your bank details are encrypted and stored securely. They will only be used to transfer your earnings.
                    </p>
                  </div>

                  <Button variant="hero" className="w-full" type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Bank Details"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default DesignerBankDetails;
