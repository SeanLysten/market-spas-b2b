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
    const result = await caller.admin.forecast.getSummary();

    // Can be null if no products exist
    if (result) {
      expect(result).toHaveProperty("totalProducts");
      expect(result).toHaveProperty("totalStock");
      expect(result).toHaveProperty("totalTransit");
      expect(result).toHaveProperty("productsInStock");
      expect(result).toHaveProperty("productsInTransit");
      expect(result).toHaveProperty("productsInRupture");
    }
  });

  it("should get all product forecasts", async () => {
    const result = await caller.admin.forecast.getAll();

    expect(result).toBeDefined();
    // Result is an object with products array and lastSupplierUpdate
    if (result && 'products' in result) {
      expect(Array.isArray(result.products)).toBe(true);

      if (result.products.length > 0) {
        const product = result.products[0];
        expect(product).toHaveProperty("productId");
        expect(product).toHaveProperty("productName");
        expect(product).toHaveProperty("totalStock");
        expect(product).toHaveProperty("totalTransit");
        expect(product).toHaveProperty("status");
        expect(product).toHaveProperty("variants");
        expect(Array.isArray(product.variants)).toBe(true);
      }
    }
  });

  it("should get product forecast with valid productId", async () => {
    const allForecasts = await caller.admin.forecast.getAll();

    if (allForecasts && 'products' in allForecasts && allForecasts.products.length > 0) {
      const productId = allForecasts.products[0].productId;
      const result = await caller.admin.forecast.getProduct({ productId });

      expect(result).toBeDefined();
      if (result) {
        expect(result).toHaveProperty("product");
        expect(result).toHaveProperty("totalStock");
        expect(result).toHaveProperty("totalTransit");
        expect(result).toHaveProperty("variants");
        expect(Array.isArray(result.variants)).toBe(true);
      }
    }
  });

  it("should return null for invalid productId", async () => {
    const result = await caller.admin.forecast.getProduct({ productId: 999999 });
    expect(result).toBeNull();
  });

  it("should have correct variant structure", async () => {
    const allForecasts = await caller.admin.forecast.getAll();

    if (allForecasts && 'products' in allForecasts && allForecasts.products.length > 0) {
      const productWithVariants = allForecasts.products.find((p: any) => p.variants.length > 0);
      if (productWithVariants) {
        const variant = productWithVariants.variants[0];
        expect(variant).toHaveProperty("id");
        expect(variant).toHaveProperty("sku");
        expect(variant).toHaveProperty("stockQuantity");
        expect(variant).toHaveProperty("inTransitQuantity");
        expect(variant).toHaveProperty("available");
      }
    }
  });

  it("should correctly identify product status", async () => {
    const allForecasts = await caller.admin.forecast.getAll();

    if (allForecasts && 'products' in allForecasts) {
      for (const product of allForecasts.products) {
        if (product.totalStock > 0) {
          expect(product.status).toBe("EN_STOCK");
        } else if (product.totalTransit > 0) {
          expect(product.status).toBe("EN_TRANSIT");
        } else {
          expect(product.status).toBe("RUPTURE");
        }
      }
    }
  });

  it("should get supplier logs", async () => {
    const result = await caller.admin.forecast.getSupplierLogs({ limit: 5 });
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});
