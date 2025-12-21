import Stripe from "stripe";
import { ENV } from "./_core/env";

// Initialize Stripe with the secret key
const stripe = new Stripe(ENV.stripeSecretKey || "", {
  apiVersion: "2025-12-15.clover",
});

export interface CreatePaymentIntentInput {
  amount: number; // Amount in cents
  currency?: string;
  customerId?: string;
  orderId: number;
  orderNumber: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
}

/**
 * Create a payment intent for an order deposit
 */
export async function createPaymentIntent(
  input: CreatePaymentIntentInput
): Promise<PaymentIntentResult> {
  const { amount, currency = "eur", customerId, orderId, orderNumber, description, metadata } = input;

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    customer: customerId || undefined,
    description: description || `Acompte commande ${orderNumber}`,
    metadata: {
      orderId: orderId.toString(),
      orderNumber,
      ...metadata,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret || "",
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
  };
}

/**
 * Retrieve a payment intent by ID
 */
export async function getPaymentIntent(paymentIntentId: string) {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Confirm a payment intent
 */
export async function confirmPaymentIntent(paymentIntentId: string) {
  return await stripe.paymentIntents.confirm(paymentIntentId);
}

/**
 * Cancel a payment intent
 */
export async function cancelPaymentIntent(paymentIntentId: string) {
  return await stripe.paymentIntents.cancel(paymentIntentId);
}

/**
 * Create a refund for a payment
 */
export async function createRefund(paymentIntentId: string, amount?: number) {
  return await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount, // If undefined, refunds the full amount
  });
}

/**
 * Create or get a Stripe customer
 */
export async function createOrGetCustomer(
  email: string,
  name: string,
  metadata?: Record<string, string>
): Promise<string> {
  // Search for existing customer
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0].id;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata,
  });

  return customer.id;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = ENV.stripeWebhookSecret || "";
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

export { stripe };
