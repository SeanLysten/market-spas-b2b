import { describe, it, expect } from "vitest";
import {
  getAdminPermissions,
  hasAdminModuleAccess,
  getAccessibleModules,
  detectPreset,
  ADMIN_MODULES,
  type AdminPermissions,
} from "./admin-permissions";
import {
  getDefaultPermissions,
  hasPermission,
  getRoleLabel,
  getRoleDescription,
  type TeamRole,
} from "./team-permissions";

// ============================================
// ADMIN PERMISSIONS TESTS
// ============================================

describe("Admin Permissions", () => {
  describe("getAdminPermissions", () => {
    it("SUPER_ADMIN should have full access to all modules", () => {
      const perms = getAdminPermissions("SUPER_ADMIN");
      for (const key of Object.keys(ADMIN_MODULES)) {
        expect(perms.modules[key as keyof typeof ADMIN_MODULES].view).toBe(true);
        expect(perms.modules[key as keyof typeof ADMIN_MODULES].edit).toBe(true);
      }
    });

    it("ADMIN_FULL should have view+edit on all except users.edit", () => {
      const perms = getAdminPermissions("ADMIN_FULL");
      expect(perms.modules.users.view).toBe(true);
      expect(perms.modules.users.edit).toBe(false);
      expect(perms.modules.products.edit).toBe(true);
      expect(perms.modules.orders.edit).toBe(true);
    });

    it("ADMIN_STOCK should only access stock-related modules", () => {
      const perms = getAdminPermissions("ADMIN_STOCK");
      expect(perms.modules.products.view).toBe(true);
      expect(perms.modules.products.edit).toBe(true);
      expect(perms.modules.stock.view).toBe(true);
      expect(perms.modules.stock.edit).toBe(true);
      expect(perms.modules.spare_parts.view).toBe(true);
      expect(perms.modules.orders.view).toBe(true);
      expect(perms.modules.orders.edit).toBe(false);
      // Should not have marketing access
      expect(perms.modules.marketing.view).toBe(false);
      expect(perms.modules.newsletter.view).toBe(false);
      expect(perms.modules.users.view).toBe(false);
    });

    it("ADMIN_SAV should only access SAV-related modules", () => {
      const perms = getAdminPermissions("ADMIN_SAV");
      expect(perms.modules.sav.view).toBe(true);
      expect(perms.modules.sav.edit).toBe(true);
      expect(perms.modules.spare_parts.edit).toBe(true);
      expect(perms.modules.technical_resources.edit).toBe(true);
      expect(perms.modules.partners.view).toBe(true);
      expect(perms.modules.partners.edit).toBe(false);
      // Should not have stock access
      expect(perms.modules.stock.view).toBe(false);
      expect(perms.modules.marketing.view).toBe(false);
    });

    it("ADMIN_MARKETING should access marketing-related modules", () => {
      const perms = getAdminPermissions("ADMIN_MARKETING");
      expect(perms.modules.marketing.edit).toBe(true);
      expect(perms.modules.territories.edit).toBe(true);
      expect(perms.modules.newsletter.edit).toBe(true);
      expect(perms.modules.calendar.edit).toBe(true);
      expect(perms.modules.resources.edit).toBe(true);
      expect(perms.modules.partner_map.edit).toBe(true);
      // Should not have stock/orders edit
      expect(perms.modules.stock.view).toBe(false);
      expect(perms.modules.orders.view).toBe(false);
    });

    it("ADMIN_ORDERS should access order-related modules", () => {
      const perms = getAdminPermissions("ADMIN_ORDERS");
      expect(perms.modules.orders.edit).toBe(true);
      expect(perms.modules.partners.edit).toBe(true);
      expect(perms.modules.reports.edit).toBe(true);
      expect(perms.modules.products.view).toBe(true);
      expect(perms.modules.products.edit).toBe(false);
      // Should not have SAV access
      expect(perms.modules.sav.view).toBe(false);
    });

    it("ADMIN_CUSTOM should have no access by default", () => {
      const perms = getAdminPermissions("ADMIN_CUSTOM");
      for (const key of Object.keys(ADMIN_MODULES)) {
        expect(perms.modules[key as keyof typeof ADMIN_MODULES].view).toBe(false);
        expect(perms.modules[key as keyof typeof ADMIN_MODULES].edit).toBe(false);
      }
    });
  });

  describe("hasAdminModuleAccess", () => {
    it("SUPER_ADMIN always has access", () => {
      expect(hasAdminModuleAccess("SUPER_ADMIN", null, "products")).toBe(true);
      expect(hasAdminModuleAccess("SUPER_ADMIN", null, "users", "edit")).toBe(true);
    });

    it("Non-admin roles never have admin access", () => {
      expect(hasAdminModuleAccess("PARTNER", null, "products")).toBe(false);
      expect(hasAdminModuleAccess("PARTNER_ADMIN", null, "products")).toBe(false);
    });

    it("ADMIN with null permissions is denied", () => {
      expect(hasAdminModuleAccess("ADMIN", null, "products")).toBe(false);
    });

    it("ADMIN with specific permissions is checked correctly", () => {
      const perms = getAdminPermissions("ADMIN_STOCK");
      expect(hasAdminModuleAccess("ADMIN", perms, "products", "view")).toBe(true);
      expect(hasAdminModuleAccess("ADMIN", perms, "products", "edit")).toBe(true);
      expect(hasAdminModuleAccess("ADMIN", perms, "marketing", "view")).toBe(false);
    });
  });

  describe("getAccessibleModules", () => {
    it("SUPER_ADMIN gets all modules", () => {
      const modules = getAccessibleModules("SUPER_ADMIN", null);
      expect(modules.length).toBe(Object.keys(ADMIN_MODULES).length);
    });

    it("ADMIN_STOCK gets limited modules", () => {
      const perms = getAdminPermissions("ADMIN_STOCK");
      const modules = getAccessibleModules("ADMIN", perms);
      expect(modules).toContain("products");
      expect(modules).toContain("stock");
      expect(modules).toContain("spare_parts");
      expect(modules).not.toContain("marketing");
      expect(modules).not.toContain("newsletter");
    });

    it("PARTNER gets no admin modules", () => {
      const modules = getAccessibleModules("PARTNER", null);
      expect(modules.length).toBe(0);
    });
  });

  describe("detectPreset", () => {
    it("detects SUPER_ADMIN preset correctly", () => {
      const perms = getAdminPermissions("SUPER_ADMIN");
      expect(detectPreset(perms)).toBe("SUPER_ADMIN");
    });

    it("detects ADMIN_STOCK preset correctly", () => {
      const perms = getAdminPermissions("ADMIN_STOCK");
      expect(detectPreset(perms)).toBe("ADMIN_STOCK");
    });

    it("returns ADMIN_CUSTOM for modified permissions", () => {
      const perms = getAdminPermissions("ADMIN_STOCK");
      perms.modules.newsletter = { view: true, edit: true };
      expect(detectPreset(perms)).toBe("ADMIN_CUSTOM");
    });
  });
});

// ============================================
// TEAM (PARTNER) PERMISSIONS TESTS
// ============================================

describe("Team Permissions", () => {
  describe("getDefaultPermissions", () => {
    it("OWNER should have full access", () => {
      const perms = getDefaultPermissions("OWNER");
      expect(perms.leads.view).toBe("all");
      expect(perms.leads.edit).toBe(true);
      expect(perms.orders.create).toBe(true);
      expect(perms.spas.order).toBe(true);
      expect(perms.sav.create).toBe(true);
      expect(perms.spareParts.order).toBe(true);
      expect(perms.team.invite).toBe(true);
      expect(perms.team.manage).toBe(true);
    });

    it("SALES_REP should only see assigned leads and catalog without prices", () => {
      const perms = getDefaultPermissions("SALES_REP");
      expect(perms.leads.view).toBe("assigned");
      expect(perms.leads.edit).toBe(true);
      expect(perms.leads.delete).toBe(false);
      expect(perms.catalog.view).toBe(true);
      expect(perms.catalog.viewPrices).toBe(false);
      expect(perms.orders.view).toBe(false);
      expect(perms.spas.order).toBe(false);
      expect(perms.sav.view).toBe(false);
    });

    it("ORDER_MANAGER should manage orders and SAV", () => {
      const perms = getDefaultPermissions("ORDER_MANAGER");
      expect(perms.orders.create).toBe(true);
      expect(perms.orders.edit).toBe(true);
      expect(perms.spas.order).toBe(true);
      expect(perms.sav.view).toBe(true);
      expect(perms.sav.create).toBe(true);
      expect(perms.spareParts.order).toBe(true);
      expect(perms.leads.view).toBe("none");
      expect(perms.team.manage).toBe(false);
    });

    it("ACCOUNTANT should only view orders and export invoices", () => {
      const perms = getDefaultPermissions("ACCOUNTANT");
      expect(perms.orders.view).toBe(true);
      expect(perms.orders.create).toBe(false);
      expect(perms.invoices.view).toBe(true);
      expect(perms.invoices.export).toBe(true);
      expect(perms.spas.order).toBe(false);
      expect(perms.catalog.view).toBe(false);
    });

    it("FULL_MANAGER should have full access except team management", () => {
      const perms = getDefaultPermissions("FULL_MANAGER");
      expect(perms.leads.view).toBe("all");
      expect(perms.orders.create).toBe(true);
      expect(perms.spas.order).toBe(true);
      expect(perms.sav.edit).toBe(true);
      expect(perms.team.invite).toBe(false);
      expect(perms.team.manage).toBe(false);
    });
  });

  describe("hasPermission", () => {
    it("returns true for granted permissions", () => {
      const perms = getDefaultPermissions("OWNER");
      expect(hasPermission(perms, "orders", "create")).toBe(true);
      expect(hasPermission(perms, "leads", "view")).toBe(true);
    });

    it("returns false for denied permissions", () => {
      const perms = getDefaultPermissions("SALES_REP");
      expect(hasPermission(perms, "orders", "create")).toBe(false);
      expect(hasPermission(perms, "sav", "view")).toBe(false);
    });

    it("returns false for null permissions", () => {
      expect(hasPermission(null, "orders", "create")).toBe(false);
    });
  });

  describe("getRoleLabel", () => {
    it("returns French labels", () => {
      expect(getRoleLabel("OWNER")).toBe("Propriétaire");
      expect(getRoleLabel("SALES_REP")).toBe("Commercial");
      expect(getRoleLabel("ORDER_MANAGER")).toBe("Gestionnaire Commandes");
      expect(getRoleLabel("ACCOUNTANT")).toBe("Comptable");
      expect(getRoleLabel("FULL_MANAGER")).toBe("Gestionnaire Complet");
    });
  });

  describe("getRoleDescription", () => {
    it("returns French descriptions", () => {
      expect(getRoleDescription("OWNER")).toContain("complet");
      expect(getRoleDescription("SALES_REP")).toContain("leads");
      expect(getRoleDescription("ACCOUNTANT")).toContain("factures");
    });
  });
});
