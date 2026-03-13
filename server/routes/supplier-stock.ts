import { Router } from "express";
import { getDb } from "../db";
import { products, productVariants, orders, partners, users, orderItems, payments } from "../../drizzle/schema";
import { eq, or, sql, inArray, and } from "drizzle-orm";

const router = Router();

// ============================================
// Supplier Stock Import API
// POST /api/supplier/stock/import
// Receives JSON from supplier system to update stock and transit quantities
// ============================================

interface SupplierStockItem {
  Ean13: number | string;
  CodeProduit: string;
  EnStock: number;
  EnTransit: number;
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
  try {
    const payload = req.body as SupplierStockPayload;

    // Validate payload structure
    if (!payload || !payload.data || !Array.isArray(payload.data)) {
      return res.status(400).json({
        success: false,
        error: "Format invalide. Attendu: { key: string, data: [{ Ean13, CodeProduit, EnStock, EnTransit }] }",
      });
    }

    const db = await getDb();
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
            .set({ stockQuantity: enStock, inTransitQuantity: enTransit })
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

    // Log the import
    console.log(
      `[SupplierStock] Import completed: ${matched} matched, ${unmatched} unmatched, ${errors} errors out of ${payload.data.length} items (key: ${payload.key})`
    );

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
// ============================================

router.get("/api/supplier/orders/export", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ success: false, error: "Base de données non disponible" });
    }

    // Parse query parameters
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Step 1: Get orders
    let orderRows: any[] = [];
    try {
      orderRows = await db
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
          depositPercent: orders.depositPercent,
          depositAmount: orders.depositAmount,
          shippingMethod: orders.shippingMethod,
          internalNotes: orders.internalNotes,
          customerNotes: orders.customerNotes,
          partnerId: orders.partnerId,
          createdById: orders.createdById,
        })
        .from(orders)
        .orderBy(sql`${orders.createdAt} DESC`)
        .limit(limit)
        .offset(offset);
    } catch (e: any) {
      console.error("[SupplierOrders] Step 1 error:", e.message);
      return res.status(500).json({ success: false, error: "Erreur lors de la récupération des commandes: " + e.message });
    }

    // Step 2: Enrich with partner and user info
    const exportData = [];
    for (const order of orderRows) {
      let partnerInfo: any = {};
      let userInfo: any = {};
      let orderItemsList: any[] = [];
      let paymentsList: any[] = [];

      try {
        if (order.partnerId) {
          const partnerRows = await db.select().from(partners).where(eq(partners.id, order.partnerId)).limit(1);
          if (partnerRows.length > 0) {
            const p = partnerRows[0];
            partnerInfo = {
              partnerId: p.id,
              companyName: p.companyName,
              partnerLevel: p.partnerLevel,
              vatNumber: p.vatNumber,
              phone: p.phone,
              email: p.email,
              siret: p.siret,
            };
          }
        }
      } catch (e: any) {
        console.error("[SupplierOrders] Partner lookup error:", e.message);
      }

      try {
        if (order.createdById) {
          const userRows = await db.select().from(users).where(eq(users.id, order.createdById)).limit(1);
          if (userRows.length > 0) {
            userInfo = { contactName: userRows[0].name, contactEmail: userRows[0].email };
          }
        }
      } catch (e: any) {
        console.error("[SupplierOrders] User lookup error:", e.message);
      }

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
          })
          .from(orderItems)
          .where(eq(orderItems.orderId, order.orderId));

        for (const item of items) {
          let supplierCode = null;
          let ean13 = null;

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

          orderItemsList.push({
            name: item.itemName,
            sku: item.itemSku,
            quantity: item.quantity,
            unitPriceHT: item.unitPriceHT,
            totalHT: item.totalHT,
            supplierProductCode: supplierCode,
            ean13: ean13,
          });
        }
      } catch (e: any) {
        console.error("[SupplierOrders] Items lookup error:", e.message);
      }

      try {
        const pmts = await db
          .select({
            amount: payments.amount,
            method: payments.method,
            status: payments.status,
            stripePaymentIntentId: payments.stripePaymentIntentId,
            paidAt: payments.paidAt,
          })
          .from(payments)
          .where(eq(payments.orderId, order.orderId));
        paymentsList = pmts;
      } catch (e: any) {
        console.error("[SupplierOrders] Payments lookup error:", e.message);
      }

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
          depositPercent: order.depositPercent,
          depositAmount: order.depositAmount,
        },
        items: orderItemsList,
        payments: paymentsList,
        client: { ...partnerInfo, ...userInfo },
      });
    }

    return res.json({
      success: true,
      exportedAt: new Date().toISOString(),
      count: exportData.length,
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
