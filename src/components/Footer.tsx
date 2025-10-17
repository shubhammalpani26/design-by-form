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
              <li><button onClick={() => handleNavigation("/sustainability")} className="text-muted-foreground hover:text-primary transition-colors text-left">Sustainability</button></li>
              <li><button onClick={() => handleNavigation("/contact")} className="text-muted-foreground hover:text-primary transition-colors text-left">Contact</button></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <div className="flex justify-center gap-6 mb-4">
            <button onClick={() => handleNavigation("/terms")} className="hover:text-primary transition-colors">Terms & Conditions</button>
            <button onClick={() => handleNavigation("/contact")} className="hover:text-primary transition-colors">Privacy Policy</button>
          </div>
          <p>&copy; 2025 Forma. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
