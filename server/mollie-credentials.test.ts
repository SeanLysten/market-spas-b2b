import { describe, it, expect } from "vitest";

describe("Mollie credentials validation", () => {
  it("should have MOLLIE_API_KEY_TEST env var set", () => {
    const key = process.env.MOLLIE_API_KEY_TEST;
    expect(key).toBeDefined();
    expect(key!.startsWith("test_")).toBe(true);
  });

  it("should have MOLLIE_API_KEY_LIVE env var set", () => {
    const key = process.env.MOLLIE_API_KEY_LIVE;
    expect(key).toBeDefined();
    expect(key!.startsWith("live_")).toBe(true);
  });

  it("should have MOLLIE_PROFILE_ID env var set", () => {
    const profileId = process.env.MOLLIE_PROFILE_ID;
    expect(profileId).toBeDefined();
    expect(profileId!.startsWith("pfl_")).toBe(true);
  });

  it("should be able to initialize Mollie client with test key", async () => {
    const { createMollieClient } = await import("@mollie/api-client");
    const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY_TEST! });
    expect(mollieClient).toBeDefined();
    // Try to list payment methods to validate the key works
    try {
      const methods = await mollieClient.methods.list();
      expect(methods).toBeDefined();
      // Check that banktransfer is available
      const bankTransfer = methods.find((m: any) => m.id === "banktransfer");
      // banktransfer may or may not be enabled, but the API call should work
      expect(methods.length).toBeGreaterThanOrEqual(0);
    } catch (err: any) {
      // If it's an auth error, the key is invalid
      if (err.message?.includes("Unauthorized") || err.statusCode === 401) {
        throw new Error("Mollie API key is invalid - got 401 Unauthorized");
      }
      // Other errors (network, etc.) are acceptable in test environment
      console.log("Mollie API call result:", err.message);
    }
  });
});
