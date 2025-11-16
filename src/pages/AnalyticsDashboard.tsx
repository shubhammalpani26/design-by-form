import { useState, useEffect } from 'react';
import { CreatorSidebar } from '@/components/CreatorSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Package, Users, DollarSign, ShoppingCart, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalViews: number;
  conversionRate: number;
  avgOrderValue: number;
  totalProducts: number;
  salesTrends: Array<{ date: string; sales: number; revenue: number }>;
  topProducts: Array<{ name: string; sales: number; revenue: number }>;
  customerDemographics: {
    byLocation: Array<{ location: string; count: number }>;
    byOrderValue: Array<{ range: string; count: number }>;
  };
  productViews: Array<{ product: string; views: number; purchases: number }>;
}

const COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  muted: 'hsl(var(--muted))',
  chart1: 'hsl(15 65% 55%)',
  chart2: 'hsl(145 25% 45%)',
  chart3: 'hsl(35 40% 60%)',
  chart4: 'hsl(200 60% 50%)',
  chart5: 'hsl(280 50% 55%)',
};

const AnalyticsDashboard = () => {
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalViews: 0,
    conversionRate: 0,
    avgOrderValue: 0,
    totalProducts: 0,
    salesTrends: [],
    topProducts: [],
    customerDemographics: {
      byLocation: [],
      byOrderValue: [],
    },
    productViews: [],
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
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

      // Fetch all products
      const { data: products } = await supabase
        .from('designer_products')
        .select('*')
        .eq('designer_id', profile.id);

      const totalProducts = products?.length || 0;

      // Fetch order items for this designer
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          *,
          designer_products!inner(name, id),
          orders!inner(created_at, status, total_amount, shipping_address)
        `)
        .eq('designer_id', profile.id)
        .eq('orders.status', 'completed');

      // Calculate total revenue and orders
      const totalRevenue = orderItems?.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0) || 0;
      const totalOrders = orderItems?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Fetch analytics data (views)
      const { data: analyticsData } = await supabase
        .from('usage_analytics')
        .select('*')
        .in('product_id', products?.map(p => p.id) || []);

      const totalViews = analyticsData?.filter(a => a.action_type === 'view').length || 0;
      const conversionRate = totalViews > 0 ? (totalOrders / totalViews) * 100 : 0;

      // Calculate sales trends (last 30 days)
      const salesTrends = calculateSalesTrends(orderItems || []);

      // Calculate top products
      const topProducts = calculateTopProducts(orderItems || []);

      // Calculate customer demographics
      const customerDemographics = calculateCustomerDemographics(orderItems || []);

      // Calculate product views vs purchases
      const productViews = calculateProductViews(products || [], analyticsData || [], orderItems || []);

      setAnalytics({
        totalRevenue,
        totalOrders,
        totalViews,
        conversionRate,
        avgOrderValue,
        totalProducts,
        salesTrends,
        topProducts,
        customerDemographics,
        productViews,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSalesTrends = (orderItems: any[]) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return last30Days.map(date => {
      const dayItems = orderItems.filter(item => {
        const orderDate = new Date(item.orders.created_at).toISOString().split('T')[0];
        return orderDate === date;
      });

      const sales = dayItems.length;
      const revenue = dayItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales,
        revenue,
      };
    });
  };

  const calculateTopProducts = (orderItems: any[]) => {
    const productSales: Record<string, { sales: number; revenue: number; name: string }> = {};

    orderItems.forEach(item => {
      const productId = item.product_id;
      const productName = item.designer_products?.name || 'Unknown Product';
      
      if (!productSales[productId]) {
        productSales[productId] = { sales: 0, revenue: 0, name: productName };
      }

      productSales[productId].sales += item.quantity;
      productSales[productId].revenue += Number(item.price) * item.quantity;
    });

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(p => ({
        name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
        sales: p.sales,
        revenue: p.revenue,
      }));
  };

  const calculateCustomerDemographics = (orderItems: any[]) => {
    // Location data from shipping addresses
    const locationCounts: Record<string, number> = {};
    
    orderItems.forEach(item => {
      const address = item.orders?.shipping_address;
      if (address?.country) {
        locationCounts[address.country] = (locationCounts[address.country] || 0) + 1;
      }
    });

    const byLocation = Object.entries(locationCounts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Order value ranges
    const ranges = {
      '₹0-₹5,000': 0,
      '₹5,001-₹15,000': 0,
      '₹15,001-₹30,000': 0,
      '₹30,001+': 0,
    };

    orderItems.forEach(item => {
      const value = Number(item.price) * item.quantity;
      if (value <= 5000) ranges['₹0-₹5,000']++;
      else if (value <= 15000) ranges['₹5,001-₹15,000']++;
      else if (value <= 30000) ranges['₹15,001-₹30,000']++;
      else ranges['₹30,001+']++;
    });

    const byOrderValue = Object.entries(ranges).map(([range, count]) => ({ range, count }));

    return { byLocation, byOrderValue };
  };

  const calculateProductViews = (products: any[], analytics: any[], orderItems: any[]) => {
    return products.slice(0, 5).map(product => {
      const views = analytics.filter(a => a.product_id === product.id && a.action_type === 'view').length;
      const purchases = orderItems.filter(item => item.product_id === product.id).length;
      
      return {
        product: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
        views,
        purchases,
      };
    });
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

  const chartConfig = {
    sales: {
      label: "Sales",
      color: COLORS.chart1,
    },
    revenue: {
      label: "Revenue",
      color: COLORS.chart2,
    },
    views: {
      label: "Views",
      color: COLORS.chart3,
    },
    purchases: {
      label: "Purchases",
      color: COLORS.chart4,
    },
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <CreatorSidebar />
        <main className="flex-1 p-8 bg-background">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Comprehensive insights into your sales and performance</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPrice(analytics.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">Lifetime earnings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">Completed orders</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.conversionRate.toFixed(2)}%</div>
                  <p className="text-xs text-muted-foreground">{analytics.totalViews} total views</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPrice(analytics.avgOrderValue)}</div>
                  <p className="text-xs text-muted-foreground">{analytics.totalProducts} products</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="trends" className="space-y-6">
              <TabsList>
                <TabsTrigger value="trends">Sales Trends</TabsTrigger>
                <TabsTrigger value="products">Top Products</TabsTrigger>
                <TabsTrigger value="demographics">Demographics</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              {/* Sales Trends Tab */}
              <TabsContent value="trends" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Sales Trends - Last 30 Days</CardTitle>
                    <CardDescription>Track your daily sales and revenue performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.salesTrends}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={COLORS.chart2} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={COLORS.chart2} stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={COLORS.chart1} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={COLORS.chart1} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="date" 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                          />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke={COLORS.chart2}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            strokeWidth={2}
                          />
                          <Area
                            type="monotone"
                            dataKey="sales"
                            stroke={COLORS.chart1}
                            fillOpacity={1}
                            fill="url(#colorSales)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Top Products Tab */}
              <TabsContent value="products" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top 10 Products by Revenue</CardTitle>
                    <CardDescription>Your best-selling products ranked by total revenue</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.topProducts} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={150}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={11}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="revenue" fill={COLORS.chart1} radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Product Sales Volume</CardTitle>
                    <CardDescription>Number of units sold per product</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.topProducts}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="name" 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10}
                            angle={-45}
                            textAnchor="end"
                            height={100}
                          />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="sales" fill={COLORS.chart2} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Demographics Tab */}
              <TabsContent value="demographics" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Orders by Location</CardTitle>
                      <CardDescription>Top 5 countries by order count</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.customerDemographics.byLocation}
                              dataKey="count"
                              nameKey="location"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              label={(entry) => entry.location}
                            >
                              {analytics.customerDemographics.byLocation.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % 5]} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Orders by Value Range</CardTitle>
                      <CardDescription>Distribution of order values</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.customerDemographics.byOrderValue}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="range" 
                              stroke="hsl(var(--muted-foreground))"
                              fontSize={11}
                            />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="count" fill={COLORS.chart3} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Performance - Views vs Purchases</CardTitle>
                    <CardDescription>Compare product views with actual purchases</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.productViews}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="product" 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={11}
                          />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Bar dataKey="views" fill={COLORS.chart3} radius={[4, 4, 0, 0]} name="Views" />
                          <Bar dataKey="purchases" fill={COLORS.chart4} radius={[4, 4, 0, 0]} name="Purchases" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">
                        {analytics.totalViews > 0 
                          ? ((analytics.totalOrders / analytics.totalViews) * 100).toFixed(1)
                          : 0}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Views to orders conversion</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Sales per Product</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-secondary">
                        {analytics.totalProducts > 0 
                          ? (analytics.totalOrders / analytics.totalProducts).toFixed(1)
                          : 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Average orders per product</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Revenue per View</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-accent-foreground">
                        {formatPrice(analytics.totalViews > 0 
                          ? analytics.totalRevenue / analytics.totalViews
                          : 0)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Average revenue generated per view</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AnalyticsDashboard;
