import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { CreatorSidebar } from '@/components/CreatorSidebar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface DashboardStats {
  totalProducts: number;
  approvedProducts: number;
  pendingProducts: number;
  totalEarnings: number;
  totalSales: number;
}

const CreatorDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    approvedProducts: 0,
    pendingProducts: 0,
    totalEarnings: 0,
    totalSales: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('designer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast({
          title: 'Profile Not Found',
          description: 'Please complete your creator onboarding',
          variant: 'destructive',
        });
        return;
      }

      const { data: products } = await supabase
        .from('designer_products')
        .select('*')
        .eq('designer_id', profile.id);

      const { data: salesData } = await supabase
        .from('product_sales')
        .select('designer_earnings')
        .eq('designer_id', profile.id);

      const totalEarnings = salesData?.reduce((sum, sale) => sum + Number(sale.designer_earnings), 0) || 0;

      setStats({
        totalProducts: products?.length || 0,
        approvedProducts: products?.filter(p => p.status === 'approved').length || 0,
        pendingProducts: products?.filter(p => p.status === 'pending').length || 0,
        totalEarnings,
        totalSales: salesData?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <CreatorSidebar />
          <main className="flex-1 p-8">
            <p className="text-center text-muted-foreground">Loading dashboard...</p>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <CreatorSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="border-b bg-background sticky top-0 z-10">
            <div className="flex items-center gap-4 p-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold">Creator Dashboard</h1>
            </div>
          </header>

          <main className="flex-1 p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Welcome Back!</h2>
              <p className="text-muted-foreground">Here's an overview of your creative journey</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Designs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">{stats.totalProducts}</p>
                </CardContent>
              </Card>

              <Card className="border-green-500/20">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Live Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{stats.approvedProducts}</p>
                </CardContent>
              </Card>

              <Card className="border-yellow-500/20">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Under Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pendingProducts}</p>
                </CardContent>
              </Card>

              <Card className="border-secondary/20">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-secondary">₹{stats.totalEarnings.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/design-studio">
                  <Button variant="hero" className="w-full">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create New Design
                  </Button>
                </Link>
                <Link to="/creator/designs">
                  <Button variant="outline" className="w-full">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    View My Designs
                  </Button>
                </Link>
                <Link to="/creator/earnings">
                  <Button variant="outline" className="w-full">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Check Earnings
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Getting Started */}
            {stats.totalProducts === 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle>Get Started</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Ready to create your first design? Use our AI-powered design studio to bring your ideas to life!
                  </p>
                  <Link to="/design-studio">
                    <Button variant="hero">
                      Start Creating
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CreatorDashboard;