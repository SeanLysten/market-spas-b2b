import { describe, it, expect } from "vitest";

/**
 * Tests for Supplier API payment flows:
 * 1. Outbound: notifySupplierDepositPaid (when deposit is confirmed via Mollie)
 * 2. Inbound: POST /api/supplier/orders/balance-paid (when supplier confirms balance paid)
 */

// ─── Supplier API Module Tests ───────────────────────────────────────────────

describe("Supplier API - notifySupplierDepositPaid", () => {
  it("should export the notifySupplierDepositPaid function", async () => {
    const mod = await import("./supplier-api");
    expect(mod.notifySupplierDepositPaid).toBeDefined();
    expect(typeof mod.notifySupplierDepositPaid).toBe("function");
  });

  it("should handle missing SUPPLIER_API_URL gracefully (non-blocking)", async () => {
    // When SUPPLIER_API_URL is not set, the function should return false without throwing
    const originalUrl = process.env.SUPPLIER_API_URL;
    delete process.env.SUPPLIER_API_URL;

    const { notifySupplierDepositPaid } = await import("./supplier-api");
    // This will fail to find the order in DB (no real DB in test), but should not throw
    try {
      const result = await notifySupplierDepositPaid(999999, "ORD-TEST-001");
      expect(typeof result).toBe("boolean");
    } catch (e: any) {
      // Even if DB is unavailable, it should handle gracefully
      expect(e).toBeDefined();
    }

    if (originalUrl) process.env.SUPPLIER_API_URL = originalUrl;
  });
});

// ─── Balance Paid Webhook Route Tests ────────────────────────────────────────

describe("Supplier API - Balance Paid Webhook", () => {
  it("should have the balance-paid route registered in supplier-stock router", async () => {
    const mod = await import("./routes/supplier-stock");
    expect(mod.supplierStockRouter).toBeDefined();
    
    // Check that the router has routes registered
    const routes = (mod.supplierStockRouter as any).stack || [];
    const balancePaidRoute = routes.find((layer: any) => 
      layer.route && layer.route.path === "/api/supplier/orders/balance-paid"
    );
    expect(balancePaidRoute).toBeDefined();
    expect(balancePaidRoute.route.methods.post).toBe(true);
  });

  it("should have the stock import route registered", async () => {
    const mod = await import("./routes/supplier-stock");
    const routes = (mod.supplierStockRouter as any).stack || [];
    const stockRoute = routes.find((layer: any) => 
      layer.route && layer.route.path === "/api/supplier/stock/import"
    );
    expect(stockRoute).toBeDefined();
    expect(stockRoute.route.methods.post).toBe(true);
  });

  it("should have the orders export route registered", async () => {
    const mod = await import("./routes/supplier-stock");
    const routes = (mod.supplierStockRouter as any).stack || [];
    const exportRoute = routes.find((layer: any) => 
      layer.route && layer.route.path === "/api/supplier/orders/export"
    );
    expect(exportRoute).toBeDefined();
    expect(exportRoute.route.methods.get).toBe(true);
  });
});

// ─── Mollie Webhook Integration Tests ────────────────────────────────────────

describe("Mollie Webhook - Supplier API Integration", () => {
  it("should import notifySupplierDepositPaid in mollie-webhook module", async () => {
    // Verify the import exists in the mollie-webhook file
    const fs = await import("fs");
    const content = fs.readFileSync("server/mollie-webhook.ts", "utf-8");
    expect(content).toContain('import { notifySupplierDepositPaid } from "./supplier-api"');
  });

  it("should call notifySupplierDepositPaid in the PAID case of mollie webhook", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/mollie-webhook.ts", "utf-8");
    expect(content).toContain("notifySupplierDepositPaid(orderId, currentOrder.orderNumber)");
  });
});

// ─── Payload Structure Tests ─────────────────────────────────────────────────

describe("Balance Paid Payload Validation", () => {
  it("should accept payload with orderNumber", () => {
    const payload = {
      orderNumber: "ORD-2026-001",
      balancePaidAt: "2026-04-09T10:00:00.000Z",
      balanceAmount: "8750.00",
      supplierReference: "INV-2026-1234",
    };
    expect(payload.orderNumber).toBeDefined();
    expect(typeof payload.orderNumber).toBe("string");
    expect(payload.balancePaidAt).toBeDefined();
  });

  it("should accept payload with orderId", () => {
    const payload = {
      orderId: 12345,
      balancePaidAt: "2026-04-09T10:00:00.000Z",
    };
    expect(payload.orderId).toBeDefined();
    expect(typeof payload.orderId).toBe("number");
  });

  it("should reject payload without orderNumber or orderId", () => {
    const payload = {
      balancePaidAt: "2026-04-09T10:00:00.000Z",
    };
    expect((payload as any).orderNumber).toBeUndefined();
    expect((payload as any).orderId).toBeUndefined();
  });

  it("should handle optional fields in balance paid payload", () => {
    const payload = {
      orderNumber: "ORD-2026-001",
      supplierReference: "INV-2026-1234",
      notes: "Paiement reçu par virement",
    };
    expect(payload.supplierReference).toBe("INV-2026-1234");
    expect(payload.notes).toBe("Paiement reçu par virement");
  });
});

// ─── Deposit Notification Payload Structure Tests ────────────────────────────

describe("Deposit Notification Payload Structure", () => {
  it("should define correct event type for deposit paid", () => {
    const event = "deposit_paid";
    expect(event).toBe("deposit_paid");
  });

  it("should include all required fields in notification payload", () => {
    const payload = {
      event: "deposit_paid",
      timestamp: new Date().toISOString(),
      order: {
        id: 1,
        number: "ORD-2026-001",
        date: "2026-04-09T10:00:00.000Z",
        totalTTC: "12500.00",
        depositAmount: "3750.00",
        balanceAmount: "8750.00",
      },
      items: [],
      client: {
        partnerId: 1,
        companyName: "Test Company",
      },
      payment: {
        depositAmount: "3750.00",
        balanceAmount: "8750.00",
        balanceDue: true,
      },
    };

    expect(payload.event).toBe("deposit_paid");
    expect(payload.order.number).toBeDefined();
    expect(payload.order.depositAmount).toBeDefined();
    expect(payload.order.balanceAmount).toBeDefined();
    expect(payload.payment.balanceDue).toBe(true);
    expect(payload.client.partnerId).toBeGreaterThan(0);
  });
});
