import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Helper: create admin context ──────────────────────────────────────────

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@marketspas.be",
      name: "Admin User",
      loginMethod: "local",
      role: "ADMIN",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: { origin: "https://marketspas.be" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "local",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("settings routes", () => {
  const adminCaller = appRouter.createCaller(createAdminContext());
  const userCaller = appRouter.createCaller(createUserContext());

  describe("settings.getAll", () => {
    it("returns an object with settings for admin", async () => {
      const result = await adminCaller.settings.getAll();
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });

    it("rejects non-admin users", async () => {
      await expect(userCaller.settings.getAll()).rejects.toThrow();
    });
  });

  describe("settings.get", () => {
    it("returns null for non-existent key", async () => {
      const result = await adminCaller.settings.get({ key: "nonexistent_key_xyz" });
      expect(result).toBeNull();
    });

    it("returns the company settings", async () => {
      const result = await adminCaller.settings.get({ key: "company" });
      // Should return parsed JSON or null (if not yet inserted)
      if (result !== null) {
        expect(result).toHaveProperty("companyName");
      }
    });

    it("rejects non-admin users", async () => {
      await expect(userCaller.settings.get({ key: "company" })).rejects.toThrow();
    });
  });

  describe("settings.update", () => {
    it("creates or updates a setting", async () => {
      const result = await adminCaller.settings.update({
        key: "test_setting",
        value: { foo: "bar", count: 42 },
        description: "Test setting for vitest",
      });
      expect(result).toEqual({ success: true });

      // Verify it was saved
      const saved = await adminCaller.settings.get({ key: "test_setting" });
      expect(saved).toEqual({ foo: "bar", count: 42 });
    });

    it("overwrites existing setting", async () => {
      await adminCaller.settings.update({
        key: "test_setting",
        value: { foo: "updated", count: 99 },
      });
      const saved = await adminCaller.settings.get({ key: "test_setting" });
      expect(saved).toEqual({ foo: "updated", count: 99 });
    });

    it("rejects non-admin users", async () => {
      await expect(
        userCaller.settings.update({
          key: "test_setting",
          value: { hacked: true },
        })
      ).rejects.toThrow();
    });
  });

  describe("settings.updateMultiple", () => {
    it("updates multiple settings at once", async () => {
      const result = await adminCaller.settings.updateMultiple({
        settings: [
          { key: "multi_test_a", value: { a: 1 } },
          { key: "multi_test_b", value: { b: 2 } },
        ],
      });
      expect(result).toEqual({ success: true });

      const a = await adminCaller.settings.get({ key: "multi_test_a" });
      const b = await adminCaller.settings.get({ key: "multi_test_b" });
      expect(a).toEqual({ a: 1 });
      expect(b).toEqual({ b: 2 });
    });

    it("rejects non-admin users", async () => {
      await expect(
        userCaller.settings.updateMultiple({
          settings: [{ key: "hack", value: "nope" }],
        })
      ).rejects.toThrow();
    });
  });

  describe("settings.integrationStatus", () => {
    it("returns integration statuses for admin", async () => {
      const result = await adminCaller.settings.integrationStatus();
      expect(result).toBeDefined();
      expect(result).toHaveProperty("stripe");
      expect(result).toHaveProperty("resend");
      expect(result).toHaveProperty("meta");
      expect(result).toHaveProperty("googleAds");
      expect(result).toHaveProperty("ga4");
      expect(result).toHaveProperty("shopify");

      // Each integration should have a connected boolean
      expect(typeof result.stripe.connected).toBe("boolean");
      expect(typeof result.resend.connected).toBe("boolean");
      expect(typeof result.meta.connected).toBe("boolean");
      expect(typeof result.googleAds.connected).toBe("boolean");
      expect(typeof result.ga4.connected).toBe("boolean");
      expect(typeof result.shopify.connected).toBe("boolean");
    });

    it("rejects non-admin users", async () => {
      await expect(userCaller.settings.integrationStatus()).rejects.toThrow();
    });
  });
});
