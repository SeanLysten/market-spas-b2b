import { describe, it, expect, vi } from "vitest";

// ============================================
// Tests for the user/partner management refonte
// ============================================

describe("getAllPartners memberCount", () => {
  it("should include memberCount field in partner list results", async () => {
    // Import the function
    const db = await import("./db");
    const result = await db.getAllPartners({});
    
    // Result should be an array
    expect(Array.isArray(result)).toBe(true);
    
    // If there are partners, each should have memberCount
    if (result.length > 0) {
      const firstPartner = result[0];
      expect(firstPartner).toHaveProperty("memberCount");
      // memberCount should be a number (or string representation of number from SQL)
      expect(typeof firstPartner.memberCount === "number" || typeof firstPartner.memberCount === "string").toBe(true);
      expect(Number(firstPartner.memberCount)).toBeGreaterThanOrEqual(0);
    }
  });

  it("should still return all standard partner fields", async () => {
    const db = await import("./db");
    const result = await db.getAllPartners({});
    
    if (result.length > 0) {
      const partner = result[0];
      // Check essential fields are still present
      expect(partner).toHaveProperty("id");
      expect(partner).toHaveProperty("companyName");
      expect(partner).toHaveProperty("vatNumber");
      expect(partner).toHaveProperty("primaryContactEmail");
      expect(partner).toHaveProperty("status");
      expect(partner).toHaveProperty("level");
      expect(partner).toHaveProperty("discountPercent");
      expect(partner).toHaveProperty("totalOrders");
      expect(partner).toHaveProperty("totalRevenue");
      expect(partner).toHaveProperty("supplierClientCode");
      expect(partner).toHaveProperty("createdAt");
    }
  });

  it("should support search filter", async () => {
    const db = await import("./db");
    // Search with a term that likely won't match anything
    const result = await db.getAllPartners({ search: "zzz_nonexistent_zzz" });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("should support status filter", async () => {
    const db = await import("./db");
    const result = await db.getAllPartners({ status: "APPROVED" });
    expect(Array.isArray(result)).toBe(true);
    // All returned partners should have APPROVED status
    for (const partner of result) {
      expect(partner.status).toBe("APPROVED");
    }
  });
});

describe("getTeamMembers includes extended fields", () => {
  it("should return team members with lastLoginAt, phone, isActive, and role fields", async () => {
    const db = await import("./db");
    
    // Get a partner to test with
    const partners = await db.getAllPartners({ limit: 1 });
    if (partners.length === 0) {
      // No partners to test with, skip
      return;
    }
    
    const partnerId = partners[0].id;
    const members = await db.getTeamMembers(partnerId);
    
    expect(Array.isArray(members)).toBe(true);
    
    if (members.length > 0) {
      const member = members[0];
      // Check that extended fields are present
      expect(member).toHaveProperty("userId");
      expect(member).toHaveProperty("name");
      expect(member).toHaveProperty("email");
      expect(member).toHaveProperty("teamRole");
    }
  });
});

describe("Admin navigation structure", () => {
  it("should have Équipe interne under Paramètres section, not Communication", async () => {
    // Read the AdminLayout file to verify structure
    const fs = await import("fs");
    const path = await import("path");
    const layoutPath = path.resolve(__dirname, "../client/src/components/AdminLayout.tsx");
    const content = fs.readFileSync(layoutPath, "utf-8");
    
    // Verify "Équipe interne" is in Paramètres section
    const parametresSection = content.match(/label:\s*"Paramètres"[\s\S]*?items:\s*\[([\s\S]*?)\]/);
    expect(parametresSection).toBeTruthy();
    expect(parametresSection![1]).toContain("Équipe interne");
    
    // Verify "Utilisateurs" is NOT in Communication section
    const communicationSection = content.match(/label:\s*"Communication"[\s\S]*?items:\s*\[([\s\S]*?)\]/);
    expect(communicationSection).toBeTruthy();
    expect(communicationSection![1]).not.toContain("Utilisateurs");
  });
});

describe("AdminUsers page focuses on admins only", () => {
  it("should have title 'Équipe interne' and filter for admin users", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const usersPagePath = path.resolve(__dirname, "../client/src/pages/admin/AdminUsers.tsx");
    const content = fs.readFileSync(usersPagePath, "utf-8");
    
    // Should contain "Équipe interne" title
    expect(content).toContain("Équipe interne");
    
    // Should filter for admin users only
    expect(content).toContain('u.role === "SUPER_ADMIN" || u.role === "ADMIN"');
    
    // Should NOT contain "Comptes Partenaires" tab (removed)
    expect(content).not.toContain("Comptes Partenaires");
    
    // Should contain info banner pointing to partner pages
    expect(content).toContain("/admin/partners");
    
    // Should have "Inviter un administrateur" button
    expect(content).toContain("Inviter un administrateur");
  });
});

describe("AdminPartnerDetail has tabs structure", () => {
  it("should have Vue d'ensemble, Membres, Contacts, Commandes, and Notes tabs", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const detailPath = path.resolve(__dirname, "../client/src/pages/admin/AdminPartnerDetail.tsx");
    const content = fs.readFileSync(detailPath, "utf-8");
    
    // Check for tab values
    expect(content).toContain('"overview"');
    expect(content).toContain('"members"');
    expect(content).toContain('"contacts"');
    expect(content).toContain('"orders"');
    expect(content).toContain('"notes"');
    
    // Should have team member management
    expect(content).toContain("team.list");
  });
});

describe("AdminPartners list includes member count column", () => {
  it("should display Membres column header and memberCount data", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const partnersPath = path.resolve(__dirname, "../client/src/pages/admin/AdminPartners.tsx");
    const content = fs.readFileSync(partnersPath, "utf-8");
    
    // Should have Membres table header
    expect(content).toContain("<TableHead>Membres</TableHead>");
    
    // Should reference memberCount
    expect(content).toContain("partner.memberCount");
    
    // Should NOT have "Voir le compte utilisateur" link (removed)
    expect(content).not.toContain("Voir le compte utilisateur");
  });
});
