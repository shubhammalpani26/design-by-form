import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export const Footer = () => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-border bg-card mt-20">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">Forma</h3>
            <p className="text-sm text-muted-foreground">
              Empowering creators to design the future of sustainable furniture.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => handleNavigation("/browse")} className="text-muted-foreground hover:text-primary transition-colors text-left">Browse All</button></li>
              <li><button onClick={() => handleNavigation("/browse?category=chairs")} className="text-muted-foreground hover:text-primary transition-colors text-left">Chairs</button></li>
              <li><button onClick={() => handleNavigation("/browse?category=coffee-tables")} className="text-muted-foreground hover:text-primary transition-colors text-left">Coffee Tables</button></li>
              <li><button onClick={() => handleNavigation("/browse?category=benches")} className="text-muted-foreground hover:text-primary transition-colors text-left">Benches</button></li>
              <li><button onClick={() => handleNavigation("/browse?category=vases")} className="text-muted-foreground hover:text-primary transition-colors text-left">Vases</button></li>
              <li><button onClick={() => handleNavigation("/browse?category=installations")} className="text-muted-foreground hover:text-primary transition-colors text-left">Installations</button></li>
              <li><button onClick={() => handleNavigation("/browse?category=dining-tables")} className="text-muted-foreground hover:text-primary transition-colors text-left">Dining Tables</button></li>
              <li><button onClick={() => handleNavigation("/browse?category=home-decor")} className="text-muted-foreground hover:text-primary transition-colors text-left">Home Decor</button></li>
              <li><button onClick={() => handleNavigation("/shopper-faq")} className="text-muted-foreground hover:text-primary transition-colors text-left">Shopper FAQ</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">For Creators</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => handleNavigation("/designer-signup")} className="text-muted-foreground hover:text-primary transition-colors text-left">Join as Creator</button></li>
              <li><button onClick={() => handleNavigation("/how-it-works")} className="text-muted-foreground hover:text-primary transition-colors text-left">How It Works</button></li>
              <li><button onClick={() => handleNavigation("/creator-earnings")} className="text-muted-foreground hover:text-primary transition-colors text-left">Your Earnings</button></li>
              <li><button onClick={() => handleNavigation("/creator-faq")} className="text-muted-foreground hover:text-primary transition-colors text-left">Creator FAQ</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => handleNavigation("/about")} className="text-muted-foreground hover:text-primary transition-colors text-left">About Us</button></li>
              <li><button onClick={() => handleNavigation("/plans")} className="text-muted-foreground hover:text-primary transition-colors text-left">Pricing Plans</button></li>
              <li><button onClick={() => handleNavigation("/sustainability")} className="text-muted-foreground hover:text-primary transition-colors text-left">Sustainability</button></li>
              <li><button onClick={() => handleNavigation("/contact")} className="text-muted-foreground hover:text-primary transition-colors text-left">Contact</button></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border">
          {/* Trust Badges - Subtle placement */}
          <div className="flex flex-wrap justify-center items-center gap-6 mb-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>SSL Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>100% Secure Checkout</span>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <div className="flex justify-center gap-6 mb-4">
              <button onClick={() => handleNavigation("/terms")} className="hover:text-primary transition-colors">Terms & Conditions</button>
              <button onClick={() => handleNavigation("/privacy-policy")} className="hover:text-primary transition-colors">Privacy Policy</button>
            </div>
            <p>&copy; 2025 Forma. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
