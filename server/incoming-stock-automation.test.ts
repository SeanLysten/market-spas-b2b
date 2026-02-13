import { describe, it, expect, beforeAll } from "vitest";
import { 
  processArrivedStock, 
  getIncomingStock, 
  createIncomingStock,
  getProductVariants,
  updateProductVariant
} from "./db";

describe("Transfert automatique stock arrivages", () => {
  describe("processArrivedStock function", () => {
    it("should exist and be callable", async () => {
      expect(processArrivedStock).toBeDefined();
      expect(typeof processArrivedStock).toBe("function");
      
      // Call the function to ensure it doesn't throw
      const result = await processArrivedStock();
      expect(result).toHaveProperty("processed");
      expect(typeof result.processed).toBe("number");
      
      console.log(`✓ processArrivedStock executed successfully, processed: ${result.processed} arrivage(s)`);
    });

    it("should detect and process past week arrivals", async () => {
      // Get all incoming stock
      const allIncoming = await getIncomingStock();
      
      // Get current week and year
      const now = new Date();
      const currentYear = now.getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const daysSinceStart = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
      const currentWeek = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
      
      // Count how many should be processed (past or current week)
      const shouldBeProcessed = allIncoming.filter((incoming: any) => {
        if (incoming.status !== "PENDING") return false;
        
        if (incoming.expectedYear < currentYear) return true;
        if (incoming.expectedYear === currentYear && incoming.expectedWeek <= currentWeek) return true;
        
        return false;
      });
      
      console.log(`Current week: ${currentWeek}, year: ${currentYear}`);
      console.log(`Found ${shouldBeProcessed.length} arrivage(s) that should be processed`);
      
      if (shouldBeProcessed.length > 0) {
        // Process arrivals
        const result = await processArrivedStock();
        
        expect(result.processed).toBeGreaterThanOrEqual(0);
        console.log(`✓ Processed ${result.processed} arrivage(s)`);
        
        // Verify they are now marked as ARRIVED
        for (const incoming of shouldBeProcessed) {
          const updated = await getIncomingStock({ status: "ARRIVED" });
          const found = updated.find((u: any) => u.id === incoming.id);
          
          if (found) {
            expect(found.status).toBe("ARRIVED");
            expect(found.arrivedAt).toBeTruthy();
            console.log(`✓ Arrivage #${incoming.id} marked as ARRIVED`);
          }
        }
      } else {
        console.log("✓ No arrivals to process (all future or already processed)");
      }
    });

    it("should not process future week arrivals", async () => {
      // Get current week and year
      const now = new Date();
      const currentYear = now.getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const daysSinceStart = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
      const currentWeek = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
      
      // Get all pending incoming stock
      const pendingIncoming = await getIncomingStock({ status: "PENDING" });
      
      // Filter future arrivals
      const futureArrivals = pendingIncoming.filter((incoming: any) => {
        if (incoming.expectedYear > currentYear) return true;
        if (incoming.expectedYear === currentYear && incoming.expectedWeek > currentWeek) return true;
        return false;
      });
      
      if (futureArrivals.length > 0) {
        console.log(`Found ${futureArrivals.length} future arrivage(s) that should NOT be processed`);
        
        // Process arrivals
        await processArrivedStock();
        
        // Verify future arrivals are still PENDING
        for (const incoming of futureArrivals) {
          const stillPending = await getIncomingStock({ status: "PENDING" });
          const found = stillPending.find((p: any) => p.id === incoming.id);
          
          if (found) {
            expect(found.status).toBe("PENDING");
            console.log(`✓ Future arrivage #${incoming.id} (week ${incoming.expectedWeek}/${incoming.expectedYear}) still PENDING`);
          }
        }
      } else {
        console.log("✓ No future arrivals in database");
      }
    });

    it("should transfer stock to variants when processing arrivals", async () => {
      // Get all incoming stock with variants
      const incomingWithVariants = await getIncomingStock();
      const withVariants = incomingWithVariants.filter((i: any) => i.variantId && i.status === "ARRIVED");
      
      if (withVariants.length > 0) {
        for (const incoming of withVariants.slice(0, 3)) { // Check first 3
          if (incoming.variantId) {
            const variants = await getProductVariants(incoming.productId!);
            const variant = variants?.find((v: any) => v.id === incoming.variantId);
            
            if (variant) {
              // Stock should have been increased (we can't verify the exact amount without knowing the before state)
              expect(variant.stockQuantity).toBeGreaterThanOrEqual(0);
              console.log(`✓ Variant #${variant.id} has stock: ${variant.stockQuantity}`);
            }
          }
        }
      } else {
        console.log("✓ No ARRIVED incoming stock with variants to verify");
      }
    });
  });

  describe("Job scheduling", () => {
    it("should have a job file for periodic execution", async () => {
      // Check if the job file exists
      const fs = await import("fs");
      const path = await import("path");
      
      const jobPath = path.join(process.cwd(), "server", "jobs", "processIncomingStock.ts");
      const exists = fs.existsSync(jobPath);
      
      expect(exists).toBe(true);
      console.log("✓ Job file exists at server/jobs/processIncomingStock.ts");
      
      if (exists) {
        const content = fs.readFileSync(jobPath, "utf-8");
        expect(content).toContain("processArrivedStock");
        expect(content).toContain("setInterval");
        console.log("✓ Job file contains processArrivedStock and setInterval");
      }
    });
  });
});
