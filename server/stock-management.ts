import { eq, and, sql, lt } from "drizzle-orm";
import { getDb } from "./db";
import {
  orders,
  orderItems,
  products,
  productVariants,
  incomingStock,
  orderStatusHistory,
} from "../drizzle/schema";

/**
 * Restore stock for a given order (when payment expires/fails/is refused)
 * Reverses the stock changes made during createOrder:
 * - In-stock items: re-increment stockQuantity
 * - Preorder items: decrement stockReserved
 * - Incoming stock: re-increment quantity if linked
 */
export async function restoreStockForOrder(orderId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get order items
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  for (const item of items) {
    const isPreorder = item.stockSource === "TRANSIT";

    if (item.variantId) {
      if (!isPreorder) {
        // In-stock item: re-add stock
        await db
          .update(productVariants)
          .set({
            stockQuantity: sql`${productVariants.stockQuantity} + ${item.quantity}`,
          })
          .where(eq(productVariants.id, item.variantId));
      } else {
        // Preorder item: release reservation
        await db
          .update(productVariants)
          .set({
            stockReserved: sql`GREATEST(0, ${productVariants.stockReserved} - ${item.quantity})`,
          })
          .where(eq(productVariants.id, item.variantId));
      }
    } else if (item.productId) {
      if (!isPreorder) {
        // In-stock item without variant: re-add stock
        await db
          .update(products)
          .set({
            stockQuantity: sql`${products.stockQuantity} + ${item.quantity}`,
          })
          .where(eq(products.id, item.productId));
      } else {
        // Preorder item without variant: release reservation
        await db
          .update(products)
          .set({
            stockReserved: sql`GREATEST(0, ${products.stockReserved} - ${item.quantity})`,
          })
          .where(eq(products.id, item.productId));
      }
    }

    // Restore incoming stock if it was decremented
    if (isPreorder && (item as any).incomingStockId) {
      await db
        .update(incomingStock)
        .set({
          quantity: sql`${incomingStock.quantity} + ${item.quantity}`,
        })
        .where(eq(incomingStock.id, (item as any).incomingStockId));
    }
  }

  console.log(`[Stock] Restored stock for order ${orderId} (${items.length} items)`);
}

/**
 * Check for expired PAYMENT_PENDING orders (older than 3 days)
 * and set them to REFUSED + restore stock
 * This should be called periodically (e.g., every hour via a cron job)
 */
export async function expireUnpaidOrders(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  // Find orders that are PAYMENT_PENDING and were created more than 3 days ago
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const expiredOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.status, "PAYMENT_PENDING"),
        lt(orders.createdAt, threeDaysAgo)
      )
    );

  let count = 0;
  for (const order of expiredOrders) {
    try {
      // Restore stock
      await restoreStockForOrder(order.id);

      // Update order status to REFUSED
      await db
        .update(orders)
        .set({
          status: "REFUSED",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));

      // Record status history
      await db.insert(orderStatusHistory).values({
        orderId: order.id,
        oldStatus: order.status,
        newStatus: "REFUSED",
        note: "Paiement non reçu dans les 3 jours - commande refusée et stock restauré automatiquement",
      });

      // Send order refused email to partner
      try {
        const { sendOrderRefusedEmail } = await import("./email");
        const { partners, users } = await import("../drizzle/schema");
        const partner = await db.select().from(partners).where(eq(partners.id, order.partnerId)).limit(1);
        if (partner.length > 0) {
          const partnerUsers = await db.select().from(users).where(eq(users.partnerId, order.partnerId)).limit(5);
          const emailTargets = partnerUsers.length > 0
            ? partnerUsers.map((u: any) => u.email).filter(Boolean)
            : [partner[0].email].filter(Boolean);
          for (const targetEmail of emailTargets) {
            await sendOrderRefusedEmail(
              targetEmail,
              order.orderNumber,
              parseFloat(order.depositAmount || "0"),
              parseFloat(order.totalTTC || "0"),
              partner[0].companyName
            );
          }
          console.log(`[Stock] Order ${order.orderNumber}: Refused email sent to ${emailTargets.length} recipient(s)`);
        }
      } catch (emailError: any) {
        console.error(`[Stock] Order ${order.orderNumber}: Failed to send refused email:`, emailError.message);
      }

      count++;
      console.log(`[Stock] Order ${order.orderNumber} expired: PAYMENT_PENDING → REFUSED (stock restored)`);
    } catch (error: any) {
      console.error(`[Stock] Error expiring order ${order.id}:`, error.message);
    }
  }

  if (count > 0) {
    console.log(`[Stock] Expired ${count} unpaid orders`);
  }

  return count;
}
