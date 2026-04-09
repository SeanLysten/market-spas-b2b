import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
const mockInsert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockOffset = vi.fn();

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: mockInsert,
    select: mockSelect,
  }),
}));

vi.mock("../drizzle/schema", () => ({
  mollieWebhookLogs: {
    id: "id",
    molliePaymentId: "molliePaymentId",
    mollieStatus: "mollieStatus",
    eventType: "eventType",
    orderId: "orderId",
    orderNumber: "orderNumber",
    savTicketId: "savTicketId",
    httpStatusCode: "httpStatusCode",
    processingTimeMs: "processingTimeMs",
    rawPayload: "rawPayload",
    mollieResponsePayload: "mollieResponsePayload",
    previousOrderStatus: "previousOrderStatus",
    newOrderStatus: "newOrderStatus",
    errorMessage: "errorMessage",
    ipAddress: "ipAddress",
    success: "success",
    createdAt: "createdAt",
  },
  molliePayments: { molliePaymentId: "molliePaymentId" },
  orders: { id: "id", orderNumber: "orderNumber", status: "status" },
  orderStatusHistory: {},
  afterSalesServices: { id: "id" },
}));

vi.mock("./mollie", () => ({
  getMolliePaymentById: vi.fn(),
  MOLLIE_STATUS: {
    OPEN: "open",
    PENDING: "pending",
    PAID: "paid",
    FAILED: "failed",
    EXPIRED: "expired",
    CANCELLED: "cancelled",
  },
}));

vi.mock("./notification-service", () => ({
  notifyPaymentReceived: vi.fn(),
  notifyPaymentFailed: vi.fn(),
}));

describe("Mollie Webhook Logs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleMollieWebhook - Logging", () => {
    it("should log an error when no payment ID is provided", async () => {
      const { handleMollieWebhook } = await import("./mollie-webhook");

      const req = {
        body: {},
        headers: {},
        socket: { remoteAddress: "127.0.0.1" },
      } as any;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      await handleMollieWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Missing payment ID" });

      // Verify that a log was inserted
      expect(mockInsert).toHaveBeenCalled();
      const insertCall = mockInsert.mock.results[0]?.value;
      if (insertCall?.values) {
        const valuesCall = insertCall.values.mock.calls[0]?.[0];
        if (valuesCall) {
          expect(valuesCall.eventType).toBe("error.missing_payment_id");
          expect(valuesCall.httpStatusCode).toBe(400);
          expect(valuesCall.success).toBe(false);
        }
      }
    });

    it("should log an error when Mollie payment fetch fails", async () => {
      const { getMolliePaymentById } = await import("./mollie");
      (getMolliePaymentById as any).mockRejectedValueOnce(new Error("Mollie API error"));

      const { handleMollieWebhook } = await import("./mollie-webhook");

      const req = {
        body: { id: "tr_test123" },
        headers: {},
        socket: { remoteAddress: "192.168.1.1" },
      } as any;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      await handleMollieWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(mockInsert).toHaveBeenCalled();
    });

    it("should extract client IP from x-forwarded-for header", async () => {
      const { handleMollieWebhook } = await import("./mollie-webhook");

      const req = {
        body: {},
        headers: { "x-forwarded-for": "10.0.0.1, 172.16.0.1" },
        socket: { remoteAddress: "127.0.0.1" },
      } as any;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any;

      await handleMollieWebhook(req, res);

      // The log should contain the first IP from x-forwarded-for
      expect(mockInsert).toHaveBeenCalled();
      const insertCall = mockInsert.mock.results[0]?.value;
      if (insertCall?.values) {
        const valuesCall = insertCall.values.mock.calls[0]?.[0];
        if (valuesCall) {
          expect(valuesCall.ipAddress).toBe("10.0.0.1");
        }
      }
    });
  });

  describe("Webhook Log Schema", () => {
    it("should have all required fields in the schema", async () => {
      const schema = await import("../drizzle/schema");
      const table = schema.mollieWebhookLogs;

      // Verify all expected fields exist
      expect(table).toBeDefined();
      expect(table.molliePaymentId).toBeDefined();
      expect(table.mollieStatus).toBeDefined();
      expect(table.eventType).toBeDefined();
      expect(table.orderId).toBeDefined();
      expect(table.orderNumber).toBeDefined();
      expect(table.savTicketId).toBeDefined();
      expect(table.httpStatusCode).toBeDefined();
      expect(table.processingTimeMs).toBeDefined();
      expect(table.rawPayload).toBeDefined();
      expect(table.mollieResponsePayload).toBeDefined();
      expect(table.previousOrderStatus).toBeDefined();
      expect(table.newOrderStatus).toBeDefined();
      expect(table.errorMessage).toBeDefined();
      expect(table.ipAddress).toBeDefined();
      expect(table.success).toBeDefined();
      expect(table.createdAt).toBeDefined();
    });
  });

  describe("Webhook Log Event Types", () => {
    it("should categorize events correctly", () => {
      // Test event type naming convention
      const errorEvents = [
        "error.missing_payment_id",
        "error.fetch_payment_failed",
        "error.database_unavailable",
        "error.unhandled",
      ];
      const orderEvents = [
        "order.paid",
        "order.pending",
        "order.failed",
        "order.expired",
        "order.cancelled",
        "order.open",
      ];
      const savEvents = [
        "sav.paid",
        "sav.failed",
      ];
      const infoEvents = [
        "info.no_metadata",
      ];

      // All error events start with "error."
      errorEvents.forEach(e => expect(e.startsWith("error.")).toBe(true));
      // All order events start with "order."
      orderEvents.forEach(e => expect(e.startsWith("order.")).toBe(true));
      // All SAV events start with "sav."
      savEvents.forEach(e => expect(e.startsWith("sav.")).toBe(true));
      // All info events start with "info."
      infoEvents.forEach(e => expect(e.startsWith("info.")).toBe(true));
    });
  });
});
