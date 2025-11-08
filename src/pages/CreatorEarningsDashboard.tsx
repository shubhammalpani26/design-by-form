import { useState, useEffect } from 'react';
import { CreatorSidebar } from '@/components/CreatorSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp, Package, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/contexts/CurrencyContext';

interface EarningsData {
  totalEarnings: number;
  totalSales: number;
  commissionTier: string;
  commissionRate: number;
  pendingPayout: number;
  thisMonthEarnings: number;
}

const CreatorEarningsDashboard = () => {
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    totalSales: 0,
    commissionTier: 'Standard',
    commissionRate: 10,
    pendingPayout: 0,
    thisMonthEarnings: 0,
  });

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch designer profile
      const { data: profile } = await supabase
        .from('designer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Designer profile not found');

      // Fetch sales data
      const { data: salesData } = await supabase
        .from('product_sales')
        .select('designer_earnings, sale_price, sale_date')
        .eq('designer_id', profile.id);

      // Calculate totals
      const totalEarnings = salesData?.reduce((sum, sale) => sum + Number(sale.designer_earnings), 0) || 0;
      const totalSalesVolume = salesData?.reduce((sum, sale) => sum + Number(sale.sale_price), 0) || 0;
      
      // Calculate this month's earnings
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonthEarnings = salesData?.reduce((sum, sale) => {
        const saleDate = new Date(sale.sale_date || new Date());
        if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
          return sum + Number(sale.designer_earnings);
        }
        return sum;
      }, 0) || 0;

      // Determine commission tier based on total sales volume
      let tier = 'Standard';
      let rate = 10;

      if (totalSalesVolume >= 1245000) {
        tier = 'Elite';
        rate = 15;
      } else if (totalSalesVolume >= 415000) {
        tier = 'Premium';
        rate = 12;
      }

      setEarnings({
        totalEarnings,
        totalSales: totalSalesVolume,
        commissionTier: tier,
        commissionRate: rate,
        pendingPayout: totalEarnings, // All earnings pending until paid
        thisMonthEarnings,
      });
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load earnings data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <CreatorSidebar />
          <main className="flex-1 p-8">
            <Skeleton className="h-8 w-64 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <CreatorSidebar />
        
        <main className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Earnings Dashboard</h1>
            <p className="text-muted-foreground">
              Track your sales performance and commission earnings
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(earnings.totalEarnings)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Lifetime earnings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Payout
                </CardTitle>
                <Calendar className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(earnings.pendingPayout)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Next payout: 1st of next month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Commission Tier
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{earnings.commissionTier}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {earnings.commissionRate}% commission rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Sales
                </CardTitle>
                <Package className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(earnings.totalSales)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All-time sales volume
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Commission Tiers */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Commission Tiers</CardTitle>
              <CardDescription>
                Your commission rate increases as your sales volume grows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg border ${earnings.commissionTier === 'Standard' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Standard</h3>
                    <span className="text-2xl font-bold text-primary">10%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">All creators start here</p>
                </div>

                <div className={`p-4 rounded-lg border ${earnings.commissionTier === 'Premium' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Premium</h3>
                    <span className="text-2xl font-bold text-primary">12%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">₹4,15,000+ in sales</p>
                </div>

                <div className={`p-4 rounded-lg border ${earnings.commissionTier === 'Elite' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Elite</h3>
                    <span className="text-2xl font-bold text-primary">15%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">₹12,45,000+ in sales</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>
                How and when you receive your earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Payment Schedule</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Monthly payments on the 1st of each month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Minimum payout: ₹4,000 (rolls over if under)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Direct bank transfer or UPI</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">What You Earn</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>100% of your price markup</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{earnings.commissionRate}% commission on base cost</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Perpetual earnings on all sales</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CreatorEarningsDashboard;
