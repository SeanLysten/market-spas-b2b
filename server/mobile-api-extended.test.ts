/**
 * Tests for mobile-api-user.ts and mobile-api-admin.ts
 * Validates that all new endpoints are registered, auth-protected,
 * and respond with correct structure.
 */
import { describe, it, expect, vi, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

// ============================================
// 1. FILE STRUCTURE TESTS
// ============================================
describe("Mobile API Extended - File Structure", () => {
  const basePath = path.resolve(__dirname, "routes");

  it("mobile-api-user.ts exists", () => {
    expect(fs.existsSync(path.join(basePath, "mobile-api-user.ts"))).toBe(true);
  });

  it("mobile-api-admin.ts exists", () => {
    expect(fs.existsSync(path.join(basePath, "mobile-api-admin.ts"))).toBe(true);
  });

  it("_core/index.ts imports both new routers", () => {
    const coreIndex = fs.readFileSync(path.resolve(__dirname, "_core/index.ts"), "utf-8");
    expect(coreIndex).toContain('import { mobileApiUserRouter } from "../routes/mobile-api-user"');
    expect(coreIndex).toContain('import { mobileApiAdminRouter } from "../routes/mobile-api-admin"');
    expect(coreIndex).toContain("app.use(mobileApiUserRouter)");
    expect(coreIndex).toContain("app.use(mobileApiAdminRouter)");
  });
});

// ============================================
// 2. USER ENDPOINTS REGISTRATION
// ============================================
describe("Mobile API User - Endpoint Registration", () => {
  const userFile = fs.readFileSync(
    path.resolve(__dirname, "routes/mobile-api-user.ts"),
    "utf-8"
  );

  // Profile
  it("has GET /api/mobile/v1/profile", () => {
    expect(userFile).toContain('router.get("/api/mobile/v1/profile"');
  });
  it("has PUT /api/mobile/v1/profile", () => {
    expect(userFile).toContain('router.put("/api/mobile/v1/profile"');
  });
  it("has PUT /api/mobile/v1/partner/profile", () => {
    expect(userFile).toContain('router.put("/api/mobile/v1/partner/profile"');
  });

  // Cart
  it("has GET /api/mobile/v1/cart", () => {
    expect(userFile).toContain('router.get("/api/mobile/v1/cart"');
  });
  it("has POST /api/mobile/v1/cart", () => {
    expect(userFile).toContain('router.post("/api/mobile/v1/cart"');
  });
  it("has PUT /api/mobile/v1/cart/:productId", () => {
    expect(userFile).toContain('router.put("/api/mobile/v1/cart/:productId"');
  });
  it("has DELETE /api/mobile/v1/cart/:productId", () => {
    expect(userFile).toContain('router.delete("/api/mobile/v1/cart/:productId"');
  });
  it("has DELETE /api/mobile/v1/cart (clear)", () => {
    expect(userFile).toContain('router.delete("/api/mobile/v1/cart"');
  });

  // Favorites
  it("has GET /api/mobile/v1/favorites", () => {
    expect(userFile).toContain('router.get("/api/mobile/v1/favorites"');
  });
  it("has POST /api/mobile/v1/favorites/:productId", () => {
    expect(userFile).toContain('router.post("/api/mobile/v1/favorites/:productId"');
  });
  it("has DELETE /api/mobile/v1/favorites/:productId", () => {
    expect(userFile).toContain('router.delete("/api/mobile/v1/favorites/:productId"');
  });

  // Search
  it("has GET /api/mobile/v1/products/search", () => {
    expect(userFile).toContain('router.get("/api/mobile/v1/products/search"');
  });

  // Orders advanced
  it("has POST /api/mobile/v1/orders/:id/cancel", () => {
    expect(userFile).toContain('router.post("/api/mobile/v1/orders/:id/cancel"');
  });
  it("has POST /api/mobile/v1/orders/:id/reorder", () => {
    expect(userFile).toContain('router.post("/api/mobile/v1/orders/:id/reorder"');
  });
  it("has GET /api/mobile/v1/orders/export", () => {
    expect(userFile).toContain('router.get("/api/mobile/v1/orders/export"');
  });

  // Returns
  it("has GET /api/mobile/v1/returns", () => {
    expect(userFile).toContain('router.get("/api/mobile/v1/returns"');
  });
  it("has GET /api/mobile/v1/returns/:id", () => {
    expect(userFile).toContain('router.get("/api/mobile/v1/returns/:id"');
  });

  // SAV extended
  it("has GET /api/mobile/v1/sav/:id/history", () => {
    expect(userFile).toContain('router.get("/api/mobile/v1/sav/:id/history"');
  });
  it("has GET /api/mobile/v1/sav/:id/spare-parts", () => {
    expect(userFile).toContain('router.get("/api/mobile/v1/sav/:id/spare-parts"');
  });
  it("has POST /api/mobile/v1/sav/:id/note", () => {
    expect(userFile).toContain('router.post("/api/mobile/v1/sav/:id/note"');
  });

  // Spare parts
  it("has GET /api/mobile/v1/spare-parts", () => {
    expect(userFile).toContain('router.get("/api/mobile/v1/spare-parts"');
  });
  it("has GET /api/mobile/v1/spare-parts/:id", () => {
    expect(userFile).toContain('router.get("/api/mobile/v1/spare-parts/:id"');
  });

  // Spa models
  it("has GET /api/mobile/v1/spa-models", () => {
    expect(userFile).toContain('router.get("/api/mobile/v1/spa-models"');
  });
  it("has GET /api/mobile/v1/spa-models/:id", () => {
    expect(userFile).toContain('router.get("/api/mobile/v1/spa-models/:id"');
  });

  // Technical resources
  it("has GET /api/mobile/v1/technical-resources", () => {
    expect(userFile).toContain('router.get("/api/mobile/v1/technical-resources"');
  });

  // Forum
  it("has GET /api/mobile/v1/forum/topics", () => {
    expect(userFile).toContain('router.get("/api/mobile/v1/forum/topics"');
  });
  it("has POST /api/mobile/v1/forum/topics", () => {
    expect(userFile).toContain('router.post("/api/mobile/v1/forum/topics"');
  });
  it("has POST /api/mobile/v1/forum/topics/:id/reply", () => {
    expect(userFile).toContain('router.post("/api/mobile/v1/forum/topics/:id/reply"');
  });

  // Team
  it("has GET /api/mobile/v1/team", () => {
    expect(userFile).toContain('router.get("/api/mobile/v1/team"');
  });
  it("has GET /api/mobile/v1/team/permissions", () => {
    expect(userFile).toContain('router.get("/api/mobile/v1/team/permissions"');
  });

  // Notification preferences
  it("has GET /api/mobile/v1/notification-preferences", () => {
    expect(userFile).toContain('router.get("/api/mobile/v1/notification-preferences"');
  });
  it("has PUT /api/mobile/v1/notification-preferences", () => {
    expect(userFile).toContain('router.put("/api/mobile/v1/notification-preferences"');
  });

  // Leads stats
  it("has GET /api/mobile/v1/leads/stats", () => {
    expect(userFile).toContain('router.get("/api/mobile/v1/leads/stats"');
  });

  // Shipping zones
  it("has GET /api/mobile/v1/shipping-zones/lookup", () => {
    expect(userFile).toContain('router.get("/api/mobile/v1/shipping-zones/lookup"');
  });

  // Onboarding
  it("has GET /api/mobile/v1/onboarding", () => {
    expect(userFile).toContain('router.get("/api/mobile/v1/onboarding"');
  });
  it("has POST /api/mobile/v1/onboarding/complete", () => {
    expect(userFile).toContain('router.post("/api/mobile/v1/onboarding/complete"');
  });

  // Saved routes
  it("has GET /api/mobile/v1/saved-routes", () => {
    expect(userFile).toContain('router.get("/api/mobile/v1/saved-routes"');
  });
  it("has POST /api/mobile/v1/saved-routes", () => {
    expect(userFile).toContain('router.post("/api/mobile/v1/saved-routes"');
  });

  // Media folders
  it("has GET /api/mobile/v1/media-folders", () => {
    expect(userFile).toContain('router.get("/api/mobile/v1/media-folders"');
  });
});

// ============================================
// 3. ADMIN ENDPOINTS REGISTRATION
// ============================================
describe("Mobile API Admin - Endpoint Registration", () => {
  const adminFile = fs.readFileSync(
    path.resolve(__dirname, "routes/mobile-api-admin.ts"),
    "utf-8"
  );

  // Users
  it("has GET /api/mobile/admin/users", () => {
    expect(adminFile).toContain('router.get("/api/mobile/admin/users"');
  });
  it("has PUT /api/mobile/admin/users/:id/toggle-active", () => {
    expect(adminFile).toContain('router.put("/api/mobile/admin/users/:id/toggle-active"');
  });

  // Products
  it("has GET /api/mobile/admin/products", () => {
    expect(adminFile).toContain('router.get("/api/mobile/admin/products"');
  });
  it("has POST /api/mobile/admin/products", () => {
    expect(adminFile).toContain('router.post("/api/mobile/admin/products"');
  });
  it("has PUT /api/mobile/admin/products/:id", () => {
    expect(adminFile).toContain('router.put("/api/mobile/admin/products/:id"');
  });
  it("has DELETE /api/mobile/admin/products/:id", () => {
    expect(adminFile).toContain('router.delete("/api/mobile/admin/products/:id"');
  });

  // Events
  it("has GET /api/mobile/admin/events", () => {
    expect(adminFile).toContain('router.get("/api/mobile/admin/events"');
  });
  it("has POST /api/mobile/admin/events", () => {
    expect(adminFile).toContain('router.post("/api/mobile/admin/events"');
  });
  it("has PUT /api/mobile/admin/events/:id", () => {
    expect(adminFile).toContain('router.put("/api/mobile/admin/events/:id"');
  });
  it("has DELETE /api/mobile/admin/events/:id", () => {
    expect(adminFile).toContain('router.delete("/api/mobile/admin/events/:id"');
  });

  // Payments
  it("has GET /api/mobile/admin/payments", () => {
    expect(adminFile).toContain('router.get("/api/mobile/admin/payments"');
  });

  // Order actions
  it("has PUT /api/mobile/admin/orders/:id/status", () => {
    expect(adminFile).toContain('router.put("/api/mobile/admin/orders/:id/status"');
  });
  it("has GET /api/mobile/admin/orders/today", () => {
    expect(adminFile).toContain('router.get("/api/mobile/admin/orders/today"');
  });
  it("has POST /api/mobile/admin/orders/:id/validate", () => {
    expect(adminFile).toContain('router.post("/api/mobile/admin/orders/:id/validate"');
  });

  // Partners
  it("has POST /api/mobile/admin/partners", () => {
    expect(adminFile).toContain('router.post("/api/mobile/admin/partners"');
  });
  it("has PUT /api/mobile/admin/partners/:id", () => {
    expect(adminFile).toContain('router.put("/api/mobile/admin/partners/:id"');
  });

  // SAV admin
  it("has PUT /api/mobile/admin/sav/:id/status", () => {
    expect(adminFile).toContain('router.put("/api/mobile/admin/sav/:id/status"');
  });
  it("has PUT /api/mobile/admin/sav/:id/warranty", () => {
    expect(adminFile).toContain('router.put("/api/mobile/admin/sav/:id/warranty"');
  });
  it("has POST /api/mobile/admin/sav/:id/spare-part", () => {
    expect(adminFile).toContain('router.post("/api/mobile/admin/sav/:id/spare-part"');
  });
  it("has POST /api/mobile/admin/sav/:id/tracking", () => {
    expect(adminFile).toContain('router.post("/api/mobile/admin/sav/:id/tracking"');
  });
  it("has GET /api/mobile/admin/sav/stats", () => {
    expect(adminFile).toContain('router.get("/api/mobile/admin/sav/stats"');
  });
  it("has GET /api/mobile/admin/sav", () => {
    expect(adminFile).toContain('router.get("/api/mobile/admin/sav"');
  });

  // Customer SAV
  it("has GET /api/mobile/admin/customer-sav", () => {
    expect(adminFile).toContain('router.get("/api/mobile/admin/customer-sav"');
  });

  // Territories
  it("has GET /api/mobile/admin/territories", () => {
    expect(adminFile).toContain('router.get("/api/mobile/admin/territories"');
  });

  // Candidates
  it("has GET /api/mobile/admin/candidates", () => {
    expect(adminFile).toContain('router.get("/api/mobile/admin/candidates"');
  });
  it("has PUT /api/mobile/admin/candidates/:id", () => {
    expect(adminFile).toContain('router.put("/api/mobile/admin/candidates/:id"');
  });

  // Newsletters
  it("has GET /api/mobile/admin/newsletters/scheduled", () => {
    expect(adminFile).toContain('router.get("/api/mobile/admin/newsletters/scheduled"');
  });

  // Settings
  it("has GET /api/mobile/admin/settings", () => {
    expect(adminFile).toContain('router.get("/api/mobile/admin/settings"');
  });
  it("has PUT /api/mobile/admin/settings", () => {
    expect(adminFile).toContain('router.put("/api/mobile/admin/settings"');
  });
  it("has GET /api/mobile/admin/settings/integrations", () => {
    expect(adminFile).toContain('router.get("/api/mobile/admin/settings/integrations"');
  });

  // Logs
  it("has GET /api/mobile/admin/webhook-logs", () => {
    expect(adminFile).toContain('router.get("/api/mobile/admin/webhook-logs"');
  });
  it("has GET /api/mobile/admin/supplier-logs", () => {
    expect(adminFile).toContain('router.get("/api/mobile/admin/supplier-logs"');
  });

  // Shipping zones
  it("has GET /api/mobile/admin/shipping-zones", () => {
    expect(adminFile).toContain('router.get("/api/mobile/admin/shipping-zones"');
  });

  // Warranty rules
  it("has GET /api/mobile/admin/warranty-rules", () => {
    expect(adminFile).toContain('router.get("/api/mobile/admin/warranty-rules"');
  });
  it("has POST /api/mobile/admin/warranty-rules", () => {
    expect(adminFile).toContain('router.post("/api/mobile/admin/warranty-rules"');
  });

  // Spare parts admin
  it("has POST /api/mobile/admin/spare-parts", () => {
    expect(adminFile).toContain('router.post("/api/mobile/admin/spare-parts"');
  });
  it("has PUT /api/mobile/admin/spare-parts/:id", () => {
    expect(adminFile).toContain('router.put("/api/mobile/admin/spare-parts/:id"');
  });
  it("has DELETE /api/mobile/admin/spare-parts/:id", () => {
    expect(adminFile).toContain('router.delete("/api/mobile/admin/spare-parts/:id"');
  });

  // Spa models admin
  it("has POST /api/mobile/admin/spa-models", () => {
    expect(adminFile).toContain('router.post("/api/mobile/admin/spa-models"');
  });
  it("has PUT /api/mobile/admin/spa-models/:id", () => {
    expect(adminFile).toContain('router.put("/api/mobile/admin/spa-models/:id"');
  });
  it("has DELETE /api/mobile/admin/spa-models/:id", () => {
    expect(adminFile).toContain('router.delete("/api/mobile/admin/spa-models/:id"');
  });

  // Forecast
  it("has GET /api/mobile/admin/forecast", () => {
    expect(adminFile).toContain('router.get("/api/mobile/admin/forecast"');
  });

  // Detailed stats
  it("has GET /api/mobile/admin/stats/detailed", () => {
    expect(adminFile).toContain('router.get("/api/mobile/admin/stats/detailed"');
  });

  // Leads admin
  it("has GET /api/mobile/admin/leads/stats", () => {
    expect(adminFile).toContain('router.get("/api/mobile/admin/leads/stats"');
  });
  it("has PUT /api/mobile/admin/leads/:id", () => {
    expect(adminFile).toContain('router.put("/api/mobile/admin/leads/:id"');
  });
});

// ============================================
// 4. AUTH MIDDLEWARE TESTS
// ============================================
describe("Mobile API Extended - Auth Middleware", () => {
  const userFile = fs.readFileSync(
    path.resolve(__dirname, "routes/mobile-api-user.ts"),
    "utf-8"
  );
  const adminFile = fs.readFileSync(
    path.resolve(__dirname, "routes/mobile-api-admin.ts"),
    "utf-8"
  );

  it("user router imports verifyMobileAccessToken", () => {
    expect(userFile).toContain("verifyMobileAccessToken");
  });

  it("user router applies requireMobileAuth middleware", () => {
    expect(userFile).toContain('router.use("/api/mobile/v1", requireMobileAuth)');
  });

  it("admin router imports verifyMobileAccessToken", () => {
    expect(adminFile).toContain("verifyMobileAccessToken");
  });

  it("admin router applies requireMobileAuth + requireAdminRole middleware", () => {
    expect(adminFile).toContain('router.use("/api/mobile/admin", requireMobileAuth, requireAdminRole)');
  });

  it("admin router defines requireAdminRole function", () => {
    expect(adminFile).toContain("async function requireAdminRole");
    expect(adminFile).toContain('"SUPER_ADMIN"');
    expect(adminFile).toContain('"ADMIN"');
  });
});

// ============================================
// 5. RESPONSE FORMAT CONSISTENCY
// ============================================
describe("Mobile API Extended - Response Format Consistency", () => {
  const userFile = fs.readFileSync(
    path.resolve(__dirname, "routes/mobile-api-user.ts"),
    "utf-8"
  );
  const adminFile = fs.readFileSync(
    path.resolve(__dirname, "routes/mobile-api-admin.ts"),
    "utf-8"
  );

  it("user endpoints use consistent error format", () => {
    const errorPattern = /res\.status\(\d+\)\.json\(\{ error: "[A-Z_]+", message:/g;
    const matches = userFile.match(errorPattern);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThan(5);
  });

  it("admin endpoints use consistent error format", () => {
    const errorPattern = /res\.status\(\d+\)\.json\(\{ error: "[A-Z_]+", message:/g;
    const matches = adminFile.match(errorPattern);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThan(3);
  });

  it("list endpoints include pagination", () => {
    const paginationPattern = /pagination: \{ page, limit, total, totalPages/g;
    const userMatches = userFile.match(paginationPattern);
    const adminMatches = adminFile.match(paginationPattern);
    expect(userMatches).not.toBeNull();
    expect(adminMatches).not.toBeNull();
  });
});

// ============================================
// 6. ENDPOINT COUNT VALIDATION
// ============================================
describe("Mobile API Extended - Endpoint Count", () => {
  const userFile = fs.readFileSync(
    path.resolve(__dirname, "routes/mobile-api-user.ts"),
    "utf-8"
  );
  const adminFile = fs.readFileSync(
    path.resolve(__dirname, "routes/mobile-api-admin.ts"),
    "utf-8"
  );

  it("user router has at least 30 endpoints", () => {
    const routePattern = /router\.(get|post|put|delete|patch)\("/g;
    const matches = userFile.match(routePattern);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(30);
  });

  it("admin router has at least 30 endpoints", () => {
    const routePattern = /router\.(get|post|put|delete|patch)\("/g;
    const matches = adminFile.match(routePattern);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(30);
  });
});
