import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Sparkles } from "lucide-react";

const trends = [
  {
    category: "Chairs & Seating",
    trend: "Organic Curves & Biophilic Designs",
    description: "Flowing, nature-inspired forms with sustainable materials",
    demand: "High",
  },
  {
    category: "Tables",
    trend: "Minimalist Multi-Functional",
    description: "Clean lines with hidden storage and adaptable configurations",
    demand: "High",
  },
  {
    category: "Storage",
    trend: "Modular Wall Systems",
    description: "Customizable shelving with integrated lighting",
    demand: "Medium",
  },
  {
    category: "Decor",
    trend: "Sculptural Statement Pieces",
    description: "Bold, artistic accessories that double as art",
    demand: "Medium",
  },
];

export const FurnitureTrends = () => {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Current Furniture Trends
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Design with these trends in mind to maximize your sales potential
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trends.map((trend, index) => (
            <div
              key={index}
              className="bg-background rounded-lg p-4 border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-foreground">{trend.category}</h4>
                  <p className="text-sm text-primary font-medium">{trend.trend}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    trend.demand === "High"
                      ? "bg-green-500/10 text-green-600"
                      : "bg-yellow-500/10 text-yellow-600"
                  }`}
                >
                  {trend.demand} Demand
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{trend.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground">
              <strong>Pro Tip:</strong> Designs that align with current trends see 3x higher conversion rates. 
              Focus on sustainability, functionality, and aesthetic appeal.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
