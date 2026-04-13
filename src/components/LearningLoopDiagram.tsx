import { useEffect, useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const steps = [
  {
    id: "observe",
    label: "Observe",
    desc: "Capture real production data",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <circle cx="12" cy="12" r="3" />
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
      </svg>
    ),
  },
  {
    id: "encode",
    label: "Encode",
    desc: "Map maker capabilities and materials",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
      </svg>
    ),
  },
  {
    id: "predict",
    label: "Predict",
    desc: "Estimate outcomes and feasibility",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    id: "compound",
    label: "Compound",
    desc: "Continuously improve with every build",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M23 6l-9.5 9.5-5-5L1 18" />
        <path d="M17 6h6v6" />
      </svg>
    ),
  },
];

const LearningLoopDiagram = () => {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3, triggerOnce: true });
  const [activeStep, setActiveStep] = useState(-1);

  useEffect(() => {
    if (!isVisible) return;

    // Animate steps sequentially
    const timers: NodeJS.Timeout[] = [];
    steps.forEach((_, i) => {
      timers.push(setTimeout(() => setActiveStep(i), 400 + i * 500));
    });

    // Then loop continuously
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 2500);
    timers.push(interval as unknown as NodeJS.Timeout);

    return () => timers.forEach(clearTimeout);
  }, [isVisible]);

  return (
    <div ref={ref} className="relative max-w-3xl mx-auto">
      {/* Desktop: Horizontal flow */}
      <div className="hidden md:flex items-start justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-8 left-[10%] right-[10%] h-px bg-border" />
        
        {/* Animated progress line */}
        <div
          className="absolute top-8 left-[10%] h-px bg-primary transition-all duration-700 ease-out"
          style={{
            width: activeStep >= 0 ? `${Math.min((activeStep / (steps.length - 1)) * 80, 80)}%` : "0%",
          }}
        />

        {steps.map((step, i) => {
          const isActive = i === activeStep;
          const isPast = i < activeStep;

          return (
            <div
              key={step.id}
              className="relative flex flex-col items-center text-center z-10 flex-1"
              onMouseEnter={() => setActiveStep(i)}
            >
              {/* Node */}
              <div
                className={`
                  w-16 h-16 rounded-full flex items-center justify-center
                  transition-all duration-500 ease-out
                  ${isActive
                    ? "bg-primary text-primary-foreground scale-110 shadow-lg"
                    : isPast
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-muted text-muted-foreground border border-border"
                  }
                `}
              >
                {step.icon}
              </div>

              {/* Label */}
              <p
                className={`
                  mt-3 text-sm font-semibold tracking-tight transition-colors duration-300
                  ${isActive ? "text-foreground" : "text-muted-foreground"}
                `}
              >
                {step.label}
              </p>

              {/* Description */}
              <p
                className={`
                  mt-1 text-[11px] transition-all duration-500
                  ${isActive ? "text-muted-foreground opacity-100 translate-y-0" : "text-muted-foreground/50 opacity-60 translate-y-1"}
                `}
              >
                {step.desc}
              </p>

              {/* Arrow between nodes (except last) */}
              {i < steps.length - 1 && (
                <div className="absolute top-7 -right-2 text-muted-foreground/30">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: Vertical flow */}
      <div className="md:hidden space-y-0">
        {steps.map((step, i) => {
          const isActive = i === activeStep;
          const isPast = i < activeStep;

          return (
            <div key={step.id} className="flex items-start gap-4">
              {/* Vertical line + node */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center shrink-0
                    transition-all duration-500
                    ${isActive
                      ? "bg-primary text-primary-foreground scale-110"
                      : isPast
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-muted text-muted-foreground border border-border"
                    }
                  `}
                >
                  {step.icon}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-px h-8 transition-colors duration-500 ${isPast || isActive ? "bg-primary/40" : "bg-border"}`} />
                )}
              </div>

              {/* Content */}
              <div className="pt-2 pb-4">
                <p className={`text-sm font-semibold tracking-tight transition-colors duration-300 ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loop indicator */}
      <div className="flex items-center justify-center mt-6 gap-2">
        <div className="h-px w-8 bg-border" />
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">Continuous loop</p>
        <div className="h-px w-8 bg-border" />
      </div>
    </div>
  );
};

export default LearningLoopDiagram;
