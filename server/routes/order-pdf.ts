import { Router } from "express";
import PDFDocument from "pdfkit";
import { getDb, getOrderWithItems } from "../db";
import { partners, users, payments, productVariants, products } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import https from "https";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031645455/jX4Ppf2KXZ8z9Tppipem7T/logo-market-spa_177731cb.png";

function fetchImageBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

const router = Router();

// ============================================
// GET /api/orders/:id/pdf - Generate order summary PDF
// ============================================
router.get("/api/orders/:id/pdf", async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: "ID de commande invalide" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Base de données non disponible" });
    }

    // Get order with items
    const order = await getOrderWithItems(orderId);
    if (!order) {
      return res.status(404).json({ error: "Commande introuvable" });
    }

    // Get partner info
    let partner: any = null;
    if (order.partnerId) {
      const partnerRows = await db.select().from(partners).where(eq(partners.id, order.partnerId)).limit(1);
      if (partnerRows.length > 0) partner = partnerRows[0];
    }

    // Get user who created the order
    let createdByUser: any = null;
    if (order.createdById) {
      const userRows = await db.select().from(users).where(eq(users.id, order.createdById)).limit(1);
      if (userRows.length > 0) createdByUser = userRows[0];
    }

    // Get payments
    let orderPayments: any[] = [];
    try {
      orderPayments = await db.select().from(payments).where(eq(payments.orderId, orderId));
    } catch (e) {
      // payments table might not have data
    }

    // Enrich items with product/variant info
    const enrichedItems = [];
    for (const item of order.items) {
      let variantInfo: any = null;
      let productInfo: any = null;

      if (item.variantId) {
        const v = await db.select().from(productVariants).where(eq(productVariants.id, item.variantId)).limit(1);
        if (v.length > 0) variantInfo = v[0];
      }
      if (item.productId) {
        const p = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
        if (p.length > 0) productInfo = p[0];
      }

      enrichedItems.push({
        ...item,
        productName: productInfo?.name || item.name || "Produit",
        variantName: variantInfo?.name || variantInfo?.color || null,
        supplierCode: variantInfo?.supplierProductCode || productInfo?.supplierProductCode || null,
        ean13: variantInfo?.ean13 || productInfo?.ean13 || null,
      });
    }

    // ============================================
    // Generate PDF
    // ============================================
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: `Récapitulatif commande ${order.orderNumber}`,
        Author: "Market Spas",
        Subject: `Commande ${order.orderNumber}`,
      },
    });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="commande-${order.orderNumber}.pdf"`
    );
    doc.pipe(res);

    const primaryColor = "#8B4513";
    const darkColor = "#1a1a1a";
    const mutedColor = "#666666";
    const lightBg = "#f8f5f0";
    const borderColor = "#e0d5c8";
    const pageWidth = 495; // A4 width minus margins

    // ── Header with logo ──────────────────────────────────────────
    try {
      const logoBuffer = await fetchImageBuffer(LOGO_URL);
      doc.image(logoBuffer, 50, 40, { width: 50, height: 50 });
    } catch (e) {
      // fallback: no logo
    }

    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("Market Spas", 108, 48);

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor(mutedColor)
      .text("Portail B2B — Récapitulatif de commande", 108, 72);

    // Order number and date on the right
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor(darkColor)
      .text(order.orderNumber, 300, 50, { align: "right" });

    const orderDate = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "N/A";
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor(mutedColor)
      .text(`Date : ${orderDate}`, 300, 68, { align: "right" });

    // Status badge
    const statusLabels: Record<string, string> = {
      DRAFT: "Brouillon",
      PENDING_APPROVAL: "En attente de validation",
      PENDING_DEPOSIT: "Acompte requis",
      DEPOSIT_PAID: "Acompte payé",
      IN_PRODUCTION: "En production",
      READY_TO_SHIP: "Prêt à expédier",
      SHIPPED: "Expédié",
      DELIVERED: "Livré",
      COMPLETED: "Terminé",
      CANCELLED: "Annulé",
      REFUNDED: "Remboursé",
    };
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text(`Statut : ${statusLabels[order.status] || order.status}`, 300, 82, { align: "right" });

    // Separator line
    doc
      .moveTo(50, 105)
      .lineTo(545, 105)
      .strokeColor(borderColor)
      .lineWidth(1)
      .stroke();

    // ── Client & Delivery info (2 columns) ──────────────
    let yPos = 120;

    // Left column: Client info
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("COMMANDITAIRE", 50, yPos);

    yPos += 16;
    if (partner) {
      doc.fontSize(9).font("Helvetica-Bold").fillColor(darkColor)
        .text(partner.companyName, 50, yPos);
      yPos += 13;
      if (partner.tradeName && partner.tradeName !== partner.companyName) {
        doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
          .text(`Nom commercial : ${partner.tradeName}`, 50, yPos);
        yPos += 11;
      }
      if (partner.legalForm) {
        doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
          .text(`Forme juridique : ${partner.legalForm}`, 50, yPos);
        yPos += 11;
      }
      doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
        .text(`TVA : ${partner.vatNumber}`, 50, yPos);
      yPos += 11;
      if (partner.registrationNumber) {
        doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
          .text(`N° entreprise : ${partner.registrationNumber}`, 50, yPos);
        yPos += 11;
      }
      yPos += 4;
      // Contact
      doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
        .text(`Contact : ${partner.primaryContactName}`, 50, yPos);
      yPos += 11;
      doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
        .text(`Email : ${partner.primaryContactEmail}`, 50, yPos);
      yPos += 11;
      doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
        .text(`Tél : ${partner.primaryContactPhone}`, 50, yPos);
      yPos += 11;

      // Billing address
      yPos += 4;
      const billingStreet = partner.billingAddressSame ? partner.addressStreet : (partner.billingStreet || partner.addressStreet);
      const billingCity = partner.billingAddressSame ? partner.addressCity : (partner.billingCity || partner.addressCity);
      const billingPostal = partner.billingAddressSame ? partner.addressPostalCode : (partner.billingPostalCode || partner.addressPostalCode);
      const billingCountry = partner.billingAddressSame ? (partner.addressCountry || "BE") : (partner.billingCountry || "BE");
      doc.fontSize(8).font("Helvetica-Bold").fillColor(mutedColor)
        .text("Adresse de facturation :", 50, yPos);
      yPos += 11;
      doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
        .text(billingStreet || "", 50, yPos);
      yPos += 11;
      doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
        .text(`${billingPostal || ""} ${billingCity || ""}, ${billingCountry}`, 50, yPos);
      yPos += 11;
    }

    // Right column: Delivery address
    let yRight = 120;
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("ADRESSE DE LIVRAISON", 310, yRight);

    yRight += 16;
    if (order.deliveryContactName) {
      doc.fontSize(9).font("Helvetica-Bold").fillColor(darkColor)
        .text(order.deliveryContactName, 310, yRight);
      yRight += 13;
    }
    if (order.deliveryStreet) {
      doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
        .text(order.deliveryStreet, 310, yRight);
      yRight += 11;
    }
    if (order.deliveryStreet2) {
      doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
        .text(order.deliveryStreet2, 310, yRight);
      yRight += 11;
    }
    doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
      .text(
        `${order.deliveryPostalCode || ""} ${order.deliveryCity || ""}, ${order.deliveryCountry || "BE"}`,
        310,
        yRight
      );
    yRight += 11;
    if (order.deliveryContactPhone) {
      doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
        .text(`Tél : ${order.deliveryContactPhone}`, 310, yRight);
      yRight += 11;
    }
    if (order.deliveryInstructions) {
      yRight += 4;
      doc.fontSize(8).font("Helvetica-Bold").fillColor(mutedColor)
        .text("Instructions :", 310, yRight);
      yRight += 11;
      doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
        .text(order.deliveryInstructions, 310, yRight, { width: 235 });
      yRight += 11;
    }
    if (order.deliveryRequestedWeek) {
      yRight += 4;
      doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
        .text(`Semaine souhaitée : ${order.deliveryRequestedWeek}`, 310, yRight);
      yRight += 11;
    }

    // ── Separator ──────────────────────────────────────
    const afterInfoY = Math.max(yPos, yRight) + 10;
    doc
      .moveTo(50, afterInfoY)
      .lineTo(545, afterInfoY)
      .strokeColor(borderColor)
      .lineWidth(0.5)
      .stroke();

    // ── Items Table ──────────────────────────────────────
    let tableY = afterInfoY + 15;

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("ARTICLES COMMANDÉS", 50, tableY);

    tableY += 20;

    // Table header
    doc.rect(50, tableY, pageWidth, 20).fill(lightBg);
    doc.fontSize(7).font("Helvetica-Bold").fillColor(darkColor);
    doc.text("Produit", 55, tableY + 6, { width: 160 });
    doc.text("Réf. fournisseur", 220, tableY + 6, { width: 90 });
    doc.text("Source", 315, tableY + 6, { width: 50 });
    doc.text("Qté", 370, tableY + 6, { width: 30, align: "center" });
    doc.text("P.U. HT", 405, tableY + 6, { width: 60, align: "right" });
    doc.text("Total HT", 470, tableY + 6, { width: 70, align: "right" });

    tableY += 22;

    // Table rows
    for (const item of enrichedItems) {
      // Check if we need a new page
      if (tableY > 700) {
        doc.addPage();
        tableY = 50;
      }

      const rowHeight = 28;
      // Alternating row background
      if (enrichedItems.indexOf(item) % 2 === 0) {
        doc.rect(50, tableY - 2, pageWidth, rowHeight).fill("#faf9f7");
      }

      doc.fontSize(8).font("Helvetica-Bold").fillColor(darkColor)
        .text(item.productName, 55, tableY + 2, { width: 160 });

      if (item.variantName || item.color) {
        doc.fontSize(7).font("Helvetica").fillColor(mutedColor)
          .text(item.variantName || item.color || "", 55, tableY + 13, { width: 160 });
      }

      // Supplier code
      doc.fontSize(7).font("Helvetica").fillColor(mutedColor)
        .text(item.supplierCode || "-", 220, tableY + 2, { width: 90 });
      if (item.ean13) {
        doc.fontSize(6).font("Helvetica").fillColor(mutedColor)
          .text(`EAN: ${item.ean13}`, 220, tableY + 12, { width: 90 });
      }

      // Stock source
      const sourceLabel = item.stockSource === "TRANSIT"
        ? `Transit${item.stockSourceArrivalWeek ? ` (${item.stockSourceArrivalWeek})` : ""}`
        : "Stock";
      doc.fontSize(7).font("Helvetica").fillColor(mutedColor)
        .text(sourceLabel, 315, tableY + 6, { width: 50 });

      // Quantity
      doc.fontSize(8).font("Helvetica").fillColor(darkColor)
        .text(String(item.quantity), 370, tableY + 6, { width: 30, align: "center" });

      // Unit price
      doc.fontSize(8).font("Helvetica").fillColor(darkColor)
        .text(formatEuro(item.unitPriceHT), 405, tableY + 6, { width: 60, align: "right" });

      // Total
      doc.fontSize(8).font("Helvetica-Bold").fillColor(darkColor)
        .text(formatEuro(item.totalHT), 470, tableY + 6, { width: 70, align: "right" });

      tableY += rowHeight;
    }

    // ── Totals ──────────────────────────────────────────
    tableY += 10;

    if (tableY > 680) {
      doc.addPage();
      tableY = 50;
    }

    doc
      .moveTo(350, tableY)
      .lineTo(545, tableY)
      .strokeColor(borderColor)
      .lineWidth(0.5)
      .stroke();

    tableY += 8;

    // Subtotal
    doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
      .text("Sous-total HT", 350, tableY);
    doc.fontSize(8).font("Helvetica").fillColor(darkColor)
      .text(formatEuro(order.subtotalHT), 470, tableY, { width: 70, align: "right" });
    tableY += 14;

    // Discount
    if (Number(order.discountAmount) > 0) {
      doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
        .text(`Remise (${order.discountPercent}%)`, 350, tableY);
      doc.fontSize(8).font("Helvetica").fillColor("#b91c1c")
        .text(`-${formatEuro(order.discountAmount)}`, 470, tableY, { width: 70, align: "right" });
      tableY += 14;
    }

    // Shipping
    if (Number(order.shippingHT) > 0) {
      doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
        .text("Frais de livraison HT", 350, tableY);
      doc.fontSize(8).font("Helvetica").fillColor(darkColor)
        .text(formatEuro(order.shippingHT), 470, tableY, { width: 70, align: "right" });
      tableY += 14;
    }

    // Total HT
    doc.fontSize(9).font("Helvetica-Bold").fillColor(darkColor)
      .text("Total HT", 350, tableY);
    doc.fontSize(9).font("Helvetica-Bold").fillColor(darkColor)
      .text(formatEuro(order.totalHT), 470, tableY, { width: 70, align: "right" });
    tableY += 14;

    // TVA — Dynamic rate based on order amounts
    const totalHTVal = parseFloat(order.totalHT) || 0;
    const totalVATVal = parseFloat(order.totalVAT) || 0;
    const effectiveVatPercent = totalHTVal > 0 ? Math.round((totalVATVal / totalHTVal) * 100) : 0;
    const vatLabel = effectiveVatPercent > 0 ? `TVA (${effectiveVatPercent}%)` : "TVA (0% - Autoliquidation)";
    doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
      .text(vatLabel, 350, tableY);
    doc.fontSize(8).font("Helvetica").fillColor(darkColor)
      .text(formatEuro(order.totalVAT), 470, tableY, { width: 70, align: "right" });
    tableY += 16;

    // Total TTC
    doc.rect(345, tableY - 4, 200, 22).fill(lightBg);
    doc.fontSize(11).font("Helvetica-Bold").fillColor(primaryColor)
      .text("Total TTC", 350, tableY);
    doc.fontSize(11).font("Helvetica-Bold").fillColor(primaryColor)
      .text(formatEuro(order.totalTTC), 470, tableY, { width: 70, align: "right" });
    tableY += 28;

    // ── Deposit & Payment info ──────────────────────────
    if (Number(order.depositAmount) > 0) {
      tableY += 5;
      doc
        .moveTo(50, tableY)
        .lineTo(545, tableY)
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .stroke();

      tableY += 12;
      doc.fontSize(10).font("Helvetica-Bold").fillColor(primaryColor)
        .text("PAIEMENT", 50, tableY);
      tableY += 18;

      // Deposit info
      doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
        .text(`Acompte (${order.depositPercent}%)`, 50, tableY);
      doc.fontSize(8).font("Helvetica-Bold").fillColor(darkColor)
        .text(formatEuro(order.depositAmount), 200, tableY);

      const depositStatus = order.depositPaid ? "Payé" : "En attente";
      const depositColor = order.depositPaid ? "#16a34a" : "#d97706";
      doc.fontSize(8).font("Helvetica-Bold").fillColor(depositColor)
        .text(depositStatus, 300, tableY);

      if (order.depositPaidAt) {
        const paidDate = new Date(order.depositPaidAt).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
        doc.fontSize(7).font("Helvetica").fillColor(mutedColor)
          .text(`le ${paidDate}`, 340, tableY);
      }
      tableY += 16;

      // Balance
      doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
        .text("Solde restant", 50, tableY);
      doc.fontSize(8).font("Helvetica-Bold").fillColor(darkColor)
        .text(formatEuro(order.balanceAmount), 200, tableY);

      const balanceStatus = order.balancePaid ? "Payé" : "À régler";
      const balanceColor = order.balancePaid ? "#16a34a" : "#d97706";
      doc.fontSize(8).font("Helvetica-Bold").fillColor(balanceColor)
        .text(balanceStatus, 300, tableY);
      tableY += 16;

      // Payment history
      if (orderPayments.length > 0) {
        tableY += 8;
        doc.fontSize(8).font("Helvetica-Bold").fillColor(mutedColor)
          .text("Historique des paiements :", 50, tableY);
        tableY += 14;

        for (const pmt of orderPayments) {
          const pmtDate = pmt.paidAt
            ? new Date(pmt.paidAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
            : "N/A";
          const methodLabel = pmt.method === "card" ? "Carte" : pmt.method === "transfer" ? "Virement" : (pmt.method || "N/A");
          doc.fontSize(7).font("Helvetica").fillColor(mutedColor)
            .text(`${pmtDate} — ${methodLabel} — ${formatEuro(pmt.amount)} — ${pmt.status || "N/A"}`, 55, tableY);
          tableY += 12;
        }
      }
    }

    // ── Notes ──────────────────────────────────────────
    if (order.customerNotes) {
      tableY += 10;
      if (tableY > 720) {
        doc.addPage();
        tableY = 50;
      }
      doc
        .moveTo(50, tableY)
        .lineTo(545, tableY)
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .stroke();
      tableY += 12;
      doc.fontSize(10).font("Helvetica-Bold").fillColor(primaryColor)
        .text("NOTES", 50, tableY);
      tableY += 16;
      doc.fontSize(8).font("Helvetica").fillColor(mutedColor)
        .text(order.customerNotes, 50, tableY, { width: pageWidth });
    }

    // ── Footer ──────────────────────────────────────────
    const footerY = 780;
    doc
      .moveTo(50, footerY)
      .lineTo(545, footerY)
      .strokeColor(borderColor)
      .lineWidth(0.5)
      .stroke();

    doc.fontSize(7).font("Helvetica").fillColor(mutedColor)
      .text(
        `Market Spas — Document généré le ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`,
        50,
        footerY + 6,
        { align: "center", width: pageWidth }
      );
    doc.fontSize(6).font("Helvetica").fillColor(mutedColor)
      .text(
        "Ce document est un récapitulatif de commande et ne constitue pas une facture.",
        50,
        footerY + 18,
        { align: "center", width: pageWidth }
      );

    doc.end();
  } catch (error: any) {
    console.error("[OrderPDF] Error generating PDF:", error.message, error.stack);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Erreur lors de la génération du PDF" });
    }
  }
});

function formatEuro(value: string | number | null): string {
  if (!value) return "0,00 €";
  return `${Number(value).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export { router as orderPdfRouter };
