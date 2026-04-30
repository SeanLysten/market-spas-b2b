import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Sentry Configuration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("should have SENTRY_DSN environment variable configured", () => {
    const dsn = process.env.SENTRY_DSN;
    expect(dsn).toBeDefined();
    expect(dsn).toContain("sentry.io");
  });

  it("should have VITE_SENTRY_DSN environment variable configured", () => {
    const dsn = process.env.VITE_SENTRY_DSN;
    expect(dsn).toBeDefined();
    expect(dsn).toContain("sentry.io");
  });

  it("should have valid DSN format (https://key@org.ingest.sentry.io/project)", () => {
    const dsn = process.env.SENTRY_DSN!;
    expect(dsn).toMatch(/^https:\/\/[a-f0-9]+@[a-z0-9]+\.ingest\.[a-z]+\.sentry\.io\/\d+$/);
  });

  it("initSentry should not throw when DSN is configured", async () => {
    const { initSentry } = await import("./sentry");
    expect(() => initSentry()).not.toThrow();
  });

  it("initSentry should handle missing DSN gracefully", async () => {
    const originalDsn = process.env.SENTRY_DSN;
    delete process.env.SENTRY_DSN;
    
    // Re-import to get fresh module
    vi.resetModules();
    const { initSentry } = await import("./sentry");
    expect(() => initSentry()).not.toThrow();
    
    // Restore
    process.env.SENTRY_DSN = originalDsn;
  });
});
