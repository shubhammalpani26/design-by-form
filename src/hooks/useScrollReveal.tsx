import { useEffect, useRef, useState, useCallback } from "react";

interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useScrollReveal = (options: ScrollRevealOptions = {}) => {
  const { threshold = 0.15, rootMargin = "0px 0px -50px 0px", triggerOnce = true } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) observer.unobserve(el);
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
};

// Component wrapper for scroll reveal
interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  animation?: "fade-up" | "fade-left" | "fade-right" | "zoom-in" | "blur-in";
  delay?: number;
  duration?: number;
}

export const ScrollReveal = ({
  children,
  className = "",
  animation = "fade-up",
  delay = 0,
  duration = 600,
}: ScrollRevealProps) => {
  const { ref, isVisible } = useScrollReveal();

  const baseStyles: React.CSSProperties = {
    transitionProperty: "opacity, transform, filter",
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
    transitionDelay: `${delay}ms`,
  };

  const hiddenStyles: Record<string, React.CSSProperties> = {
    "fade-up": { opacity: 0, transform: "translateY(40px)" },
    "fade-left": { opacity: 0, transform: "translateX(-40px)" },
    "fade-right": { opacity: 0, transform: "translateX(40px)" },
    "zoom-in": { opacity: 0, transform: "scale(0.9)" },
    "blur-in": { opacity: 0, filter: "blur(10px)" },
  };

  const visibleStyles: React.CSSProperties = {
    opacity: 1,
    transform: "translate(0) scale(1)",
    filter: "blur(0px)",
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...baseStyles,
        ...(isVisible ? visibleStyles : hiddenStyles[animation]),
      }}
    >
      {children}
    </div>
  );
};

// Stagger children animation wrapper
interface StaggerRevealProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
  animation?: "fade-up" | "fade-left" | "fade-right" | "zoom-in" | "blur-in";
}

export const StaggerReveal = ({
  children,
  className = "",
  staggerDelay = 100,
  animation = "fade-up",
}: StaggerRevealProps) => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div ref={ref} className={className}>
      {children.map((child, index) => {
        const baseStyles: React.CSSProperties = {
          transitionProperty: "opacity, transform, filter",
          transitionDuration: "600ms",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          transitionDelay: `${index * staggerDelay}ms`,
        };

        const hiddenStyles: Record<string, React.CSSProperties> = {
          "fade-up": { opacity: 0, transform: "translateY(40px)" },
          "fade-left": { opacity: 0, transform: "translateX(-40px)" },
          "fade-right": { opacity: 0, transform: "translateX(40px)" },
          "zoom-in": { opacity: 0, transform: "scale(0.9)" },
          "blur-in": { opacity: 0, filter: "blur(10px)" },
        };

        const visibleStyles: React.CSSProperties = {
          opacity: 1,
          transform: "translate(0) scale(1)",
          filter: "blur(0px)",
        };

        return (
          <div
            key={index}
            style={{
              ...baseStyles,
              ...(isVisible ? visibleStyles : hiddenStyles[animation]),
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};

// Counter animation hook
export const useCountUp = (end: number, duration: number = 2000, startOnVisible: boolean = true) => {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useScrollReveal();
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    if (startOnVisible) hasAnimated.current = true;

    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration, startOnVisible]);

  return { count, ref, isVisible };
};
