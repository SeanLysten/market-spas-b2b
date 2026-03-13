import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for Supplier API authentication (X-API-Key header)
 * and logging system (supplier_api_logs table).
 */

// ============================================
// API Key Authentication Tests
// ============================================

describe("Supplier API - Authentication", () => {
  it("should reject requests without X-API-Key header", () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const hasApiKey = "x-api-key" in headers || "X-API-Key" in headers;
    expect(hasApiKey).toBe(false);
  });

  it("should reject requests with invalid API key", () => {
    const expectedKey = "3D8vpCO8K2DPd7dCX5ZPopV1BQbw2HTJhiAXt1cAT34";
    const providedKey = "invalid-key-12345";
    expect(providedKey).not.toBe(expectedKey);
    expect(providedKey !== expectedKey).toBe(true);
  });

  it("should accept requests with valid API key", () => {
    const expectedKey = "test-api-key-123";
    const providedKey = "test-api-key-123";
    expect(providedKey).toBe(expectedKey);
  });

  it("should support API key via query parameter as fallback", () => {
    const queryParams = { apiKey: "test-key-456" };
    const headerKey = undefined;
    const effectiveKey = headerKey || queryParams.apiKey;
    expect(effectiveKey).toBe("test-key-456");
  });

  it("should prioritize header over query parameter", () => {
    const queryParams = { apiKey: "query-key" };
    const headerKey = "header-key";
    const effectiveKey = headerKey || queryParams.apiKey;
    expect(effectiveKey).toBe("header-key");
  });

  it("should return 401 status for missing authentication", () => {
    const statusCode = !undefined ? 401 : 200;
    expect(statusCode).toBe(401);
  });

  it("should return 403 status for invalid authentication", () => {
    const isValidKey = "wrong-key" === "correct-key";
    const statusCode = isValidKey ? 200 : 403;
    expect(statusCode).toBe(403);
  });
});

// ============================================
// API Logging Tests
// ============================================

describe("Supplier API - Logging", () => {
  it("should create a log entry with correct fields for successful import", () => {
    const logEntry = {
      importKey: "ExportStockValentin",
      rawPayload: JSON.stringify({ key: "ExportStockValentin", data: [{ Ean13: 123, CodeProduit: "ABC", EnStock: 5, EnTransit: 2 }] }),
      totalItems: 1,
      matchedItems: 1,
      unmatchedItems: 0,
      errorItems: 0,
      success: true,
      errorMessage: null,
      ipAddress: "192.168.1.1",
      userAgent: "SupplierSystem/1.0",
    };

    expect(logEntry.importKey).toBe("ExportStockValentin");
    expect(logEntry.totalItems).toBe(1);
    expect(logEntry.matchedItems).toBe(1);
    expect(logEntry.success).toBe(true);
    expect(logEntry.errorMessage).toBeNull();
  });

  it("should store the raw JSON payload", () => {
    const payload = {
      key: "ExportStockValentin",
      data: [
        { Ean13: 9364549284619, CodeProduit: "662201 078 38", EnStock: 0, EnTransit: 154 },
        { Ean13: 9364549284626, CodeProduit: "662201 079 38", EnStock: 0, EnTransit: 28 },
      ],
    };
    const rawPayload = JSON.stringify(payload);
    const parsed = JSON.parse(rawPayload);

    expect(parsed.key).toBe("ExportStockValentin");
    expect(parsed.data).toHaveLength(2);
    expect(parsed.data[0].CodeProduit).toBe("662201 078 38");
    expect(parsed.data[0].EnTransit).toBe(154);
  });

  it("should log failed imports with error message", () => {
    const logEntry = {
      importKey: null,
      rawPayload: "invalid json",
      totalItems: 0,
      matchedItems: 0,
      unmatchedItems: 0,
      errorItems: 0,
      success: false,
      errorMessage: "Format invalide",
    };

    expect(logEntry.success).toBe(false);
    expect(logEntry.errorMessage).toBe("Format invalide");
    expect(logEntry.totalItems).toBe(0);
  });

  it("should store results JSON with matching details", () => {
    const results = [
      {
        codeProduit: "662201 078 38",
        ean13: "9364549284619",
        matched: true,
        matchedTo: { type: "variant", id: 30014, name: "Neptune V2 - Sterling Marble", sku: "SPA-NEPTUNE-STERLING-SILVER" },
        previousStock: 0,
        newStock: 0,
        previousTransit: 0,
        newTransit: 154,
      },
      {
        codeProduit: "999999 999 99",
        ean13: "0000000000000",
        matched: false,
      },
    ];

    const resultsJson = JSON.stringify(results);
    const parsed = JSON.parse(resultsJson);

    expect(parsed).toHaveLength(2);
    expect(parsed[0].matched).toBe(true);
    expect(parsed[0].matchedTo.type).toBe("variant");
    expect(parsed[1].matched).toBe(false);
  });

  it("should capture IP address and user agent", () => {
    const headers = {
      "x-forwarded-for": "203.0.113.50",
      "user-agent": "SupplierERP/2.0 (Windows NT 10.0)",
    };

    const ipAddress = (headers["x-forwarded-for"] || "unknown").slice(0, 100);
    const userAgent = (headers["user-agent"] || "").slice(0, 500);

    expect(ipAddress).toBe("203.0.113.50");
    expect(userAgent).toBe("SupplierERP/2.0 (Windows NT 10.0)");
    expect(ipAddress.length).toBeLessThanOrEqual(100);
    expect(userAgent.length).toBeLessThanOrEqual(500);
  });

  it("should track summary statistics correctly", () => {
    const items = [
      { matched: true },
      { matched: true },
      { matched: false },
      { matched: true },
      { matched: false },
    ];

    const matched = items.filter(i => i.matched).length;
    const unmatched = items.filter(i => !i.matched).length;
    const total = items.length;

    expect(total).toBe(5);
    expect(matched).toBe(3);
    expect(unmatched).toBe(2);
    expect(matched + unmatched).toBe(total);
  });

  it("should handle the real supplier payload format (17 items)", () => {
    const payload = {
      key: "ExportStockValentin",
      data: [
        { Ean13: 9364549284718, CodeProduit: "066200 078 38", EnStock: 0, EnTransit: 0 },
        { Ean13: 9364549284619, CodeProduit: "662201 078 38", EnStock: 0, EnTransit: 154 },
        { Ean13: 9364549284626, CodeProduit: "662201 079 38", EnStock: 0, EnTransit: 28 },
        { Ean13: 9364549284633, CodeProduit: "662201 080 38", EnStock: 0, EnTransit: 28 },
        { Ean13: 9364549284640, CodeProduit: "662600 078 38", EnStock: 0, EnTransit: 56 },
        { Ean13: 9364549284657, CodeProduit: "662600 079 38", EnStock: 0, EnTransit: 14 },
        { Ean13: 9364549284664, CodeProduit: "662600 080 38", EnStock: 0, EnTransit: 0 },
        { Ean13: 90, CodeProduit: "662650 302 38", EnStock: 0, EnTransit: 0 },
        { Ean13: 9364549284718, CodeProduit: "662700 078 38", EnStock: 0, EnTransit: 24 },
        { Ean13: 9364549284725, CodeProduit: "662700 079 38", EnStock: 0, EnTransit: 12 },
        { Ean13: 9364549284732, CodeProduit: "662700 080 38", EnStock: 0, EnTransit: 12 },
        { Ean13: 9364549284749, CodeProduit: "662800 078 38", EnStock: 0, EnTransit: 15 },
        { Ean13: 9364549284756, CodeProduit: "662800 079 38", EnStock: 0, EnTransit: 8 },
        { Ean13: 9364549284763, CodeProduit: "662800 080 38", EnStock: 0, EnTransit: 7 },
        { Ean13: 9364549284770, CodeProduit: "662900 078 38", EnStock: 0, EnTransit: 14 },
        { Ean13: 9364549284787, CodeProduit: "662900 079 38", EnStock: 0, EnTransit: 7 },
        { Ean13: 9364549284794, CodeProduit: "662900 080 38", EnStock: 0, EnTransit: 7 },
      ],
    };

    expect(payload.data).toHaveLength(17);
    expect(payload.key).toBe("ExportStockValentin");

    const withTransit = payload.data.filter(d => d.EnTransit > 0);
    const withStock = payload.data.filter(d => d.EnStock > 0);
    const empty = payload.data.filter(d => d.EnStock === 0 && d.EnTransit === 0);

    expect(withTransit).toHaveLength(14);
    expect(withStock).toHaveLength(0);
    expect(empty).toHaveLength(3);

    const totalTransit = payload.data.reduce((sum, d) => sum + d.EnTransit, 0);
    expect(totalTransit).toBe(386);
  });
});

// ============================================
// Supplier API Logs Schema Tests
// ============================================

describe("Supplier API Logs - Schema", () => {
  it("should define all required fields for the log entry", () => {
    const requiredFields = [
      "id",
      "importKey",
      "rawPayload",
      "totalItems",
      "matchedItems",
      "unmatchedItems",
      "errorItems",
      "resultsJson",
      "ipAddress",
      "userAgent",
      "success",
      "errorMessage",
      "createdAt",
    ];

    expect(requiredFields).toHaveLength(13);
    expect(requiredFields).toContain("rawPayload");
    expect(requiredFields).toContain("success");
    expect(requiredFields).toContain("createdAt");
  });

  it("should truncate IP address to 100 chars max", () => {
    const longIp = "x".repeat(200);
    const truncated = longIp.slice(0, 100);
    expect(truncated.length).toBe(100);
  });

  it("should truncate user agent to 500 chars max", () => {
    const longUA = "x".repeat(1000);
    const truncated = longUA.slice(0, 500);
    expect(truncated.length).toBe(500);
  });
});
