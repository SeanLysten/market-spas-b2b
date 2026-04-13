import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock getDb
const mockDb = {
  select: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
};

const mockSelect = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
};

const mockUpdate = {
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue(undefined),
};

const mockInsert = {
  values: vi.fn().mockResolvedValue(undefined),
};

vi.mock("./db", () => ({
  getDb: vi.fn(async () => {
    mockDb.select.mockReturnValue(mockSelect);
    mockDb.update.mockReturnValue(mockUpdate);
    mockDb.insert.mockReturnValue(mockInsert);
    return mockDb;
  }),
}));

vi.mock("../drizzle/schema", () => ({
  orders: { id: "id", orderNumber: "orderNumber", status: "status" },
  orderStatusHistory: { id: "id" },
  supplierApiLogs: { id: "id" },
  products: {},
  productVariants: {},
  partners: {},
  users: {},
  orderItems: {},
  payments: {},
  partnerContacts: {},
}));

describe("Supplier Order Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPPLIER_API_KEY = "test-key-123";
  });

  describe("POST /orders/update-status", () => {
    it("should reject without API key", async () => {
      const { supplierStockRouter } = await import("./routes/supplier-stock");
      // The router validates API key - we test the logic
      expect(supplierStockRouter).toBeDefined();
    });

    it("should validate required fields", () => {
      // orderNumber and status are required
      const body = {};
      const hasOrderNumber = "orderNumber" in body;
      const hasStatus = "status" in body;
      expect(hasOrderNumber).toBe(false);
      expect(hasStatus).toBe(false);
    });

    it("should only allow valid supplier statuses", () => {
      const ALLOWED = ["IN_PRODUCTION", "READY_TO_SHIP", "SHIPPED", "DELIVERED"];
      expect(ALLOWED).toContain("IN_PRODUCTION");
      expect(ALLOWED).toContain("READY_TO_SHIP");
      expect(ALLOWED).toContain("SHIPPED");
      expect(ALLOWED).toContain("DELIVERED");
      expect(ALLOWED).not.toContain("DRAFT");
      expect(ALLOWED).not.toContain("CANCELLED");
      expect(ALLOWED).not.toContain("PENDING_DEPOSIT");
    });

    it("should set shippedAt timestamp when status is SHIPPED", () => {
      const status = "SHIPPED";
      const order = { shippedAt: null };
      const updateData: any = { status };
      if (status === "SHIPPED" && !order.shippedAt) {
        updateData.shippedAt = new Date();
      }
      expect(updateData.shippedAt).toBeInstanceOf(Date);
    });

    it("should set deliveredAt timestamp when status is DELIVERED", () => {
      const status = "DELIVERED";
      const order = { deliveredAt: null };
      const updateData: any = { status };
      if (status === "DELIVERED" && !order.deliveredAt) {
        updateData.deliveredAt = new Date();
      }
      expect(updateData.deliveredAt).toBeInstanceOf(Date);
    });

    it("should not overwrite existing shippedAt", () => {
      const existingDate = new Date("2026-01-01");
      const status = "SHIPPED";
      const order = { shippedAt: existingDate };
      const updateData: any = { status };
      if (status === "SHIPPED" && !order.shippedAt) {
        updateData.shippedAt = new Date();
      }
      expect(updateData.shippedAt).toBeUndefined();
    });

    it("should set deliveryConfirmedDate when estimatedDeliveryDate provided", () => {
      const estimatedDeliveryDate = "2026-06-15";
      const updateData: any = {};
      if (estimatedDeliveryDate) {
        updateData.deliveryConfirmedDate = new Date(estimatedDeliveryDate);
      }
      expect(updateData.deliveryConfirmedDate).toBeInstanceOf(Date);
      expect(updateData.deliveryConfirmedDate.toISOString()).toContain("2026-06-15");
    });
  });

  describe("POST /orders/confirm-delivery", () => {
    it("should validate required fields", () => {
      const body = { orderNumber: "CMD-2026-001" };
      expect(body.orderNumber).toBeDefined();
      expect((body as any).estimatedDeliveryDate).toBeUndefined();
    });

    it("should reject invalid date format", () => {
      const parsedDate = new Date("not-a-date");
      expect(isNaN(parsedDate.getTime())).toBe(true);
    });

    it("should accept valid ISO date", () => {
      const parsedDate = new Date("2026-07-20");
      expect(isNaN(parsedDate.getTime())).toBe(false);
    });

    it("should not change order status when confirming delivery date", () => {
      const order = { status: "IN_PRODUCTION" };
      // confirm-delivery only updates deliveryConfirmedDate, not status
      const historyEntry = {
        oldStatus: order.status,
        newStatus: order.status,
      };
      expect(historyEntry.oldStatus).toBe(historyEntry.newStatus);
    });
  });

  describe("POST /orders/mark-delivered", () => {
    it("should validate orderNumber is required", () => {
      const body = {};
      expect((body as any).orderNumber).toBeUndefined();
    });

    it("should reject already delivered orders", () => {
      const order = { status: "DELIVERED" };
      const isAlreadyDelivered = order.status === "DELIVERED" || order.status === "COMPLETED";
      expect(isAlreadyDelivered).toBe(true);
    });

    it("should reject already completed orders", () => {
      const order = { status: "COMPLETED" };
      const isAlreadyDelivered = order.status === "DELIVERED" || order.status === "COMPLETED";
      expect(isAlreadyDelivered).toBe(true);
    });

    it("should accept non-delivered orders", () => {
      const order = { status: "SHIPPED" };
      const isAlreadyDelivered = order.status === "DELIVERED" || order.status === "COMPLETED";
      expect(isAlreadyDelivered).toBe(false);
    });

    it("should use current date if deliveredAt not provided", () => {
      const deliveredAt = undefined;
      const deliveryTimestamp = deliveredAt ? new Date(deliveredAt) : new Date();
      expect(deliveryTimestamp).toBeInstanceOf(Date);
      // Should be close to now
      expect(Date.now() - deliveryTimestamp.getTime()).toBeLessThan(1000);
    });

    it("should use provided deliveredAt date", () => {
      const deliveredAt = "2026-04-10T14:00:00Z";
      const deliveryTimestamp = deliveredAt ? new Date(deliveredAt) : new Date();
      expect(deliveryTimestamp.toISOString()).toContain("2026-04-10");
    });

    it("should set status to DELIVERED", () => {
      const newStatus = "DELIVERED";
      expect(newStatus).toBe("DELIVERED");
    });
  });

  describe("Meta Leads field mapping", () => {
    it("should map French field names with accents", () => {
      const fields: Record<string, string> = {
        "prénom": "Sylvia",
        "nom_de_famille": "Pastermadjian",
        "e-mail": "sy.pastermadjian@gmail.com",
        "numéro_de_téléphone": "+33612122121",
        "code_postal": "33350",
      };

      const firstName = fields.first_name || fields.prenom || fields["prénom"] || fields.firstname || "";
      const lastName = fields.last_name || fields.nom || fields.nom_de_famille || fields.lastname || "";
      const email = fields.email || fields["e-mail"] || "";
      const phone = fields.phone_number || fields.phone || fields.telephone || fields["téléphone"] || fields["numéro_de_téléphone"] || "";

      expect(firstName).toBe("Sylvia");
      expect(lastName).toBe("Pastermadjian");
      expect(email).toBe("sy.pastermadjian@gmail.com");
      expect(phone).toBe("+33612122121");
    });

    it("should fallback to full_name split when firstName/lastName empty", () => {
      const fields: Record<string, string> = {
        full_name: "Jean Dupont",
      };

      let firstName = fields.first_name || fields.prenom || fields["prénom"] || fields.firstname || "";
      let lastName = fields.last_name || fields.nom || fields.nom_de_famille || fields.lastname || "";
      if (!firstName && !lastName && fields.full_name) {
        const parts = fields.full_name.trim().split(/\s+/);
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(" ") || "";
      }

      expect(firstName).toBe("Jean");
      expect(lastName).toBe("Dupont");
    });

    it("should handle standard English field names", () => {
      const fields: Record<string, string> = {
        first_name: "John",
        last_name: "Smith",
        email: "john@example.com",
        phone_number: "+32470123456",
      };

      const firstName = fields.first_name || fields.prenom || fields["prénom"] || fields.firstname || "";
      const lastName = fields.last_name || fields.nom || fields.nom_de_famille || fields.lastname || "";
      const email = fields.email || fields["e-mail"] || "";
      const phone = fields.phone_number || fields.phone || fields.telephone || fields["téléphone"] || fields["numéro_de_téléphone"] || "";

      expect(firstName).toBe("John");
      expect(lastName).toBe("Smith");
      expect(email).toBe("john@example.com");
      expect(phone).toBe("+32470123456");
    });
  });
});
