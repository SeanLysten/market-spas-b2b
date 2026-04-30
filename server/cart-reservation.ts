import { eq, and, sql, lt, isNotNull } from "drizzle-orm";
import { getDb } from "./db";
import {
  cartItems,
  products,
  productVariants,
} from "../drizzle/schema";

/**
 * Release expired cart reservations (reservedUntil < now)
 * Called periodically (every minute) to free up stock from abandoned carts
 */
export async function releaseExpiredCartReservations(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const now = new Date();

  // Find all cart items with expired reservations
  const expiredItems = await db
    .select()
    .from(cartItems)
    .where(
      and(
        eq(cartItems.stockReserved, true),
        isNotNull(cartItems.reservedUntil),
        lt(cartItems.reservedUntil, now)
      )
    );

  if (expiredItems.length === 0) return 0;

  let releasedCount = 0;

  for (const item of expiredItems) {
    try {
      // Release stock reservation
      if (item.variantId) {
        await db
          .update(productVariants)
          .set({
            stockReserved: sql`GREATEST(0, COALESCE(${productVariants.stockReserved}, 0) - ${item.quantity})`,
          })
          .where(eq(productVariants.id, item.variantId));
      } else {
        await db
          .update(products)
          .set({
            stockReserved: sql`GREATEST(0, COALESCE(${products.stockReserved}, 0) - ${item.quantity})`,
          })
          .where(eq(products.id, item.productId));
      }

      // Delete the expired cart item
      await db.delete(cartItems).where(eq(cartItems.id, item.id));

      releasedCount++;
      console.info(
        `[Cart Reservation] Released expired reservation: user ${item.userId}, product ${item.productId}${item.variantId ? ` variant ${item.variantId}` : ""}, qty ${item.quantity}`
      );
    } catch (error: any) {
      console.error(
        `[Cart Reservation] Error releasing reservation for cart item ${item.id}:`,
        error.message
      );
    }
  }

  if (releasedCount > 0) {
    console.info(
      `[Cart Reservation] Released ${releasedCount} expired cart reservations`
    );
  }

  return releasedCount;
}
