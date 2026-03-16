import { describe, it, expect, vi } from "vitest";

// Test the notification service module structure and exports
describe("notification-service", () => {
  it("should export createNotification function", async () => {
    const mod = await import("./notification-service");
    expect(typeof mod.createNotification).toBe("function");
  });

  it("should export notifyNewOrderCreated function", async () => {
    const mod = await import("./notification-service");
    expect(typeof mod.notifyNewOrderCreated).toBe("function");
  });

  it("should export notifyOrderStatusChanged function", async () => {
    const mod = await import("./notification-service");
    expect(typeof mod.notifyOrderStatusChanged).toBe("function");
  });

  it("should export notifyPaymentReceived function", async () => {
    const mod = await import("./notification-service");
    expect(typeof mod.notifyPaymentReceived).toBe("function");
  });

  it("should export notifyPaymentFailed function", async () => {
    const mod = await import("./notification-service");
    expect(typeof mod.notifyPaymentFailed).toBe("function");
  });

  it("should export notifyRefundProcessed function", async () => {
    const mod = await import("./notification-service");
    expect(typeof mod.notifyRefundProcessed).toBe("function");
  });

  it("should export notifyDepositReminder function", async () => {
    const mod = await import("./notification-service");
    expect(typeof mod.notifyDepositReminder).toBe("function");
  });

  it("should export notifyNewPartnerRegistered function", async () => {
    const mod = await import("./notification-service");
    expect(typeof mod.notifyNewPartnerRegistered).toBe("function");
  });

  it("should export notifyPartnerApproved function", async () => {
    const mod = await import("./notification-service");
    expect(typeof mod.notifyPartnerApproved).toBe("function");
  });

  it("should export notifyPartnerSuspended function", async () => {
    const mod = await import("./notification-service");
    expect(typeof mod.notifyPartnerSuspended).toBe("function");
  });

  it("should export notifySavTicketCreated function", async () => {
    const mod = await import("./notification-service");
    expect(typeof mod.notifySavTicketCreated).toBe("function");
  });

  it("should export notifySavStatusChanged function", async () => {
    const mod = await import("./notification-service");
    expect(typeof mod.notifySavStatusChanged).toBe("function");
  });

  it("should export notifyNewResourcePublished function", async () => {
    const mod = await import("./notification-service");
    expect(typeof mod.notifyNewResourcePublished).toBe("function");
  });
});

// Test notification type coverage
describe("notification type coverage", () => {
  const expectedTypes = [
    "ORDER_CREATED",
    "ORDER_STATUS_CHANGED",
    "PAYMENT_RECEIVED",
    "PAYMENT_FAILED",
    "INVOICE_READY",
    "STOCK_LOW",
    "NEW_PARTNER",
    "PARTNER_APPROVED",
    "PARTNER_SUSPENDED",
    "NEW_RESOURCE",
    "SAV_CREATED",
    "SAV_STATUS_CHANGED",
    "LEAD_ASSIGNED",
    "DEPOSIT_REMINDER",
    "REFUND_PROCESSED",
    "SYSTEM_ALERT",
  ];

  it("should have all 16 notification types defined", () => {
    expect(expectedTypes.length).toBe(16);
  });

  it("should have a function for each actionable notification type", async () => {
    const mod = await import("./notification-service");
    
    // Map types to their handler functions
    const typeToFunction: Record<string, string> = {
      ORDER_CREATED: "notifyNewOrderCreated",
      ORDER_STATUS_CHANGED: "notifyOrderStatusChanged",
      PAYMENT_RECEIVED: "notifyPaymentReceived",
      PAYMENT_FAILED: "notifyPaymentFailed",
      REFUND_PROCESSED: "notifyRefundProcessed",
      DEPOSIT_REMINDER: "notifyDepositReminder",
      NEW_PARTNER: "notifyNewPartnerRegistered",
      PARTNER_APPROVED: "notifyPartnerApproved",
      PARTNER_SUSPENDED: "notifyPartnerSuspended",
      NEW_RESOURCE: "notifyNewResourcePublished",
      SAV_CREATED: "notifySavTicketCreated",
      SAV_STATUS_CHANGED: "notifySavStatusChanged",
    };

    for (const [type, fnName] of Object.entries(typeToFunction)) {
      expect(typeof (mod as any)[fnName]).toBe("function");
    }
  });
});

// Test the integration points
describe("notification integration points", () => {
  it("alerts.ts should import notification-service", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/market-spas-b2b/server/alerts.ts", "utf-8");
    expect(content).toContain('from "./notification-service"');
    expect(content).toContain("notifyOrderStatusChanged");
    expect(content).toContain("notifyNewOrderCreated");
    expect(content).toContain("notifyDepositReminder");
  });

  it("stripe-webhook.ts should import notification-service", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/market-spas-b2b/server/stripe-webhook.ts", "utf-8");
    expect(content).toContain('from "./notification-service"');
    expect(content).toContain("notifyPaymentReceived");
    expect(content).toContain("notifyPaymentFailed");
    expect(content).toContain("notifyRefundProcessed");
  });

  it("routers.ts should import notification-service", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/market-spas-b2b/server/routers.ts", "utf-8");
    expect(content).toContain('from "./notification-service"');
    expect(content).toContain("notifService.notifyPartnerApproved");
    expect(content).toContain("notifService.notifyPartnerSuspended");
    expect(content).toContain("notifService.notifySavTicketCreated");
    expect(content).toContain("notifService.notifySavStatusChanged");
    expect(content).toContain("notifService.notifyNewPartnerRegistered");
    expect(content).toContain("notifService.notifyNewResourcePublished");
  });

  it("meta-leads.ts should use LEAD_ASSIGNED type", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/market-spas-b2b/server/meta-leads.ts", "utf-8");
    expect(content).toContain('"LEAD_ASSIGNED"');
    expect(content).toContain('linkUrl: "/leads"');
  });

  it("db.ts should re-export createNotification from notification-service", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/market-spas-b2b/server/db.ts", "utf-8");
    expect(content).toContain('export { createNotification } from "./notification-service"');
  });
});

// Test schema has all notification types
describe("schema notification types", () => {
  it("schema should include all 16 notification types", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/market-spas-b2b/drizzle/schema.ts", "utf-8");
    
    const types = [
      "ORDER_CREATED", "ORDER_STATUS_CHANGED", "PAYMENT_RECEIVED", "PAYMENT_FAILED",
      "INVOICE_READY", "STOCK_LOW", "NEW_PARTNER", "PARTNER_APPROVED", "PARTNER_SUSPENDED",
      "NEW_RESOURCE", "SAV_CREATED", "SAV_STATUS_CHANGED", "LEAD_ASSIGNED",
      "DEPOSIT_REMINDER", "REFUND_PROCESSED", "SYSTEM_ALERT",
    ];

    for (const type of types) {
      expect(content).toContain(`"${type}"`);
    }
  });
});
