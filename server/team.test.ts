import { describe, it, expect } from "vitest";
import { getDefaultPermissions } from "./team-permissions";

describe("Team Management - Permissions", () => {
  describe("Default Permissions", () => {
    it("should have correct default permissions for SALES_REP role", () => {
      const permissions = getDefaultPermissions("SALES_REP");

      expect(permissions.leads.view).toBe("assigned");
      expect(permissions.leads.edit).toBe(true);
      expect(permissions.orders.view).toBe(false);
      expect(permissions.team.invite).toBe(false);
    });

    it("should have correct default permissions for ORDER_MANAGER role", () => {
      const permissions = getDefaultPermissions("ORDER_MANAGER");

      expect(permissions.orders.view).toBe(true);
      expect(permissions.orders.create).toBe(true);
      expect(permissions.catalog.view).toBe(true);
      expect(permissions.leads.view).toBe("none");
    });

    it("should have correct default permissions for ACCOUNTANT role", () => {
      const permissions = getDefaultPermissions("ACCOUNTANT");

      expect(permissions.invoices.view).toBe(true);
      expect(permissions.invoices.export).toBe(true);
      expect(permissions.orders.create).toBe(false);
      expect(permissions.team.manage).toBe(false);
    });

    it("should have correct default permissions for FULL_MANAGER role", () => {
      const permissions = getDefaultPermissions("FULL_MANAGER");

      expect(permissions.leads.view).toBe("all");
      expect(permissions.orders.view).toBe(true);
      expect(permissions.invoices.view).toBe(true);
      expect(permissions.team.invite).toBe(false); // Can't invite
      expect(permissions.team.manage).toBe(false); // Can't manage team
    });

    it("should have correct default permissions for OWNER role", () => {
      const permissions = getDefaultPermissions("OWNER");

      expect(permissions.leads.view).toBe("all");
      expect(permissions.orders.view).toBe(true);
      expect(permissions.invoices.view).toBe(true);
      expect(permissions.team.invite).toBe(true);
      expect(permissions.team.manage).toBe(true);
      expect(permissions.profile.edit).toBe(true);
    });
  });

  describe("Permission Helpers", () => {
    it("should generate valid invitation token", async () => {
      const { generateInvitationToken } = await import("./team-permissions");
      const token = generateInvitationToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(10); // Token should be at least 10 chars
    });

    it("should return permissions as JSON string", () => {
      const permissions = getDefaultPermissions("SALES_REP");
      const jsonString = JSON.stringify(permissions);

      expect(jsonString).toBeDefined();
      expect(typeof jsonString).toBe("string");

      // Should be parseable back
      const parsed = JSON.parse(jsonString);
      expect(parsed.leads.view).toBe("assigned");
    });
  });

  describe("Role Hierarchy", () => {
    it("OWNER should have more permissions than FULL_MANAGER", () => {
      const ownerPerms = getDefaultPermissions("OWNER");
      const managerPerms = getDefaultPermissions("FULL_MANAGER");

      expect(ownerPerms.team.invite).toBe(true);
      expect(managerPerms.team.invite).toBe(false);

      expect(ownerPerms.team.manage).toBe(true);
      expect(managerPerms.team.manage).toBe(false);
    });

    it("FULL_MANAGER should have more permissions than ORDER_MANAGER", () => {
      const fullManagerPerms = getDefaultPermissions("FULL_MANAGER");
      const orderManagerPerms = getDefaultPermissions("ORDER_MANAGER");

      expect(fullManagerPerms.leads.view).toBe("all");
      expect(orderManagerPerms.leads.view).toBe("none");

      expect(fullManagerPerms.invoices.view).toBe(true);
      expect(orderManagerPerms.invoices.view).toBe(true); // ORDER_MANAGER can also view invoices
    });

    it("SALES_REP should have most restricted permissions", () => {
      const salesRepPerms = getDefaultPermissions("SALES_REP");

      expect(salesRepPerms.leads.view).toBe("assigned"); // Only assigned leads
      expect(salesRepPerms.orders.view).toBe(false);
      expect(salesRepPerms.catalog.view).toBe(false);
      expect(salesRepPerms.team.invite).toBe(false);
    });
  });
});
