import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { ComparisonProvider } from "@/contexts/ComparisonContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ComparisonBar } from "@/components/ComparisonBar";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Eager load only the homepage for fastest initial paint
import Home from "./pages/Home";

// Lazy load everything else
const Browse = lazy(() => import("./pages/Browse"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const DesignerProfile = lazy(() => import("./pages/DesignerProfile"));
const DesignStudio = lazy(() => import("./pages/DesignStudio"));
const Creators = lazy(() => import("./pages/Creators"));
const DesignerSignup = lazy(() => import("./pages/DesignerSignup"));
const DesignerDashboard = lazy(() => import("./pages/DesignerDashboard"));
const DesignerBankDetails = lazy(() => import("./pages/DesignerBankDetails"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const CreatorEarnings = lazy(() => import("./pages/CreatorEarnings"));
const CreatorEarningsDashboard = lazy(() => import("./pages/CreatorEarningsDashboard"));
const CreatorDashboard = lazy(() => import("./pages/CreatorDashboard"));
const CreatorProfile = lazy(() => import("./pages/CreatorProfile"));
const CreatorLeaderboard = lazy(() => import("./pages/CreatorLeaderboard"));
const Terms = lazy(() => import("./pages/Terms"));
const About = lazy(() => import("./pages/About"));
const Sustainability = lazy(() => import("./pages/Sustainability"));
const Contact = lazy(() => import("./pages/Contact"));
const Auth = lazy(() => import("./pages/Auth"));
const ShopperFAQ = lazy(() => import("./pages/ShopperFAQ"));
const CreatorFAQ = lazy(() => import("./pages/CreatorFAQ"));
const Plans = lazy(() => import("./pages/Plans"));
const DesignerOnboarding = lazy(() => import("./pages/DesignerOnboarding"));
const CreatorSuccessKit = lazy(() => import("./pages/CreatorSuccessKit"));
const ProductSuccessKit = lazy(() => import("./pages/ProductSuccessKit"));
const ProductEdit = lazy(() => import("./pages/ProductEdit"));
const AdminProductEdit = lazy(() => import("./pages/AdminProductEdit"));
const Cart = lazy(() => import("./pages/Cart"));
const ProductComparison = lazy(() => import("./pages/ProductComparison"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PayoutRequests = lazy(() => import("./pages/PayoutRequests"));
const AdminPayouts = lazy(() => import("./pages/AdminPayouts"));
const ProductStatusTracker = lazy(() => import("./pages/ProductStatusTracker"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"));
const CreatorSettings = lazy(() => import("./pages/CreatorSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Community = lazy(() => import("./pages/Community"));
const Explore = lazy(() => import("./pages/Explore"));
const VerifiedMakers = lazy(() => import("./pages/VerifiedMakers"));
const MakerProfile = lazy(() => import("./pages/MakerProfile"));
const MakerFAQ = lazy(() => import("./pages/MakerFAQ"));

// Lazy load layout
const CreatorLayout = lazy(() => import("./layouts/CreatorLayout").then(m => ({ default: m.CreatorLayout })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="space-y-4 w-full max-w-md px-4">
      <Skeleton className="h-8 w-3/4 mx-auto" />
      <Skeleton className="h-4 w-1/2 mx-auto" />
    </div>
  </div>
);

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
              <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/designer/:slug" element={<DesignerProfile />} />
              <Route path="/design-studio" element={<DesignStudio />} />
              <Route path="/creators" element={<Creators />} />
              <Route path="/community" element={<Community />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/verified-makers" element={<VerifiedMakers />} />
              <Route path="/maker/:slug" element={<MakerProfile />} />
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
              <Route path="/maker-faq" element={<MakerFAQ />} />
              <Route path="/checkout" element={<Checkout />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </BrowserRouter>
          </CartProvider>
        </ComparisonProvider>
      </CurrencyProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
