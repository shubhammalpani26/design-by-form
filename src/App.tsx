import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import ProductDetail from "./pages/ProductDetail";
import DesignerProfile from "./pages/DesignerProfile";
import DesignStudio from "./pages/DesignStudio";
import Creators from "./pages/Creators";
import DesignerSignup from "./pages/DesignerSignup";
import DesignerDashboard from "./pages/DesignerDashboard";
import DesignerBankDetails from "./pages/DesignerBankDetails";
import AdminDashboard from "./pages/AdminDashboard";
import HowItWorks from "./pages/HowItWorks";
import CreatorEarnings from "./pages/CreatorEarnings";
import CreatorEarningsDashboard from "./pages/CreatorEarningsDashboard";
import CreatorDashboard from "./pages/CreatorDashboard";
import CreatorProfile from "./pages/CreatorProfile";
import CreatorLeaderboard from "./pages/CreatorLeaderboard";
import Terms from "./pages/Terms";
import About from "./pages/About";
import Sustainability from "./pages/Sustainability";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import ShopperFAQ from "./pages/ShopperFAQ";
import CreatorFAQ from "./pages/CreatorFAQ";
import DesignerOnboarding from "./pages/DesignerOnboarding";
import CreatorSuccessKit from "./pages/CreatorSuccessKit";
import ProductSuccessKit from "./pages/ProductSuccessKit";
import Cart from "./pages/Cart";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/designer/:id" element={<DesignerProfile />} />
            <Route path="/design-studio" element={<DesignStudio />} />
            <Route path="/creators" element={<Creators />} />
            <Route path="/designer-signup" element={<DesignerSignup />} />
            <Route path="/designer-dashboard" element={<DesignerDashboard />} />
            <Route path="/designer-bank-details" element={<DesignerBankDetails />} />
            
            {/* Creator Dashboard Routes */}
            <Route path="/creator/dashboard" element={<CreatorDashboard />} />
            <Route path="/creator/designs" element={<DesignerDashboard />} />
            <Route path="/creator/earnings" element={<CreatorEarningsDashboard />} />
            <Route path="/creator/profile" element={<CreatorProfile />} />
            <Route path="/creator/settings" element={<CreatorProfile />} />
            <Route path="/creator/success-kit" element={<CreatorSuccessKit />} />
            <Route path="/creator/success-kit/:productId" element={<ProductSuccessKit />} />
            <Route path="/creator-leaderboard" element={<CreatorLeaderboard />} />
            <Route path="/cart" element={<Cart />} />
            
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/creator-earnings" element={<CreatorEarnings />} />
            <Route path="/commissions" element={<CreatorEarnings />} /> {/* Redirect old URL */}
            <Route path="/terms" element={<Terms />} />
            <Route path="/about" element={<About />} />
            <Route path="/sustainability" element={<Sustainability />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/designer-onboarding" element={<DesignerOnboarding />} />
            <Route path="/shopper-faq" element={<ShopperFAQ />} />
            <Route path="/creator-faq" element={<CreatorFAQ />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
