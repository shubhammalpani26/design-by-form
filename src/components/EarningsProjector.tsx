import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { TrendingUp, IndianRupee, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const EarningsProjector = () => {
  const [sellingPrice, setSellingPrice] = useState(75000);
  const [basePrice, setBasePrice] = useState(50000);
  const [monthlySales, setMonthlySales] = useState(10);

  const markup = Math.max(0, sellingPrice - basePrice);
  const earningsPerSale = markup * 0.7;
  const platformPerSale = markup * 0.3;
  const monthlyEarnings = earningsPerSale * monthlySales;
  const yearlyEarnings = monthlyEarnings * 12;

  const formatINR = (amount: number) =>
    `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-accent/30 to-background">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg text-foreground">Earnings Projector</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[240px]">
                <p className="text-xs">Estimate your monthly income by adjusting the sliders. You earn 70% of the markup above Manufacturing Base Price.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* MBP Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-muted-foreground">Manufacturing Base Price (MBP)</Label>
            <span className="text-sm font-semibold text-foreground">{formatINR(basePrice)}</span>
          </div>
          <Slider
            value={[basePrice]}
            onValueChange={(v) => {
              setBasePrice(v[0]);
              if (sellingPrice < v[0]) setSellingPrice(v[0]);
            }}
            min={5000}
            max={200000}
            step={5000}
            className="py-1"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>₹5,000</span>
            <span>₹2,00,000</span>
          </div>
        </div>

        {/* Selling Price */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-muted-foreground">Your Selling Price</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {basePrice > 0 ? ((markup / basePrice) * 100).toFixed(0) : 0}% markup
              </span>
              <span className="text-sm font-semibold text-foreground">{formatINR(sellingPrice)}</span>
            </div>
          </div>
          <Slider
            value={[sellingPrice]}
            onValueChange={(v) => setSellingPrice(Math.max(v[0], basePrice))}
            min={basePrice}
            max={Math.max(basePrice * 4, basePrice + 10000)}
            step={1000}
            className="py-1"
          />
        </div>

        {/* Monthly Sales */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-muted-foreground">Avg. Sales per Month</Label>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={monthlySales}
                onChange={(e) => setMonthlySales(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 h-8 text-center text-sm font-semibold"
                min={0}
                max={100}
              />
              <span className="text-xs text-muted-foreground">pieces</span>
            </div>
          </div>
          <Slider
            value={[monthlySales]}
            onValueChange={(v) => setMonthlySales(v[0])}
            min={0}
            max={50}
            step={1}
            className="py-1"
          />
        </div>

        {/* Per-Sale Breakdown */}
        <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Per Sale Breakdown</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 rounded-lg bg-background">
              <p className="text-[10px] text-muted-foreground mb-1">MBP</p>
              <p className="text-sm font-semibold text-foreground">{formatINR(basePrice)}</p>
            </div>
            <div className="p-2 rounded-lg bg-background">
              <p className="text-[10px] text-muted-foreground mb-1">Platform (30%)</p>
              <p className="text-sm font-semibold text-foreground">{formatINR(platformPerSale)}</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-[10px] text-primary font-medium mb-1">You Earn (70%)</p>
              <p className="text-sm font-bold text-primary">{formatINR(earningsPerSale)}</p>
            </div>
          </div>
          {/* Stacked bar */}
          {sellingPrice > basePrice && (
            <div className="h-6 rounded-lg overflow-hidden flex">
              <div
                className="bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground"
                style={{ width: `${(basePrice / sellingPrice) * 100}%` }}
              >
                MBP
              </div>
              <div
                className="bg-secondary/30 flex items-center justify-center text-[9px] font-medium text-secondary-foreground"
                style={{ width: `${(platformPerSale / sellingPrice) * 100}%` }}
              >
                30%
              </div>
              <div
                className="bg-primary flex items-center justify-center text-[9px] font-medium text-primary-foreground"
                style={{ width: `${(earningsPerSale / sellingPrice) * 100}%` }}
              >
                70%
              </div>
            </div>
          )}
        </div>

        {/* Projected Earnings */}
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Projected Earnings</p>
          <div className="grid grid-cols-2 gap-3 min-w-0">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Monthly</p>
              <p className="text-lg sm:text-2xl font-bold text-primary break-words leading-tight">{formatINR(monthlyEarnings)}</p>
              <p className="text-[10px] text-muted-foreground mt-1 break-words">
                {monthlySales} × {formatINR(earningsPerSale)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Yearly</p>
              <p className="text-lg sm:text-2xl font-bold text-primary break-words leading-tight">{formatINR(yearlyEarnings)}</p>
              <p className="text-[10px] text-muted-foreground mt-1 break-words">
                {monthlySales * 12} × {formatINR(earningsPerSale)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
