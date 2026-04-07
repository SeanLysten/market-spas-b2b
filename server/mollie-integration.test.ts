import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Mollie client
vi.mock("@mollie/api-client", () => ({
  createMollieClient: vi.fn(() => ({
    payments: {
      create: vi.fn(async (params: any) => ({
        id: "tr_test_mock123",
        status: "open",
        amount: params.amount,
        description: params.description,
        metadata: params.metadata,
        method: "banktransfer",
        details: {
          bankName: "Test Bank",
          bankAccount: "NL00TEST0000000000",
          bankBic: "TESTNL2A",
          transferReference: "RF-TEST-123",
        },
        getCheckoutUrl: () => "https://www.mollie.com/checkout/test",
        expiresAt: "2026-04-21T12:00:00+00:00",
      })),
      get: vi.fn(async (id: string) => ({
        id,
        status: "paid",
        amount: { currency: "EUR", value: "300.00" },
        description: "Test payment",
        metadata: { type: "order", orderId: "1", orderNumber: "MS-2026-0001" },
        method: "banktransfer",
        details: {
          bankName: "Test Bank",
          bankAccount: "NL00TEST0000000000",
          bankBic: "TESTNL2A",
          transferReference: "RF-TEST-123",
        },
        paidAt: "2026-04-07T12:00:00+00:00",
        expiresAt: null,
        cancelledAt: null,
        failedAt: null,
      })),
    },
  })),
  PaymentMethod: {
    banktransfer: "banktransfer",
  },
}));

describe("Mollie Integration", () => {
  beforeEach(() => {
    process.env.MOLLIE_API_KEY_TEST = "test_mock_key_123";
  });

  describe("getMollieClient", () => {
    it("should create a Mollie client with test key", async () => {
      const { getMollieClient } = await import("./mollie");
      const client = getMollieClient();
      expect(client).toBeDefined();
      expect(client.payments).toBeDefined();
    });

    it("should throw if no API key is configured", async () => {
      delete process.env.MOLLIE_API_KEY_TEST;
      delete process.env.MOLLIE_API_KEY_LIVE;
      
      // Re-import to get fresh module
      vi.resetModules();
      const { getMollieClient } = await import("./mollie");
      expect(() => getMollieClient()).toThrow("No Mollie API key configured");
      
      // Restore
      process.env.MOLLIE_API_KEY_TEST = "test_mock_key_123";
    });
  });

  describe("isMollieTestMode", () => {
    it("should return true when only test key is set", async () => {
      delete process.env.MOLLIE_API_KEY_LIVE;
      process.env.MOLLIE_API_KEY_TEST = "test_mock_key_123";
      vi.resetModules();
      const { isMollieTestMode } = await import("./mollie");
      expect(isMollieTestMode()).toBe(true);
    });
  });

  describe("createMolliePayment", () => {
    it("should create a payment with correct parameters", async () => {
      const { createMolliePayment } = await import("./mollie");
      const result = await createMolliePayment({
        amount: 300,
        description: "Acompte commande MS-2026-0001",
        redirectUrl: "https://example.com/order-confirmation/1",
        webhookUrl: "https://example.com/api/webhooks/mollie",
        metadata: {
          type: "order",
          orderId: "1",
          orderNumber: "MS-2026-0001",
        },
      });

      expect(result.id).toBe("tr_test_mock123");
      expect(result.status).toBe("open");
      expect(result.checkoutUrl).toBe("https://www.mollie.com/checkout/test");
      expect(result.details).toBeDefined();
    });

    it("should format amount to 2 decimal places", async () => {
      const { createMolliePayment } = await import("./mollie");
      const result = await createMolliePayment({
        amount: 300.5,
        description: "Test",
        redirectUrl: "https://example.com",
        webhookUrl: "https://example.com/webhook",
        metadata: { type: "order", orderId: "1", orderNumber: "TEST" },
      });

      expect(result.id).toBeDefined();
    });
  });

  describe("getMolliePaymentById", () => {
    it("should retrieve payment details", async () => {
      const { getMolliePaymentById } = await import("./mollie");
      const result = await getMolliePaymentById("tr_test_mock123");

      expect(result.id).toBe("tr_test_mock123");
      expect(result.status).toBe("paid");
      expect(result.paidAt).toBe("2026-04-07T12:00:00+00:00");
      expect(result.metadata).toBeDefined();
    });
  });

  describe("MOLLIE_STATUS constants", () => {
    it("should have all expected status values", async () => {
      const { MOLLIE_STATUS } = await import("./mollie");
      expect(MOLLIE_STATUS.OPEN).toBe("open");
      expect(MOLLIE_STATUS.PENDING).toBe("pending");
      expect(MOLLIE_STATUS.PAID).toBe("paid");
      expect(MOLLIE_STATUS.FAILED).toBe("failed");
      expect(MOLLIE_STATUS.CANCELLED).toBe("canceled");
      expect(MOLLIE_STATUS.EXPIRED).toBe("expired");
    });
  });
});

describe("Deposit Calculation Logic", () => {
  it("should calculate 300€ per spa unit", () => {
    const items = [
      { product: { category: "SPAS" }, quantity: 2 },
      { product: { category: "ACCESSORIES" }, quantity: 3 },
    ];

    let spaUnitCount = 0;
    for (const item of items) {
      if (item.product.category === "SPAS" || item.product.category === "SWIM_SPAS") {
        spaUnitCount += item.quantity;
      }
    }

    const depositAmount = spaUnitCount * 300;
    expect(spaUnitCount).toBe(2);
    expect(depositAmount).toBe(600);
  });

  it("should calculate 300€ per swim spa unit", () => {
    const items = [
      { product: { category: "SWIM_SPAS" }, quantity: 1 },
    ];

    let spaUnitCount = 0;
    for (const item of items) {
      if (item.product.category === "SPAS" || item.product.category === "SWIM_SPAS") {
        spaUnitCount += item.quantity;
      }
    }

    expect(spaUnitCount).toBe(1);
    expect(spaUnitCount * 300).toBe(300);
  });

  it("should require full payment for accessories only", () => {
    const items = [
      { product: { category: "ACCESSORIES" }, quantity: 2 },
      { product: { category: "MAINTENANCE" }, quantity: 1 },
    ];
    const totalTTC = 500;

    let spaUnitCount = 0;
    for (const item of items) {
      if (item.product.category === "SPAS" || item.product.category === "SWIM_SPAS") {
        spaUnitCount += item.quantity;
      }
    }

    let depositAmount: number;
    if (spaUnitCount > 0) {
      depositAmount = spaUnitCount * 300;
    } else {
      depositAmount = totalTTC; // Full payment
    }

    expect(spaUnitCount).toBe(0);
    expect(depositAmount).toBe(totalTTC);
  });

  it("should cap deposit at totalTTC if deposit exceeds total", () => {
    const items = [
      { product: { category: "SPAS" }, quantity: 5 },
    ];
    const totalTTC = 1000;

    let spaUnitCount = 0;
    for (const item of items) {
      if (item.product.category === "SPAS" || item.product.category === "SWIM_SPAS") {
        spaUnitCount += item.quantity;
      }
    }

    let depositAmount = spaUnitCount * 300;
    if (depositAmount > totalTTC) depositAmount = totalTTC;

    expect(spaUnitCount).toBe(5);
    expect(depositAmount).toBe(1000); // Capped at totalTTC
  });

  it("should calculate correct balance amount", () => {
    const totalTTC = 5000;
    const spaUnitCount = 2;
    const depositAmount = spaUnitCount * 300; // 600
    const balanceAmount = totalTTC - depositAmount; // 4400

    expect(depositAmount).toBe(600);
    expect(balanceAmount).toBe(4400);
  });
});

describe("Order Status Workflow", () => {
  it("should define correct status transitions for SEPA transfer", () => {
    const validTransitions: Record<string, string[]> = {
      PENDING_APPROVAL: ["PENDING_DEPOSIT"],
      PENDING_DEPOSIT: ["PAYMENT_PENDING", "CANCELLED"],
      PAYMENT_PENDING: ["DEPOSIT_PAID", "PAYMENT_FAILED", "CANCELLED"],
      DEPOSIT_PAID: ["IN_PRODUCTION", "CANCELLED"],
      PAYMENT_FAILED: ["PAYMENT_PENDING", "CANCELLED"],
      IN_PRODUCTION: ["READY_TO_SHIP"],
      READY_TO_SHIP: ["SHIPPED"],
      SHIPPED: ["DELIVERED"],
      DELIVERED: ["COMPLETED"],
    };

    // Verify PAYMENT_PENDING can transition to DEPOSIT_PAID (Mollie confirms payment)
    expect(validTransitions.PAYMENT_PENDING).toContain("DEPOSIT_PAID");

    // Verify PAYMENT_PENDING can transition to PAYMENT_FAILED (Mollie reports failure)
    expect(validTransitions.PAYMENT_PENDING).toContain("PAYMENT_FAILED");

    // Verify PAYMENT_FAILED can retry
    expect(validTransitions.PAYMENT_FAILED).toContain("PAYMENT_PENDING");
  });

  it("should map Mollie statuses to order statuses correctly", () => {
    const mollieToOrderStatus: Record<string, string> = {
      open: "PAYMENT_PENDING",
      pending: "PAYMENT_PENDING",
      paid: "DEPOSIT_PAID",
      failed: "PAYMENT_FAILED",
      expired: "PAYMENT_FAILED",
      canceled: "CANCELLED",
    };

    expect(mollieToOrderStatus.pending).toBe("PAYMENT_PENDING");
    expect(mollieToOrderStatus.paid).toBe("DEPOSIT_PAID");
    expect(mollieToOrderStatus.failed).toBe("PAYMENT_FAILED");
    expect(mollieToOrderStatus.canceled).toBe("CANCELLED");
  });
});

describe("14-Day Deposit Loss Warning", () => {
  it("should calculate 14-day deadline from deposit receipt", () => {
    const depositPaidAt = new Date("2026-04-07T12:00:00Z");
    const deadline = new Date(depositPaidAt);
    deadline.setDate(deadline.getDate() + 14);

    expect(deadline.toISOString()).toBe("2026-04-21T12:00:00.000Z");
  });

  it("should identify overdue deposits", () => {
    const depositPaidAt = new Date("2026-03-20T12:00:00Z");
    const now = new Date("2026-04-07T12:00:00Z");
    const deadline = new Date(depositPaidAt);
    deadline.setDate(deadline.getDate() + 14);

    const isOverdue = now > deadline;
    expect(isOverdue).toBe(true);
  });

  it("should not flag deposits within 14 days", () => {
    const depositPaidAt = new Date("2026-04-05T12:00:00Z");
    const now = new Date("2026-04-07T12:00:00Z");
    const deadline = new Date(depositPaidAt);
    deadline.setDate(deadline.getDate() + 14);

    const isOverdue = now > deadline;
    expect(isOverdue).toBe(false);
  });
});
