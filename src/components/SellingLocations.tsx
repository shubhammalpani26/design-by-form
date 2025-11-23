import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, TrendingUp, Store } from "lucide-react";

interface SellingLocationsProps {
  category: string;
}

const locationData: Record<string, { markets: string[]; platforms: string[]; tips: string }> = {
  chairs: {
    markets: ["Urban metros", "Co-working spaces", "Premium residential"],
    platforms: ["Online marketplaces", "Interior design studios", "Corporate suppliers"],
    tips: "Chairs are easy to sell in tech hubs and modern offices. High repeat purchase potential means steady income.",
  },
  tables: {
    markets: ["Residential complexes", "Restaurants", "Conference facilities"],
    platforms: ["Furniture showrooms", "E-commerce platforms", "B2B wholesalers"],
    tips: "Tables are perfect for multi-functional designs. Home renovation seasons bring the best sales opportunities.",
  },
  benches: {
    markets: ["Outdoor spaces", "Public parks", "Residential gardens"],
    platforms: ["Garden centers", "Outdoor furniture stores", "E-commerce platforms"],
    tips: "Benches sell great for outdoor and entryway spaces. Weather-resistant designs are always in demand.",
  },
  storage: {
    markets: ["Small apartments", "Student housing", "Home offices"],
    platforms: ["Home improvement stores", "Online furniture retailers", "Direct-to-consumer"],
    tips: "Storage solutions sell fast in compact urban homes. Space-saving and modular designs are in high demand.",
  },
  decor: {
    markets: ["Boutique hotels", "Premium homes", "Commercial spaces"],
    platforms: ["Art galleries", "Interior decorator networks", "Premium e-commerce"],
    tips: "Decor items are easy to position as investment pieces. Partner with interior designers for bulk orders.",
  },
  lighting: {
    markets: ["Modern homes", "Restaurants", "Boutique hotels"],
    platforms: ["Lighting showrooms", "Interior design studios", "Premium e-commerce"],
    tips: "Lighting fixtures transform spaces instantly. Statement pieces and energy-efficient designs sell best.",
  },
  default: {
    markets: ["Metro cities", "Tier-1 & Tier-2 cities", "Online nationwide"],
    platforms: ["E-commerce platforms", "Furniture retailers", "Designer networks"],
    tips: "Build a strong online presence and leverage social media for maximum reach.",
  },
};

export const SellingLocations = ({ category }: SellingLocationsProps) => {
  // Normalize category to match locationData keys
  const normalizedCategory = category.toLowerCase().trim();
  const data = locationData[normalizedCategory] || locationData.default;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-secondary/10 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <MapPin className="w-6 h-6 text-primary" />
          Where to Sell Your Product
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ready-to-target markets and proven sales channels
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
        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
          <h4 className="font-semibold text-foreground mb-2">Quick Win Strategy</h4>
          <p className="text-sm text-foreground leading-relaxed">{data.tips}</p>
        </div>

        {/* Action Items */}
        <div className="p-4 bg-background rounded-lg border border-primary/30">
          <h4 className="font-semibold text-foreground mb-3">Get Started in 3 Easy Steps</h4>
          <ul className="space-y-2 text-sm text-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5 font-bold">1.</span>
              <span>Download your Success Kit - get professional product photos ready instantly</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5 font-bold">2.</span>
              <span>Share your designer profile link - let your network discover your work</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5 font-bold">3.</span>
              <span>Track your analytics - see what buyers love and optimize your designs</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
