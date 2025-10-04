import { Link } from "react-router-dom";

export const Footer = () => {
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
              <li><Link to="/browse" className="text-muted-foreground hover:text-primary transition-colors">Browse All</Link></li>
              <li><Link to="/browse?category=chairs" className="text-muted-foreground hover:text-primary transition-colors">Chairs</Link></li>
              <li><Link to="/browse?category=tables" className="text-muted-foreground hover:text-primary transition-colors">Tables</Link></li>
              <li><Link to="/browse?category=storage" className="text-muted-foreground hover:text-primary transition-colors">Storage</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">For Designers</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/designer-signup" className="text-muted-foreground hover:text-primary transition-colors">Join as Designer</Link></li>
              <li><Link to="/how-it-works" className="text-muted-foreground hover:text-primary transition-colors">How It Works</Link></li>
              <li><Link to="/commissions" className="text-muted-foreground hover:text-primary transition-colors">Commissions</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/sustainability" className="text-muted-foreground hover:text-primary transition-colors">Sustainability</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Forma. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
