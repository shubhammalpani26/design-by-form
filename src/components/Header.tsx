import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const categories = [
    { name: "Chairs", path: "/browse?category=chairs" },
    { name: "Coffee Tables", path: "/browse?category=coffee-tables" },
    { name: "Dining Tables", path: "/browse?category=dining-tables" },
    { name: "Benches", path: "/browse?category=benches" },
    { name: "Vases", path: "/browse?category=vases" },
    { name: "Home Decor", path: "/browse?category=home-decor" },
    { name: "Installations", path: "/browse?category=installations" },
    { name: "All Products", path: "/browse" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-primary">Forma</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Shop
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-background">
              {categories.map((category) => (
                <DropdownMenuItem key={category.path} asChild>
                  <Link 
                    to={category.path}
                    className="cursor-pointer hover:bg-accent transition-colors"
                  >
                    {category.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to="/creators" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Creators
          </Link>
          <Link to="/about" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            About
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Link to="/auth">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link to="/design-studio">
            <Button variant="default" size="sm">Create with AI</Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
