import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("admin.forecast", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    // Create an admin caller
    const ctx: TrpcContext = {
      user: {
        id: 1,
        openId: "test-admin",
        name: "Test Admin",
        email: "admin@test.com",
        role: "SUPER_ADMIN",
        createdAt: new Date(),
      },
      req: {} as any,
      res: {} as any,
    };
    caller = appRouter.createCaller(ctx);
  });

  it("should get stock forecast summary", async () => {
    const result = await caller.admin.forecast.getSummary({ weeks: 8 });

    expect(result).toBeDefined();
    expect(result.totalProducts).toBeGreaterThanOrEqual(0);
    expect(result.weeklyBreakdown).toHaveLength(8);
    expect(result.weeklyBreakdown[0]).toHaveProperty("weekLabel");
    expect(result.weeklyBreakdown[0]).toHaveProperty("totalIncoming");
    expect(result.weeklyBreakdown[0]).toHaveProperty("productsWithAlerts");
  });

  it("should get all product forecasts", async () => {
    const result = await caller.admin.forecast.getAll({ weeks: 8 });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);

    if (result.length > 0) {
      const forecast = result[0];
      expect(forecast).toHaveProperty("productId");
      expect(forecast).toHaveProperty("productName");
      expect(forecast).toHaveProperty("productSku");
      expect(forecast).toHaveProperty("currentStock");
      expect(forecast).toHaveProperty("weeks");
      expect(forecast.weeks).toHaveLength(8);

      const week = forecast.weeks[0];
      expect(week).toHaveProperty("weekNumber");
      expect(week).toHaveProperty("year");
      expect(week).toHaveProperty("weekLabel");
      expect(week).toHaveProperty("projectedStock");
      expect(week).toHaveProperty("incomingQuantity");
      expect(week).toHaveProperty("preorderQuantity");
      expect(week).toHaveProperty("alerts");
      expect(Array.isArray(week.alerts)).toBe(true);
    }
  });

  it("should get product forecast with valid productId", async () => {
    // First get all products to find a valid ID
    const allForecasts = await caller.admin.forecast.getAll({ weeks: 4 });

    if (allForecasts.length > 0) {
      const productId = allForecasts[0].productId;
      const result = await caller.admin.forecast.getProduct({ productId, weeks: 4 });

      expect(result).toBeDefined();
      expect(result?.product).toHaveProperty("id");
      expect(result?.product.id).toBe(productId);
      expect(result?.currentStock).toBeDefined();
      expect(result?.forecast).toHaveLength(4);

      const week = result!.forecast[0];
      expect(week).toHaveProperty("weekNumber");
      expect(week).toHaveProperty("year");
      expect(week).toHaveProperty("weekLabel");
      expect(week).toHaveProperty("projectedStock");
      expect(week).toHaveProperty("incomingQuantity");
      expect(week).toHaveProperty("incoming");
      expect(week).toHaveProperty("alerts");
      expect(Array.isArray(week.incoming)).toBe(true);
      expect(Array.isArray(week.alerts)).toBe(true);
    }
  });

  it("should return null for invalid productId", async () => {
    const result = await caller.admin.forecast.getProduct({ productId: 999999, weeks: 4 });

    expect(result).toBeNull();
  });

  it("should handle different week horizons", async () => {
    const result4 = await caller.admin.forecast.getSummary({ weeks: 4 });
    const result12 = await caller.admin.forecast.getSummary({ weeks: 12 });

    expect(result4.weeklyBreakdown).toHaveLength(4);
    expect(result12.weeklyBreakdown).toHaveLength(12);
  });

  it("should calculate alerts correctly", async () => {
    const result = await caller.admin.forecast.getAll({ weeks: 8 });

    if (result.length > 0) {
      for (const forecast of result) {
        for (const week of forecast.weeks) {
          // Check alert logic
          if (week.projectedStock < 0) {
            expect(week.alerts).toContain("RUPTURE");
          } else if (week.projectedStock < 5) {
            expect(week.alerts).toContain("STOCK_CRITIQUE");
          } else if (week.projectedStock < 10) {
            expect(week.alerts).toContain("STOCK_BAS");
          } else {
            expect(week.alerts).toHaveLength(0);
          }
        }
      }
    }
  });

  it("should include incoming stock in projections", async () => {
    const result = await caller.admin.forecast.getAll({ weeks: 8 });

    if (result.length > 0) {
      for (const forecast of result) {
        let runningStock = forecast.currentStock;

        for (const week of forecast.weeks) {
          // Projected stock should account for incoming
          runningStock += week.incomingQuantity - week.preorderQuantity;
          expect(week.projectedStock).toBe(runningStock);
        }
      }
    }
  });
});
