import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  actionLabel: string;
  actionLink: string;
}

interface OnboardingChecklistProps {
  steps: OnboardingStep[];
}

export const OnboardingChecklist = ({ steps }: OnboardingChecklistProps) => {
  const completedSteps = steps.filter(step => step.completed).length;
  const progress = (completedSteps / steps.length) * 100;
  const allCompleted = completedSteps === steps.length;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Getting Started</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Complete these steps to start selling your designs
            </p>
          </div>
          <Badge variant={allCompleted ? "default" : "secondary"} className="text-sm">
            {completedSteps}/{steps.length} Complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {allCompleted && (
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 text-primary mb-2">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">All Set! 🎉</span>
            </div>
            <p className="text-sm text-muted-foreground">
              You've completed all the setup steps. Start creating amazing designs and grow your business!
            </p>
          </div>
        )}

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`
                p-4 rounded-lg border transition-all
                ${step.completed ? 'bg-muted/50 border-border' : 'bg-background border-primary/20'}
              `}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {step.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium ${step.completed ? 'text-muted-foreground' : 'text-primary'}`}>
                      Step {index + 1}
                    </span>
                    {step.completed && (
                      <Badge variant="outline" className="text-xs">Done</Badge>
                    )}
                  </div>
                  <h4 className={`font-semibold mb-1 ${step.completed ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {step.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {step.description}
                  </p>
                  {!step.completed && (
                    <Button asChild size="sm" variant="outline">
                      <Link to={step.actionLink}>
                        {step.actionLabel}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
