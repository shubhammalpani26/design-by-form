import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import { CreditBalance } from "@/components/CreditBalance";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useCart } from "@/contexts/CartContext";
import { CurrencySelector } from "@/components/CurrencySelector";
import { NotificationBell } from "@/components/NotificationBell";
import { Menu, ShoppingCart, User as UserIcon, Sparkles, LayoutDashboard, LogOut } from "lucide-react";

export const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cartCount } = useCart();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out successfully",
        description: "You have been signed out.",
      });
      navigate("/");
    }
  };

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
      <div className="container mx-auto px-4 flex h-16 items-center justify-between gap-2">
        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[350px]">
            <SheetHeader>
              <SheetTitle className="text-left">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex flex-col">
                  <span className="text-2xl font-bold text-primary leading-tight">Forma</span>
                  <span className="text-[10px] text-muted-foreground -mt-1">By Cyanique</span>
                </Link>
              </SheetTitle>
            </SheetHeader>
            
            <div className="mt-8 flex flex-col space-y-6">
              {/* Shop Categories */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Shop</h3>
                {categories.map((category) => (
                  <Link
                    key={category.path}
                    to={category.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>

              {/* Main Navigation */}
              <div className="space-y-3">
                <Link
                  to="/creators"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                >
                  Creators
                </Link>
                <Link
                  to="/creator-leaderboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                >
                  Leaderboard
                </Link>
                <Link
                  to="/plans"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                >
                  Pricing
                </Link>
                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                >
                  About
                </Link>
              </div>

              {/* User Actions */}
              {user ? (
                <div className="space-y-3 pt-4 border-t border-border">
                  <Link
                    to="/design-studio"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    <Sparkles className="h-5 w-5" />
                    Create with AI
                  </Link>
                  <Link
                    to="/creator-dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Creator Dashboard
                  </Link>
                  <Link
                    to="/cart"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Cart {cartCount > 0 && `(${cartCount})`}
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center gap-3 text-base font-medium text-foreground hover:text-primary transition-colors py-2 w-full text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-4 border-t border-border">
                  <Link
                    to="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="outline" className="w-full justify-start">
                      <UserIcon className="h-5 w-5 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                  <Link
                    to="/design-studio"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button className="w-full justify-start">
                      <Sparkles className="h-5 w-5 mr-2" />
                      Create with AI
                    </Button>
                  </Link>
                </div>
              )}

              {/* Currency Selector */}
              <div className="pt-4 border-t border-border">
                <CurrencySelector />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex flex-col shrink-0">
          <span className="text-2xl font-bold text-primary leading-tight">Forma</span>
          <span className="text-[10px] text-muted-foreground -mt-1">By Cyanique</span>
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
            <DropdownMenuContent align="start" className="w-56 bg-background border border-border shadow-lg z-50">
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
          <Link to="/creator-leaderboard" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Leaderboard
          </Link>
          <Link to="/plans" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Pricing
          </Link>
          <Link to="/about" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            About
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {/* Search */}
          <GlobalSearch />
          
          {/* Mobile Icons - Cart and Notifications (visible on mobile) */}
          <div className="flex items-center gap-1 md:hidden">
            {user && (
              <>
                <Link to="/cart" className="relative">
                  <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <NotificationBell />
              </>
            )}
          </div>
          
          {/* Desktop Elements */}
          {/* Credits - already has "Get More" button inside when low */}
          {user && (
            <div className="hidden md:block">
              <CreditBalance />
            </div>
          )}
          
          {/* Cart */}
          {user && (
            <Link to="/cart" className="relative hidden md:block">
              <Button variant="ghost" size="sm" className="relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
          )}
          
          {/* Notifications */}
          {user && <div className="hidden md:block"><NotificationBell /></div>}
          
          {/* Visual separator */}
          <div className="h-6 w-px bg-border/60 hidden lg:block mx-1" />
          
          {/* Currency - near corner */}
          <div className="hidden md:block">
            <CurrencySelector />
          </div>
          
          {/* User menu - at the corner */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="hidden md:inline">{user.email?.split('@')[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background border border-border shadow-lg z-50">
                <DropdownMenuItem asChild>
                  <Link to="/creator/dashboard" className="cursor-pointer hover:bg-accent">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Creator Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/design-studio" className="cursor-pointer hover:bg-accent">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Create with AI
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/designer-signup" className="cursor-pointer hover:bg-accent">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Become a Creator
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive hover:bg-destructive/10">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/design-studio">
                <Button variant="default" size="sm" className="hidden md:inline-flex">Create with AI</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
