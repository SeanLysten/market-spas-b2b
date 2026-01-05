import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

describe("cron.processArrivedStock", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    // Create a caller without authentication (public procedure)
    const ctx: TrpcContext = {
      user: null,
      req: {} as any,
      res: {} as any,
    };
    caller = appRouter.createCaller(ctx);
  });

  it("should reject invalid secret key", async () => {
    await expect(
      caller.cron.processArrivedStock({ secret: "wrong-secret" })
    ).rejects.toThrow("Invalid secret key");
  });

  it("should accept valid secret key and process arrived stock", async () => {
    const CRON_SECRET = process.env.CRON_SECRET || "default-secret-change-me";
    
    const result = await caller.cron.processArrivedStock({ secret: CRON_SECRET });
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(result.result.processed).toBeGreaterThanOrEqual(0);
  });

  it("should convert arrived stock to real stock", async () => {
    const CRON_SECRET = process.env.CRON_SECRET || "default-secret-change-me";
    
    // Get current week and year
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentYear = now.getFullYear();
    
    // Check if there are any pending incoming stock for past weeks
    const pendingStock = await db.getIncomingStock({ status: "PENDING" });
    const pastStock = pendingStock.filter((stock: any) => {
      if (stock.expectedYear < currentYear) return true;
      if (stock.expectedYear === currentYear && stock.expectedWeek < currentWeek) return true;
      return false;
    });
    
    // Process arrived stock
    const result = await caller.cron.processArrivedStock({ secret: CRON_SECRET });
    
    // Verify that past stock was processed
    expect(result.result.processed).toBe(pastStock.length);
  });
});

// Helper function to get ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
