import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { ComparisonProvider } from "@/contexts/ComparisonContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ComparisonBar } from "@/components/ComparisonBar";
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
import Plans from "./pages/Plans";
import DesignerOnboarding from "./pages/DesignerOnboarding";
import CreatorSuccessKit from "./pages/CreatorSuccessKit";
import ProductSuccessKit from "./pages/ProductSuccessKit";
import ProductEdit from "./pages/ProductEdit";
import AdminProductEdit from "./pages/AdminProductEdit";
import Cart from "./pages/Cart";
import ProductComparison from "./pages/ProductComparison";
import Checkout from "./pages/Checkout";
import PayoutRequests from "./pages/PayoutRequests";
import AdminPayouts from "./pages/AdminPayouts";
import ProductStatusTracker from "./pages/ProductStatusTracker";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import OrderHistory from "./pages/OrderHistory";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import CreatorSettings from "./pages/CreatorSettings";
import NotFound from "./pages/NotFound";
import { CreatorLayout } from "./layouts/CreatorLayout";
import AdminPanel from "./pages/AdminPanel";
import Community from "./pages/Community";
import Explore from "./pages/Explore";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CurrencyProvider>
        <ComparisonProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ComparisonBar />
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/designer/:id" element={<DesignerProfile />} />
            <Route path="/design-studio" element={<DesignStudio />} />
            <Route path="/creators" element={<Creators />} />
            <Route path="/community" element={<Community />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/designer-signup" element={<DesignerSignup />} />
            <Route path="/designer-dashboard" element={<DesignerDashboard />} />
            <Route path="/designer-bank-details" element={<DesignerBankDetails />} />
            
            {/* Creator Dashboard Routes - Wrapped in CreatorLayout */}
            <Route path="/creator-dashboard" element={<CreatorLayout />}>
              <Route index element={<CreatorDashboard />} />
            </Route>
            <Route path="/creator" element={<CreatorLayout />}>
              <Route path="dashboard" element={<CreatorDashboard />} />
              <Route path="designs" element={<DesignerDashboard />} />
              <Route path="earnings" element={<CreatorEarningsDashboard />} />
              <Route path="analytics" element={<AnalyticsDashboard />} />
              <Route path="profile" element={<CreatorProfile />} />
              <Route path="settings" element={<CreatorSettings />} />
              <Route path="success-kit" element={<CreatorSuccessKit />} />
              <Route path="success-kit/:productId" element={<ProductSuccessKit />} />
            </Route>
            <Route path="/product-edit/:id" element={<ProductEdit />} />
            <Route path="/order-history" element={<OrderHistory />} />
            <Route path="/payout-requests" element={<PayoutRequests />} />
            <Route path="/product-status" element={<ProductStatusTracker />} />
            <Route path="/creator-leaderboard" element={<CreatorLeaderboard />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/compare" element={<ProductComparison />} />
            
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin-dashboard" element={<AdminPanel />} />
            <Route path="/admin/panel" element={<AdminPanel />} />
            <Route path="/admin/payouts" element={<AdminPayouts />} />
            <Route path="/admin/products/:id/edit" element={<AdminProductEdit />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/creator-earnings" element={<CreatorEarnings />} />
            <Route path="/commissions" element={<CreatorEarnings />} /> {/* Redirect old URL */}
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/about" element={<About />} />
            <Route path="/sustainability" element={<Sustainability />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/designer-onboarding" element={<DesignerOnboarding />} />
            <Route path="/shopper-faq" element={<ShopperFAQ />} />
            <Route path="/creator-faq" element={<CreatorFAQ />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/checkout" element={<Checkout />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </ComparisonProvider>
    </CurrencyProvider>
  </TooltipProvider>
</QueryClientProvider>
);

export default App;
