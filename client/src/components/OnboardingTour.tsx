import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";

export interface TourStep {
  /** CSS selector for the target element to highlight */
  target: string;
  /** Title of the tip */
  title: string;
  /** Description/explanation of the element */
  description: string;
  /** Position of the tooltip relative to the target */
  position?: "top" | "bottom" | "left" | "right" | "auto";
}

interface OnboardingTourProps {
  steps: TourStep[];
  isActive: boolean;
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

export function OnboardingTour({
  steps,
  isActive,
  currentStep,
  onNext,
  onPrev,
  onSkip,
  onComplete,
}: OnboardingTourProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const [arrowDirection, setArrowDirection] = useState<string>("top");
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const calculatePosition = useCallback(() => {
    if (!step || !isActive) return;

    const target = document.querySelector(step.target);
    if (!target) {
      // If target not found, show tooltip in center
      setTargetRect(null);
      setTooltipStyle({
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10002,
      });
      return;
    }

    const rect = target.getBoundingClientRect();
    setTargetRect(rect);

    // Scroll element into view if needed
    const isInView =
      rect.top >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.left >= 0 &&
      rect.right <= window.innerWidth;

    if (!isInView) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      // Recalculate after scroll
      setTimeout(() => {
        const newRect = target.getBoundingClientRect();
        setTargetRect(newRect);
        positionTooltip(newRect, step.position);
      }, 400);
    } else {
      positionTooltip(rect, step.position);
    }
  }, [step, isActive]);

  const positionTooltip = (rect: DOMRect, preferredPosition?: string) => {
    const tooltipWidth = 340;
    const tooltipHeight = 200;
    const margin = 16;
    const arrowSize = 8;

    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = window.innerWidth - rect.right;

    let pos = preferredPosition || "auto";

    if (pos === "auto") {
      // Pick the best position based on available space
      if (spaceBelow >= tooltipHeight + margin) {
        pos = "bottom";
      } else if (spaceAbove >= tooltipHeight + margin) {
        pos = "top";
      } else if (spaceRight >= tooltipWidth + margin) {
        pos = "right";
      } else if (spaceLeft >= tooltipWidth + margin) {
        pos = "left";
      } else {
        pos = "bottom";
      }
    }

    const style: React.CSSProperties = {
      position: "fixed",
      zIndex: 10002,
      maxWidth: `${tooltipWidth}px`,
      width: `${tooltipWidth}px`,
    };

    const arrow: React.CSSProperties = {
      position: "absolute",
      width: 0,
      height: 0,
    };

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    switch (pos) {
      case "bottom":
        style.top = `${rect.bottom + margin}px`;
        style.left = `${Math.max(margin, Math.min(centerX - tooltipWidth / 2, window.innerWidth - tooltipWidth - margin))}px`;
        arrow.top = `-${arrowSize}px`;
        arrow.left = `${Math.min(Math.max(centerX - parseFloat(String(style.left)) - arrowSize, 16), tooltipWidth - 32)}px`;
        arrow.borderLeft = `${arrowSize}px solid transparent`;
        arrow.borderRight = `${arrowSize}px solid transparent`;
        arrow.borderBottom = `${arrowSize}px solid var(--card)`;
        setArrowDirection("top");
        break;
      case "top":
        style.bottom = `${window.innerHeight - rect.top + margin}px`;
        style.left = `${Math.max(margin, Math.min(centerX - tooltipWidth / 2, window.innerWidth - tooltipWidth - margin))}px`;
        arrow.bottom = `-${arrowSize}px`;
        arrow.left = `${Math.min(Math.max(centerX - parseFloat(String(style.left)) - arrowSize, 16), tooltipWidth - 32)}px`;
        arrow.borderLeft = `${arrowSize}px solid transparent`;
        arrow.borderRight = `${arrowSize}px solid transparent`;
        arrow.borderTop = `${arrowSize}px solid var(--card)`;
        setArrowDirection("bottom");
        break;
      case "right":
        style.left = `${rect.right + margin}px`;
        style.top = `${Math.max(margin, Math.min(centerY - tooltipHeight / 2, window.innerHeight - tooltipHeight - margin))}px`;
        arrow.left = `-${arrowSize}px`;
        arrow.top = `${Math.min(Math.max(centerY - parseFloat(String(style.top)) - arrowSize, 16), tooltipHeight - 32)}px`;
        arrow.borderTop = `${arrowSize}px solid transparent`;
        arrow.borderBottom = `${arrowSize}px solid transparent`;
        arrow.borderRight = `${arrowSize}px solid var(--card)`;
        setArrowDirection("left");
        break;
      case "left":
        style.right = `${window.innerWidth - rect.left + margin}px`;
        style.top = `${Math.max(margin, Math.min(centerY - tooltipHeight / 2, window.innerHeight - tooltipHeight - margin))}px`;
        arrow.right = `-${arrowSize}px`;
        arrow.top = `${Math.min(Math.max(centerY - parseFloat(String(style.top)) - arrowSize, 16), tooltipHeight - 32)}px`;
        arrow.borderTop = `${arrowSize}px solid transparent`;
        arrow.borderBottom = `${arrowSize}px solid transparent`;
        arrow.borderLeft = `${arrowSize}px solid var(--card)`;
        setArrowDirection("right");
        break;
    }

    setTooltipStyle(style);
    setArrowStyle(arrow);
  };

  useEffect(() => {
    if (!isActive) return;
    setIsAnimating(true);
    const timer = setTimeout(() => {
      calculatePosition();
      setIsAnimating(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [currentStep, isActive, calculatePosition]);

  // Recalculate on resize/scroll
  useEffect(() => {
    if (!isActive) return;

    const handleResize = () => calculatePosition();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [isActive, calculatePosition]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip();
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (isLastStep) onComplete();
        else onNext();
      }
      if (e.key === "ArrowLeft" && currentStep > 0) onPrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, currentStep, isLastStep, onNext, onPrev, onSkip, onComplete]);

  if (!isActive || !step) return null;

  const padding = 8;

  return (
    <>
      {/* Overlay with cutout for highlighted element */}
      <div
        className="fixed inset-0 z-[10000] transition-opacity duration-300"
        style={{ opacity: isAnimating ? 0 : 1 }}
      >
        {/* Dark overlay */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: "auto" }}
          onClick={onSkip}
        >
          <defs>
            <mask id="onboarding-mask">
              <rect width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - padding}
                  y={targetRect.top - padding}
                  width={targetRect.width + padding * 2}
                  height={targetRect.height + padding * 2}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.6)"
            mask="url(#onboarding-mask)"
          />
        </svg>

        {/* Highlight border around target */}
        {targetRect && (
          <div
            className="absolute rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent transition-all duration-300 pointer-events-none"
            style={{
              left: targetRect.left - padding,
              top: targetRect.top - padding,
              width: targetRect.width + padding * 2,
              height: targetRect.height + padding * 2,
              boxShadow: "0 0 0 4px rgba(var(--primary-rgb, 59, 130, 246), 0.3), 0 0 20px rgba(var(--primary-rgb, 59, 130, 246), 0.15)",
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[10002] transition-all duration-300"
        style={{
          ...tooltipStyle,
          opacity: isAnimating ? 0 : 1,
          transform: `${tooltipStyle.transform || ""} ${isAnimating ? "translateY(8px)" : "translateY(0)"}`,
        }}
      >
        {/* Arrow */}
        <div style={arrowStyle} />

        {/* Content */}
        <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {currentStep + 1} / {steps.length}
              </span>
            </div>
            <button
              onClick={onSkip}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent"
              title="Fermer le guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 pb-3">
            <h3 className="font-semibold text-base mb-1.5">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Progress bar */}
          <div className="px-4 pb-3">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full flex-1 transition-colors duration-300 ${
                    i <= currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 pb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Passer le guide
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrev}
                  className="gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Précédent</span>
                </Button>
              )}
              <Button
                size="sm"
                onClick={isLastStep ? onComplete : onNext}
                className="gap-1"
              >
                {isLastStep ? (
                  "Terminer"
                ) : (
                  <>
                    Suivant
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
