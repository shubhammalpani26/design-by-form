import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Lightbulb, 
  Image, 
  Wand2, 
  MousePointer, 
  Settings, 
  CheckCircle2,
  ArrowRight,
  HelpCircle
} from "lucide-react";

interface GuideStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  target: string;
  tip: string;
  position: "top" | "bottom" | "left" | "right";
}

const guideSteps: GuideStep[] = [
  {
    title: "Welcome to AI Studio",
    description: "Let's walk through how to create your first furniture design. This quick guide will show you each step of the process.",
    icon: <Lightbulb className="w-6 h-6" />,
    target: "",
    tip: "You start with 10 free credits each month to create designs!",
    position: "bottom",
  },
  {
    title: "Describe Your Design",
    description: "Start by typing a detailed description of the furniture you want to create. Be specific about style, materials, and features.",
    icon: <Wand2 className="w-6 h-6" />,
    target: "prompt-input",
    tip: "Example: 'Modern minimalist chair with curved wooden armrests and fabric cushioning'",
    position: "bottom",
  },
  {
    title: "Upload Reference Images",
    description: "Upload a sketch or room photo to help AI understand your vision better. This is optional but recommended.",
    icon: <Image className="w-6 h-6" />,
    target: "upload-section",
    tip: "Supported: JPG, PNG. Max 10MB. Room photos help match existing decor.",
    position: "bottom",
  },
  {
    title: "Generate Your Designs",
    description: "Click the generate button to create 3 unique variations. Each generation uses 1 credit from your monthly balance.",
    icon: <MousePointer className="w-6 h-6" />,
    target: "generate-button",
    tip: "The AI will create three different variations for you to choose from!",
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
  const [targetPosition, setTargetPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const updateTargetPosition = () => {
      const step = guideSteps[currentStep];
      
      // If no target specified (welcome screen), don't try to find element
      if (!step.target) {
        setTargetPosition(null);
        return;
      }
      
      const element = document.getElementById(step.target);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
        
        // Scroll element into view smoothly
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Element not found yet
        console.log(`Guide element not found: ${step.target}`);
        setTargetPosition(null);
      }
    };

    // Delay to ensure DOM is ready
    const timer = setTimeout(updateTargetPosition, 100);
    
    // Update on scroll/resize
    window.addEventListener('scroll', updateTargetPosition);
    window.addEventListener('resize', updateTargetPosition);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', updateTargetPosition);
      window.removeEventListener('resize', updateTargetPosition);
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

  // Calculate tooltip position based on target and preferred position
  const getTooltipStyle = (): React.CSSProperties => {
    // Center the tooltip if no target position (welcome screen or element not found)
    if (!targetPosition) {
      return { 
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }
    
    const padding = 20;
    const tooltipWidth = 400;
    const tooltipHeight = 280;
    
    let style: React.CSSProperties = { position: 'fixed' as const };
    
    switch (step.position) {
      case 'bottom':
        style = {
          ...style,
          top: targetPosition.top + targetPosition.height + padding,
          left: Math.max(10, Math.min(
            window.innerWidth - tooltipWidth - 10,
            targetPosition.left + (targetPosition.width / 2) - (tooltipWidth / 2)
          )),
        };
        break;
      case 'top':
        style = {
          ...style,
          top: Math.max(10, targetPosition.top - tooltipHeight - padding),
          left: Math.max(10, Math.min(
            window.innerWidth - tooltipWidth - 10,
            targetPosition.left + (targetPosition.width / 2) - (tooltipWidth / 2)
          )),
        };
        break;
      case 'left':
        style = {
          ...style,
          top: Math.max(10, targetPosition.top + (targetPosition.height / 2) - (tooltipHeight / 2)),
          left: Math.max(10, targetPosition.left - tooltipWidth - padding),
        };
        break;
      case 'right':
        style = {
          ...style,
          top: Math.max(10, targetPosition.top + (targetPosition.height / 2) - (tooltipHeight / 2)),
          left: Math.min(window.innerWidth - tooltipWidth - 10, targetPosition.left + targetPosition.width + padding),
        };
        break;
    }
    
    return style;
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
        onClick={handleSkip}
      />
      
      {/* Spotlight Effect */}
      {targetPosition && (
        <>
          <div 
            className="fixed z-[101] rounded-lg ring-4 ring-primary shadow-elegant animate-pulse"
            style={{
              top: targetPosition.top - 8,
              left: targetPosition.left - 8,
              width: targetPosition.width + 16,
              height: targetPosition.height + 16,
              pointerEvents: 'none',
            }}
          />
          <div 
            className="fixed z-[101] rounded-lg bg-background"
            style={{
              top: targetPosition.top,
              left: targetPosition.left,
              width: targetPosition.width,
              height: targetPosition.height,
              pointerEvents: 'none',
              opacity: 0,
            }}
          />
        </>
      )}

      {/* Guide Tooltip */}
      <Card 
        className="fixed z-[102] w-[400px] border-primary shadow-2xl"
        style={getTooltipStyle()}
      >
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                {step.icon}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Step {currentStep + 1} of {guideSteps.length}
                </p>
                <h3 className="text-lg font-semibold">{step.title}</h3>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground -mt-2 -mr-2"
            >
              Skip
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-secondary rounded-full h-1.5 mb-4">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-3">
            {step.description}
          </p>

          {/* Tip */}
          <div className="bg-accent/50 rounded-lg p-3 mb-4">
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
              Previous
            </Button>
            
            <div className="flex gap-1">
              {guideSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-1.5 rounded-full transition-all ${
                    index === currentStep
                      ? "bg-primary w-4"
                      : index < currentStep
                      ? "bg-primary/50"
                      : "bg-secondary"
                  }`}
                />
              ))}
            </div>

            <Button size="sm" onClick={handleNext}>
              {currentStep === guideSteps.length - 1 ? (
                <>
                  Done
                  <CheckCircle2 className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
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
      className="fixed bottom-6 right-6 z-50 shadow-lg"
    >
      <HelpCircle className="w-4 h-4 mr-2" />
      Help
    </Button>
  );
};
