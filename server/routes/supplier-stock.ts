import { Router } from "express";
import { getDb } from "../db";
import { products, productVariants, orders, partners, users, orderItems, payments, supplierApiLogs, partnerContacts } from "../../drizzle/schema";
import { eq, or, sql, inArray, and, desc } from "drizzle-orm";

const router = Router();

// ============================================
// API Key Authentication Middleware
// ============================================

function validateApiKey(req: any, res: any): boolean {
  const apiKey = req.headers["x-api-key"] || req.query.apiKey;
  const expectedKey = process.env.SUPPLIER_API_KEY;

  if (!expectedKey) {
    console.error("[SupplierStock] SUPPLIER_API_KEY not configured in environment");
    res.status(500).json({ success: false, error: "Configuration serveur manquante" });
    return false;
  }

  if (!apiKey) {
    res.status(401).json({
      success: false,
      error: "Authentification requise. Ajoutez le header 'X-API-Key' avec votre clé API.",
    });
    return false;
  }

  if (apiKey !== expectedKey) {
    res.status(403).json({
      success: false,
      error: "Clé API invalide.",
    });
    return false;
  }

  return true;
}

// ============================================
// Supplier Stock Import API
// POST /api/supplier/stock/import
// Receives JSON from supplier system to update stock and transit quantities
// Requires X-API-Key header for authentication
// ============================================

interface SupplierStockItem {
  Ean13: number | string;
  CodeProduit: string;
  EnStock: number;
  EnTransit: number;
  DelaiAppro?: number | string;
}

interface SupplierStockPayload {
  key: string;
  data: SupplierStockItem[];
}

interface StockUpdateResult {
  codeProduit: string;
  ean13: string;
  matched: boolean;
  matchedTo?: {
    type: "product" | "variant";
    id: number;
    name: string;
    sku: string;
  };
  previousStock?: number;
  newStock?: number;
  previousTransit?: number;
  newTransit?: number;
  error?: string;
}

router.post("/api/supplier/stock/import", async (req, res) => {
  // Authenticate
  if (!validateApiKey(req, res)) return;

  const db = await getDb();

  try {
    const payload = req.body as SupplierStockPayload;

    // Validate payload structure
    if (!payload || !payload.data || !Array.isArray(payload.data)) {
      // Log failed attempt
      if (db) {
        try {
          await db.insert(supplierApiLogs).values({
            importKey: payload?.key || null,
            rawPayload: JSON.stringify(req.body || {}),
            totalItems: 0,
            matchedItems: 0,
            unmatchedItems: 0,
            errorItems: 0,
            resultsJson: null,
            ipAddress: (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "").slice(0, 100),
            userAgent: (req.headers["user-agent"] || "").slice(0, 500),
            success: false,
            errorMessage: "Format invalide",
          });
        } catch (logErr) {
          console.error("[SupplierStock] Failed to log error:", logErr);
        }
      }
      return res.status(400).json({
        success: false,
        error: "Format invalide. Attendu: { key: string, data: [{ Ean13, CodeProduit, EnStock, EnTransit }] }",
      });
    }

    if (!db) {
      return res.status(500).json({ success: false, error: "Base de données non disponible" });
    }

    const results: StockUpdateResult[] = [];
    let matched = 0;
    let unmatched = 0;
    let errors = 0;

    for (const item of payload.data) {
      const codeProduit = item.CodeProduit?.trim() || "";
      const ean13 = item.Ean13?.toString().trim() || "";
      const enStock = typeof item.EnStock === "number" ? item.EnStock : 0;
      const enTransit = typeof item.EnTransit === "number" ? item.EnTransit : 0;
      const delaiAppro = item.DelaiAppro ? item.DelaiAppro.toString() : null;
      // Convert DelaiAppro to estimatedArrival format (YYYYWW string, e.g. "202611")
      const estimatedArrival = delaiAppro && delaiAppro !== "0" ? delaiAppro : null;

      const result: StockUpdateResult = {
        codeProduit,
        ean13,
        matched: false,
      };

      try {
        // Step 1: Try to match by supplierProductCode on variants first
        let matchedVariant = null;
        if (codeProduit) {
          const variantsByCode = await db
            .select()
            .from(productVariants)
            .where(eq(productVariants.supplierProductCode, codeProduit))
            .limit(1);
          if (variantsByCode.length > 0) matchedVariant = variantsByCode[0];
        }

        // Step 2: If no match by code, try by EAN13 on variants
        if (!matchedVariant && ean13) {
          const variantsByEan = await db
            .select()
            .from(productVariants)
            .where(eq(productVariants.ean13, ean13))
            .limit(1);
          if (variantsByEan.length > 0) matchedVariant = variantsByEan[0];
        }

        if (matchedVariant) {
          // Update variant stock + transit directly on the variant
          const previousStock = matchedVariant.stockQuantity || 0;
          const previousTransit = (matchedVariant as any).inTransitQuantity || 0;
          await db
            .update(productVariants)
            .set({ stockQuantity: enStock, inTransitQuantity: enTransit, estimatedArrival: estimatedArrival })
            .where(eq(productVariants.id, matchedVariant.id));

          result.matched = true;
          result.matchedTo = {
            type: "variant",
            id: matchedVariant.id,
            name: matchedVariant.name,
            sku: matchedVariant.sku,
          };
          result.previousStock = previousStock;
          result.newStock = enStock;
          result.previousTransit = previousTransit;
          result.newTransit = enTransit;
          matched++;

          // Also update the parent product's totals
          const allVariants = await db
            .select({ stockQuantity: productVariants.stockQuantity, inTransitQuantity: productVariants.inTransitQuantity })
            .from(productVariants)
            .where(eq(productVariants.productId, matchedVariant.productId));
          const totalVariantStock = allVariants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
          const totalVariantTransit = allVariants.reduce((sum, v) => sum + (v.inTransitQuantity || 0), 0);
          await db
            .update(products)
            .set({ stockQuantity: totalVariantStock, inTransitQuantity: totalVariantTransit })
            .where(eq(products.id, matchedVariant.productId));

          results.push(result);
          continue;
        }

        // Step 3: Try to match by supplierProductCode on products
        let matchedProduct = null;
        if (codeProduit) {
          const productsByCode = await db
            .select()
            .from(products)
            .where(eq(products.supplierProductCode, codeProduit))
            .limit(1);
          if (productsByCode.length > 0) matchedProduct = productsByCode[0];
        }

        // Step 4: If no match by code, try by EAN13 on products
        if (!matchedProduct && ean13) {
          const productsByEan = await db
            .select()
            .from(products)
            .where(eq(products.ean13, ean13))
            .limit(1);
          if (productsByEan.length > 0) matchedProduct = productsByEan[0];
        }

        if (matchedProduct) {
          const previousStock = matchedProduct.stockQuantity || 0;
          const previousTransit = (matchedProduct as any).inTransitQuantity || 0;
          await db
            .update(products)
            .set({ stockQuantity: enStock, inTransitQuantity: enTransit })
            .where(eq(products.id, matchedProduct.id));

          result.matched = true;
          result.matchedTo = {
            type: "product",
            id: matchedProduct.id,
            name: matchedProduct.name,
            sku: matchedProduct.sku,
          };
          result.previousStock = previousStock;
          result.newStock = enStock;
          result.previousTransit = previousTransit;
          result.newTransit = enTransit;
          matched++;
        } else {
          unmatched++;
        }
      } catch (err: any) {
        result.error = err.message || "Erreur inconnue";
        errors++;
      }

      results.push(result);
    }

    // Log the import to console
    console.log(
      `[SupplierStock] Import completed: ${matched} matched, ${unmatched} unmatched, ${errors} errors out of ${payload.data.length} items (key: ${payload.key})`
    );

    // Log the import to database
    try {
      await db.insert(supplierApiLogs).values({
        importKey: payload.key || null,
        rawPayload: JSON.stringify(payload),
        totalItems: payload.data.length,
        matchedItems: matched,
        unmatchedItems: unmatched,
        errorItems: errors,
        resultsJson: JSON.stringify(results),
        ipAddress: (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "").slice(0, 100),
        userAgent: (req.headers["user-agent"] || "").slice(0, 500),
        success: true,
        errorMessage: null,
      });
    } catch (logErr) {
      console.error("[SupplierStock] Failed to save import log:", logErr);
    }

    return res.json({
      success: true,
      summary: {
        total: payload.data.length,
        matched,
        unmatched,
        errors,
        importKey: payload.key,
        importedAt: new Date().toISOString(),
      },
      results,
    });
  } catch (error: any) {
    console.error("[SupplierStock] Import error:", error);

    // Log the error to database
    if (db) {
      try {
        await db.insert(supplierApiLogs).values({
          importKey: null,
          rawPayload: JSON.stringify(req.body || {}),
          totalItems: 0,
          matchedItems: 0,
          unmatchedItems: 0,
          errorItems: 0,
          resultsJson: null,
          ipAddress: (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "").slice(0, 100),
          userAgent: (req.headers["user-agent"] || "").slice(0, 500),
          success: false,
          errorMessage: error.message || "Erreur interne du serveur",
        });
      } catch (logErr) {
        console.error("[SupplierStock] Failed to log error:", logErr);
      }
    }

    return res.status(500).json({
      success: false,
      error: error.message || "Erreur interne du serveur",
    });
  }
});

// ============================================
// Supplier Stock Export API
// GET /api/supplier/orders/export
// Returns orders, payments and client information for the supplier
// Requires X-API-Key header for authentication
// ============================================

router.get("/api/supplier/orders/export", async (req, res) => {
  // Authenticate
  if (!validateApiKey(req, res)) return;

  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ success: false, error: "Base de données non disponible" });
    }

    // Parse query parameters
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const filterStatus = req.query.status as string | undefined;
    const filterSince = req.query.since as string | undefined;
    const filterDepositPaid = req.query.depositPaid as string | undefined;

    // Step 1: Get orders with filters
    let orderRows: any[] = [];
    try {
      const conditions: any[] = [];
      if (filterStatus) {
        conditions.push(eq(orders.status, filterStatus as any));
      }
      if (filterSince) {
        const sinceDate = new Date(filterSince);
        if (!isNaN(sinceDate.getTime())) {
          conditions.push(sql`${orders.createdAt} >= ${sinceDate}`);
        }
      }
      if (filterDepositPaid === "true") {
        conditions.push(eq(orders.depositPaid, true));
      } else if (filterDepositPaid === "false") {
        conditions.push(eq(orders.depositPaid, false));
      }

      const query = db
        .select({
          orderId: orders.id,
          orderNumber: orders.orderNumber,
          orderStatus: orders.status,
          orderDate: orders.createdAt,
          subtotalHT: orders.subtotalHT,
          discountPercent: orders.discountPercent,
          discountAmount: orders.discountAmount,
          shippingHT: orders.shippingHT,
          totalHT: orders.totalHT,
          totalVAT: orders.totalVAT,
          totalTTC: orders.totalTTC,
          currency: orders.currency,
          depositPercent: orders.depositPercent,
          depositAmount: orders.depositAmount,
          depositPaid: orders.depositPaid,
          depositPaidAt: orders.depositPaidAt,
          balanceAmount: orders.balanceAmount,
          balancePaid: orders.balancePaid,
          shippingMethod: orders.shippingMethod,
          paymentMethod: orders.paymentMethod,
          customerNotes: orders.customerNotes,
          deliveryRequestedWeek: orders.deliveryRequestedWeek,
          deliveryRequestedDate: orders.deliveryRequestedDate,
          deliveryStreet: orders.deliveryStreet,
          deliveryStreet2: orders.deliveryStreet2,
          deliveryCity: orders.deliveryCity,
          deliveryPostalCode: orders.deliveryPostalCode,
          deliveryCountry: orders.deliveryCountry,
          deliveryContactName: orders.deliveryContactName,
          deliveryContactPhone: orders.deliveryContactPhone,
          deliveryInstructions: orders.deliveryInstructions,
          partnerId: orders.partnerId,
          createdById: orders.createdById,
        })
        .from(orders);

      const finalQuery = conditions.length > 0
        ? query.where(and(...conditions))
        : query;

      orderRows = await finalQuery
        .orderBy(sql`${orders.createdAt} DESC`)
        .limit(limit)
        .offset(offset);
    } catch (e: any) {
      console.error("[SupplierOrders] Step 1 error:", e.message);
      return res.status(500).json({ success: false, error: "Erreur lors de la récupération des commandes: " + e.message });
    }

    // Step 2: Enrich with partner, user, items, payments
    const exportData = [];
    for (const order of orderRows) {
      let clientInfo: any = {};
      let orderItemsList: any[] = [];
      let paymentsList: any[] = [];

      // --- Partner info (FIXED: use correct field names) ---
      try {
        if (order.partnerId) {
          const partnerRows = await db.select().from(partners).where(eq(partners.id, order.partnerId)).limit(1);
          if (partnerRows.length > 0) {
            const p = partnerRows[0];
            clientInfo = {
              partnerId: p.id,
              supplierClientCode: p.supplierClientCode || null,
              companyName: p.companyName || null,
              country: p.billingAddressSame ? (p.addressCountry || null) : (p.billingCountry || p.addressCountry || null),
              company: {
                name: p.companyName,
                tradeName: p.tradeName || null,
                legalForm: p.legalForm || null,
                vatNumber: p.vatNumber,
                registrationNumber: p.registrationNumber || null,
              },
              contact: {
                name: p.primaryContactName,
                email: p.primaryContactEmail,
                phone: p.primaryContactPhone,
                accountingEmail: p.accountingEmail || null,
              },
              billingAddress: {
                street: p.billingAddressSame ? p.addressStreet : (p.billingStreet || p.addressStreet),
                street2: p.billingAddressSame ? (p.addressStreet2 || null) : (p.billingStreet2 || null),
                city: p.billingAddressSame ? p.addressCity : (p.billingCity || p.addressCity),
                postalCode: p.billingAddressSame ? p.addressPostalCode : (p.billingPostalCode || p.addressPostalCode),
                country: p.billingAddressSame ? (p.addressCountry || "BE") : (p.billingCountry || p.addressCountry || "BE"),
              },
              level: p.level,
            };
          }
        }
      } catch (e: any) {
        console.error("[SupplierOrders] Partner lookup error:", e.message);
      }

      // --- User info ---
      try {
        if (order.createdById) {
          const userRows = await db.select().from(users).where(eq(users.id, order.createdById)).limit(1);
          if (userRows.length > 0) {
            clientInfo.orderedBy = {
              name: userRows[0].name,
              email: userRows[0].email,
            };
          }
        }
      } catch (e: any) {
        console.error("[SupplierOrders] User lookup error:", e.message);
      }

      // --- Order items with supplier field names (CodeProduit, Ean13, etc.) ---
      try {
        const items = await db
          .select({
            itemName: orderItems.name,
            itemSku: orderItems.sku,
            quantity: orderItems.quantity,
            unitPriceHT: orderItems.unitPriceHT,
            totalHT: orderItems.totalHT,
            productId: orderItems.productId,
            variantId: orderItems.variantId,
            stockSource: orderItems.stockSource,
            stockSourceArrivalWeek: orderItems.stockSourceArrivalWeek,
            snapshotEnStock: orderItems.snapshotEnStock,
            snapshotEnTransit: orderItems.snapshotEnTransit,
            color: orderItems.color,
          })
          .from(orderItems)
          .where(eq(orderItems.orderId, order.orderId));

        for (const item of items) {
          let supplierCode: string | null = null;
          let ean13: string | number | null = null;

          if (item.variantId) {
            const variants = await db.select({ supplierProductCode: productVariants.supplierProductCode, ean13: productVariants.ean13 }).from(productVariants).where(eq(productVariants.id, item.variantId)).limit(1);
            if (variants.length > 0) {
              supplierCode = variants[0].supplierProductCode;
              ean13 = variants[0].ean13;
            }
          }
          if (!supplierCode && item.productId) {
            const prods = await db.select({ supplierProductCode: products.supplierProductCode, ean13: products.ean13 }).from(products).where(eq(products.id, item.productId)).limit(1);
            if (prods.length > 0) {
              supplierCode = prods[0].supplierProductCode;
              ean13 = prods[0].ean13;
            }
          }

          // Convert EAN13 to number if possible (matching supplier import format)
          let ean13Numeric: number | string | null = ean13;
          if (ean13 && !isNaN(Number(ean13))) {
            ean13Numeric = Number(ean13);
          }

          // TotalHT = PrixUnitaireHT × Quantité SANS remise
          // La remise est portée au niveau de la commande (discountPercent / discountAmount)
          // et ne doit PAS être incluse dans le TotalHT des lignes (format Valentin)
          const unitPrice = parseFloat(item.unitPriceHT || "0");
          const qty = item.quantity || 1;
          const totalHTSansRemise = (unitPrice * qty).toFixed(2);

          orderItemsList.push({
            NomProduit: item.itemName,
            SKU: item.itemSku,
            CodeProduit: supplierCode,
            Ean13: ean13Numeric,
            Couleur: item.color || null,
            QuantiteCommandee: item.quantity,
            PrixUnitaireHT: item.unitPriceHT,
            TotalHT: totalHTSansRemise,
            SourceStock: item.stockSource || null,
            EnStock: item.snapshotEnStock ?? null,
            EnTransit: item.snapshotEnTransit ?? null,
            DelaiAppro: item.stockSourceArrivalWeek || null,
          });
        }
      } catch (e: any) {
        console.error("[SupplierOrders] Items lookup error:", e.message);
      }

      // --- Payments (use raw SQL to avoid Drizzle enum column name issues) ---
      try {
        const pmts: any[] = await db.execute(
          sql`SELECT amount, method, status, paidAt FROM payments WHERE orderId = ${order.orderId} ORDER BY paidAt ASC`
        );
        // Flatten rows (mysql2 returns [rows, fields])
        const pmtRows = Array.isArray(pmts) && Array.isArray(pmts[0]) ? pmts[0] : pmts;
        paymentsList = pmtRows.map((p: any, idx: number) => ({
          type: idx === 0 ? "DEPOSIT" : "BALANCE",
          amount: p.amount,
          method: p.method,
          status: p.status || p.payment_status || "UNKNOWN",
          paidAt: p.paidAt || null,
        }));
      } catch (e: any) {
        console.error("[SupplierOrders] Payments lookup error:", e.message);
      }

      // Add deliveryAddress inside client (as per Valentin's format)
      clientInfo.deliveryAddress = {
        street: order.deliveryStreet || null,
        street2: order.deliveryStreet2 || null,
        city: order.deliveryCity || null,
        postalCode: order.deliveryPostalCode || null,
        country: order.deliveryCountry || null,
        contactName: order.deliveryContactName || null,
        contactPhone: order.deliveryContactPhone || null,
        instructions: order.deliveryInstructions || null,
      };

      exportData.push({
        order: {
          id: order.orderId,
          number: order.orderNumber,
          status: order.orderStatus,
          date: order.orderDate,
          subtotalHT: order.subtotalHT,
          discountPercent: order.discountPercent,
          discountAmount: order.discountAmount,
          shippingHT: order.shippingHT,
          shippingMethod: order.shippingMethod,
          totalHT: order.totalHT,
          totalVAT: order.totalVAT,
          totalTTC: order.totalTTC,
          currency: order.currency,
          depositPercent: order.depositPercent,
          depositAmount: order.depositAmount,
          depositPaid: order.depositPaid || false,
          depositPaidAt: order.depositPaidAt || null,
          depositPaymentMethod: order.paymentMethod || null,
          balanceAmount: order.balanceAmount,
          balancePaid: order.balancePaid || false,
          customerNotes: order.customerNotes || null,
          deliveryRequestedWeek: order.deliveryRequestedWeek || null,
          deliveryRequestedDate: order.deliveryRequestedDate ? (order.deliveryRequestedDate instanceof Date ? order.deliveryRequestedDate.toISOString().split('T')[0] : String(order.deliveryRequestedDate).split('T')[0]) : null,
        },
        items: orderItemsList,
        payments: paymentsList,
        client: clientInfo,
      });
    }

    return res.json({
      success: true,
      exportedAt: new Date().toISOString(),
      count: exportData.length,
      filters: {
        status: filterStatus || null,
        since: filterSince || null,
        depositPaid: filterDepositPaid || null,
      },
      data: exportData,
    });
  } catch (error: any) {
    console.error("[SupplierOrders] Export error:", error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: error.message || "Erreur interne du serveur",
    });
  }
});

export const supplierStockRouter = router;
