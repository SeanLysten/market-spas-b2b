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
 * 
 * KEY FIX: The tour only shows once per account, ever. Once marked as completed
 * on the server, it will never show again regardless of browser/device.
 */
export function useOnboarding(pageKey: string) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  // Track whether we already attempted to auto-start for this pageKey in this mount
  const autoStartAttemptedRef = useRef<string | null>(null);

  // Fetch completed tours from server (source of truth)
  // Use a long staleTime so we don't re-fetch on every navigation
  const serverQuery = trpc.auth.getCompletedOnboarding.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in garbage collection for 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const markCompletedMutation = trpc.auth.markOnboardingCompleted.useMutation();
  const utils = trpc.useUtils();

  // Sync server data to localStorage when it arrives
  useEffect(() => {
    if (serverQuery.data) {
      setLocalCompleted(serverQuery.data);
    }
  }, [serverQuery.data]);

  // Check if this page's tour has been completed
  const isCompletedForKey = useCallback((key: string): boolean => {
    // Check server data first (source of truth)
    if (serverQuery.data) {
      return serverQuery.data.includes(key);
    }
    // Fallback to localStorage while server loads
    return getLocalCompleted().includes(key);
  }, [serverQuery.data]);

  const markCompleted = useCallback(() => {
    // Update localStorage immediately
    const local = getLocalCompleted();
    if (!local.includes(pageKey)) {
      local.push(pageKey);
      setLocalCompleted(local);
    }
    // Update server and invalidate cache so future queries reflect the change
    markCompletedMutation.mutate({ pageKey }, {
      onSuccess: () => {
        // Update the cached query data directly to avoid refetch
        utils.auth.getCompletedOnboarding.setData(undefined, (old) => {
          if (!old) return [pageKey];
          if (old.includes(pageKey)) return old;
          return [...old, pageKey];
        });
      },
    });
    setIsActive(false);
    setCurrentStep(0);
  }, [pageKey, markCompletedMutation, utils]);

  // Auto-start tour on first visit ONLY if:
  // 1. Server data has loaded (not loading)
  // 2. The tour has NOT been completed (server says so)
  // 3. We haven't already attempted auto-start for this pageKey in this mount
  useEffect(() => {
    // Wait for server data to load before deciding
    if (serverQuery.isLoading) return;

    // Don't re-attempt for the same pageKey
    if (autoStartAttemptedRef.current === pageKey) return;

    // Mark that we attempted for this pageKey
    autoStartAttemptedRef.current = pageKey;

    // If already completed, do nothing
    if (isCompletedForKey(pageKey)) return;

    // Start the tour with a small delay for DOM to render
    const timer = setTimeout(() => {
      // Double-check completion status right before showing
      // (in case it was marked completed between the check and the timeout)
      if (!isCompletedForKey(pageKey)) {
        setIsActive(true);
        setCurrentStep(0);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [pageKey, serverQuery.isLoading, isCompletedForKey]);

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
    isCompleted: isCompletedForKey(pageKey),
  };
}

/**
 * Reset all onboarding tours (for testing or admin purposes)
 * Resets on both server and localStorage
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
        // Update cached data to empty array
        utils.auth.getCompletedOnboarding.setData(undefined, () => []);
        // Also invalidate to force refetch on next access
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
