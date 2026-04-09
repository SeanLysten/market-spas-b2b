/**
 * Supplier API Client
 * Handles outbound notifications to the supplier's API
 * 
 * Flow 1: When deposit is paid (DEPOSIT_PAID) → push order + payment info to supplier
 * Flow 2: Supplier pushes back balance_paid → we update order status
 */

import { getDb } from "./db";
import { orders, partners, users, orderItems, products, productVariants, payments, supplierApiLogs } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

// ============================================
// Types
// ============================================

interface SupplierDepositNotification {
  event: "deposit_paid";
  timestamp: string;
  order: {
    id: number;
    number: string;
    date: string;
    subtotalHT: string;
    discountPercent: string | null;
    discountAmount: string | null;
    shippingHT: string;
    totalHT: string;
    totalVAT: string;
    totalTTC: string;
    currency: string;
    depositPercent: string | null;
    depositAmount: string;
    depositPaidAt: string;
    balanceAmount: string;
    shippingMethod: string | null;
    customerNotes: string | null;
    deliveryRequestedWeek: string | null;
    deliveryRequestedDate: string | null;
  };
  items: Array<{
    NomProduit: string;
    SKU: string | null;
    CodeProduit: string | null;
    Ean13: number | string | null;
    Couleur: string | null;
    QuantiteCommandee: number;
    PrixUnitaireHT: string;
    TotalHT: string;
    SourceStock: string | null;
    DelaiAppro: string | null;
  }>;
  client: {
    partnerId: number;
    supplierClientCode: string | null;
    companyName: string;
    vatNumber: string | null;
    contact: {
      name: string | null;
      email: string | null;
      phone: string | null;
    };
    billingAddress: {
      street: string | null;
      city: string | null;
      postalCode: string | null;
      country: string | null;
    };
    deliveryAddress: {
      street: string | null;
      street2: string | null;
      city: string | null;
      postalCode: string | null;
      country: string | null;
      contactName: string | null;
      contactPhone: string | null;
      instructions: string | null;
    };
  };
  payment: {
    depositAmount: string;
    depositMethod: string | null;
    depositPaidAt: string;
    balanceAmount: string;
    balanceDue: boolean;
  };
}

// ============================================
// Build the deposit notification payload
// ============================================

async function buildDepositNotification(orderId: number): Promise<SupplierDepositNotification | null> {
  const db = await getDb();
  if (!db) {
    console.error("[SupplierAPI] Database not available");
    return null;
  }

  // Get order
  const orderRows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (orderRows.length === 0) {
    console.error(`[SupplierAPI] Order ${orderId} not found`);
    return null;
  }
  const order = orderRows[0];

  // Get partner
  let partnerData: any = null;
  if (order.partnerId) {
    const partnerRows = await db.select().from(partners).where(eq(partners.id, order.partnerId)).limit(1);
    if (partnerRows.length > 0) partnerData = partnerRows[0];
  }

  // Get order items with supplier codes
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
      color: orderItems.color,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const itemsList = [];
  for (const item of items) {
    let supplierCode: string | null = null;
    let ean13: string | number | null = null;

    if (item.variantId) {
      const variants = await db
        .select({ supplierProductCode: productVariants.supplierProductCode, ean13: productVariants.ean13 })
        .from(productVariants)
        .where(eq(productVariants.id, item.variantId))
        .limit(1);
      if (variants.length > 0) {
        supplierCode = variants[0].supplierProductCode;
        ean13 = variants[0].ean13;
      }
    }
    if (!supplierCode && item.productId) {
      const prods = await db
        .select({ supplierProductCode: products.supplierProductCode, ean13: products.ean13 })
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);
      if (prods.length > 0) {
        supplierCode = prods[0].supplierProductCode;
        ean13 = prods[0].ean13;
      }
    }

    let ean13Numeric: number | string | null = ean13;
    if (ean13 && !isNaN(Number(ean13))) {
      ean13Numeric = Number(ean13);
    }

    const unitPrice = parseFloat(item.unitPriceHT || "0");
    const qty = item.quantity || 1;
    const totalHTSansRemise = (unitPrice * qty).toFixed(2);

    itemsList.push({
      NomProduit: item.itemName,
      SKU: item.itemSku,
      CodeProduit: supplierCode,
      Ean13: ean13Numeric,
      Couleur: item.color || null,
      QuantiteCommandee: item.quantity,
      PrixUnitaireHT: item.unitPriceHT || "0",
      TotalHT: totalHTSansRemise,
      SourceStock: item.stockSource || null,
      DelaiAppro: item.stockSourceArrivalWeek || null,
    });
  }

  const now = new Date().toISOString();

  return {
    event: "deposit_paid",
    timestamp: now,
    order: {
      id: order.id,
      number: order.orderNumber,
      date: order.createdAt ? order.createdAt.toISOString() : now,
      subtotalHT: order.subtotalHT || "0",
      discountPercent: order.discountPercent || null,
      discountAmount: order.discountAmount || null,
      shippingHT: order.shippingHT || "0",
      totalHT: order.totalHT || "0",
      totalVAT: order.totalVAT || "0",
      totalTTC: order.totalTTC || "0",
      currency: order.currency || "EUR",
      depositPercent: order.depositPercent || null,
      depositAmount: order.depositAmount || "0",
      depositPaidAt: order.depositPaidAt ? order.depositPaidAt.toISOString() : now,
      balanceAmount: order.balanceAmount || "0",
      shippingMethod: order.shippingMethod || null,
      customerNotes: order.customerNotes || null,
      deliveryRequestedWeek: order.deliveryRequestedWeek || null,
      deliveryRequestedDate: order.deliveryRequestedDate
        ? (order.deliveryRequestedDate instanceof Date
          ? order.deliveryRequestedDate.toISOString().split("T")[0]
          : String(order.deliveryRequestedDate).split("T")[0])
        : null,
    },
    items: itemsList,
    client: {
      partnerId: partnerData?.id || 0,
      supplierClientCode: partnerData?.supplierClientCode || null,
      companyName: partnerData?.companyName || "Inconnu",
      vatNumber: partnerData?.vatNumber || null,
      contact: {
        name: partnerData?.primaryContactName || null,
        email: partnerData?.primaryContactEmail || null,
        phone: partnerData?.primaryContactPhone || null,
      },
      billingAddress: {
        street: partnerData?.billingAddressSame
          ? partnerData?.addressStreet
          : (partnerData?.billingStreet || partnerData?.addressStreet || null),
        city: partnerData?.billingAddressSame
          ? partnerData?.addressCity
          : (partnerData?.billingCity || partnerData?.addressCity || null),
        postalCode: partnerData?.billingAddressSame
          ? partnerData?.addressPostalCode
          : (partnerData?.billingPostalCode || partnerData?.addressPostalCode || null),
        country: partnerData?.billingAddressSame
          ? (partnerData?.addressCountry || "BE")
          : (partnerData?.billingCountry || partnerData?.addressCountry || "BE"),
      },
      deliveryAddress: {
        street: order.deliveryStreet || null,
        street2: order.deliveryStreet2 || null,
        city: order.deliveryCity || null,
        postalCode: order.deliveryPostalCode || null,
        country: order.deliveryCountry || null,
        contactName: order.deliveryContactName || null,
        contactPhone: order.deliveryContactPhone || null,
        instructions: order.deliveryInstructions || null,
      },
    },
    payment: {
      depositAmount: order.depositAmount || "0",
      depositMethod: order.paymentMethod || null,
      depositPaidAt: order.depositPaidAt ? order.depositPaidAt.toISOString() : now,
      balanceAmount: order.balanceAmount || "0",
      balanceDue: true,
    },
  };
}

// ============================================
// Send deposit paid notification to supplier
// ============================================

export async function notifySupplierDepositPaid(orderId: number, orderNumber: string): Promise<boolean> {
  const supplierApiUrl = process.env.SUPPLIER_API_URL;
  const supplierApiKey = process.env.SUPPLIER_API_KEY;

  // If no supplier API URL is configured, log and skip (non-blocking)
  if (!supplierApiUrl) {
    console.log(`[SupplierAPI] No SUPPLIER_API_URL configured — skipping deposit notification for order ${orderNumber}`);
    
    // Still log the event locally for traceability
    const db = await getDb();
    if (db) {
      try {
        const payload = await buildDepositNotification(orderId);
        await db.insert(supplierApiLogs).values({
          importKey: `deposit_paid_${orderNumber}`,
          rawPayload: JSON.stringify(payload),
          totalItems: 0,
          matchedItems: 0,
          unmatchedItems: 0,
          errorItems: 0,
          resultsJson: JSON.stringify({ event: "deposit_paid", status: "skipped", reason: "No SUPPLIER_API_URL configured" }),
          ipAddress: "local",
          userAgent: "market-spas-b2b/supplier-api",
          success: true,
          errorMessage: null,
        });
      } catch (logErr) {
        console.error("[SupplierAPI] Failed to log skipped notification:", logErr);
      }
    }
    return false;
  }

  try {
    const payload = await buildDepositNotification(orderId);
    if (!payload) {
      console.error(`[SupplierAPI] Could not build notification payload for order ${orderId}`);
      return false;
    }

    console.log(`[SupplierAPI] Sending deposit_paid notification for order ${orderNumber} to ${supplierApiUrl}/orders/deposit-paid`);

    const response = await fetch(`${supplierApiUrl}/orders/deposit-paid`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": supplierApiKey || "",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let responseJson: any = null;
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      responseJson = { raw: responseText };
    }

    const success = response.ok;

    // Log the API call
    const db = await getDb();
    if (db) {
      try {
        await db.insert(supplierApiLogs).values({
          importKey: `deposit_paid_${orderNumber}`,
          rawPayload: JSON.stringify(payload),
          totalItems: payload.items.length,
          matchedItems: success ? payload.items.length : 0,
          unmatchedItems: 0,
          errorItems: success ? 0 : 1,
          resultsJson: JSON.stringify({
            event: "deposit_paid",
            httpStatus: response.status,
            response: responseJson,
          }),
          ipAddress: "outbound",
          userAgent: "market-spas-b2b/supplier-api",
          success,
          errorMessage: success ? null : `HTTP ${response.status}: ${responseText.slice(0, 500)}`,
        });
      } catch (logErr) {
        console.error("[SupplierAPI] Failed to log API call:", logErr);
      }
    }

    if (success) {
      console.log(`[SupplierAPI] Deposit notification sent successfully for order ${orderNumber}`);
    } else {
      console.error(`[SupplierAPI] Deposit notification failed for order ${orderNumber}: HTTP ${response.status}`);
    }

    return success;
  } catch (error: any) {
    console.error(`[SupplierAPI] Error sending deposit notification for order ${orderNumber}:`, error.message);

    // Log the error
    const db = await getDb();
    if (db) {
      try {
        await db.insert(supplierApiLogs).values({
          importKey: `deposit_paid_${orderNumber}`,
          rawPayload: JSON.stringify({ orderId, orderNumber }),
          totalItems: 0,
          matchedItems: 0,
          unmatchedItems: 0,
          errorItems: 1,
          resultsJson: null,
          ipAddress: "outbound",
          userAgent: "market-spas-b2b/supplier-api",
          success: false,
          errorMessage: error.message?.slice(0, 500) || "Unknown error",
        });
      } catch (logErr) {
        console.error("[SupplierAPI] Failed to log error:", logErr);
      }
    }

    return false;
  }
}
