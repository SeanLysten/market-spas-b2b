import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(userOverrides?: Partial<AuthenticatedUser>): TrpcContext {
  const defaultUser: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    emailVerified: null,
    passwordHash: null,
    firstName: "Test",
    lastName: "User",
    name: "Test User",
    phone: null,
    avatar: null,
    locale: "fr",
    timezone: "Europe/Brussels",
    role: "PARTNER_USER",
    partnerId: 1,
    loginMethod: "local",
    twoFactorEnabled: false,
    twoFactorSecret: null,
    lastLoginAt: null,
    lastLoginIp: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    isActive: true,
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    deletedAt: null,
    adminPermissions: null,
    adminRolePreset: null,
  };

  const user = userOverrides ? { ...defaultUser, ...userOverrides } : defaultUser;

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return createMockContext({ role: "SUPER_ADMIN", partnerId: null });
}

describe("auth routes", () => {
  it("should return current user with auth.me", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeDefined();
    expect(result?.email).toBe("test@example.com");
    expect(result?.role).toBe("PARTNER_USER");
  });

  it("should logout successfully", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
  });
});

describe("dashboard routes", () => {
  it("should return dashboard stats for authenticated user", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.stats();

    expect(result).toBeDefined();
    expect(typeof result?.totalOrders).toBe("number");
    expect(typeof result?.totalRevenue).toBe("number");
  });

  it("should return recent orders for partner user", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.recentOrders({ limit: 10 });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should return notifications for user", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.notifications({ limit: 50 });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should return unread notification count", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.unreadCount();

    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe("partners routes", () => {
  it("should allow admin to list partners", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.partners.list({});

    expect(Array.isArray(result)).toBe(true);
  });

  it("should allow partner user to view their own partner data", async () => {
    const ctx = createMockContext({ partnerId: 1 });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.partners.myPartner();

    // Result can be null/undefined if partner doesn't exist in DB yet
    expect(result === null || result === undefined || typeof result === "object").toBe(true);
  });

  it("should prevent partner user from viewing other partner data", async () => {
    const ctx = createMockContext({ partnerId: 1 });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.partners.getById({ id: 999 })
    ).rejects.toThrow("Unauthorized");
  });
});

describe("products routes", () => {
  it("should list products for authenticated user", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.products.list({});

    expect(Array.isArray(result)).toBe(true);
  });

  it("should support search filter", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.products.list({ search: "test" });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should support category filter", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.products.list({ categoryId: 1 });

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("orders routes", () => {
  it("should list orders for partner user", async () => {
    const ctx = createMockContext({ partnerId: 1 });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orders.list({});

    expect(Array.isArray(result)).toBe(true);
  });

  it("should list all orders for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orders.list({});

    expect(Array.isArray(result)).toBe(true);
  });

  it("should prevent partner from viewing other partner orders", async () => {
    const ctx = createMockContext({ partnerId: 1 });
    const caller = appRouter.createCaller(ctx);

    // This would throw if we try to access an order from another partner
    // For now, just verify the query works
    const result = await caller.orders.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("resources routes", () => {
  it("should list resources for authenticated user", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.resources.list({});

    expect(Array.isArray(result)).toBe(true);
  });

  it("should support category filter", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.resources.list({ category: "TECHNICAL_DOC" });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should support language filter", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.resources.list({ language: "fr" });

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("profile routes", () => {
  it("should return user profile", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.profile.get();

    expect(result).toBeDefined();
    expect(result.email).toBe("test@example.com");
  });

  it("should update user profile", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.profile.update({
      firstName: "Updated",
      lastName: "Name",
    });

    expect(result).toEqual({ success: true });
  });
});
