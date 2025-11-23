import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, TrendingUp, Store } from "lucide-react";

interface SellingLocationsProps {
  category: string;
}

const locationData: Record<string, { markets: string[]; platforms: string[]; tips: string }> = {
  chairs: {
    markets: ["Urban metros", "Co-working spaces", "Premium residential"],
    platforms: ["Online marketplaces", "Interior design studios", "Corporate suppliers"],
    tips: "Target tech hubs and modern offices. Chairs have high repeat purchase potential.",
  },
  tables: {
    markets: ["Residential complexes", "Restaurants", "Conference facilities"],
    platforms: ["Furniture showrooms", "E-commerce platforms", "B2B wholesalers"],
    tips: "Focus on multi-functional designs. Tables sell best during home renovation seasons.",
  },
  storage: {
    markets: ["Small apartments", "Student housing", "Home offices"],
    platforms: ["Home improvement stores", "Online furniture retailers", "Direct-to-consumer"],
    tips: "Modular and space-saving designs perform exceptionally well in compact urban homes.",
  },
  decor: {
    markets: ["Boutique hotels", "Premium homes", "Commercial spaces"],
    platforms: ["Art galleries", "Interior decorator networks", "Premium e-commerce"],
    tips: "Position as investment pieces. Collaborate with interior designers for bulk orders.",
  },
  default: {
    markets: ["Metro cities", "Tier-1 & Tier-2 cities", "Online nationwide"],
    platforms: ["E-commerce platforms", "Furniture retailers", "Designer networks"],
    tips: "Build a strong online presence and leverage social media for maximum reach.",
  },
};

export const SellingLocations = ({ category }: SellingLocationsProps) => {
  const data = locationData[category.toLowerCase()] || locationData.default;

  return (
    <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-secondary" />
          Where to Sell Your Design
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Target markets and platforms for maximum visibility
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top Markets */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-secondary" />
            <h4 className="font-semibold text-foreground">Best Performing Markets</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.markets.map((market, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm border border-secondary/20"
              >
                {market}
              </span>
            ))}
          </div>
        </div>

        {/* Sales Channels */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Store className="w-4 h-4 text-secondary" />
            <h4 className="font-semibold text-foreground">Recommended Sales Channels</h4>
          </div>
          <ul className="space-y-2">
            {data.platforms.map((platform, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-secondary mt-0.5">•</span>
                <span>{platform}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Marketing Tips */}
        <div className="p-4 bg-secondary/10 rounded-lg border border-secondary/20">
          <h4 className="font-semibold text-foreground mb-2">Marketing Strategy</h4>
          <p className="text-sm text-foreground">{data.tips}</p>
        </div>

        {/* Action Items */}
        <div className="p-4 bg-background rounded-lg border border-border">
          <h4 className="font-semibold text-foreground mb-3">Your Action Plan</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Use your Success Kit to create stunning product photos for marketing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Share your designer profile link on social media and with your network</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Join interior design communities and showcase your work</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              <span>Track your analytics to understand what designs resonate with buyers</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
