import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Lightbulb, 
  Image, 
  Wand2, 
  MousePointer, 
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Sparkles,
  X
} from "lucide-react";

interface GuideStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  tip: string;
  targetId: string;
  position: "top" | "bottom" | "left" | "right";
}

const guideSteps: GuideStep[] = [
  {
    title: "Welcome to AI Studio!",
    description: "Let's create your first furniture design. I'll guide you through each step.",
    icon: <Sparkles className="w-6 h-6" />,
    tip: "You have 10 free credits each month to create designs",
    targetId: "welcome-card",
    position: "bottom",
  },
  {
    title: "Describe Your Design",
    description: "Start here - describe the furniture you want to create in detail.",
    icon: <Wand2 className="w-6 h-6" />,
    tip: "Be specific about style, materials, and dimensions for best results",
    targetId: "prompt-input",
    position: "bottom",
  },
  {
    title: "Upload References",
    description: "Optionally upload a sketch or room photo to help the AI understand your vision.",
    icon: <Image className="w-6 h-6" />,
    tip: "Room photos help the AI design furniture that matches your space",
    targetId: "upload-section",
    position: "top",
  },
  {
    title: "Generate Designs",
    description: "Click this button to generate 3 unique design variations (uses 1 credit).",
    icon: <MousePointer className="w-6 h-6" />,
    tip: "Each generation creates 3 variations to choose from",
    targetId: "generate-button",
    position: "top",
  },
];

interface DesignerGuideProps {
  onComplete: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const DesignerGuide = ({ onComplete, isOpen, onClose }: DesignerGuideProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const step = guideSteps[currentStep];
      const element = document.getElementById(step.targetId);

      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);

        // Calculate tooltip position
        const tooltipWidth = 380;
        const tooltipHeight = 200;
        const padding = 16;

        let top = 0;
        let left = 0;

        switch (step.position) {
          case "bottom":
            top = rect.bottom + window.scrollY + padding;
            left = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);
            break;
          case "top":
            top = rect.top + window.scrollY - tooltipHeight - padding;
            left = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);
            break;
          case "left":
            top = rect.top + window.scrollY + (rect.height / 2) - (tooltipHeight / 2);
            left = rect.left + window.scrollX - tooltipWidth - padding;
            break;
          case "right":
            top = rect.top + window.scrollY + (rect.height / 2) - (tooltipHeight / 2);
            left = rect.right + window.scrollX + padding;
            break;
        }

        // Keep tooltip on screen
        left = Math.max(10, Math.min(left, window.innerWidth - tooltipWidth - 10));
        top = Math.max(10, top);

        setTooltipPosition({ top, left });

        // Scroll element into view
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        // Element not found - show centered
        setTargetRect(null);
        setTooltipPosition({
          top: window.innerHeight / 2 - 100,
          left: window.innerWidth / 2 - 190,
        });
      }
    };

    // Initial update with delay for DOM
    const timer = setTimeout(updatePosition, 150);

    // Update on scroll/resize
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [currentStep, isOpen]);

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("designer-guide-completed", "true");
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem("designer-guide-completed", "true");
    onClose();
  };

  if (!isOpen || !tooltipPosition) return null;

  const step = guideSteps[currentStep];
  const progress = ((currentStep + 1) / guideSteps.length) * 100;

  return createPortal(
    <>
      {/* Backdrop with cutout for target element */}
      <div className="fixed inset-0 z-[9998]" style={{ pointerEvents: "none" }}>
        <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#spotlight-mask)"
            style={{ pointerEvents: "auto" }}
            onClick={handleSkip}
          />
        </svg>
      </div>

      {/* Highlight ring around target */}
      {targetRect && (
        <div
          className="fixed z-[9999] rounded-lg ring-4 ring-primary animate-pulse pointer-events-none"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {/* Tooltip Card */}
      <Card
        className="fixed z-[10000] w-[380px] border-primary shadow-2xl"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                {step.icon}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Step {currentStep + 1} of {guideSteps.length}
                </p>
                <h3 className="text-base font-semibold">{step.title}</h3>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mt-1 -mr-1"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-secondary rounded-full h-1 mb-3">
            <div
              className="bg-primary h-1 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-3">
            {step.description}
          </p>

          {/* Tip */}
          <div className="bg-accent/50 rounded-lg p-2.5 mb-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{step.tip}</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Back
            </Button>

            <div className="flex gap-1">
              {guideSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentStep
                      ? "bg-primary w-6"
                      : index < currentStep
                      ? "bg-primary/50 w-1.5"
                      : "bg-secondary w-1.5"
                  }`}
                />
              ))}
            </div>

            <Button size="sm" onClick={handleNext}>
              {currentStep === guideSteps.length - 1 ? (
                <>
                  Done <CheckCircle2 className="w-3.5 h-3.5 ml-1.5" />
                </>
              ) : (
                <>
                  Next <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>,
    document.body
  );
};

export const HelpButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 shadow-lg"
    >
      <HelpCircle className="w-4 h-4 mr-2" />
      Help
    </Button>
  );
};
