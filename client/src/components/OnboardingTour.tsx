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
  const [tooltipPos, setTooltipPos] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recalcCountRef = useRef(0);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  // Scroll target into view and then position tooltip
  const scrollAndPosition = useCallback(() => {
    if (!step || !isActive) return;

    setIsReady(false);
    recalcCountRef.current = 0;

    const target = document.querySelector(step.target) as HTMLElement | null;
    if (!target) {
      // Target not found → center tooltip
      setTargetRect(null);
      setTooltipPos({
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10002,
      });
      setArrowStyle({});
      setTimeout(() => setIsReady(true), 100);
      return;
    }

    // First, scroll the element into view
    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

    // Wait for scroll to finish, then position
    const waitAndPosition = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
        positionTooltipAroundRect(rect, step.position);
        setIsReady(true);

        // Double-check position after a short delay (scroll might still be settling)
        if (recalcCountRef.current < 2) {
          recalcCountRef.current++;
          setTimeout(() => {
            const freshRect = target.getBoundingClientRect();
            // Only update if position changed significantly
            if (Math.abs(freshRect.top - rect.top) > 5 || Math.abs(freshRect.left - rect.left) > 5) {
              setTargetRect(freshRect);
              positionTooltipAroundRect(freshRect, step.position);
            }
          }, 350);
        }
      }, 450);
    };

    waitAndPosition();
  }, [step, isActive]);

  const positionTooltipAroundRect = (rect: DOMRect, preferredPosition?: string) => {
    const tooltipWidth = 340;
    const tooltipEstHeight = 220;
    const margin = 16;
    const arrowSize = 8;
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    const spaceAbove = rect.top;
    const spaceBelow = viewH - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = viewW - rect.right;

    let pos = preferredPosition || "auto";

    if (pos === "auto") {
      if (spaceBelow >= tooltipEstHeight + margin) {
        pos = "bottom";
      } else if (spaceAbove >= tooltipEstHeight + margin) {
        pos = "top";
      } else if (spaceRight >= tooltipWidth + margin) {
        pos = "right";
      } else if (spaceLeft >= tooltipWidth + margin) {
        pos = "left";
      } else {
        // Not enough space anywhere → place below and clamp to viewport
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
      case "bottom": {
        let top = rect.bottom + margin;
        // Clamp: ensure tooltip doesn't go below viewport
        if (top + tooltipEstHeight > viewH - margin) {
          top = Math.max(margin, viewH - tooltipEstHeight - margin);
        }
        let left = Math.max(margin, Math.min(centerX - tooltipWidth / 2, viewW - tooltipWidth - margin));
        style.top = `${top}px`;
        style.left = `${left}px`;
        arrow.top = `-${arrowSize}px`;
        arrow.left = `${Math.min(Math.max(centerX - left - arrowSize, 16), tooltipWidth - 32)}px`;
        arrow.borderLeft = `${arrowSize}px solid transparent`;
        arrow.borderRight = `${arrowSize}px solid transparent`;
        arrow.borderBottom = `${arrowSize}px solid var(--card)`;
        break;
      }
      case "top": {
        let bottom = viewH - rect.top + margin;
        // Clamp: ensure tooltip doesn't go above viewport
        if (viewH - bottom - tooltipEstHeight < margin) {
          bottom = Math.max(margin, viewH - tooltipEstHeight - margin);
        }
        let left = Math.max(margin, Math.min(centerX - tooltipWidth / 2, viewW - tooltipWidth - margin));
        style.bottom = `${bottom}px`;
        style.left = `${left}px`;
        arrow.bottom = `-${arrowSize}px`;
        arrow.left = `${Math.min(Math.max(centerX - left - arrowSize, 16), tooltipWidth - 32)}px`;
        arrow.borderLeft = `${arrowSize}px solid transparent`;
        arrow.borderRight = `${arrowSize}px solid transparent`;
        arrow.borderTop = `${arrowSize}px solid var(--card)`;
        break;
      }
      case "right": {
        let left = rect.right + margin;
        if (left + tooltipWidth > viewW - margin) {
          left = Math.max(margin, viewW - tooltipWidth - margin);
        }
        let top = Math.max(margin, Math.min(centerY - tooltipEstHeight / 2, viewH - tooltipEstHeight - margin));
        style.left = `${left}px`;
        style.top = `${top}px`;
        arrow.left = `-${arrowSize}px`;
        arrow.top = `${Math.min(Math.max(centerY - top - arrowSize, 16), tooltipEstHeight - 32)}px`;
        arrow.borderTop = `${arrowSize}px solid transparent`;
        arrow.borderBottom = `${arrowSize}px solid transparent`;
        arrow.borderRight = `${arrowSize}px solid var(--card)`;
        break;
      }
      case "left": {
        let right = viewW - rect.left + margin;
        if (viewW - right - tooltipWidth < margin) {
          right = Math.max(margin, viewW - tooltipWidth - margin);
        }
        let top = Math.max(margin, Math.min(centerY - tooltipEstHeight / 2, viewH - tooltipEstHeight - margin));
        style.right = `${right}px`;
        style.top = `${top}px`;
        arrow.right = `-${arrowSize}px`;
        arrow.top = `${Math.min(Math.max(centerY - top - arrowSize, 16), tooltipEstHeight - 32)}px`;
        arrow.borderTop = `${arrowSize}px solid transparent`;
        arrow.borderBottom = `${arrowSize}px solid transparent`;
        arrow.borderLeft = `${arrowSize}px solid var(--card)`;
        break;
      }
    }

    setTooltipPos(style);
    setArrowStyle(arrow);
  };

  // Trigger scroll+position on step change
  useEffect(() => {
    if (!isActive) return;
    scrollAndPosition();
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [currentStep, isActive, scrollAndPosition]);

  // Recalculate on resize (debounced)
  useEffect(() => {
    if (!isActive) return;

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (step) {
          const target = document.querySelector(step.target);
          if (target) {
            const rect = target.getBoundingClientRect();
            setTargetRect(rect);
            positionTooltipAroundRect(rect, step.position);
          }
        }
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    // Listen to scroll on capture to update highlight position
    const handleScroll = () => {
      if (step) {
        const target = document.querySelector(step.target);
        if (target) {
          const rect = target.getBoundingClientRect();
          setTargetRect(rect);
          positionTooltipAroundRect(rect, step.position);
        }
      }
    };
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
      clearTimeout(resizeTimer);
    };
  }, [isActive, step]);

  // Keyboard navigation
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
        style={{ opacity: isReady ? 1 : 0 }}
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
              boxShadow:
                "0 0 0 4px rgba(var(--primary-rgb, 59, 130, 246), 0.3), 0 0 20px rgba(var(--primary-rgb, 59, 130, 246), 0.15)",
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[10002] transition-all duration-300"
        style={{
          ...tooltipPos,
          opacity: isReady ? 1 : 0,
          transform: `${tooltipPos.transform || ""} ${isReady ? "translateY(0)" : "translateY(8px)"}`,
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
