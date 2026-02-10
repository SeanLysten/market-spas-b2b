import { describe, it, expect } from "vitest";

describe("SITE_URL configuration", () => {
  it("should have SITE_URL configured", () => {
    const siteUrl = process.env.SITE_URL;
    expect(siteUrl).toBeDefined();
    expect(siteUrl).not.toBe("");
    expect(siteUrl).toContain("https://");
  });

  it("should generate correct Meta OAuth redirect URI", () => {
    const siteUrl = process.env.SITE_URL;
    expect(siteUrl).toBeDefined();
    
    const redirectUri = `${siteUrl}/api/auth/meta/callback`;
    expect(redirectUri).toBe("https://marketspas.pro/api/auth/meta/callback");
  });

  it("SITE_URL should not have trailing slash", () => {
    const siteUrl = process.env.SITE_URL;
    expect(siteUrl).toBeDefined();
    expect(siteUrl!.endsWith("/")).toBe(false);
  });

  it("SITE_URL should be marketspas.pro", () => {
    const siteUrl = process.env.SITE_URL;
    expect(siteUrl).toBe("https://marketspas.pro");
  });
});
