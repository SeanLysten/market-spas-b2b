import { describe, it, expect } from "vitest";

describe("Meta App Credentials", () => {
  it("should have META_APP_ID configured", () => {
    const appId = process.env.META_APP_ID;
    expect(appId).toBeDefined();
    expect(appId).not.toBe("");
    expect(appId).toBe("1228586458787257");
  });

  it("should have META_APP_SECRET configured", () => {
    const appSecret = process.env.META_APP_SECRET;
    expect(appSecret).toBeDefined();
    expect(appSecret).not.toBe("");
    expect(appSecret!.length).toBeGreaterThan(10);
  });

  it("should be able to get an app access token from Meta", async () => {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (!appId || !appSecret) {
      console.log("Skipping: META_APP_ID or META_APP_SECRET not set");
      return;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`
      );
      const data = await response.json() as any;

      // Should return an access token if credentials are valid
      if (response.ok) {
        expect(data.access_token).toBeDefined();
        expect(data.access_token).toContain(appId);
        console.log("Meta App credentials validated successfully");
      } else {
        // If rate limited or temporary issue, skip
        if (response.status === 429) {
          console.log("Rate limited, skipping validation");
          return;
        }
        // Invalid credentials
        throw new Error(`Meta API error: ${JSON.stringify(data)}`);
      }
    } catch (error: any) {
      if (error.message?.includes("fetch")) {
        console.log("Network error, skipping validation");
        return;
      }
      throw error;
    }
  });
});
