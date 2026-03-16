// Manus OAuth has been removed. Authentication is handled locally via email/password.
// This file is kept as a stub to avoid breaking imports during cleanup.
import type { Express } from "express";

export function registerOAuthRoutes(_app: Express) {
  // No-op: Manus OAuth routes have been removed.
  // Authentication is now fully local (email/password + JWT session).
}
