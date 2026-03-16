import { useState, useCallback, useEffect } from "react";

const ONBOARDING_STORAGE_KEY = "market-spas-onboarding-completed";

/**
 * Hook to manage onboarding tour state per page.
 * Stores completed tours in localStorage so they only show once per user.
 */
export function useOnboarding(pageKey: string) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Check if this page's tour has already been completed
  const getCompletedTours = useCallback((): string[] => {
    try {
      const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const isCompleted = useCallback((): boolean => {
    return getCompletedTours().includes(pageKey);
  }, [pageKey, getCompletedTours]);

  const markCompleted = useCallback(() => {
    const completed = getCompletedTours();
    if (!completed.includes(pageKey)) {
      completed.push(pageKey);
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(completed));
    }
    setIsActive(false);
    setCurrentStep(0);
  }, [pageKey, getCompletedTours]);

  // Auto-start tour on first visit (with a small delay for DOM to render)
  useEffect(() => {
    if (!isCompleted()) {
      const timer = setTimeout(() => {
        setIsActive(true);
        setCurrentStep(0);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [pageKey, isCompleted]);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => prev + 1);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const skipTour = useCallback(() => {
    markCompleted();
  }, [markCompleted]);

  const restartTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  return {
    isActive,
    currentStep,
    nextStep,
    prevStep,
    skipTour,
    markCompleted,
    restartTour,
    isCompleted: isCompleted(),
  };
}

/**
 * Reset all onboarding tours (for testing or admin purposes)
 */
export function resetAllOnboarding() {
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
}

/**
 * Reset a specific page's onboarding tour
 */
export function resetOnboarding(pageKey: string) {
  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    const completed: string[] = stored ? JSON.parse(stored) : [];
    const filtered = completed.filter((key) => key !== pageKey);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}
