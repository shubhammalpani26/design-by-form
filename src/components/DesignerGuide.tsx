import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  X,
  HelpCircle
} from "lucide-react";

interface GuideStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string;
}

const guideSteps: GuideStep[] = [
  {
    title: "Welcome to AI Studio",
    description: "Let's walk through the design process. This guide will help you create your first furniture design using AI.",
    icon: <Lightbulb className="w-8 h-8" />,
  },
  {
    title: "Describe Your Design",
    description: "Start by typing a detailed description of the furniture you want to create. Be specific about style, materials, and features.",
    icon: <Wand2 className="w-8 h-8" />,
    target: "prompt-input",
  },
  {
    title: "Upload Reference Images (Optional)",
    description: "You can upload a sketch or room photo to help AI understand your vision better. This is optional but recommended.",
    icon: <Image className="w-8 h-8" />,
    target: "upload-section",
  },
  {
    title: "Generate Variations",
    description: "Click 'Generate Design' to create 3 unique variations. Each generation uses 1 credit from your balance.",
    icon: <MousePointer className="w-8 h-8" />,
    target: "generate-button",
  },
  {
    title: "Select & Customize",
    description: "Choose your favorite design, then customize colors, finishes, and dimensions. Set pricing and prepare for submission.",
    icon: <Settings className="w-8 h-8" />,
    target: "variations-section",
  },
  {
    title: "Submit to Marketplace",
    description: "Once satisfied with your design, submit it for review. Approved designs will be listed in the marketplace for buyers.",
    icon: <CheckCircle2 className="w-8 h-8" />,
    target: "submit-section",
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
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Designer Guide
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip Tutorial
            </Button>
          </div>
          <DialogDescription>
            Step {currentStep + 1} of {guideSteps.length}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step Content */}
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-primary/10 rounded-full text-primary">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground text-lg max-w-md">
                  {step.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Tips */}
          <Card className="bg-accent/50">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                Quick Tip
              </h4>
              <p className="text-sm text-muted-foreground">
                {currentStep === 0 && "You start with 10 free credits each month. Use them wisely to explore different design ideas."}
                {currentStep === 1 && "Example: 'Modern minimalist chair with curved wooden armrests and fabric cushioning'"}
                {currentStep === 2 && "Supported formats: JPG, PNG. Max size: 10MB. Room photos help AI match existing decor."}
                {currentStep === 3 && "Each generation creates 3 variations. Pick the one that best matches your vision."}
                {currentStep === 4 && "Experiment with different colors and finishes. Pricing updates automatically based on dimensions."}
                {currentStep === 5 && "All designs go through a review process to ensure quality and manufacturability."}
              </p>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            <div className="flex gap-1">
              {guideSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === currentStep
                      ? "bg-primary w-6"
                      : index < currentStep
                      ? "bg-primary/50"
                      : "bg-secondary"
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
