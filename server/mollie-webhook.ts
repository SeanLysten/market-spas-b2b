import type { Request, Response } from "express";
import { getMolliePaymentById, MOLLIE_STATUS } from "./mollie";
import { notifyPaymentReceived, notifyPaymentFailed } from "./notification-service";
import { notifySupplierDepositPaid } from "./supplier-api";

/**
 * Log a webhook event to the mollie_webhook_logs table
 */
async function logWebhookEvent(data: {
  molliePaymentId?: string;
  mollieStatus?: string;
  eventType: string;
  orderId?: number;
  orderNumber?: string;
  savTicketId?: number;
  httpStatusCode: number;
  processingTimeMs?: number;
  rawPayload?: string;
  mollieResponsePayload?: string;
  previousOrderStatus?: string;
  newOrderStatus?: string;
  errorMessage?: string;
  ipAddress?: string;
  success: boolean;
}) {
  try {
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) return;

    const { mollieWebhookLogs } = await import("../drizzle/schema");
    await db.insert(mollieWebhookLogs).values({
      molliePaymentId: data.molliePaymentId || null,
      mollieStatus: data.mollieStatus || null,
      eventType: data.eventType,
      orderId: data.orderId || null,
      orderNumber: data.orderNumber || null,
      savTicketId: data.savTicketId || null,
      httpStatusCode: data.httpStatusCode,
      processingTimeMs: data.processingTimeMs || null,
      rawPayload: data.rawPayload || null,
      mollieResponsePayload: data.mollieResponsePayload || null,
      previousOrderStatus: data.previousOrderStatus || null,
      newOrderStatus: data.newOrderStatus || null,
      errorMessage: data.errorMessage || null,
      ipAddress: data.ipAddress || null,
      success: data.success,
    });
  } catch (logError: any) {
    // Ne jamais faire planter le webhook à cause du logging
    console.error("[Mollie Webhook Log] Failed to write log:", logError.message);
  }
}

/**
 * Extract client IP from request
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0];
  return req.socket?.remoteAddress || "unknown";
}

/**
 * Handle Mollie webhook notifications
 * Mollie sends a POST with { id: "tr_xxx" } when payment status changes
 */
export async function handleMollieWebhook(req: Request, res: Response) {
  const startTime = Date.now();
  const clientIp = getClientIp(req);
  const rawPayload = JSON.stringify(req.body);

  try {
    const paymentId = req.body?.id;
    if (!paymentId) {
      console.log("[Mollie Webhook] No payment ID in request body");
      const processingTimeMs = Date.now() - startTime;
      await logWebhookEvent({
        eventType: "error.missing_payment_id",
        httpStatusCode: 400,
        processingTimeMs,
        rawPayload,
        errorMessage: "Missing payment ID in request body",
        ipAddress: clientIp,
        success: false,
      });
      return res.status(400).json({ error: "Missing payment ID" });
    }

    console.log(`[Mollie Webhook] Received notification for payment: ${paymentId}`);

    // Fetch the payment details from Mollie
    let payment: any;
    try {
      payment = await getMolliePaymentById(paymentId);
    } catch (fetchError: any) {
      console.error(`[Mollie Webhook] Failed to fetch payment ${paymentId}:`, fetchError.message);
      const processingTimeMs = Date.now() - startTime;
      await logWebhookEvent({
        molliePaymentId: paymentId,
        eventType: "error.fetch_payment_failed",
        httpStatusCode: 500,
        processingTimeMs,
        rawPayload,
        errorMessage: `Failed to fetch payment from Mollie: ${fetchError.message}`,
        ipAddress: clientIp,
        success: false,
      });
      return res.status(500).json({ error: "Failed to fetch payment from Mollie" });
    }

    console.log(`[Mollie Webhook] Payment ${paymentId} status: ${payment.status}`);
    const mollieResponsePayload = JSON.stringify(payment);

    const metadata = payment.metadata as Record<string, string> | null;
    if (!metadata) {
      console.log(`[Mollie Webhook] No metadata found for payment ${paymentId}`);
      const processingTimeMs = Date.now() - startTime;
      await logWebhookEvent({
        molliePaymentId: paymentId,
        mollieStatus: payment.status,
        eventType: "info.no_metadata",
        httpStatusCode: 200,
        processingTimeMs,
        rawPayload,
        mollieResponsePayload,
        ipAddress: clientIp,
        success: true,
      });
      return res.status(200).json({ received: true });
    }

    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) {
      console.error("[Mollie Webhook] Database not available");
      const processingTimeMs = Date.now() - startTime;
      await logWebhookEvent({
        molliePaymentId: paymentId,
        mollieStatus: payment.status,
        eventType: "error.database_unavailable",
        httpStatusCode: 500,
        processingTimeMs,
        rawPayload,
        mollieResponsePayload,
        errorMessage: "Database not available",
        ipAddress: clientIp,
        success: false,
      });
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

    // Prepare log data
    let logOrderId: number | undefined;
    let logOrderNumber: string | undefined;
    let logSavTicketId: number | undefined;
    let logPreviousStatus: string | undefined;
    let logNewStatus: string | undefined;
    let logEventType = "payment.status_change";

    // Handle order payments
    if (metadata.type === "order" && metadata.orderId) {
      const orderId = parseInt(metadata.orderId);
      logOrderId = orderId;

      // Get order info for logging
      const orderRows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (orderRows.length > 0) {
        logOrderNumber = orderRows[0].orderNumber;
        logPreviousStatus = orderRows[0].status;
      }

      const result = await handleOrderPaymentUpdate(db, orderId, paymentId, payment.status);
      logNewStatus = result?.newStatus || undefined;
      logEventType = `order.${payment.status}`;
    }

    // Handle SAV payments
    if (metadata.type === "sav" && metadata.savId) {
      const savId = parseInt(metadata.savId);
      logSavTicketId = savId;
      logEventType = `sav.${payment.status}`;
      await handleSavPaymentUpdate(db, savId, paymentId, payment.status);
    }

    const processingTimeMs = Date.now() - startTime;
    await logWebhookEvent({
      molliePaymentId: paymentId,
      mollieStatus: payment.status,
      eventType: logEventType,
      orderId: logOrderId,
      orderNumber: logOrderNumber,
      savTicketId: logSavTicketId,
      httpStatusCode: 200,
      processingTimeMs,
      rawPayload,
      mollieResponsePayload,
      previousOrderStatus: logPreviousStatus,
      newOrderStatus: logNewStatus,
      ipAddress: clientIp,
      success: true,
    });

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("[Mollie Webhook] Error:", error.message);
    const processingTimeMs = Date.now() - startTime;
    await logWebhookEvent({
      molliePaymentId: req.body?.id || undefined,
      eventType: "error.unhandled",
      httpStatusCode: 500,
      processingTimeMs,
      rawPayload,
      errorMessage: error.message,
      ipAddress: clientIp,
      success: false,
    });
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Handle order payment status update from Mollie
 * Returns the new status if changed
 */
async function handleOrderPaymentUpdate(
  db: any,
  orderId: number,
  molliePaymentId: string,
  status: string
): Promise<{ newStatus: string | null }> {
  const { orders, orderStatusHistory } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (order.length === 0) {
    console.log(`[Mollie Webhook] Order ${orderId} not found`);
    return { newStatus: null };
  }

  const currentOrder = order[0];
  let newStatus: string | null = null;
  let depositPaid = currentOrder.depositPaid;

  switch (status) {
    case MOLLIE_STATUS.PENDING:
      // Bank transfer initiated - status "En cours"
      newStatus = "PAYMENT_PENDING";
      console.log(`[Mollie Webhook] Order ${orderId}: SEPA transfer pending (En cours)`);
      break;

    case MOLLIE_STATUS.PAID:
      // Payment confirmed - status "Acompte paye"
      newStatus = "DEPOSIT_PAID";
      depositPaid = true;
      console.log(`[Mollie Webhook] Order ${orderId}: Deposit paid (Acompte paye)`);

      // Send payment received notification
      try {
        await notifyPaymentReceived(orderId, currentOrder.orderNumber, "deposit");
      } catch (e) {
        console.log("[Mollie Webhook] notifyPaymentReceived skipped:", (e as any).message);
      }

      // Send notification email
      try {
        const { sendPaymentConfirmationEmail } = await import("./email");
        if (typeof sendPaymentConfirmationEmail === "function") {
          const { partners } = await import("../drizzle/schema");
          const partner = await db.select().from(partners).where(eq(partners.id, currentOrder.partnerId)).limit(1);
          if (partner.length > 0) {
            console.log(`[Mollie Webhook] Sending payment confirmation email for order ${currentOrder.orderNumber}`);
          }
        }
      } catch (e) {
        console.log("[Mollie Webhook] Email notification skipped:", (e as any).message);
      }

      // Notify supplier API that deposit has been paid
      try {
        const supplierResult = await notifySupplierDepositPaid(orderId, currentOrder.orderNumber);
        console.log(`[Mollie Webhook] Order ${orderId}: Supplier API notification ${supplierResult ? 'sent successfully' : 'skipped or failed'}`);
      } catch (e) {
        console.error("[Mollie Webhook] Supplier API forwarding error:", (e as any).message);
      }
      break;

    case MOLLIE_STATUS.FAILED:
    case MOLLIE_STATUS.EXPIRED:
      // Payment not received within deadline -> REFUSED + restore stock
      newStatus = "REFUSED";
      console.log(`[Mollie Webhook] Order ${orderId}: Payment ${status} -> REFUSED`);

      try {
        await notifyPaymentFailed(orderId, currentOrder.orderNumber, status);
      } catch (e) {
        console.log("[Mollie Webhook] notifyPaymentFailed skipped:", (e as any).message);
      }

      // Send order refused email to partner
      try {
        const { sendOrderRefusedEmail } = await import("./email");
        const { partners, users } = await import("../drizzle/schema");
        const partner = await db.select().from(partners).where(eq(partners.id, currentOrder.partnerId)).limit(1);
        if (partner.length > 0) {
          const partnerUsers = await db.select().from(users).where(eq(users.partnerId, currentOrder.partnerId)).limit(5);
          const emailTargets = partnerUsers.length > 0
            ? partnerUsers.map((u: any) => u.email).filter(Boolean)
            : [partner[0].email].filter(Boolean);
          for (const targetEmail of emailTargets) {
            await sendOrderRefusedEmail(
              targetEmail,
              currentOrder.orderNumber,
              parseFloat(currentOrder.depositAmount || "0"),
              parseFloat(currentOrder.totalTTC || "0"),
              partner[0].companyName
            );
          }
          console.log(`[Mollie Webhook] Order ${orderId}: Refused email sent to ${emailTargets.length} recipient(s)`);
        }
      } catch (emailError: any) {
        console.error(`[Mollie Webhook] Order ${orderId}: Failed to send refused email:`, emailError.message);
      }
      
      // Restore stock for all items in this order
      try {
        const { restoreStockForOrder } = await import("./stock-management");
        await restoreStockForOrder(orderId);
        console.log(`[Mollie Webhook] Order ${orderId}: Stock restored successfully`);
      } catch (stockError: any) {
        console.error(`[Mollie Webhook] Order ${orderId}: Failed to restore stock:`, stockError.message);
      }
      break;

    case MOLLIE_STATUS.CANCELLED:
      newStatus = "REFUSED";
      console.log(`[Mollie Webhook] Order ${orderId}: Payment cancelled -> REFUSED`);

      // Send order refused email for cancelled payments too
      try {
        const { sendOrderRefusedEmail: sendRefusedEmail } = await import("./email");
        const { partners: partnersTable, users: usersTable } = await import("../drizzle/schema");
        const partnerData = await db.select().from(partnersTable).where(eq(partnersTable.id, currentOrder.partnerId)).limit(1);
        if (partnerData.length > 0) {
          const partnerUsersList = await db.select().from(usersTable).where(eq(usersTable.partnerId, currentOrder.partnerId)).limit(5);
          const targets = partnerUsersList.length > 0
            ? partnerUsersList.map((u: any) => u.email).filter(Boolean)
            : [partnerData[0].email].filter(Boolean);
          for (const t of targets) {
            await sendRefusedEmail(
              t,
              currentOrder.orderNumber,
              parseFloat(currentOrder.depositAmount || "0"),
              parseFloat(currentOrder.totalTTC || "0"),
              partnerData[0].companyName
            );
          }
          console.log(`[Mollie Webhook] Order ${orderId}: Refused email sent after cancellation`);
        }
      } catch (emailError: any) {
        console.error(`[Mollie Webhook] Order ${orderId}: Failed to send refused email:`, emailError.message);
      }
      
      // Restore stock for cancelled orders too
      try {
        const { restoreStockForOrder: restoreStock } = await import("./stock-management");
        await restoreStock(orderId);
        console.log(`[Mollie Webhook] Order ${orderId}: Stock restored after cancellation`);
      } catch (stockError: any) {
        console.error(`[Mollie Webhook] Order ${orderId}: Failed to restore stock:`, stockError.message);
      }
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

    console.log(`[Mollie Webhook] Order ${orderId}: Status updated ${currentOrder.status} -> ${newStatus}`);
  }

  return { newStatus };
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
