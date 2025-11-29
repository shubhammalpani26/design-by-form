import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Trophy, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export const WeeklyThemes = () => {
  // This would typically come from a database or CMS
  const currentTheme = {
    title: "Organic Curves",
    description: "Create furniture with flowing, natural forms",
    endDate: "Dec 31, 2024",
    prize: "Featured on Homepage + ₹5,000 bonus",
  };

  const editorsPick = {
    designerName: "Priya Sharma",
    designerId: "designer-id-123",
    productName: "Wave Lounge Chair",
    productId: "product-id-456",
    reason: "Outstanding use of sustainable materials with innovative form",
  };

  return (
    <div className="space-y-6">
      {/* Weekly Theme Challenge */}
      <Card className="border-2 border-accent bg-gradient-to-br from-accent/10 to-accent/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-accent" />
            This Week's Theme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-xl">{currentTheme.title}</h3>
              <Badge variant="secondary" className="bg-accent/20">
                <Zap className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {currentTheme.description}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Trophy className="h-4 w-4 text-accent" />
              <span className="font-semibold">{currentTheme.prize}</span>
            </div>
            <p className="text-xs text-muted-foreground">Ends: {currentTheme.endDate}</p>
          </div>
          <Button asChild size="sm" className="w-full">
            <Link to="/design-studio">Submit Design</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Editor's Pick */}
      <Card className="border-2 border-secondary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-secondary" />
            Editor's Pick
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Link
              to={`/product/${editorsPick.productId}`}
              className="font-semibold hover:text-primary transition-colors"
            >
              {editorsPick.productName}
            </Link>
            <p className="text-sm text-muted-foreground mb-2">
              by{" "}
              <Link
                to={`/creator/${editorsPick.designerId}`}
                className="font-medium hover:text-primary transition-colors"
              >
                {editorsPick.designerName}
              </Link>
            </p>
            <p className="text-xs text-muted-foreground italic">
              "{editorsPick.reason}"
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link to={`/product/${editorsPick.productId}`}>View Design</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Algorithm Info */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6 text-center space-y-2">
          <Zap className="h-8 w-8 mx-auto text-primary mb-2" />
          <h3 className="font-semibold text-sm">Fair Discovery Algorithm</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Our algorithm promotes variety and gives every creator equal opportunity
            for homepage exposure, not just top sellers
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
