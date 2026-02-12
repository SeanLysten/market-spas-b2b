import { describe, it, expect } from "vitest";
import {
  getAllProducts,
  getProductById,
  updateProduct,
} from "./db";

describe("Image Upload - Product Image Display in Edit Form", () => {
  describe("getAllProducts returns imageUrl field", () => {
    it("should include imageUrl field in product data", async () => {
      const products = await getAllProducts({ limit: 1 });
      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);
      if (products.length > 0) {
        // The imageUrl property should exist (even if null)
        expect("imageUrl" in products[0]).toBe(true);
      }
    });

    it("should return imageUrl for all products", async () => {
      const products = await getAllProducts({});
      expect(products).toBeDefined();
      products.forEach((product) => {
        expect("imageUrl" in product).toBe(true);
      });
    });
  });

  describe("getProductById returns imageUrl field", () => {
    it("should include imageUrl when fetching a single product", async () => {
      const products = await getAllProducts({ limit: 1 });
      if (products.length > 0) {
        const product = await getProductById(products[0].id);
        expect(product).toBeDefined();
        expect("imageUrl" in product!).toBe(true);
      }
    });
  });

  describe("updateProduct handles imageUrl correctly", () => {
    it("should update imageUrl when provided", async () => {
      const products = await getAllProducts({ limit: 1 });
      if (products.length > 0) {
        const testUrl = "https://example.com/test-image-" + Date.now() + ".jpg";
        
        // Update with imageUrl
        await updateProduct(products[0].id, { imageUrl: testUrl });
        
        // Verify the update
        const updated = await getProductById(products[0].id);
        expect(updated).toBeDefined();
        expect(updated!.imageUrl).toBe(testUrl);
        
        // Restore original value
        await updateProduct(products[0].id, { imageUrl: products[0].imageUrl || "" });
      }
    });

    it("should skip update when no fields are provided", async () => {
      const products = await getAllProducts({ limit: 1 });
      if (products.length > 0) {
        // Should not throw when called with empty data
        await expect(updateProduct(products[0].id, {})).resolves.not.toThrow();
      }
    });

    it("should update pricePublicHT when priceHT is provided", async () => {
      const products = await getAllProducts({ limit: 1 });
      if (products.length > 0) {
        const originalPrice = products[0].pricePublicHT;
        const testPrice = 1234.56;
        
        // Update price
        await updateProduct(products[0].id, { priceHT: testPrice });
        
        // Verify the update
        const updated = await getProductById(products[0].id);
        expect(updated).toBeDefined();
        expect(parseFloat(updated!.pricePublicHT as string)).toBe(testPrice);
        
        // Restore original value
        await updateProduct(products[0].id, { priceHT: parseFloat(originalPrice as string) || 0 });
      }
    });
  });
});
