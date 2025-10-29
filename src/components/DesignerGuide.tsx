import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  Sparkles
} from "lucide-react";

interface GuideStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  tip: string;
  visual?: string;
}

const guideSteps: GuideStep[] = [
  {
    title: "Welcome to AI Studio",
    description: "Create custom furniture designs using AI. This quick guide will show you the process from idea to marketplace-ready product.",
    icon: <Sparkles className="w-8 h-8" />,
    tip: "You start with 10 free credits each month!",
  },
  {
    title: "Step 1: Describe Your Design",
    description: "Use the text area to describe your furniture piece. Be specific about style, materials, dimensions, and any unique features you want.",
    icon: <Wand2 className="w-8 h-8" />,
    tip: "Example: 'Modern minimalist dining chair with curved wooden armrests, fabric cushion, and matte black legs'",
  },
  {
    title: "Step 2: Add References (Optional)",
    description: "Upload a sketch or room photo to help the AI understand your vision. You can also specify room context for better results.",
    icon: <Image className="w-8 h-8" />,
    tip: "Supported formats: JPG, PNG. Max 10MB. Room photos help match your existing space!",
  },
  {
    title: "Step 3: Generate Designs",
    description: "Click the 'Generate Design' button to create 3 unique variations. Each generation uses 1 credit. Review all variations before selecting one.",
    icon: <MousePointer className="w-8 h-8" />,
    tip: "The AI creates 3 variations per generation. Pick the one you like best!",
  },
  {
    title: "Step 4: Customize & Submit",
    description: "After selecting a design, customize colors, finishes, and dimensions. Set your pricing, then submit for marketplace review.",
    icon: <CheckCircle2 className="w-8 h-8" />,
    tip: "All designs go through quality review to ensure manufacturability. You'll earn royalties on every sale!",
  },
];

interface DesignerGuideProps {
  onComplete: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const DesignerGuide = ({ onComplete, isOpen, onClose }: DesignerGuideProps) => {
  const [currentStep, setCurrentStep] = useState(0);

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

  const step = guideSteps[currentStep];
  const progress = ((currentStep + 1) / guideSteps.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <div className="space-y-6">
          {/* Header with Skip */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Designer Quick Start</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip Tutorial
            </Button>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Step {currentStep + 1} of {guideSteps.length}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <Card className="border-primary/20">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-primary/10 rounded-full text-primary">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground text-base max-w-md leading-relaxed">
                  {step.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tip Card */}
          <Card className="bg-accent/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Quick Tip</h4>
                  <p className="text-sm text-muted-foreground">
                    {step.tip}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            <div className="flex gap-1.5">
              {guideSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? "bg-primary w-8"
                      : index < currentStep
                      ? "bg-primary/50 w-2"
                      : "bg-secondary w-2"
                  }`}
                />
              ))}
            </div>

            <Button onClick={handleNext}>
              {currentStep === guideSteps.length - 1 ? (
                <>
                  Get Started
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
