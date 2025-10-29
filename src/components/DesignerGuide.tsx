import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  tip: string;
  targetId: string;
}

const guideSteps: GuideStep[] = [
  {
    title: "Welcome! Let's Create Your First Design",
    description: "I'll guide you through the design process step by step. Click Next to begin.",
    tip: "You have 10 free credits to get started!",
    targetId: "welcome-card",
  },
  {
    title: "Step 1: Describe Your Design",
    description: "Type a detailed description of the furniture you want to create. Be specific about style, materials, and features.",
    tip: "Example: 'Modern minimalist chair with curved wooden armrests and gray fabric cushion'",
    targetId: "prompt-input",
  },
  {
    title: "Step 2: Upload References (Optional)",
    description: "You can upload a sketch or room photo to help the AI understand your vision better.",
    tip: "Supported: JPG, PNG up to 10MB. Room photos help match your space!",
    targetId: "upload-section",
  },
  {
    title: "Step 3: Generate Your Designs",
    description: "Click this button to generate 3 unique design variations. Each generation uses 1 credit.",
    tip: "Review all 3 variations and pick your favorite to customize further!",
    targetId: "generate-button",
  },
];

interface DesignerGuideProps {
  onComplete: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const DesignerGuide = ({ onComplete, isOpen, onClose }: DesignerGuideProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [elementRect, setElementRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updateHighlight = () => {
      const step = guideSteps[currentStep];
      const element = document.getElementById(step.targetId);

      if (element) {
        const rect = element.getBoundingClientRect();
        setElementRect(rect);
        
        // Smooth scroll into view
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        });
      } else {
        setElementRect(null);
      }
    };

    // Wait for DOM to be ready
    const timer = setTimeout(updateHighlight, 200);

    // Update on window changes
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight, true);
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

  if (!isOpen) return null;

  const step = guideSteps[currentStep];
  const progress = ((currentStep + 1) / guideSteps.length) * 100;

  // Calculate tooltip position
  const getTooltipStyle = () => {
    if (!elementRect) {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10002,
      };
    }

    const tooltipWidth = 360;
    const gap = 20;
    
    // Try to position below the element
    let top = elementRect.bottom + gap;
    let left = elementRect.left + (elementRect.width / 2) - (tooltipWidth / 2);

    // If too far down, position above
    if (top + 250 > window.innerHeight) {
      top = elementRect.top - 250 - gap;
    }

    // Keep within horizontal bounds
    if (left < 10) left = 10;
    if (left + tooltipWidth > window.innerWidth - 10) {
      left = window.innerWidth - tooltipWidth - 10;
    }

    // Keep within vertical bounds
    if (top < 10) top = 10;

    return {
      position: 'fixed' as const,
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 10002,
    };
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        style={{ zIndex: 10000 }}
        onClick={handleSkip}
      />

      {/* Highlight ring around target element */}
      {elementRect && (
        <div
          className="fixed rounded-xl ring-4 ring-primary shadow-2xl pointer-events-none animate-pulse"
          style={{
            top: `${elementRect.top - 8}px`,
            left: `${elementRect.left - 8}px`,
            width: `${elementRect.width + 16}px`,
            height: `${elementRect.height + 16}px`,
            zIndex: 10001,
          }}
        />
      )}

      {/* Guide tooltip */}
      <Card 
        className="w-[360px] border-primary/50 shadow-2xl"
        style={getTooltipStyle()}
      >
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {currentStep === 0 ? <Sparkles className="w-5 h-5 text-primary" /> :
                 currentStep === 1 ? <Wand2 className="w-5 h-5 text-primary" /> :
                 currentStep === 2 ? <Image className="w-5 h-5 text-primary" /> :
                 <MousePointer className="w-5 h-5 text-primary" />}
                <span className="text-xs text-muted-foreground">
                  Step {currentStep + 1} of {guideSteps.length}
                </span>
              </div>
              <h3 className="font-semibold text-base leading-tight">{step.title}</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-secondary rounded-full h-1">
            <div
              className="bg-primary h-1 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>

          {/* Tip box */}
          <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-foreground font-medium">{step.tip}</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Back
            </Button>

            {/* Step indicators */}
            <div className="flex gap-1.5">
              {guideSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentStep
                      ? "bg-primary w-6"
                      : index < currentStep
                      ? "bg-primary/50 w-1.5"
                      : "bg-muted w-1.5"
                  }`}
                />
              ))}
            </div>

            <Button size="sm" onClick={handleNext} className="min-w-[80px]">
              {currentStep === guideSteps.length - 1 ? (
                <>
                  Done <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
                </>
              ) : (
                <>
                  Next <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
};

export const HelpButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 shadow-lg hover:shadow-xl transition-shadow"
    >
      <HelpCircle className="w-4 h-4 mr-2" />
      Help
    </Button>
  );
};
