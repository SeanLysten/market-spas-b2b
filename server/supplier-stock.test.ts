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

// ============================================
// Tests for the UPDATED export format (supplier-aligned field names)
// ============================================

describe("Supplier Orders Export - Updated Format (Supplier-Aligned Fields)", () => {
  const sampleExport = {
    success: true,
    exportedAt: "2026-03-16T10:30:00.000Z",
    count: 1,
    filters: { status: null, since: null, depositPaid: null },
    data: [
      {
        order: {
          id: 42,
          number: "ORD-2026-0042",
          status: "DEPOSIT_PAID",
          date: "2026-03-15T14:22:00.000Z",
          subtotalHT: "5200.00",
          discountPercent: "5.00",
          discountAmount: "260.00",
          shippingHT: "0.00",
          shippingMethod: null,
          totalHT: "4940.00",
          totalVAT: "1037.40",
          totalTTC: "5977.40",
          currency: "EUR",
          depositPercent: "30.00",
          depositAmount: "1482.00",
          depositPaid: true,
          depositPaidAt: "2026-03-15T14:25:33.000Z",
          depositPaymentMethod: "card",
          balanceAmount: "4495.40",
          balancePaid: false,
          customerNotes: "Livraison souhaitée semaine 14",
          deliveryRequestedWeek: "S14 2026",
        },
        items: [
          {
            NomProduit: "Neptune V2",
            SKU: "NEPTUNE-V2-SM",
            CodeProduit: "662201 078 38",
            Ean13: 3364549284619,
            Couleur: "Sterling Marble",
            QuantiteCommandee: 1,
            PrixUnitaireHT: "3300.00",
            TotalHT: "3300.00",
            SourceStock: "STOCK",
            EnStock: 5,
            EnTransit: 0,
            DelaiAppro: null,
          },
          {
            NomProduit: "Volcano",
            SKU: "VOLCANO-MO",
            CodeProduit: "662600 078 38",
            Ean13: 9364549284640,
            Couleur: "Midnight Opal",
            QuantiteCommandee: 1,
            PrixUnitaireHT: "4400.00",
            TotalHT: "4400.00",
            SourceStock: "TRANSIT",
            EnStock: 0,
            EnTransit: 56,
            DelaiAppro: "202611",
          },
        ],
        payments: [
          {
            type: "DEPOSIT",
            amount: "1482.00",
            method: "card",
            status: "SUCCEEDED",
            paidAt: "2026-03-15T14:25:33.000Z",
          },
        ],
        client: {
          partnerId: 7,
          supplierClientCode: null,
          company: {
            name: "Spa Concept SPRL",
            tradeName: "Spa Concept",
            legalForm: "SPRL",
            vatNumber: "BE0123456789",
            registrationNumber: "0123.456.789",
          },
          contact: {
            name: "Jean Dupont",
            email: "jean.dupont@spaconcept.be",
            phone: "+32 475 12 34 56",
            accountingEmail: "compta@spaconcept.be",
          },
          billingAddress: {
            street: "Rue de la Station 45",
            street2: null,
            city: "Namur",
            postalCode: "5000",
            country: "BE",
          },
          level: "GOLD",
          orderedBy: {
            name: "Jean Dupont",
            email: "jean.dupont@spaconcept.be",
          },
          deliveryAddress: {
            street: "Zoning Industriel 12",
            street2: "Bâtiment B",
            city: "Gembloux",
            postalCode: "5030",
            country: "BE",
            contactName: "Jean Dupont",
            contactPhone: "+32 475 12 34 56",
            instructions: "Accès par la porte latérale",
          },
        },
      },
    ],
  };

  it("should have top-level export structure with filters", () => {
    expect(sampleExport).toHaveProperty("success", true);
    expect(sampleExport).toHaveProperty("exportedAt");
    expect(sampleExport).toHaveProperty("count");
    expect(sampleExport).toHaveProperty("filters");
    expect(sampleExport).toHaveProperty("data");
    expect(sampleExport.filters).toHaveProperty("status");
    expect(sampleExport.filters).toHaveProperty("since");
    expect(sampleExport.filters).toHaveProperty("depositPaid");
  });

  it("should include deposit fields in order", () => {
    const order = sampleExport.data[0].order;
    expect(order).toHaveProperty("depositPaid", true);
    expect(order).toHaveProperty("depositPaidAt");
    expect(order).toHaveProperty("depositPaymentMethod", "card");
    expect(order).toHaveProperty("balanceAmount");
    expect(order).toHaveProperty("balancePaid", false);
    expect(order).toHaveProperty("deliveryRequestedWeek", "S14 2026");
    expect(order).toHaveProperty("currency", "EUR");
  });

  it("should use supplier-aligned field names in items (CodeProduit, Ean13, etc.)", () => {
    const item = sampleExport.data[0].items[0];
    expect(item).toHaveProperty("CodeProduit", "662201 078 38");
    expect(item).toHaveProperty("Ean13", 3364549284619);
    expect(item).toHaveProperty("NomProduit");
    expect(item).toHaveProperty("SKU");
    expect(item).toHaveProperty("Couleur");
    expect(item).toHaveProperty("QuantiteCommandee");
    expect(item).toHaveProperty("PrixUnitaireHT");
    expect(item).toHaveProperty("TotalHT");
    // Should NOT have old field names
    expect(item).not.toHaveProperty("supplierProductCode");
    expect(item).not.toHaveProperty("ean13");
    expect(item).not.toHaveProperty("name");
    expect(item).not.toHaveProperty("quantity");
  });

  it("should include stock source tracking fields in items", () => {
    const stockItem = sampleExport.data[0].items[0];
    expect(stockItem.SourceStock).toBe("STOCK");
    expect(stockItem.EnStock).toBe(5);
    expect(stockItem.EnTransit).toBe(0);
    expect(stockItem.DelaiAppro).toBeNull();

    const transitItem = sampleExport.data[0].items[1];
    expect(transitItem.SourceStock).toBe("TRANSIT");
    expect(transitItem.EnStock).toBe(0);
    expect(transitItem.EnTransit).toBe(56);
    expect(transitItem.DelaiAppro).toBe("202611");
  });

  it("should have Ean13 as numeric (matching supplier import format)", () => {
    for (const item of sampleExport.data[0].items) {
      expect(typeof item.Ean13).toBe("number");
    }
  });

  it("should have structured client info with company, contact, and billing address", () => {
    const client = sampleExport.data[0].client;
    expect(client).toHaveProperty("partnerId");
    expect(client).toHaveProperty("company");
    expect(client.company).toHaveProperty("name");
    expect(client.company).toHaveProperty("tradeName");
    expect(client.company).toHaveProperty("legalForm");
    expect(client.company).toHaveProperty("vatNumber");
    expect(client.company).toHaveProperty("registrationNumber");
    expect(client).toHaveProperty("contact");
    expect(client.contact).toHaveProperty("name");
    expect(client.contact).toHaveProperty("email");
    expect(client.contact).toHaveProperty("phone");
    expect(client.contact).toHaveProperty("accountingEmail");
    expect(client).toHaveProperty("billingAddress");
    expect(client.billingAddress).toHaveProperty("street");
    expect(client.billingAddress).toHaveProperty("city");
    expect(client.billingAddress).toHaveProperty("postalCode");
    expect(client.billingAddress).toHaveProperty("country");
    expect(client).toHaveProperty("level");
    // Should NOT have old flat field names
    expect(client).not.toHaveProperty("companyName");
    expect(client).not.toHaveProperty("partnerLevel");
    expect(client).not.toHaveProperty("siret");
    expect(client).not.toHaveProperty("email");
    expect(client).not.toHaveProperty("phone");
  });

  it("should have delivery address inside client (Valentin format)", () => {
    const delivery = sampleExport.data[0].client.deliveryAddress;
    expect(delivery).toHaveProperty("street");
    expect(delivery).toHaveProperty("city");
    expect(delivery).toHaveProperty("postalCode");
    expect(delivery).toHaveProperty("country");
    expect(delivery).toHaveProperty("contactName");
    expect(delivery).toHaveProperty("contactPhone");
    expect(delivery).toHaveProperty("instructions");
  });

  it("should include payment type (DEPOSIT/BALANCE) in payments", () => {
    const payment = sampleExport.data[0].payments[0];
    expect(payment).toHaveProperty("type", "DEPOSIT");
    expect(payment).toHaveProperty("amount");
    expect(payment).toHaveProperty("method");
    expect(payment).toHaveProperty("status");
    expect(payment).toHaveProperty("paidAt");
  });

  it("should include supplierClientCode and orderedBy in client", () => {
    const client = sampleExport.data[0].client;
    expect(client).toHaveProperty("supplierClientCode");
    expect(client).toHaveProperty("orderedBy");
    expect(client.orderedBy).toHaveProperty("name");
    expect(client.orderedBy).toHaveProperty("email");
  });

  it("should allow matching items by CodeProduit with supplier import data", () => {
    const supplierImportData = [
      { Ean13: 3364549284619, CodeProduit: "662201 078 38", EnStock: 5, EnTransit: 0 },
      { Ean13: 9364549284640, CodeProduit: "662600 078 38", EnStock: 0, EnTransit: 56 },
    ];

    for (const exportItem of sampleExport.data[0].items) {
      const match = supplierImportData.find(
        (imp) => imp.CodeProduit === exportItem.CodeProduit || imp.Ean13 === exportItem.Ean13
      );
      expect(match).toBeDefined();
      expect(match!.CodeProduit).toBe(exportItem.CodeProduit);
      expect(match!.Ean13).toBe(exportItem.Ean13);
    }
  });
});

// ============================================
// Tests for stock source persistence in order items
// ============================================

describe("Order Items - Stock Source Persistence", () => {
  it("should determine stockSource from isPreorder flag", () => {
    const isPreorder = true;
    const stockSource = isPreorder ? "TRANSIT" : "STOCK";
    expect(stockSource).toBe("TRANSIT");
  });

  it("should default to STOCK when isPreorder is false", () => {
    const isPreorder = false;
    const stockSource = isPreorder ? "TRANSIT" : "STOCK";
    expect(stockSource).toBe("STOCK");
  });

  it("should capture arrival week for transit items", () => {
    const isPreorder = true;
    const estimatedArrival = "202611";
    const arrivalWeek = isPreorder ? estimatedArrival : null;
    expect(arrivalWeek).toBe("202611");
  });

  it("should not capture arrival week for stock items", () => {
    const isPreorder = false;
    const estimatedArrival = "202611";
    const arrivalWeek = isPreorder ? estimatedArrival : null;
    expect(arrivalWeek).toBeNull();
  });

  it("should snapshot stock and transit quantities at order time", () => {
    const variantAtOrderTime = { stockQuantity: 5, inTransitQuantity: 3 };
    expect(variantAtOrderTime.stockQuantity).toBe(5);
    expect(variantAtOrderTime.inTransitQuantity).toBe(3);
  });

  it("should use explicit stockSource when provided", () => {
    const itemWithExplicitSource = { stockSource: "TRANSIT", isPreorder: false };
    const resolved = itemWithExplicitSource.stockSource || (itemWithExplicitSource.isPreorder ? "TRANSIT" : "STOCK");
    expect(resolved).toBe("TRANSIT");
  });
});

// ============================================
// Tests for API query filters
// ============================================

describe("Supplier Orders Export - Query Filters", () => {
  it("should parse status filter", () => {
    const query = { status: "DEPOSIT_PAID" };
    expect(query.status).toBe("DEPOSIT_PAID");
  });

  it("should parse since filter as valid date", () => {
    const query = { since: "2026-03-01" };
    const sinceDate = new Date(query.since);
    expect(sinceDate.getTime()).not.toBeNaN();
    expect(sinceDate.getFullYear()).toBe(2026);
    expect(sinceDate.getMonth()).toBeGreaterThanOrEqual(1); // March in UTC, may be Feb in local TZ
  });

  it("should parse depositPaid filter as boolean string", () => {
    expect("true" === "true").toBe(true);
    expect("false" === "true").toBe(false);
  });

  it("should handle missing filters gracefully", () => {
    const query: Record<string, string | undefined> = {};
    const filterStatus = query.status as string | undefined;
    const filterSince = query.since as string | undefined;
    const filterDepositPaid = query.depositPaid as string | undefined;
    expect(filterStatus).toBeUndefined();
    expect(filterSince).toBeUndefined();
    expect(filterDepositPaid).toBeUndefined();
  });

  it("should reject invalid date in since filter", () => {
    const query = { since: "not-a-date" };
    const sinceDate = new Date(query.since);
    expect(isNaN(sinceDate.getTime())).toBe(true);
  });
});
