import { describe, it, expect } from "vitest";
import {
  getAllOrders,
  getOrderById,
} from "./db";

describe("Orders Module", () => {
  describe("getAllOrders", () => {
    it("should return a list of orders", async () => {
      const result = await getAllOrders({});
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should respect limit parameter", async () => {
      const result = await getAllOrders({ limit: 5 });
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe("getOrderById", () => {
    it("should return undefined for non-existent order", async () => {
      const result = await getOrderById(999999);
      expect(result).toBeUndefined();
    });

    it("should return order for valid ID if orders exist", async () => {
      const orders = await getAllOrders({ limit: 1 });
      if (orders.length > 0) {
        const result = await getOrderById(orders[0].id);
        expect(result).toBeDefined();
        expect(result?.id).toBe(orders[0].id);
      }
    });
  });
});
