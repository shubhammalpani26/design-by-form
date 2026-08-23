import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DesignersManagement } from "@/components/admin/DesignersManagement";
import { ProductsManagement } from "@/components/admin/ProductsManagement";
import { UsersManagement } from "@/components/admin/UsersManagement";
import { OrdersManagement } from "@/components/admin/OrdersManagement";
import { PrintFarmManagement } from "@/components/admin/PrintFarmManagement";
import { OriginalsFulfillmentManagement } from "@/components/admin/OriginalsFulfillmentManagement";
import { NotificationsManagement } from "@/components/admin/NotificationsManagement";
import { CreditsManagement } from "@/components/admin/CreditsManagement";
import { ContactSubmissions } from "@/components/admin/ContactSubmissions";
import { EarlyAccessManagement } from "@/components/admin/EarlyAccessManagement";
import { SocialScheduleManagement } from "@/components/admin/SocialScheduleManagement";
import { ReviewsManagement } from "@/components/admin/ReviewsManagement";
import { SEOHead } from "@/components/SEOHead";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TABS = [
  { value: "designers", label: "Creators" },
  { value: "products", label: "Products" },
  { value: "users", label: "Users" },
  { value: "credits", label: "Credits" },
  { value: "orders", label: "Orders" },
  { value: "print-farm", label: "US Print" },
  { value: "originals-ops", label: "Originals Ops" },
  { value: "early-access", label: "Early Access" },
  { value: "contacts", label: "Contacts" },
  { value: "notifications", label: "Notifications" },
  { value: "reviews", label: "Reviews" },
  { value: "social", label: "Social" },
];

export default function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("designers");
  const navigate = useNavigate();
  const { toast } = useToast();


  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (error || !roleData) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
      <SEOHead title={"Admin Panel"} description={"Private page on Nyzora."} noIndex />
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-3 py-6 sm:px-4 sm:py-8">
        <h1 className="mb-5 text-2xl font-bold sm:mb-8 sm:text-3xl">Admin Control Panel</h1>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          {/* Mobile: dropdown selector */}
          <div className="mb-5 sm:hidden">
            <Select value={tab} onValueChange={setTab}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TABS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop / tablet: scrollable tab bar */}
          <div className="mb-8 hidden overflow-x-auto sm:block">
            <TabsList className="inline-flex w-max min-w-full">
              {TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="whitespace-nowrap">
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>


          <TabsContent value="social">
            <SocialScheduleManagement />
          </TabsContent>

          <TabsContent value="designers">
            <DesignersManagement />
          </TabsContent>

          <TabsContent value="products">
            <ProductsManagement />
          </TabsContent>

          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="credits">
            <CreditsManagement />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersManagement />
          </TabsContent>

          <TabsContent value="print-farm">
            <PrintFarmManagement />
          </TabsContent>

          <TabsContent value="originals-ops">
            <OriginalsFulfillmentManagement />
          </TabsContent>

          <TabsContent value="early-access">
            <EarlyAccessManagement />
          </TabsContent>

          <TabsContent value="contacts">
            <ContactSubmissions />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsManagement />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsManagement />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
