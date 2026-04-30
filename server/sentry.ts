import * as Sentry from "@sentry/node";

const SENTRY_DSN = process.env.SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) {
    console.info("[Sentry] DSN not configured, skipping initialization");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.2, // 20% des transactions en prod pour limiter le volume
    sendDefaultPii: false, // Ne pas envoyer les données personnelles par défaut
    beforeSend(event) {
      // Filtrer les erreurs non pertinentes
      if (event.exception?.values?.[0]?.value?.includes("aborted")) {
        return null;
      }
      return event;
    },
  });

  console.info("[Sentry] Initialized successfully");
}

export function setupSentryExpressErrorHandler(app: any) {
  if (!SENTRY_DSN) return;
  Sentry.setupExpressErrorHandler(app);
}

export { Sentry };
