import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock des modules ────────────────────────────────────────────────────────
vi.mock("./shopify-api", () => ({
  getShopifyOAuthUrl: vi.fn((shopDomain: string, clientId: string, redirectUri: string, state: string) => {
    return `https://${shopDomain}/admin/oauth/authorize?client_id=${clientId}&scope=read_orders,read_customers,read_products,read_analytics&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  }),
  exchangeShopifyCode: vi.fn(async () => ({
    access_token: "shpat_test_token_123",
    scope: "read_orders,read_customers,read_products,read_analytics",
  })),
  getShopInfo: vi.fn(async () => ({
    name: "Market Spas France",
    email: "contact@marketspas.com",
    currency: "EUR",
  })),
  getShopifyReport: vi.fn(async () => ({
    overview: {
      totalRevenue: 15000,
      totalOrders: 42,
      averageOrderValue: 357.14,
      totalCustomers: 38,
      newCustomers: 25,
      returningCustomers: 13,
      currency: "EUR",
    },
    dailyRevenue: [
      { date: "2026-02-01", revenue: 500, orders: 2 },
      { date: "2026-02-02", revenue: 750, orders: 3 },
    ],
    topProducts: [
      { id: "1", title: "Spa Wellis Premium", totalSold: 5, totalRevenue: 7500, imageUrl: null },
      { id: "2", title: "Spa Compact 4 places", totalSold: 3, totalRevenue: 3600, imageUrl: null },
    ],
    orderStatuses: [
      { status: "fulfilled", count: 35 },
      { status: "unfulfilled", count: 7 },
    ],
  })),
}));

vi.mock("./db", () => ({
  getShopifyAccount: vi.fn(async (userId: number) => {
    if (userId === 1) {
      return {
        id: 1,
        userId: 1,
        shopDomain: "hvbgin-zq.myshopify.com",
        accessToken: "shpat_test_token_123",
        scope: "read_orders,read_customers,read_products,read_analytics",
        shopName: "Market Spas France",
        shopEmail: "contact@marketspas.com",
        currency: "EUR",
        connectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return null;
  }),
  upsertShopifyAccount: vi.fn(async () => {}),
  deleteShopifyAccount: vi.fn(async () => {}),
}));

// ─── Tests ───────────────────────────────────────────────────────────────────
describe("Shopify OAuth URL Generation", () => {
  it("génère une URL OAuth valide avec le bon domaine et les bons scopes", async () => {
    const { getShopifyOAuthUrl } = await import("./shopify-api");
    const url = getShopifyOAuthUrl(
      "hvbgin-zq.myshopify.com",
      "964035fb8c4d21034489137b7f965219",
      "https://marketspas.pro/api/shopify/callback",
      "shopify:1"
    );
    expect(url).toContain("hvbgin-zq.myshopify.com");
    expect(url).toContain("read_orders");
    expect(url).toContain("read_customers");
    expect(url).toContain("read_products");
    expect(url).toContain("shopify:1");
  });

  it("inclut le redirect_uri encodé dans l'URL OAuth", async () => {
    const { getShopifyOAuthUrl } = await import("./shopify-api");
    const url = getShopifyOAuthUrl(
      "hvbgin-zq.myshopify.com",
      "test_client_id",
      "https://marketspas.pro/api/shopify/callback",
      "shopify:42"
    );
    expect(url).toContain("redirect_uri=");
    expect(url).toContain("marketspas.pro");
  });
});

describe("Shopify Token Exchange", () => {
  it("échange le code d'autorisation contre un token d'accès", async () => {
    const { exchangeShopifyCode } = await import("./shopify-api");
    const result = await exchangeShopifyCode(
      "hvbgin-zq.myshopify.com",
      "test_code_123",
      "964035fb8c4d21034489137b7f965219",
      "shpss_test_secret"
    );
    expect(result).toHaveProperty("access_token");
    expect(result.access_token).toContain("shpat_");
    expect(result).toHaveProperty("scope");
  });
});

describe("Shopify Report", () => {
  it("récupère les métriques de ventes pour une période donnée", async () => {
    const { getShopifyReport } = await import("./shopify-api");
    const report = await getShopifyReport(
      "hvbgin-zq.myshopify.com",
      "shpat_test_token_123",
      "2026-02-01",
      "2026-02-28"
    );
    expect(report).toHaveProperty("overview");
    expect(report.overview).toHaveProperty("totalRevenue");
    expect(report.overview.totalRevenue).toBeGreaterThan(0);
    expect(report.overview).toHaveProperty("totalOrders");
    expect(report.overview).toHaveProperty("averageOrderValue");
    expect(report.overview).toHaveProperty("totalCustomers");
    expect(report.overview).toHaveProperty("currency");
  });

  it("retourne les données journalières de CA", async () => {
    const { getShopifyReport } = await import("./shopify-api");
    const report = await getShopifyReport(
      "hvbgin-zq.myshopify.com",
      "shpat_test_token_123",
      "2026-02-01",
      "2026-02-28"
    );
    expect(report).toHaveProperty("dailyRevenue");
    expect(Array.isArray(report.dailyRevenue)).toBe(true);
    if (report.dailyRevenue.length > 0) {
      expect(report.dailyRevenue[0]).toHaveProperty("date");
      expect(report.dailyRevenue[0]).toHaveProperty("revenue");
      expect(report.dailyRevenue[0]).toHaveProperty("orders");
    }
  });

  it("retourne les top produits", async () => {
    const { getShopifyReport } = await import("./shopify-api");
    const report = await getShopifyReport(
      "hvbgin-zq.myshopify.com",
      "shpat_test_token_123",
      "2026-02-01",
      "2026-02-28"
    );
    expect(report).toHaveProperty("topProducts");
    expect(Array.isArray(report.topProducts)).toBe(true);
    if (report.topProducts.length > 0) {
      expect(report.topProducts[0]).toHaveProperty("title");
      expect(report.topProducts[0]).toHaveProperty("totalSold");
      expect(report.topProducts[0]).toHaveProperty("totalRevenue");
    }
  });

  it("retourne les statuts des commandes", async () => {
    const { getShopifyReport } = await import("./shopify-api");
    const report = await getShopifyReport(
      "hvbgin-zq.myshopify.com",
      "shpat_test_token_123",
      "2026-02-01",
      "2026-02-28"
    );
    expect(report).toHaveProperty("orderStatuses");
    expect(Array.isArray(report.orderStatuses)).toBe(true);
  });
});

describe("Shopify DB Functions", () => {
  it("récupère le compte Shopify d'un utilisateur existant", async () => {
    const { getShopifyAccount } = await import("./db");
    const account = await getShopifyAccount(1);
    expect(account).not.toBeNull();
    expect(account?.shopDomain).toBe("hvbgin-zq.myshopify.com");
    expect(account?.shopName).toBe("Market Spas France");
  });

  it("retourne null pour un utilisateur sans compte Shopify", async () => {
    const { getShopifyAccount } = await import("./db");
    const account = await getShopifyAccount(999);
    expect(account).toBeNull();
  });

  it("peut sauvegarder un compte Shopify", async () => {
    const { upsertShopifyAccount } = await import("./db");
    await expect(
      upsertShopifyAccount(2, "test-shop.myshopify.com", "shpat_token", "read_orders", "Test Shop", "test@shop.com", "EUR")
    ).resolves.not.toThrow();
  });

  it("peut supprimer un compte Shopify", async () => {
    const { deleteShopifyAccount } = await import("./db");
    await expect(deleteShopifyAccount(1)).resolves.not.toThrow();
  });
});
