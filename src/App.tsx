import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import ProductDetail from "./pages/ProductDetail";
import DesignerProfile from "./pages/DesignerProfile";
import DesignStudio from "./pages/DesignStudio";
import Creators from "./pages/Creators";
import DesignerSignup from "./pages/DesignerSignup";
import HowItWorks from "./pages/HowItWorks";
import Commissions from "./pages/Commissions";
import Terms from "./pages/Terms";
import About from "./pages/About";
import Sustainability from "./pages/Sustainability";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import ShopperFAQ from "./pages/ShopperFAQ";
import CreatorFAQ from "./pages/CreatorFAQ";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
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
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/commissions" element={<Commissions />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/about" element={<About />} />
          <Route path="/sustainability" element={<Sustainability />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/shopper-faq" element={<ShopperFAQ />} />
          <Route path="/creator-faq" element={<CreatorFAQ />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
