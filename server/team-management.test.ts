import { describe, it, expect } from "vitest";

// ============================================
// TEAM MANAGEMENT TESTS
// ============================================

describe("Team Management - Roles and Permissions", () => {
  // Test role labels
  const ROLE_LABELS: Record<string, string> = {
    OWNER: "Propriétaire",
    SALES_REP: "Commercial",
    ORDER_MANAGER: "Gestionnaire Commandes",
    ACCOUNTANT: "Comptable",
    FULL_MANAGER: "Gestionnaire Complet",
  };

  it("should have correct role labels for all team roles", () => {
    expect(ROLE_LABELS.OWNER).toBe("Propriétaire");
    expect(ROLE_LABELS.SALES_REP).toBe("Commercial");
    expect(ROLE_LABELS.ORDER_MANAGER).toBe("Gestionnaire Commandes");
    expect(ROLE_LABELS.ACCOUNTANT).toBe("Comptable");
    expect(ROLE_LABELS.FULL_MANAGER).toBe("Gestionnaire Complet");
  });

  // Test default permissions for each role
  function getDefaultPermissions(role: string): Record<string, any> {
    switch (role) {
      case "OWNER":
        return {
          leads: { view: "all", edit: true, delete: true },
          orders: { view: true, create: true, edit: true, cancel: true },
          spas: { view: true, order: true },
          invoices: { view: true, export: true },
          catalog: { view: true, viewPrices: true },
          sav: { view: true, create: true, edit: true },
          spareParts: { view: true, order: true },
          resources: { view: true, download: true },
          team: { invite: true, manage: true },
          profile: { edit: true },
        };
      case "SALES_REP":
        return {
          leads: { view: "assigned", edit: true, delete: false },
          orders: { view: false, create: false, edit: false, cancel: false },
          spas: { view: false, order: false },
          invoices: { view: false, export: false },
          catalog: { view: true, viewPrices: false },
          sav: { view: false, create: false, edit: false },
          spareParts: { view: false, order: false },
          resources: { view: false, download: false },
          team: { invite: false, manage: false },
          profile: { edit: false },
        };
      case "ORDER_MANAGER":
        return {
          leads: { view: "none", edit: false, delete: false },
          orders: { view: true, create: true, edit: true, cancel: true },
          spas: { view: true, order: true },
          invoices: { view: true, export: false },
          catalog: { view: true, viewPrices: true },
          sav: { view: true, create: true, edit: false },
          spareParts: { view: true, order: true },
          resources: { view: true, download: true },
          team: { invite: false, manage: false },
          profile: { edit: false },
        };
      case "ACCOUNTANT":
        return {
          leads: { view: "none", edit: false, delete: false },
          orders: { view: true, create: false, edit: false, cancel: false },
          spas: { view: false, order: false },
          invoices: { view: true, export: true },
          catalog: { view: false, viewPrices: false },
          sav: { view: false, create: false, edit: false },
          spareParts: { view: false, order: false },
          resources: { view: false, download: false },
          team: { invite: false, manage: false },
          profile: { edit: false },
        };
      case "FULL_MANAGER":
        return {
          leads: { view: "all", edit: true, delete: true },
          orders: { view: true, create: true, edit: true, cancel: true },
          spas: { view: true, order: true },
          invoices: { view: true, export: true },
          catalog: { view: true, viewPrices: true },
          sav: { view: true, create: true, edit: true },
          spareParts: { view: true, order: true },
          resources: { view: true, download: true },
          team: { invite: false, manage: false },
          profile: { edit: false },
        };
      default:
        return {};
    }
  }

  it("OWNER should have full access to all permissions", () => {
    const perms = getDefaultPermissions("OWNER");
    expect(perms.leads.view).toBe("all");
    expect(perms.leads.edit).toBe(true);
    expect(perms.leads.delete).toBe(true);
    expect(perms.orders.view).toBe(true);
    expect(perms.orders.create).toBe(true);
    expect(perms.team.invite).toBe(true);
    expect(perms.team.manage).toBe(true);
  });

  it("SALES_REP should only see assigned leads and catalog without prices", () => {
    const perms = getDefaultPermissions("SALES_REP");
    expect(perms.leads.view).toBe("assigned");
    expect(perms.leads.edit).toBe(true);
    expect(perms.leads.delete).toBe(false);
    expect(perms.orders.view).toBe(false);
    expect(perms.catalog.view).toBe(true);
    expect(perms.catalog.viewPrices).toBe(false);
    expect(perms.team.invite).toBe(false);
  });

  it("ORDER_MANAGER should have access to orders, catalog with prices, SAV and spare parts", () => {
    const perms = getDefaultPermissions("ORDER_MANAGER");
    expect(perms.leads.view).toBe("none");
    expect(perms.orders.view).toBe(true);
    expect(perms.orders.create).toBe(true);
    expect(perms.catalog.viewPrices).toBe(true);
    expect(perms.sav.view).toBe(true);
    expect(perms.spareParts.view).toBe(true);
    expect(perms.spareParts.order).toBe(true);
  });

  it("ACCOUNTANT should only see orders and export invoices", () => {
    const perms = getDefaultPermissions("ACCOUNTANT");
    expect(perms.orders.view).toBe(true);
    expect(perms.orders.create).toBe(false);
    expect(perms.invoices.view).toBe(true);
    expect(perms.invoices.export).toBe(true);
    expect(perms.catalog.view).toBe(false);
    expect(perms.sav.view).toBe(false);
  });

  it("FULL_MANAGER should have access to everything except team management", () => {
    const perms = getDefaultPermissions("FULL_MANAGER");
    expect(perms.leads.view).toBe("all");
    expect(perms.orders.view).toBe(true);
    expect(perms.invoices.export).toBe(true);
    expect(perms.sav.edit).toBe(true);
    expect(perms.team.invite).toBe(false);
    expect(perms.team.manage).toBe(false);
  });
});

describe("Team Management - Admin Access Logic", () => {
  function isAdminUser(role: string): boolean {
    return role === "SUPER_ADMIN" || role === "ADMIN";
  }

  function isOwner(role: string): boolean {
    return role === "PARTNER_ADMIN" || role === "PARTNER" || isAdminUser(role);
  }

  function canInvite(role: string, partnerId: number | null, inputPartnerId?: number): boolean {
    const isAdmin = isAdminUser(role);
    const targetPartnerId = inputPartnerId || partnerId;
    if (!targetPartnerId) return false;
    // Admins can always invite when they specify a partner
    if (isAdmin) return true;
    // Partner admins can invite for their own partner
    if (role === "PARTNER_ADMIN" && partnerId) return true;
    return false;
  }

  it("SUPER_ADMIN should be identified as admin", () => {
    expect(isAdminUser("SUPER_ADMIN")).toBe(true);
  });

  it("ADMIN should be identified as admin", () => {
    expect(isAdminUser("ADMIN")).toBe(true);
  });

  it("PARTNER_ADMIN should NOT be identified as admin", () => {
    expect(isAdminUser("PARTNER_ADMIN")).toBe(false);
  });

  it("SUPER_ADMIN should be identified as owner", () => {
    expect(isOwner("SUPER_ADMIN")).toBe(true);
  });

  it("PARTNER_ADMIN should be identified as owner", () => {
    expect(isOwner("PARTNER_ADMIN")).toBe(true);
  });

  it("PARTNER_USER should NOT be identified as owner", () => {
    expect(isOwner("PARTNER_USER")).toBe(false);
  });

  it("Admin without partnerId but with inputPartnerId should be able to invite", () => {
    expect(canInvite("SUPER_ADMIN", null, 123)).toBe(true);
  });

  it("Admin without any partnerId should NOT be able to invite", () => {
    expect(canInvite("SUPER_ADMIN", null)).toBe(false);
  });

  it("PARTNER_ADMIN with partnerId should be able to invite", () => {
    expect(canInvite("PARTNER_ADMIN", 42)).toBe(true);
  });

  it("PARTNER_USER should NOT be able to invite", () => {
    expect(canInvite("PARTNER_USER", 42)).toBe(false);
  });
});

describe("Team Management - Partner Selection for Admins", () => {
  it("should determine effective partnerId correctly for admin", () => {
    const isAdmin = true;
    const selectedPartnerId = 5;
    const userPartnerId = undefined;
    const effectivePartnerId = isAdmin ? selectedPartnerId : userPartnerId;
    expect(effectivePartnerId).toBe(5);
  });

  it("should use user partnerId for non-admin", () => {
    const isAdmin = false;
    const selectedPartnerId = undefined;
    const userPartnerId = 42;
    const effectivePartnerId = isAdmin ? selectedPartnerId : userPartnerId;
    expect(effectivePartnerId).toBe(42);
  });

  it("should return undefined when admin has not selected a partner", () => {
    const isAdmin = true;
    const selectedPartnerId = undefined;
    const userPartnerId = undefined;
    const effectivePartnerId = isAdmin ? selectedPartnerId : userPartnerId;
    expect(effectivePartnerId).toBeUndefined();
  });

  it("should prioritize admin selection over user partnerId", () => {
    const isAdmin = true;
    const selectedPartnerId = 10;
    const userPartnerId = 42;
    const effectivePartnerId = isAdmin ? selectedPartnerId : userPartnerId;
    expect(effectivePartnerId).toBe(10);
  });
});

describe("Team Management - External Email Validation", () => {
  function validateExternalEmail(email: string, existingEmails: string[]): { valid: boolean; error?: string } {
    if (!email) return { valid: false, error: "Email requis" };
    if (existingEmails.includes(email.toLowerCase())) {
      return { valid: false, error: "Cette adresse email est déjà associée à un compte existant" };
    }
    return { valid: true };
  }

  it("should reject an email that belongs to an existing user", () => {
    const result = validateExternalEmail("admin@marketspas.com", ["admin@marketspas.com", "user@test.com"]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("déjà associée");
  });

  it("should accept an email that does not belong to any existing user", () => {
    const result = validateExternalEmail("nouveau@externe.com", ["admin@marketspas.com", "user@test.com"]);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should be case-insensitive when checking existing emails", () => {
    const result = validateExternalEmail("Admin@MarketSpas.com", ["admin@marketspas.com"]);
    expect(result.valid).toBe(false);
  });

  it("should reject empty email", () => {
    const result = validateExternalEmail("", ["admin@marketspas.com"]);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Email requis");
  });
});

describe("Team Management - Invitation Input Validation", () => {
  it("should require partnerId for admin invitation", () => {
    const isAdmin = true;
    const selectedPartnerId: number | undefined = undefined;
    const email = "test@example.com";
    const canSubmit = !!email && (!isAdmin || !!selectedPartnerId);
    expect(canSubmit).toBe(false);
  });

  it("should allow submission when admin has selected a partner", () => {
    const isAdmin = true;
    const selectedPartnerId: number | undefined = 5;
    const email = "test@example.com";
    const canSubmit = !!email && (!isAdmin || !!selectedPartnerId);
    expect(canSubmit).toBe(true);
  });

  it("should allow submission for non-admin with email", () => {
    const isAdmin = false;
    const selectedPartnerId: number | undefined = undefined;
    const email = "test@example.com";
    const canSubmit = !!email && (!isAdmin || !!selectedPartnerId);
    expect(canSubmit).toBe(true);
  });

  it("should block submission without email", () => {
    const isAdmin = false;
    const selectedPartnerId: number | undefined = undefined;
    const email = "";
    const canSubmit = !!email && (!isAdmin || !!selectedPartnerId);
    expect(canSubmit).toBe(false);
  });
});
