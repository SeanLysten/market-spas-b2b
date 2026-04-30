import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) {
    console.info("[Sentry] DSN not configured, skipping initialization");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.2, // 20% des transactions
    replaysSessionSampleRate: 0, // Pas de session replay par défaut
    replaysOnErrorSampleRate: 1.0, // Replay uniquement sur erreur
    beforeSend(event) {
      // Filtrer les erreurs de réseau non pertinentes
      if (event.exception?.values?.[0]?.value?.includes("Failed to fetch")) {
        return null;
      }
      if (event.exception?.values?.[0]?.value?.includes("aborted")) {
        return null;
      }
      return event;
    },
  });

  console.info("[Sentry] Frontend initialized successfully");
}

export { Sentry };
