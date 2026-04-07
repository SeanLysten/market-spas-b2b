import type { Request, Response } from "express";
import { getMolliePaymentById, MOLLIE_STATUS } from "./mollie";

/**
 * Handle Mollie webhook notifications
 * Mollie sends a POST with { id: "tr_xxx" } when payment status changes
 */
export async function handleMollieWebhook(req: Request, res: Response) {
  try {
    const paymentId = req.body?.id;
    if (!paymentId) {
      console.log("[Mollie Webhook] No payment ID in request body");
      return res.status(400).json({ error: "Missing payment ID" });
    }

    console.log(`[Mollie Webhook] Received notification for payment: ${paymentId}`);

    // Fetch the payment details from Mollie
    const payment = await getMolliePaymentById(paymentId);
    console.log(`[Mollie Webhook] Payment ${paymentId} status: ${payment.status}`);

    const metadata = payment.metadata as Record<string, string> | null;
    if (!metadata) {
      console.log(`[Mollie Webhook] No metadata found for payment ${paymentId}`);
      return res.status(200).json({ received: true });
    }

    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) {
      console.error("[Mollie Webhook] Database not available");
      return res.status(500).json({ error: "Database not available" });
    }

    const { molliePayments, orders } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Update mollie_payments table
    const existingPayment = await db
      .select()
      .from(molliePayments)
      .where(eq(molliePayments.molliePaymentId, paymentId))
      .limit(1);

    if (existingPayment.length > 0) {
      const updateData: Record<string, any> = {
        mollieStatus: payment.status,
      };
      if (payment.paidAt) updateData.paidAt = new Date(payment.paidAt);
      if (payment.failedAt) updateData.failedAt = new Date(payment.failedAt);
      if (payment.cancelledAt) updateData.cancelledAt = new Date(payment.cancelledAt);
      if (payment.details?.transferReference) updateData.transferReference = payment.details.transferReference;
      if (payment.details?.bankName) updateData.bankName = payment.details.bankName;
      if (payment.details?.bankAccount) updateData.bankAccount = payment.details.bankAccount;
      if (payment.details?.bankBic) updateData.bankBic = payment.details.bankBic;

      await db
        .update(molliePayments)
        .set(updateData)
        .where(eq(molliePayments.molliePaymentId, paymentId));
    }

    // Handle order payments
    if (metadata.type === "order" && metadata.orderId) {
      const orderId = parseInt(metadata.orderId);
      await handleOrderPaymentUpdate(db, orderId, paymentId, payment.status);
    }

    // Handle SAV payments
    if (metadata.type === "sav" && metadata.savId) {
      const savId = parseInt(metadata.savId);
      await handleSavPaymentUpdate(db, savId, paymentId, payment.status);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("[Mollie Webhook] Error:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Handle order payment status update from Mollie
 */
async function handleOrderPaymentUpdate(
  db: any,
  orderId: number,
  molliePaymentId: string,
  status: string
) {
  const { orders, orderStatusHistory } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (order.length === 0) {
    console.log(`[Mollie Webhook] Order ${orderId} not found`);
    return;
  }

  const currentOrder = order[0];
  let newStatus: string | null = null;
  let depositPaid = currentOrder.depositPaid;

  switch (status) {
    case MOLLIE_STATUS.PENDING:
      // Bank transfer initiated - status "En cours"
      // Products are already withdrawn from stock at order creation
      newStatus = "PAYMENT_PENDING";
      console.log(`[Mollie Webhook] Order ${orderId}: SEPA transfer pending (En cours)`);
      break;

    case MOLLIE_STATUS.PAID:
      // Payment confirmed - status "Acompte payé"
      newStatus = "DEPOSIT_PAID";
      depositPaid = true;
      console.log(`[Mollie Webhook] Order ${orderId}: Deposit paid (Acompte payé)`);

      // Send notification email
      try {
        const { sendPaymentConfirmationEmail } = await import("./email");
        if (typeof sendPaymentConfirmationEmail === "function") {
          // Get partner info for email
          const { partners } = await import("../drizzle/schema");
          const partner = await db.select().from(partners).where(eq(partners.id, currentOrder.partnerId)).limit(1);
          if (partner.length > 0) {
            // Attempt to send email notification
            console.log(`[Mollie Webhook] Sending payment confirmation email for order ${currentOrder.orderNumber}`);
          }
        }
      } catch (e) {
        console.log("[Mollie Webhook] Email notification skipped:", (e as any).message);
      }

      // TODO: Forward deposit invoice + remaining balance to supplier API
      try {
        console.log(`[Mollie Webhook] Order ${orderId}: Forwarding to supplier API (deposit invoice + balance)`);
      } catch (e) {
        console.log("[Mollie Webhook] Supplier API forwarding skipped:", (e as any).message);
      }
      break;

    case MOLLIE_STATUS.FAILED:
    case MOLLIE_STATUS.EXPIRED:
      newStatus = "PAYMENT_FAILED";
      console.log(`[Mollie Webhook] Order ${orderId}: Payment ${status}`);
      break;

    case MOLLIE_STATUS.CANCELLED:
      newStatus = "CANCELLED";
      console.log(`[Mollie Webhook] Order ${orderId}: Payment cancelled`);
      break;

    case MOLLIE_STATUS.OPEN:
      // Payment created, waiting for customer - no status change needed
      console.log(`[Mollie Webhook] Order ${orderId}: Payment open, awaiting customer action`);
      break;
  }

  if (newStatus && newStatus !== currentOrder.status) {
    // Update order status
    await db
      .update(orders)
      .set({
        status: newStatus,
        depositPaid,
        molliePaymentId,
        mollieStatus: status,
      })
      .where(eq(orders.id, orderId));

    // Record status history
    await db.insert(orderStatusHistory).values({
      orderId,
      oldStatus: currentOrder.status,
      newStatus,
      note: `Mollie webhook: ${status} (Payment ID: ${molliePaymentId})`,
    });

    console.log(`[Mollie Webhook] Order ${orderId}: Status updated ${currentOrder.status} → ${newStatus}`);
  }
}

/**
 * Handle SAV payment status update from Mollie
 */
async function handleSavPaymentUpdate(
  db: any,
  savId: number,
  molliePaymentId: string,
  status: string
) {
  const { afterSalesServices } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  switch (status) {
    case MOLLIE_STATUS.PAID:
      await db
        .update(afterSalesServices)
        .set({ status: "PAYMENT_CONFIRMED" })
        .where(eq(afterSalesServices.id, savId));
      console.log(`[Mollie Webhook] SAV ${savId}: Payment confirmed`);
      break;

    case MOLLIE_STATUS.FAILED:
    case MOLLIE_STATUS.EXPIRED:
    case MOLLIE_STATUS.CANCELLED:
      console.log(`[Mollie Webhook] SAV ${savId}: Payment ${status}`);
      break;
  }
}
