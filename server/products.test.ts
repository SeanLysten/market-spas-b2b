import { describe, it, expect } from "vitest";
import {
  getAllProducts,
  getProductById,
  getProductVariants,
} from "./db";

describe("Products Module", () => {
  describe("getAllProducts", () => {
    it("should return a list of products", async () => {
      const result = await getAllProducts({});
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter products by search term", async () => {
      const result = await getAllProducts({ search: "Jacuzzi" });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // All results should contain "Jacuzzi" in name or description
      result.forEach((product) => {
        const matchesSearch =
          product.name?.toLowerCase().includes("jacuzzi") ||
          product.description?.toLowerCase().includes("jacuzzi") ||
          product.sku?.toLowerCase().includes("jacuzzi");
        expect(matchesSearch).toBe(true);
      });
    });

    it("should respect limit parameter", async () => {
      const result = await getAllProducts({ limit: 3 });
      expect(result.length).toBeLessThanOrEqual(3);
    });
  });

  describe("getProductById", () => {
    it("should return undefined for non-existent product", async () => {
      const result = await getProductById(999999);
      expect(result).toBeUndefined();
    });

    it("should return product for valid ID", async () => {
      // First get any product
      const products = await getAllProducts({ limit: 1 });
      if (products.length > 0) {
        const result = await getProductById(products[0].id);
        expect(result).toBeDefined();
        expect(result?.id).toBe(products[0].id);
      }
    });
  });

  describe("getProductVariants", () => {
    it("should return variants for a product", async () => {
      // Get a product first
      const productsList = await getAllProducts({ limit: 1 });
      if (productsList.length > 0) {
        const result = await getProductVariants(productsList[0].id);
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      }
    });
  });
});
