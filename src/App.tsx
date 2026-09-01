import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { ComparisonProvider } from "@/contexts/ComparisonContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ComparisonBar } from "@/components/ComparisonBar";
import { Suspense, useEffect } from "react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { Skeleton } from "@/components/ui/skeleton";
import { useReferralCapture } from "@/hooks/useReferralCapture";
import { getCanonicalUrl } from "@/components/SEOHead";

// Eager load only the homepage for fastest initial paint
import Home from "./pages/Home";
import OriginalsHome from "./pages/OriginalsHome";
const OriginalDetail = lazyWithRetry(() => import("./pages/OriginalDetail"));
const OriginalsReturn = lazyWithRetry(() => import("./pages/OriginalsReturn"));
const MyOrders = lazyWithRetry(() => import("./pages/MyOrders"));
const Reviews = lazyWithRetry(() => import("./pages/Reviews"));
const Unsubscribe = lazyWithRetry(() => import("./pages/Unsubscribe"));

// Lazy load everything else
const Browse = lazyWithRetry(() => import("./pages/Browse"));
const ProductDetail = lazyWithRetry(() => import("./pages/ProductDetail"));
const DesignerProfile = lazyWithRetry(() => import("./pages/DesignerProfile"));
const DesignStudio = lazyWithRetry(() => import("./pages/DesignStudio"));
const DesignStudioChat = lazyWithRetry(() => import("./pages/DesignStudioChat"));
const Creators = lazyWithRetry(() => import("./pages/Creators"));
const DesignerSignup = lazyWithRetry(() => import("./pages/DesignerSignup"));
const DesignerDashboard = lazyWithRetry(() => import("./pages/DesignerDashboard"));
const DesignerBankDetails = lazyWithRetry(() => import("./pages/DesignerBankDetails"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
const HowItWorks = lazyWithRetry(() => import("./pages/HowItWorks"));
const CreatorEarnings = lazyWithRetry(() => import("./pages/CreatorEarnings"));
const CreatorEarningsDashboard = lazyWithRetry(() => import("./pages/CreatorEarningsDashboard"));
const CreatorDashboard = lazyWithRetry(() => import("./pages/CreatorDashboard"));
const CreatorProfile = lazyWithRetry(() => import("./pages/CreatorProfile"));
const CreatorLeaderboard = lazyWithRetry(() => import("./pages/CreatorLeaderboard"));
const Terms = lazyWithRetry(() => import("./pages/Terms"));
const About = lazyWithRetry(() => import("./pages/About"));

const Contact = lazyWithRetry(() => import("./pages/Contact"));
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const OAuthConsent = lazyWithRetry(() => import("./pages/OAuthConsent"));
const ShopperFAQ = lazyWithRetry(() => import("./pages/ShopperFAQ"));
const CreatorFAQ = lazyWithRetry(() => import("./pages/CreatorFAQ"));
const Plans = lazyWithRetry(() => import("./pages/Plans"));
const DesignerOnboarding = lazyWithRetry(() => import("./pages/DesignerOnboarding"));
const CreatorSuccessKit = lazyWithRetry(() => import("./pages/CreatorSuccessKit"));
const ProductSuccessKit = lazyWithRetry(() => import("./pages/ProductSuccessKit"));
const ProductEdit = lazyWithRetry(() => import("./pages/ProductEdit"));
const AdminProductEdit = lazyWithRetry(() => import("./pages/AdminProductEdit"));
const Cart = lazyWithRetry(() => import("./pages/Cart"));
const ProductComparison = lazyWithRetry(() => import("./pages/ProductComparison"));
const Checkout = lazyWithRetry(() => import("./pages/Checkout"));
const BillingReturn = lazyWithRetry(() => import("./pages/BillingReturn"));
const PayoutRequests = lazyWithRetry(() => import("./pages/PayoutRequests"));
const AdminPayouts = lazyWithRetry(() => import("./pages/AdminPayouts"));
const ProductStatusTracker = lazyWithRetry(() => import("./pages/ProductStatusTracker"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const OrderHistory = lazyWithRetry(() => import("./pages/OrderHistory"));
const AnalyticsDashboard = lazyWithRetry(() => import("./pages/AnalyticsDashboard"));
const CreatorSettings = lazyWithRetry(() => import("./pages/CreatorSettings"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const AdminPanel = lazyWithRetry(() => import("./pages/AdminPanel"));
const Community = lazyWithRetry(() => import("./pages/Community"));
const Explore = lazyWithRetry(() => import("./pages/Explore"));
const VerifiedMakers = lazyWithRetry(() => import("./pages/VerifiedMakers"));
const MakerProfile = lazyWithRetry(() => import("./pages/MakerProfile"));
const MakerFAQ = lazyWithRetry(() => import("./pages/MakerFAQ"));
const Technology = lazyWithRetry(() => import("./pages/Technology"));
const LuxuryFurnitureIndia = lazyWithRetry(() => import("./pages/LuxuryFurnitureIndia"));
const AIDesignedFurniture = lazyWithRetry(() => import("./pages/AIDesignedFurniture"));

// Lazy load layout
const CreatorLayout = lazyWithRetry(() => import("./layouts/CreatorLayout").then(m => ({ default: m.CreatorLayout })));

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

const ReferralCapture = () => {
  useReferralCapture();
  return null;
};

const CanonicalRouteSync = () => {
  const location = useLocation();

  useEffect(() => {
    const canonicalUrl = getCanonicalUrl(`${location.pathname}${location.search}`);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", canonicalUrl);
  }, [location.pathname, location.search]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CurrencyProvider>
        <ComparisonProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ReferralCapture />
              <CanonicalRouteSync />
              <ComparisonBar />
              <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/" element={<OriginalsHome />} />
              <Route path="/originals/:slug" element={<OriginalDetail />} />
              <Route path="/originals/checkout/return" element={<OriginalsReturn />} />
              <Route path="/orders" element={<MyOrders />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              {/* Existing platform homepage preserved verbatim at its own route */}
              <Route path="/platform" element={<Home />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/designer/:slug" element={<DesignerProfile />} />
              <Route path="/design-studio" element={<DesignStudioChat />} />
              <Route path="/studio" element={<DesignStudioChat />} />
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
              
              <Route path="/contact" element={<Contact />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
              <Route path="/designer-onboarding" element={<DesignerOnboarding />} />
              <Route path="/shopper-faq" element={<ShopperFAQ />} />
              <Route path="/creator-faq" element={<CreatorFAQ />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/maker-faq" element={<MakerFAQ />} />
              <Route path="/technology" element={<Technology />} />
              <Route path="/luxury-furniture-india" element={<LuxuryFurnitureIndia />} />
              <Route path="/ai-designed-furniture" element={<AIDesignedFurniture />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/billing/return" element={<BillingReturn />} />
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
