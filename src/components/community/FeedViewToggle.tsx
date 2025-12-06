import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedViewToggleProps {
  view: "feed" | "grid";
  onViewChange: (view: "feed" | "grid") => void;
}

export const FeedViewToggle = ({ view, onViewChange }: FeedViewToggleProps) => {
  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <Button
        variant={view === "feed" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewChange("feed")}
        className="gap-2"
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">Feed</span>
      </Button>
      <Button
        variant={view === "grid" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewChange("grid")}
        className="gap-2"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Grid</span>
      </Button>
    </div>
  );
};
