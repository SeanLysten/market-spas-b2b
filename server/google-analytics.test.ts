import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================
// Tests for Google Analytics 4 OAuth and API modules
// ============================================================

describe("Google Analytics 4 OAuth", () => {
  beforeEach(() => {
    process.env.GOOGLE_ADS_CLIENT_ID = "test-client-id";
    process.env.GOOGLE_ADS_CLIENT_SECRET = "test-client-secret";
    process.env.SITE_URL = "https://test.example.com";
  });

  it("getGa4OAuthClient returns an OAuth2 client when credentials are set", async () => {
    const { getGa4OAuthClient } = await import("./google-analytics-oauth");
    const client = getGa4OAuthClient();
    expect(client).not.toBeNull();
  });

  it("getGa4OAuthClient returns null when CLIENT_ID is missing", async () => {
    delete process.env.GOOGLE_ADS_CLIENT_ID;
    // Re-import to pick up env change
    vi.resetModules();
    const { getGa4OAuthClient } = await import("./google-analytics-oauth");
    const client = getGa4OAuthClient();
    expect(client).toBeNull();
  });

  it("getGa4AuthUrl generates a valid OAuth URL", async () => {
    vi.resetModules();
    process.env.GOOGLE_ADS_CLIENT_ID = "test-client-id";
    process.env.GOOGLE_ADS_CLIENT_SECRET = "test-client-secret";
    const { getGa4AuthUrl } = await import("./google-analytics-oauth");
    const url = getGa4AuthUrl("test-state");
    expect(url).not.toBeNull();
    expect(url).toContain("accounts.google.com");
    expect(url).toContain("analytics.readonly");
    expect(url).toContain("test-state");
  });

  it("getGa4AuthUrl includes the correct redirect URI (shared with Google Ads)", async () => {
    vi.resetModules();
    process.env.GOOGLE_ADS_CLIENT_ID = "test-client-id";
    process.env.GOOGLE_ADS_CLIENT_SECRET = "test-client-secret";
    process.env.SITE_URL = "https://marketspas.example.com";
    const { getGa4AuthUrl } = await import("./google-analytics-oauth");
    const url = getGa4AuthUrl();
    // GA4 réutilise la même URI de redirection que Google Ads
    expect(url).toContain("google-ads%2Fcallback");
    // Le state doit avoir le préfixe "ga4:"
    expect(url).toContain("ga4%3A");
  });
});

describe("Google Analytics 4 API - token refresh", () => {
  it("uses existing access token when not expired", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ rows: [] }),
    } as any);

    // Token expires far in the future
    const futureExpiry = new Date(Date.now() + 60 * 60 * 1000);

    const { getGa4FullReport } = await import("./google-analytics-api");

    try {
      await getGa4FullReport(
        "123456789",
        "valid-access-token",
        "refresh-token",
        futureExpiry,
        "2026-02-01",
        "2026-03-01"
      );
    } catch {
      // May fail due to mocked empty responses, but we check fetch wasn't called for token refresh
    }

    // Should NOT have called the token refresh endpoint
    const tokenRefreshCalls = fetchSpy.mock.calls.filter(
      (call) => String(call[0]).includes("oauth2.googleapis.com/token")
    );
    expect(tokenRefreshCalls).toHaveLength(0);

    fetchSpy.mockRestore();
  });

  it("refreshes access token when expired", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (String(url).includes("oauth2.googleapis.com/token")) {
        return {
          ok: true,
          json: async () => ({ access_token: "new-access-token" }),
        } as any;
      }
      return {
        ok: true,
        json: async () => ({ rows: [] }),
      } as any;
    });

    // Token expired in the past
    const pastExpiry = new Date(Date.now() - 60 * 1000);

    const { getGa4FullReport } = await import("./google-analytics-api");

    try {
      await getGa4FullReport(
        "123456789",
        "expired-access-token",
        "valid-refresh-token",
        pastExpiry,
        "2026-02-01",
        "2026-03-01"
      );
    } catch {
      // May fail due to mocked responses
    }

    const tokenRefreshCalls = fetchSpy.mock.calls.filter(
      (call) => String(call[0]).includes("oauth2.googleapis.com/token")
    );
    expect(tokenRefreshCalls.length).toBeGreaterThan(0);

    fetchSpy.mockRestore();
  });
});

describe("Google Analytics 4 API - report parsing", () => {
  it("returns zero metrics when API returns empty rows", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ rows: [] }),
    } as any);

    const futureExpiry = new Date(Date.now() + 60 * 60 * 1000);
    const { getGa4FullReport } = await import("./google-analytics-api");

    const report = await getGa4FullReport(
      "123456789",
      "valid-token",
      "refresh-token",
      futureExpiry,
      "2026-02-01",
      "2026-03-01"
    );

    expect(report.overview.sessions).toBe(0);
    expect(report.overview.totalUsers).toBe(0);
    expect(report.overview.pageviews).toBe(0);
    expect(report.dailyTrend).toHaveLength(0);
    expect(report.topPages).toHaveLength(0);
    expect(report.trafficSources).toHaveLength(0);
    expect(report.deviceCategories).toHaveLength(0);
    expect(report.propertyId).toBe("123456789");

    vi.restoreAllMocks();
  });

  it("correctly parses overview metrics from API response", async () => {
    let callCount = 0;
    vi.spyOn(global, "fetch").mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        // Overview report
        return {
          ok: true,
          json: async () => ({
            rows: [{
              metricValues: [
                { value: "1500" }, // sessions
                { value: "1200" }, // totalUsers
                { value: "800" },  // newUsers
                { value: "4500" }, // pageviews
                { value: "180" },  // avgSessionDuration
                { value: "0.35" }, // bounceRate
                { value: "0.65" }, // engagementRate
              ],
            }],
          }),
        } as any;
      }
      return { ok: true, json: async () => ({ rows: [] }) } as any;
    });

    const futureExpiry = new Date(Date.now() + 60 * 60 * 1000);
    vi.resetModules();
    const { getGa4FullReport } = await import("./google-analytics-api");

    const report = await getGa4FullReport(
      "123456789",
      "valid-token",
      "refresh-token",
      futureExpiry,
      "2026-02-01",
      "2026-03-01"
    );

    expect(report.overview.sessions).toBe(1500);
    expect(report.overview.totalUsers).toBe(1200);
    expect(report.overview.newUsers).toBe(800);
    expect(report.overview.pageviews).toBe(4500);
    expect(report.overview.avgSessionDuration).toBe(180);
    expect(report.overview.bounceRate).toBeCloseTo(35, 0);
    expect(report.overview.engagementRate).toBeCloseTo(65, 0);

    vi.restoreAllMocks();
  });
});

describe("DB functions for GA4 accounts", () => {
  it("connectGa4Account function is exported from db.ts", async () => {
    const db = await import("./db");
    expect(typeof db.connectGa4Account).toBe("function");
    expect(typeof db.disconnectGa4Account).toBe("function");
    expect(typeof db.getConnectedGa4Accounts).toBe("function");
    expect(typeof db.updateGa4AccountLastSynced).toBe("function");
    expect(typeof db.updateGa4AccountSyncError).toBe("function");
    expect(typeof db.updateGa4AccountTokens).toBe("function");
  });
});
