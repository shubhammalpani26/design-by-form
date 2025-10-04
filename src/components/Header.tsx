import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-primary">Forma</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/browse" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Browse
          </Link>
          <Link to="/designers" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Designers
          </Link>
          <Link to="/about" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            About
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">Sign In</Button>
          <Button variant="default" size="sm">Get Started</Button>
        </div>
      </div>
    </header>
  );
};
