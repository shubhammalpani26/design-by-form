import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { IndianRupee, TrendingUp, Percent, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PriceCalculatorProps {
  basePrice: number;
  designerPrice: number;
  onPriceChange: (newPrice: number) => void;
  readOnly?: boolean;
}

export const PriceCalculator = ({ basePrice, designerPrice, onPriceChange, readOnly = false }: PriceCalculatorProps) => {
  const [price, setPrice] = useState(designerPrice);

  useEffect(() => {
    setPrice(designerPrice);
  }, [designerPrice]);

  const markup = Math.max(0, price - basePrice);
  const yourEarnings = markup * 0.7;
  const platformFee = markup * 0.3;
  const markupPercent = basePrice > 0 ? ((markup / basePrice) * 100).toFixed(0) : '0';
  const minPrice = basePrice;
  const maxPrice = basePrice * 4;

  const handleSliderChange = (value: number[]) => {
    const newPrice = value[0];
    setPrice(newPrice);
    onPriceChange(newPrice);
  };

  const handleInputChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setPrice(numValue);
    onPriceChange(numValue);
  };

  const formatINR = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-accent/30 to-background">
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg text-foreground">Earnings Calculator</h3>
        </div>

        {/* MBP Display */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Manufacturing Base Price</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[220px]">
                  <p className="text-xs">Set by the platform based on production requirements. This is the minimum selling price.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="font-semibold text-foreground">{formatINR(basePrice)}</span>
        </div>

        {/* Your Selling Price */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Your Selling Price</Label>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {markupPercent}% markup
            </span>
          </div>
          
          {!readOnly ? (
            <>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="pl-9 text-lg font-semibold h-12"
                  min={basePrice}
                />
              </div>
              <Slider
                value={[Math.min(price, maxPrice)]}
                onValueChange={handleSliderChange}
                min={minPrice}
                max={maxPrice}
                step={500}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatINR(minPrice)}</span>
                <span>{formatINR(maxPrice)}</span>
              </div>
            </>
          ) : (
            <div className="text-2xl font-bold text-foreground">{formatINR(price)}</div>
          )}
        </div>

        {/* Visual Breakdown */}
        <div className="space-y-2 pt-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Breakdown per sale</p>
          
          {/* Stacked Bar */}
          <div className="h-8 rounded-lg overflow-hidden flex">
            {basePrice > 0 && (
              <div
                className="bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground"
                style={{ width: `${(basePrice / Math.max(price, 1)) * 100}%` }}
              >
                {((basePrice / Math.max(price, 1)) * 100).toFixed(0)}%
              </div>
            )}
            {platformFee > 0 && (
              <div
                className="bg-secondary/30 flex items-center justify-center text-[10px] font-medium text-secondary-foreground"
                style={{ width: `${(platformFee / Math.max(price, 1)) * 100}%` }}
              >
                {((platformFee / Math.max(price, 1)) * 100).toFixed(0)}%
              </div>
            )}
            {yourEarnings > 0 && (
              <div
                className="bg-primary flex items-center justify-center text-[10px] font-medium text-primary-foreground"
                style={{ width: `${(yourEarnings / Math.max(price, 1)) * 100}%` }}
              >
                {((yourEarnings / Math.max(price, 1)) * 100).toFixed(0)}%
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                <span className="text-[10px] text-muted-foreground">MBP</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{formatINR(basePrice)}</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary/10">
              <div className="flex items-center justify-center gap-1 mb-1">
                <div className="w-2 h-2 rounded-full bg-secondary/50" />
                <span className="text-[10px] text-muted-foreground">Platform</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{formatINR(platformFee)}</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-center gap-1 mb-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[10px] text-primary font-medium">You Earn</span>
              </div>
              <p className="text-sm font-bold text-primary">{formatINR(yourEarnings)}</p>
            </div>
          </div>
        </div>

        {/* Monthly estimate */}
        {yourEarnings > 0 && (
          <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
            <p className="text-xs text-muted-foreground mb-1">Estimated monthly income</p>
            <div className="flex items-baseline gap-3">
              <div>
                <span className="text-lg font-bold text-primary">{formatINR(yourEarnings * 5)}</span>
                <span className="text-xs text-muted-foreground ml-1">@ 5 sales</span>
              </div>
              <div className="text-muted-foreground">·</div>
              <div>
                <span className="text-lg font-bold text-primary">{formatINR(yourEarnings * 15)}</span>
                <span className="text-xs text-muted-foreground ml-1">@ 15 sales</span>
              </div>
            </div>
          </div>
        )}

        {price < basePrice && price > 0 && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <Info className="h-3 w-3" />
            Price must be at least {formatINR(basePrice)} (Manufacturing Base Price)
          </p>
        )}
      </CardContent>
    </Card>
  );
};
