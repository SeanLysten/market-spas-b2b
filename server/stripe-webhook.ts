import type { Request, Response } from "express";
import Stripe from "stripe";
import { verifyWebhookSignature } from "./stripe";
import * as db from "./db";
import { sendPaymentConfirmationEmail, sendPaymentFailureEmail, sendRefundConfirmationEmail } from "./email";
import { notifyPaymentReceived, notifyPaymentFailed, notifyRefundProcessed } from "./notification-service";

/**
 * Handle Stripe webhook events
 * This endpoint processes payment confirmations, failures, and refunds
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"] as string;

  if (!signature) {
    console.error("[Stripe Webhook] Missing signature");
    return res.status(400).send("Missing signature");
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = verifyWebhookSignature(req.body, signature);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;

      case "charge.refunded":
        await handleRefund(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error(`[Stripe Webhook] Error processing event:`, error);
    res.status(500).send(`Webhook Error: ${error.message}`);
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const orderId = parseInt(paymentIntent.metadata.orderId || "0");
  
  if (!orderId) {
    console.error("[Stripe Webhook] Missing orderId in metadata");
    return;
  }

  console.log(`[Stripe Webhook] Payment succeeded for order ${orderId}`);

  // Update order status to PAID
  await db.updateOrderStatus(orderId, "PAID");

  // Record payment transaction
  await db.createPaymentTransaction({
    orderId,
    amount: paymentIntent.amount / 100, // Convert cents to euros
    currency: paymentIntent.currency.toUpperCase(),
    paymentMethod: "CARD",
    stripePaymentIntentId: paymentIntent.id,
    status: "COMPLETED",
  });

  // Send confirmation email to customer
  const order = await db.getOrderById(orderId);
  if (order && order.partnerEmail) {
    const paymentMethod = paymentIntent.payment_method_types?.[0] || "Carte bancaire";
    await sendPaymentConfirmationEmail(
      order.partnerEmail,
      order.orderNumber,
      paymentIntent.amount / 100,
      paymentMethod
    );
  }
  // Persistent DB notification
  try {
    const paymentMethod = paymentIntent.payment_method_types?.[0] || "Carte bancaire";
    await notifyPaymentReceived(orderId, paymentIntent.amount / 100, paymentMethod);
  } catch (err) {
    console.error("[Stripe Webhook] Failed to create payment notification:", err);
  }

  console.log(`[Stripe Webhook] Order ${orderId} marked as PAID`);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const orderId = parseInt(paymentIntent.metadata.orderId || "0");
  
  if (!orderId) {
    console.error("[Stripe Webhook] Missing orderId in metadata");
    return;
  }

  console.log(`[Stripe Webhook] Payment failed for order ${orderId}`);

  // Record failed payment attempt
  await db.createPaymentTransaction({
    orderId,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency.toUpperCase(),
    paymentMethod: "CARD",
    stripePaymentIntentId: paymentIntent.id,
    status: "FAILED",
  });

  // Send payment failure notification to customer
  const order = await db.getOrderById(orderId);
  if (order && order.partnerEmail) {
    const reason = paymentIntent.last_payment_error?.message || "Paiement refusé";
    await sendPaymentFailureEmail(
      order.partnerEmail,
      order.orderNumber,
      paymentIntent.amount / 100,
      reason
    );
  }
  // Persistent DB notification
  try {
    const reason = paymentIntent.last_payment_error?.message || "Paiement refusé";
    await notifyPaymentFailed(orderId, paymentIntent.amount / 100, reason);
  } catch (err) {
    console.error("[Stripe Webhook] Failed to create payment failure notification:", err);
  }

  console.log(`[Stripe Webhook] Payment failure recorded for order ${orderId}`);
}

/**
 * Handle refund
 */
async function handleRefund(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;
  
  if (!paymentIntentId) {
    console.error("[Stripe Webhook] Missing payment_intent in charge");
    return;
  }

  console.log(`[Stripe Webhook] Refund processed for payment ${paymentIntentId}`);

  // Find the original transaction
  const transaction = await db.getPaymentTransactionByStripeId(paymentIntentId);
  
  if (!transaction) {
    console.error(`[Stripe Webhook] Transaction not found for payment ${paymentIntentId}`);
    return;
  }

  // Record refund transaction
  if (!transaction.orderId) {
    console.error(`[Stripe Webhook] Missing orderId in transaction`);
    return;
  }

  await db.createPaymentTransaction({
    orderId: transaction.orderId,
    amount: -(charge.amount_refunded / 100), // Negative amount for refund
    currency: charge.currency.toUpperCase(),
    paymentMethod: "CARD",
    stripePaymentIntentId: paymentIntentId,
    status: "REFUNDED",
  });

  // Update order status if fully refunded
  if (charge.amount_refunded === charge.amount && transaction.orderId) {
    await db.updateOrderStatus(transaction.orderId, "CANCELLED");
  }

  // Send refund confirmation email to customer
  const order = await db.getOrderById(transaction.orderId);
  if (order && order.partnerEmail) {
    await sendRefundConfirmationEmail(
      order.partnerEmail,
      order.orderNumber,
      charge.amount_refunded / 100
    );
  }
  // Persistent DB notification
  try {
    await notifyRefundProcessed(transaction.orderId, charge.amount_refunded / 100);
  } catch (err) {
    console.error("[Stripe Webhook] Failed to create refund notification:", err);
  }

  console.log(`[Stripe Webhook] Refund recorded for order ${transaction.orderId}`);
}
