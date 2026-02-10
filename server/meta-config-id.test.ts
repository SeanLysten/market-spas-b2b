import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Meta OAuth config_id", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("META_CONFIG_ID should be set in environment", () => {
    const configId = process.env.META_CONFIG_ID;
    expect(configId).toBeDefined();
    expect(configId).not.toBe("");
    expect(configId).toBe("905361441974416");
  });

  it("getMetaOAuthUrl should use config_id when META_CONFIG_ID is set", async () => {
    vi.stubEnv("META_APP_ID", "1228586458787257");
    vi.stubEnv("META_CONFIG_ID", "905361441974416");

    const { getMetaOAuthUrl } = await import("./meta-oauth");
    const url = getMetaOAuthUrl("https://marketspas.pro/api/auth/meta/callback", "test-state");

    expect(url).toContain("config_id=905361441974416");
    expect(url).toContain("override_default_response_type=true");
    expect(url).toContain("response_type=code");
    expect(url).not.toContain("scope=");
    expect(url).not.toContain("display=page");
  });

  it("getMetaOAuthUrl should fallback to scope when META_CONFIG_ID is not set", async () => {
    vi.stubEnv("META_APP_ID", "1228586458787257");
    vi.stubEnv("META_CONFIG_ID", "");

    // Need to re-import to get fresh module
    vi.resetModules();
    const { getMetaOAuthUrl } = await import("./meta-oauth");
    const url = getMetaOAuthUrl("https://marketspas.pro/api/auth/meta/callback", "test-state");

    expect(url).toContain("scope=");
    expect(url).not.toContain("config_id=");
  });
});
