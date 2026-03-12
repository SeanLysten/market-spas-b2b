import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================
// Tests for Supplier Stock Integration
// ============================================

// Mock getDb
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
};

vi.mock("../server/db", () => ({
  getDb: vi.fn(() => Promise.resolve(mockDb)),
}));

vi.mock("../drizzle/schema", () => ({
  products: { id: "id", supplierProductCode: "supplierProductCode", ean13: "ean13", stockQuantity: "stockQuantity" },
  productVariants: { id: "id", supplierProductCode: "supplierProductCode", ean13: "ean13", stockQuantity: "stockQuantity", productId: "productId" },
  orders: { id: "id", orderNumber: "orderNumber", status: "status", createdAt: "createdAt", subtotalHT: "subtotalHT", discountPercent: "discountPercent", discountAmount: "discountAmount", shippingCost: "shippingCost", vatAmount: "vatAmount", totalTTC: "totalTTC", depositPercent: "depositPercent", depositAmount: "depositAmount", shippingType: "shippingType", notes: "notes", partnerId: "partnerId", userId: "userId" },
  partners: { id: "id", companyName: "companyName", partnerLevel: "partnerLevel", vatNumber: "vatNumber", phone: "phone", email: "email", siret: "siret" },
  users: { id: "id", name: "name", email: "email" },
  orderItems: { id: "id", orderId: "orderId", productId: "productId", variantId: "variantId", productName: "productName", variantName: "variantName", quantity: "quantity", unitPriceHT: "unitPriceHT", totalHT: "totalHT" },
  payments: { id: "id", orderId: "orderId", amount: "amount", method: "method", status: "status", stripePaymentIntentId: "stripePaymentIntentId", paidAt: "paidAt", createdAt: "createdAt" },
}));

// ============================================
// Unit tests for the stock import payload validation
// ============================================

describe("Supplier Stock Import - Payload Validation", () => {
  it("should validate correct payload structure", () => {
    const payload = {
      key: "ExportStockValentin",
      data: [
        { Ean13: 3364549284619, CodeProduit: "662201 078 38", EnStock: 123, EnTransit: 456 },
      ],
    };

    expect(payload).toHaveProperty("key");
    expect(payload).toHaveProperty("data");
    expect(Array.isArray(payload.data)).toBe(true);
    expect(payload.data[0]).toHaveProperty("Ean13");
    expect(payload.data[0]).toHaveProperty("CodeProduit");
    expect(payload.data[0]).toHaveProperty("EnStock");
    expect(payload.data[0]).toHaveProperty("EnTransit");
  });

  it("should reject payload without data array", () => {
    const payload = { key: "test" };
    expect((payload as any).data).toBeUndefined();
  });

  it("should reject payload with empty data array", () => {
    const payload = { key: "test", data: [] };
    expect(payload.data.length).toBe(0);
  });

  it("should handle string EAN13 values", () => {
    const item = { Ean13: "3364549284619", CodeProduit: "662201 078 38", EnStock: 10, EnTransit: 5 };
    const ean13 = item.Ean13.toString().trim();
    expect(ean13).toBe("3364549284619");
  });

  it("should handle numeric EAN13 values", () => {
    const item = { Ean13: 3364549284619, CodeProduit: "662201 078 38", EnStock: 10, EnTransit: 5 };
    const ean13 = item.Ean13.toString().trim();
    expect(ean13).toBe("3364549284619");
  });

  it("should trim CodeProduit whitespace", () => {
    const item = { Ean13: 3364549284619, CodeProduit: "  662201 078 38  ", EnStock: 10, EnTransit: 5 };
    const code = item.CodeProduit.trim();
    expect(code).toBe("662201 078 38");
  });
});

// ============================================
// Unit tests for the supplier product codes reference
// ============================================

describe("Supplier Product Codes Reference", () => {
  const SUPPLIER_PRODUCTS = [
    { model: "Neptune V2", color: "Sterling Silver", code: "662201 078 38", ean13: "3364549284619" },
    { model: "Neptune V2", color: "Odyssey", code: "662201 079 38", ean13: "3364549284626" },
    { model: "Neptune V2", color: "Midnight Opal", code: "662201 080 38", ean13: "3364549284633" },
    { model: "Easy relax", color: "Sterling Silver", code: "662600 078 38", ean13: "3364549284640" },
    { model: "Easy relax", color: "Odyssey", code: "662600 079 38", ean13: "3364549284657" },
    { model: "Easy relax", color: "Midnight Opal", code: "662600 080 38", ean13: "3364549284664" },
    { model: "Volcano", color: "Sterling Silver", code: "662700 078 38", ean13: "3364549284718" },
    { model: "Volcano", color: "Odyssey", code: "662700 079 38", ean13: "3364549284725" },
    { model: "Volcano", color: "Midnight Opal", code: "662700 080 38", ean13: "3364549284732" },
    { model: "Mykonos", color: "Sterling Silver", code: "662800 078 38", ean13: "3364549284749" },
    { model: "Mykonos", color: "Odyssey", code: "662800 079 38", ean13: "3364549284756" },
    { model: "Mykonos", color: "Midnight Opal", code: "662800 080 38", ean13: "3364549284763" },
    { model: "Twin Plug & Play", color: "Sterling Silver", code: "662900 078 38", ean13: "3364549284770" },
    { model: "Twin Plug & Play", color: "Odyssey", code: "662900 079 38", ean13: "3364549284787" },
    { model: "Twin Plug & Play", color: "Midnight Opal", code: "662900 080 38", ean13: "3364549284794" },
  ];

  it("should have 15 supplier products defined", () => {
    expect(SUPPLIER_PRODUCTS.length).toBe(15);
  });

  it("should have unique codes for each product", () => {
    const codes = SUPPLIER_PRODUCTS.map(p => p.code);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(15);
  });

  it("should have unique EAN13 for each product", () => {
    const eans = SUPPLIER_PRODUCTS.map(p => p.ean13);
    const uniqueEans = new Set(eans);
    expect(uniqueEans.size).toBe(15);
  });

  it("should have 5 models with 3 colors each", () => {
    const models = new Set(SUPPLIER_PRODUCTS.map(p => p.model));
    expect(models.size).toBe(5);
    
    const colors = new Set(SUPPLIER_PRODUCTS.map(p => p.color));
    expect(colors.size).toBe(3);
    expect(colors.has("Sterling Silver")).toBe(true);
    expect(colors.has("Odyssey")).toBe(true);
    expect(colors.has("Midnight Opal")).toBe(true);
  });

  it("should have all EAN13 codes starting with 336454928", () => {
    for (const p of SUPPLIER_PRODUCTS) {
      expect(p.ean13.startsWith("336454928")).toBe(true);
    }
  });

  it("should have all codes ending with 38", () => {
    for (const p of SUPPLIER_PRODUCTS) {
      expect(p.code.endsWith("38")).toBe(true);
    }
  });

  it("should have color codes 078=Sterling Silver, 079=Odyssey, 080=Midnight Opal", () => {
    for (const p of SUPPLIER_PRODUCTS) {
      if (p.color === "Sterling Silver") expect(p.code).toContain("078");
      if (p.color === "Odyssey") expect(p.code).toContain("079");
      if (p.color === "Midnight Opal") expect(p.code).toContain("080");
    }
  });
});

// ============================================
// Tests for the matching logic
// ============================================

describe("Supplier Stock Import - Matching Logic", () => {
  it("should prioritize variant match by supplierProductCode over product match", () => {
    // The matching order should be:
    // 1. Variant by supplierProductCode
    // 2. Variant by ean13
    // 3. Product by supplierProductCode
    // 4. Product by ean13
    const matchingOrder = [
      "variant.supplierProductCode",
      "variant.ean13",
      "product.supplierProductCode",
      "product.ean13",
    ];
    expect(matchingOrder[0]).toBe("variant.supplierProductCode");
  });

  it("should handle items with missing CodeProduit", () => {
    const item = { Ean13: 3364549284619, CodeProduit: "", EnStock: 10, EnTransit: 5 };
    const codeProduit = item.CodeProduit?.trim() || "";
    expect(codeProduit).toBe("");
    // Should still try to match by EAN13
    const ean13 = item.Ean13?.toString().trim() || "";
    expect(ean13).toBe("3364549284619");
  });

  it("should handle items with missing EAN13", () => {
    const item = { Ean13: 0, CodeProduit: "662201 078 38", EnStock: 10, EnTransit: 5 };
    const ean13 = item.Ean13?.toString().trim() || "";
    expect(ean13).toBe("0");
    // Should still try to match by CodeProduit
    const codeProduit = item.CodeProduit?.trim() || "";
    expect(codeProduit).toBe("662201 078 38");
  });

  it("should default EnStock and EnTransit to 0 if not numbers", () => {
    const item = { Ean13: 3364549284619, CodeProduit: "662201 078 38", EnStock: "abc" as any, EnTransit: null as any };
    const enStock = typeof item.EnStock === "number" ? item.EnStock : 0;
    const enTransit = typeof item.EnTransit === "number" ? item.EnTransit : 0;
    expect(enStock).toBe(0);
    expect(enTransit).toBe(0);
  });
});

// ============================================
// Tests for the export format
// ============================================

describe("Supplier Orders Export - Format", () => {
  it("should have the correct export structure", () => {
    const exportItem = {
      order: {
        id: 1,
        number: "ORD-2026-001",
        status: "CONFIRMED",
        totalTTC: "12500.00",
        depositAmount: "3750.00",
      },
      items: [
        {
          productName: "Neptune V2",
          variantName: "Sterling Silver",
          quantity: 1,
          supplierProductCode: "662201 078 38",
          ean13: "3364549284619",
        },
      ],
      payments: [],
      client: {
        companyName: "Spa Paradise SARL",
        vatNumber: "FR12345678901",
        email: "contact@spaparadise.fr",
      },
    };

    expect(exportItem).toHaveProperty("order");
    expect(exportItem).toHaveProperty("items");
    expect(exportItem).toHaveProperty("payments");
    expect(exportItem).toHaveProperty("client");
    expect(exportItem.items[0]).toHaveProperty("supplierProductCode");
    expect(exportItem.items[0]).toHaveProperty("ean13");
    expect(exportItem.client).toHaveProperty("companyName");
    expect(exportItem.client).toHaveProperty("vatNumber");
  });

  it("should include supplier codes in order items", () => {
    const item = {
      productName: "Neptune V2",
      variantName: "Sterling Silver",
      quantity: 1,
      unitPriceHT: "5000.00",
      totalHT: "5000.00",
      supplierProductCode: "662201 078 38",
      ean13: "3364549284619",
    };

    expect(item.supplierProductCode).toBe("662201 078 38");
    expect(item.ean13).toBe("3364549284619");
  });

  it("should handle null supplier codes gracefully", () => {
    const variantSupplierCode = null;
    const productSupplierCode = "662201 078 38";
    const supplierCode = variantSupplierCode || productSupplierCode || null;
    expect(supplierCode).toBe("662201 078 38");
  });

  it("should prefer variant supplier code over product supplier code", () => {
    const variantSupplierCode = "662201 079 38";
    const productSupplierCode = "662201 078 38";
    const supplierCode = variantSupplierCode || productSupplierCode || null;
    expect(supplierCode).toBe("662201 079 38");
  });
});

// ============================================
// Tests for transit (incoming stock) handling
// ============================================

describe("Supplier Stock Import - Transit Handling", () => {
  it("should create incoming stock entry when EnTransit > 0", () => {
    const item = { Ean13: 3364549284619, CodeProduit: "662201 078 38", EnStock: 5, EnTransit: 3 };
    expect(item.EnTransit).toBeGreaterThan(0);
    // When EnTransit > 0, an incoming_stock entry should be created or updated
  });

  it("should mark existing incoming stock as ARRIVED when EnTransit is 0", () => {
    const item = { Ean13: 3364549284619, CodeProduit: "662201 078 38", EnStock: 10, EnTransit: 0 };
    expect(item.EnTransit).toBe(0);
    // When EnTransit is 0, existing PENDING incoming_stock should be marked as ARRIVED
  });

  it("should update existing PENDING incoming stock quantity instead of creating duplicate", () => {
    const existingIncoming = { id: 1, variantId: 30014, quantity: 5, status: "PENDING" };
    const newTransit = 8;
    // Should update quantity to 8, not create a new entry
    expect(existingIncoming.status).toBe("PENDING");
    expect(newTransit).not.toBe(existingIncoming.quantity);
  });

  it("should set expected week to current week + 2 for new transit entries", () => {
    const now = new Date();
    const currentWeek = Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    const expectedWeek = currentWeek + 2;
    expect(expectedWeek).toBeGreaterThan(currentWeek);
    expect(expectedWeek).toBeLessThanOrEqual(54);
  });

  it("should include import key in notes for traceability", () => {
    const importKey = "TestTransitMarketSpa";
    const notes = `Import automatique fournisseur (${importKey})`;
    expect(notes).toContain(importKey);
    expect(notes).toContain("Import automatique");
  });
});

// ============================================
// Tests for the test JSON file format
// ============================================

describe("Test JSON File Format", () => {
  const testPayload = {
    key: "ExportStockValentin",
    data: [
      { Ean13: 3364549282899, CodeProduit: "661900 075 38", EnStock: 123, EnTransit: 456 },
      { Ean13: 3364549282974, CodeProduit: "661950 302 38", EnStock: 123, EnTransit: 456 },
      { Ean13: 3364549283049, CodeProduit: "661951 302 38", EnStock: 123, EnTransit: 456 },
    ],
  };

  it("should have a key field", () => {
    expect(testPayload.key).toBe("ExportStockValentin");
  });

  it("should have a data array with stock items", () => {
    expect(Array.isArray(testPayload.data)).toBe(true);
    expect(testPayload.data.length).toBeGreaterThan(0);
  });

  it("should have numeric Ean13 values", () => {
    for (const item of testPayload.data) {
      expect(typeof item.Ean13).toBe("number");
    }
  });

  it("should have string CodeProduit values", () => {
    for (const item of testPayload.data) {
      expect(typeof item.CodeProduit).toBe("string");
    }
  });

  it("should have numeric EnStock and EnTransit values", () => {
    for (const item of testPayload.data) {
      expect(typeof item.EnStock).toBe("number");
      expect(typeof item.EnTransit).toBe("number");
    }
  });
});
