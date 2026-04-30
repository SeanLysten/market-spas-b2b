import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Order PDF Route", () => {
  it("should have the order-pdf route file", () => {
    const routePath = path.resolve(__dirname, "routes/order-pdf.ts");
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it("should export orderPdfRouter", async () => {
    const mod = await import("./routes/order-pdf");
    expect(mod.orderPdfRouter).toBeDefined();
    expect(typeof mod.orderPdfRouter).toBe("function");
  });

  it("should be registered in the server _core/index.ts", () => {
    const indexPath = path.resolve(__dirname, "_core/index.ts");
    const content = fs.readFileSync(indexPath, "utf-8");
    expect(content).toContain('import { orderPdfRouter } from "../routes/order-pdf"');
    expect(content).toContain("app.use(orderPdfRouter)");
  });

  it("should use pdfkit for PDF generation", () => {
    const routePath = path.resolve(__dirname, "routes/order-pdf.ts");
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).toContain('import PDFDocument from "pdfkit"');
  });

  it("should set correct Content-Type and Content-Disposition headers", () => {
    const routePath = path.resolve(__dirname, "routes/order-pdf.ts");
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).toContain("application/pdf");
    expect(content).toContain("Content-Disposition");
    expect(content).toContain("attachment");
  });

  it("should include partner info (companyName, vatNumber, contacts)", () => {
    const routePath = path.resolve(__dirname, "routes/order-pdf.ts");
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).toContain("partner.companyName");
    expect(content).toContain("partner.vatNumber");
    expect(content).toContain("partner.primaryContactName");
    expect(content).toContain("partner.primaryContactEmail");
    expect(content).toContain("partner.primaryContactPhone");
  });

  it("should include delivery address fields", () => {
    const routePath = path.resolve(__dirname, "routes/order-pdf.ts");
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).toContain("order.deliveryStreet");
    expect(content).toContain("order.deliveryCity");
    expect(content).toContain("order.deliveryPostalCode");
    expect(content).toContain("order.deliveryContactName");
    expect(content).toContain("order.deliveryContactPhone");
  });

  it("should include deposit and payment information", () => {
    const routePath = path.resolve(__dirname, "routes/order-pdf.ts");
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).toContain("order.depositAmount");
    expect(content).toContain("order.depositPaid");
    expect(content).toContain("order.depositPaidAt");
    expect(content).toContain("order.balanceAmount");
    expect(content).toContain("order.balancePaid");
  });

  it("should include stock source info (stockSource, arrivalWeek)", () => {
    const routePath = path.resolve(__dirname, "routes/order-pdf.ts");
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).toContain("item.stockSource");
    expect(content).toContain("item.stockSourceArrivalWeek");
  });

  it("should include supplier product codes and EAN13", () => {
    const routePath = path.resolve(__dirname, "routes/order-pdf.ts");
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).toContain("supplierProductCode");
    expect(content).toContain("ean13");
  });

  it("should include totals (subtotalHT, totalHT, totalVAT, totalTTC)", () => {
    const routePath = path.resolve(__dirname, "routes/order-pdf.ts");
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).toContain("order.subtotalHT");
    expect(content).toContain("order.totalHT");
    expect(content).toContain("order.totalVAT");
    expect(content).toContain("order.totalTTC");
  });

  it("should include a footer disclaimer", () => {
    const routePath = path.resolve(__dirname, "routes/order-pdf.ts");
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).toContain("ne constitue pas une facture");
  });
});

describe("OrderSummary Page", () => {
  it("should have the OrderSummary page file", () => {
    const pagePath = path.resolve(__dirname, "../client/src/pages/OrderSummary.tsx");
    expect(fs.existsSync(pagePath)).toBe(true);
  });

  it("should be registered as a route in App.tsx", () => {
    const appPath = path.resolve(__dirname, "../client/src/App.tsx");
    const content = fs.readFileSync(appPath, "utf-8");
    // Supports both static import and React.lazy dynamic import
    expect(content).toContain('./pages/OrderSummary');
    expect(content).toContain('/order/:orderId/summary');
  });

  it("should include a PDF download button", () => {
    const pagePath = path.resolve(__dirname, "../client/src/pages/OrderSummary.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("/api/orders/");
    expect(content).toContain("/pdf");
    expect(content).toContain("handleDownloadPdf");
  });

  it("should include mobile-responsive design (md:hidden, hidden md:block)", () => {
    const pagePath = path.resolve(__dirname, "../client/src/pages/OrderSummary.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("md:hidden");
    expect(content).toContain("hidden md:block");
  });

  it("should display stock source badges", () => {
    const pagePath = path.resolve(__dirname, "../client/src/pages/OrderSummary.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("stockSource");
    expect(content).toContain("En stock");
    expect(content).toContain("Transit");
  });

  it("should link to order tracking from summary", () => {
    const pagePath = path.resolve(__dirname, "../client/src/pages/OrderSummary.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("/order/");
    expect(content).toContain("Suivi");
  });
});

describe("Orders page links to summary", () => {
  it("should link FileText button to /order/:id/summary in Orders.tsx", () => {
    const ordersPath = path.resolve(__dirname, "../client/src/pages/Orders.tsx");
    const content = fs.readFileSync(ordersPath, "utf-8");
    expect(content).toContain("/order/${order.id}/summary");
  });

  it("should link from OrderTracking to summary page", () => {
    const trackingPath = path.resolve(__dirname, "../client/src/pages/OrderTracking.tsx");
    const content = fs.readFileSync(trackingPath, "utf-8");
    expect(content).toContain("/order/${orderId}/summary");
    expect(content).toContain("Récapitulatif");
  });

  it("should have PDF download button in OrderTracking", () => {
    const trackingPath = path.resolve(__dirname, "../client/src/pages/OrderTracking.tsx");
    const content = fs.readFileSync(trackingPath, "utf-8");
    expect(content).toContain("/api/orders/${orderId}/pdf");
    expect(content).toContain("PDF");
  });
});
