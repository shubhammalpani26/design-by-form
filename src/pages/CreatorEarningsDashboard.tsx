import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp, Package, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/contexts/CurrencyContext';

interface EarningsData {
  totalEarnings: number;
  totalSales: number;
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

      setEarnings({
        totalEarnings,
        totalSales: totalSalesVolume,
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
      <div className="text-center py-12">
        <Skeleton className="h-8 w-64 mb-8 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Earnings Dashboard</h1>
        <p className="text-muted-foreground">
          Track your sales performance and earnings (70% of your markup)
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

          {/* How it Works */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How You Earn</CardTitle>
              <CardDescription>
                Simple and transparent - 70% of your markup on every sale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border border-border bg-accent/5">
                    <div className="text-4xl font-bold text-primary mb-2">1</div>
                    <h4 className="font-semibold mb-1">We Set MBP</h4>
                    <p className="text-sm text-muted-foreground">
                      Manufacturing Base Price is calculated based on production requirements
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-accent/5">
                    <div className="text-4xl font-bold text-primary mb-2">2</div>
                    <h4 className="font-semibold mb-1">You Price</h4>
                    <p className="text-sm text-muted-foreground">
                      Set your selling price above MBP - the difference is your markup
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                    <div className="text-4xl font-bold text-primary mb-2">3</div>
                    <h4 className="font-semibold mb-1">You Earn 70%</h4>
                    <p className="text-sm text-muted-foreground">
                      Get 70% of your markup, we keep 30% to run the platform
                    </p>
                  </div>
                </div>

                <div className="bg-secondary/5 rounded-lg p-4 border border-secondary/20">
                  <h4 className="font-semibold text-sm mb-2">Example</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>MBP: ₹50,000 | Your Price: ₹75,000 | Your Markup: ₹25,000</p>
                    <p className="text-primary font-semibold">→ You earn: ₹17,500 (70% of ₹25,000)</p>
                  </div>
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
                      <span>70% of your markup on every sale</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Platform fees waived initially*</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Perpetual earnings on all sales forever</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Simple & transparent pricing model</span>
                    </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
    </>
  );
};

export default CreatorEarningsDashboard;
