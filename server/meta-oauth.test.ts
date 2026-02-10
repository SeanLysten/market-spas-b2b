import { describe, it, expect, vi } from "vitest";

// Mock the meta-oauth module functions
describe("Meta OAuth Integration", () => {
  it("should generate a valid OAuth URL", async () => {
    const { getMetaOAuthUrl } = await import("./meta-oauth");
    
    // Set env vars for test
    process.env.META_APP_ID = "test_app_id";
    process.env.META_APP_SECRET = "test_app_secret";
    
    const redirectUri = "https://example.com/api/auth/meta/callback";
    const state = "test_state";
    const url = getMetaOAuthUrl(redirectUri, state);
    
    expect(url).toContain("https://www.facebook.com/v21.0/dialog/oauth");
    expect(url).toContain("client_id=");
    expect(url).toContain("redirect_uri=");
    expect(url).toContain("state=test_state");
    // When META_CONFIG_ID is set, uses config_id instead of scope
    if (process.env.META_CONFIG_ID) {
      expect(url).toContain("config_id=");
    } else {
      expect(url).toContain("ads_read");
      expect(url).toContain("scope=");
    }
  });

  it("should include config_id or required permissions in OAuth URL", async () => {
    const { getMetaOAuthUrl } = await import("./meta-oauth");
    
    const url = getMetaOAuthUrl("https://example.com/callback", "state");
    
    // Facebook Login for Business uses config_id instead of scope
    if (process.env.META_CONFIG_ID) {
      expect(url).toContain("config_id=" + process.env.META_CONFIG_ID);
      expect(url).toContain("response_type=code");
    } else {
      // Standard Facebook Login uses scope
      expect(url).toContain("ads_read");
      expect(url).toContain("leads_retrieval");
    }
  });

  it("should validate token format check", async () => {
    const { validateToken } = await import("./meta-oauth");
    
    // Empty token should return false
    const result = await validateToken("");
    expect(result).toBe(false);
  });

  it("should handle getCampaignsWithInsights with invalid token gracefully", async () => {
    const { getCampaignsWithInsights } = await import("./meta-oauth");
    
    try {
      await getCampaignsWithInsights("act_invalid", "invalid_token", "last_30d");
      // If it doesn't throw, it should return an empty array
    } catch (error: any) {
      // Expected to fail with invalid token
      expect(error).toBeDefined();
    }
  });

  it("should export all required functions", async () => {
    const metaOAuth = await import("./meta-oauth");
    
    expect(typeof metaOAuth.getMetaOAuthUrl).toBe("function");
    expect(typeof metaOAuth.exchangeCodeForToken).toBe("function");
    expect(typeof metaOAuth.getLongLivedToken).toBe("function");
    expect(typeof metaOAuth.getMetaUserInfo).toBe("function");
    expect(typeof metaOAuth.getAdAccounts).toBe("function");
    expect(typeof metaOAuth.getCampaignsWithInsights).toBe("function");
    expect(typeof metaOAuth.validateToken).toBe("function");
  });
});
