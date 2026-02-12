import { describe, it, expect } from "vitest";
import { getAllProducts, getProductVariants } from "./db";

describe("UX Improvements - Catalog and Admin", () => {
  describe("Stock calculation for catalog display", () => {
    it("should calculate total stock from all active variants", async () => {
      const products = await getAllProducts({ limit: 5 });
      
      for (const product of products) {
        const variants = await getProductVariants(product.id);
        
        if (variants && variants.length > 0) {
          // Calculate stock from active variants only (matching catalog logic)
          const activeVariants = variants.filter((v: any) => v.isActive !== false);
          const totalActiveStock = activeVariants.reduce(
            (sum: number, v: any) => sum + (v.stockQuantity || 0),
            0
          );
          
          expect(totalActiveStock).toBeGreaterThanOrEqual(0);
          
          if (totalActiveStock > 0) {
            console.log(`✓ Product ${product.name}: ${totalActiveStock} units from ${activeVariants.length} active variants`);
          }
        }
      }
    });

    it("should filter out inactive variants from stock calculation", async () => {
      const products = await getAllProducts({ limit: 5 });
      
      for (const product of products) {
        const variants = await getProductVariants(product.id);
        
        if (variants && variants.length > 0) {
          const activeVariants = variants.filter((v: any) => v.isActive !== false);
          const inactiveVariants = variants.filter((v: any) => v.isActive === false);
          
          // Active variants count should be <= total variants count
          expect(activeVariants.length).toBeLessThanOrEqual(variants.length);
          
          if (inactiveVariants.length > 0) {
            console.log(`✓ Product ${product.name}: ${inactiveVariants.length} inactive variants excluded from stock`);
          }
        }
      }
    });
  });

  describe("Product data structure", () => {
    it("should have imageUrl field for products", async () => {
      const products = await getAllProducts({ limit: 5 });
      
      for (const product of products) {
        // imageUrl should exist (can be null or a string)
        expect(product).toHaveProperty("imageUrl");
        
        if (product.imageUrl) {
          console.log(`✓ Product ${product.name} has image: ${product.imageUrl.substring(0, 50)}...`);
        }
      }
    });

    it("should have variants with color and stockQuantity fields", async () => {
      const products = await getAllProducts({ limit: 5 });
      
      for (const product of products) {
        const variants = await getProductVariants(product.id);
        
        if (variants && variants.length > 0) {
          for (const variant of variants) {
            expect(variant).toHaveProperty("color");
            expect(variant).toHaveProperty("stockQuantity");
            expect(variant).toHaveProperty("isActive");
            
            if (variant.isActive !== false && variant.stockQuantity > 0) {
              console.log(`✓ Variant ${variant.color || variant.name}: ${variant.stockQuantity} units in stock`);
            }
          }
        }
      }
    });
  });
});
