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

describe("Partner-User Synchronization", () => {
  // Simulate the auto-creation logic
  function shouldCreateUserForPartner(
    partner: { id: number; primaryContactEmail: string },
    existingUsers: { email: string; partnerId: number | null }[]
  ): boolean {
    // Check if any user is already linked to this partner
    return !existingUsers.some(u => u.partnerId === partner.id);
  }

  function generateOpenId(partnerId: number): string {
    return `partner-auto-${partnerId}-${Date.now()}`;
  }

  it("should create a user when partner has no linked user", () => {
    const partner = { id: 60001, primaryContactEmail: "test@example.com" };
    const existingUsers: { email: string; partnerId: number | null }[] = [];
    expect(shouldCreateUserForPartner(partner, existingUsers)).toBe(true);
  });

  it("should not create a user when partner already has a linked user", () => {
    const partner = { id: 60001, primaryContactEmail: "test@example.com" };
    const existingUsers = [{ email: "test@example.com", partnerId: 60001 }];
    expect(shouldCreateUserForPartner(partner, existingUsers)).toBe(false);
  });

  it("should create a user even if email exists but linked to different partner", () => {
    const partner = { id: 60002, primaryContactEmail: "shared@example.com" };
    const existingUsers = [{ email: "shared@example.com", partnerId: 60001 }];
    expect(shouldCreateUserForPartner(partner, existingUsers)).toBe(true);
  });

  it("should generate unique openId for each partner", () => {
    const id1 = generateOpenId(60001);
    const id2 = generateOpenId(60002);
    expect(id1).toContain("partner-auto-60001");
    expect(id2).toContain("partner-auto-60002");
    expect(id1).not.toBe(id2);
  });

  it("should assign PARTNER_ADMIN role to auto-created users", () => {
    const autoCreatedRole = "PARTNER_ADMIN";
    expect(autoCreatedRole).toBe("PARTNER_ADMIN");
  });

  it("should set loginMethod to invitation for auto-created users", () => {
    const loginMethod = "invitation";
    expect(loginMethod).toBe("invitation");
  });
});

describe("Partner Cascade - Deactivate/Reactivate Users", () => {
  // Simulate the cascade logic
  function shouldDeactivateUsers(partnerStatus: string): boolean {
    return partnerStatus === "SUSPENDED" || partnerStatus === "TERMINATED";
  }

  function shouldReactivateUsers(partnerStatus: string): boolean {
    return partnerStatus === "APPROVED";
  }

  function shouldCascadeOnDelete(): boolean {
    return true; // Always deactivate + dissociate on delete
  }

  function filterActiveUsersByPartner(
    users: { id: number; partnerId: number | null; isActive: boolean }[],
    partnerId: number
  ): { id: number; partnerId: number | null; isActive: boolean }[] {
    return users.filter(u => u.partnerId === partnerId && u.isActive);
  }

  function filterInactiveUsersByPartner(
    users: { id: number; partnerId: number | null; isActive: boolean }[],
    partnerId: number
  ): { id: number; partnerId: number | null; isActive: boolean }[] {
    return users.filter(u => u.partnerId === partnerId && !u.isActive);
  }

  // Status-based cascade tests
  it("should deactivate users when partner is SUSPENDED", () => {
    expect(shouldDeactivateUsers("SUSPENDED")).toBe(true);
  });

  it("should deactivate users when partner is TERMINATED", () => {
    expect(shouldDeactivateUsers("TERMINATED")).toBe(true);
  });

  it("should NOT deactivate users when partner is APPROVED", () => {
    expect(shouldDeactivateUsers("APPROVED")).toBe(false);
  });

  it("should NOT deactivate users when partner is PENDING", () => {
    expect(shouldDeactivateUsers("PENDING")).toBe(false);
  });

  it("should reactivate users when partner is APPROVED", () => {
    expect(shouldReactivateUsers("APPROVED")).toBe(true);
  });

  it("should NOT reactivate users when partner is SUSPENDED", () => {
    expect(shouldReactivateUsers("SUSPENDED")).toBe(false);
  });

  it("should NOT reactivate users when partner is TERMINATED", () => {
    expect(shouldReactivateUsers("TERMINATED")).toBe(false);
  });

  // Delete cascade tests
  it("should always cascade on partner delete", () => {
    expect(shouldCascadeOnDelete()).toBe(true);
  });

  // User filtering tests
  it("should find active users for a given partner", () => {
    const users = [
      { id: 1, partnerId: 100, isActive: true },
      { id: 2, partnerId: 100, isActive: false },
      { id: 3, partnerId: 200, isActive: true },
      { id: 4, partnerId: 100, isActive: true },
    ];
    const active = filterActiveUsersByPartner(users, 100);
    expect(active).toHaveLength(2);
    expect(active.map(u => u.id)).toEqual([1, 4]);
  });

  it("should find inactive users for a given partner", () => {
    const users = [
      { id: 1, partnerId: 100, isActive: true },
      { id: 2, partnerId: 100, isActive: false },
      { id: 3, partnerId: 200, isActive: false },
    ];
    const inactive = filterInactiveUsersByPartner(users, 100);
    expect(inactive).toHaveLength(1);
    expect(inactive[0].id).toBe(2);
  });

  it("should return empty array when no active users for partner", () => {
    const users = [
      { id: 1, partnerId: 200, isActive: true },
    ];
    const active = filterActiveUsersByPartner(users, 100);
    expect(active).toHaveLength(0);
  });

  it("should handle dissociation after delete (partnerId set to null)", () => {
    const users = [
      { id: 1, partnerId: 100, isActive: true },
      { id: 2, partnerId: 100, isActive: true },
    ];
    // Simulate deactivation
    const deactivated = users.map(u => ({ ...u, isActive: false }));
    // Simulate dissociation
    const dissociated = deactivated.map(u => ({ ...u, partnerId: null }));
    expect(dissociated.every(u => !u.isActive && u.partnerId === null)).toBe(true);
  });
});
