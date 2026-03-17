import { useState, useCallback, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

const ONBOARDING_STORAGE_KEY = "market-spas-onboarding-completed";

/**
 * Get completed tours from localStorage (fast cache)
 */
function getLocalCompleted(): string[] {
  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save completed tours to localStorage (fast cache)
 */
function setLocalCompleted(completed: string[]) {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(completed));
  } catch {
    // ignore
  }
}

/**
 * Hook to manage onboarding tour state per page.
 * Stores completed tours in both localStorage (fast) and server DB (persistent).
 * The server is the source of truth; localStorage is a fast cache.
 */
export function useOnboarding(pageKey: string) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const hasStartedRef = useRef(false);
  const pageKeyRef = useRef(pageKey);
  pageKeyRef.current = pageKey;

  // Fetch completed tours from server (source of truth)
  const serverQuery = trpc.auth.getCompletedOnboarding.useQuery(undefined, {
    staleTime: 60_000, // Cache for 1 minute
    retry: 1,
  });

  const markCompletedMutation = trpc.auth.markOnboardingCompleted.useMutation();

  // Sync server data to localStorage when it arrives
  useEffect(() => {
    if (serverQuery.data) {
      setLocalCompleted(serverQuery.data);
    }
  }, [serverQuery.data]);

  // Check if this page's tour has been completed (check both server and local)
  const isCompleted = useCallback((): boolean => {
    // Check server data first (source of truth)
    if (serverQuery.data) {
      return serverQuery.data.includes(pageKeyRef.current);
    }
    // Fallback to localStorage while server loads
    return getLocalCompleted().includes(pageKeyRef.current);
  }, [serverQuery.data]);

  const markCompleted = useCallback(() => {
    const key = pageKeyRef.current;
    // Update localStorage immediately
    const local = getLocalCompleted();
    if (!local.includes(key)) {
      local.push(key);
      setLocalCompleted(local);
    }
    // Update server
    markCompletedMutation.mutate({ pageKey: key });
    setIsActive(false);
    setCurrentStep(0);
  }, [markCompletedMutation]);

  // Auto-start tour on first visit (with a small delay for DOM to render)
  // Only start after server data has loaded to avoid false starts
  useEffect(() => {
    // Wait for server data to load before deciding
    if (serverQuery.isLoading) return;
    
    // Don't start if already started for this page
    if (hasStartedRef.current) return;

    if (!isCompleted()) {
      hasStartedRef.current = true;
      const timer = setTimeout(() => {
        setIsActive(true);
        setCurrentStep(0);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [pageKey, isCompleted, serverQuery.isLoading]);

  // Reset hasStartedRef when pageKey changes
  useEffect(() => {
    hasStartedRef.current = false;
  }, [pageKey]);

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
 * Now also resets on the server
 */
export function useResetAllOnboarding() {
  const resetMutation = trpc.auth.resetOnboarding.useMutation();
  const utils = trpc.useUtils();

  return useCallback(() => {
    // Clear localStorage
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    // Clear server
    resetMutation.mutate(undefined, {
      onSuccess: () => {
        // Invalidate the query so tours will show again
        utils.auth.getCompletedOnboarding.invalidate();
      },
    });
  }, [resetMutation, utils]);
}

/**
 * @deprecated Use useResetAllOnboarding hook instead for server-synced reset
 */
export function resetAllOnboarding() {
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
}

/**
 * Reset a specific page's onboarding tour (localStorage only - legacy)
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
