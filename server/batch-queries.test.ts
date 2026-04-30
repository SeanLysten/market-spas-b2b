import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Batch Query Functions — N+1 Fix", () => {
  const dbPath = path.resolve(__dirname, "db.ts");
  const dbContent = fs.readFileSync(dbPath, "utf-8");

  it("should export getProductsByIds function", () => {
    expect(dbContent).toContain("export async function getProductsByIds(ids: number[])");
  });

  it("should export getProductVariantsByIds function", () => {
    expect(dbContent).toContain("export async function getProductVariantsByIds(ids: number[])");
  });

  it("getProductsByIds should use inArray for batch query", () => {
    const fnMatch = dbContent.match(/export async function getProductsByIds[\s\S]*?^}/m);
    expect(fnMatch).toBeTruthy();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain("inArray(products.id, ids)");
  });

  it("getProductVariantsByIds should use inArray for batch query", () => {
    const fnMatch = dbContent.match(/export async function getProductVariantsByIds[\s\S]*?^}/m);
    expect(fnMatch).toBeTruthy();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain("inArray(productVariants.id, ids)");
  });

  it("getProductsByIds should handle empty array gracefully", () => {
    const fnMatch = dbContent.match(/export async function getProductsByIds[\s\S]*?^}/m);
    expect(fnMatch).toBeTruthy();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain("if (ids.length === 0) return []");
  });

  it("getProductVariantsByIds should handle empty array gracefully", () => {
    const fnMatch = dbContent.match(/export async function getProductVariantsByIds[\s\S]*?^}/m);
    expect(fnMatch).toBeTruthy();
    const fnBody = fnMatch![0];
    expect(fnBody).toContain("if (ids.length === 0) return []");
  });
});

describe("N+1 Fix in routers.ts — createOrder", () => {
  const routersPath = path.resolve(__dirname, "routers.ts");
  const routersContent = fs.readFileSync(routersPath, "utf-8");

  it("should use batch getProductsByIds instead of getProductById in createOrder", () => {
    // The createOrder procedure should use the batch function
    expect(routersContent).toContain("db.getProductsByIds(productIds)");
  });

  it("should use batch getProductVariantsByIds instead of getProductVariantById in createOrder", () => {
    expect(routersContent).toContain("db.getProductVariantsByIds(variantIds)");
  });

  it("should use Promise.all for parallel batch fetching", () => {
    expect(routersContent).toContain("Promise.all([");
    expect(routersContent).toContain("db.getProductsByIds(productIds)");
  });

  it("should build productsMap and variantsMap for O(1) lookup", () => {
    expect(routersContent).toContain("productsMap");
    expect(routersContent).toContain("variantsMap");
  });

  it("should still validate that each product exists (throw if not found)", () => {
    // The validation logic must be preserved
    expect(routersContent).toContain("productsMap.get(item.productId)");
    expect(routersContent).toContain("Produit ${item.productId} non trouvé");
  });

  it("should NOT call getProductById inside the for-loop of createOrder anymore", () => {
    // Find the createOrder procedure block and check no N+1 pattern remains
    const createOrderIdx = routersContent.indexOf("Batch-fetch all products and variants");
    const endLoopIdx = routersContent.indexOf("Weighted average discount", createOrderIdx);
    const loopBlock = routersContent.substring(createOrderIdx, endLoopIdx);
    expect(loopBlock).not.toContain("db.getProductById(");
    expect(loopBlock).not.toContain("db.getProductVariantById(");
  });
});

describe("N+1 Fix in mobile-api.ts — createOrder", () => {
  const mobilePath = path.resolve(__dirname, "routes/mobile-api.ts");
  const mobileContent = fs.readFileSync(mobilePath, "utf-8");

  it("should use batch getProductsByIds in mobile API createOrder", () => {
    expect(mobileContent).toContain("db.getProductsByIds(productIds)");
  });

  it("should use batch getProductVariantsByIds in mobile API createOrder", () => {
    expect(mobileContent).toContain("db.getProductVariantsByIds(variantIds)");
  });

  it("should NOT call getProductById inside the for-loop of mobile createOrder", () => {
    const batchIdx = mobileContent.indexOf("Batch-fetch all products and variants");
    const endLoopIdx = mobileContent.indexOf("Weighted average discount", batchIdx);
    const loopBlock = mobileContent.substring(batchIdx, endLoopIdx);
    expect(loopBlock).not.toContain("db.getProductById(");
    expect(loopBlock).not.toContain("db.getProductVariantById(");
  });

  it("should validate items before batch fetching", () => {
    const validateIdx = mobileContent.indexOf("Validate items first");
    const batchIdx = mobileContent.indexOf("Batch-fetch all products");
    expect(validateIdx).toBeLessThan(batchIdx);
  });
});
