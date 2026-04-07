import { createMollieClient, PaymentMethod } from "@mollie/api-client";

/**
 * Get the Mollie client using the appropriate API key (live or test)
 */
export function getMollieClient() {
  const apiKey = process.env.MOLLIE_API_KEY_LIVE || process.env.MOLLIE_API_KEY_TEST;
  if (!apiKey) {
    throw new Error("No Mollie API key configured. Set MOLLIE_API_KEY_LIVE or MOLLIE_API_KEY_TEST.");
  }
  return createMollieClient({ apiKey });
}

/**
 * Check if we're in test mode
 */
export function isMollieTestMode(): boolean {
  return !process.env.MOLLIE_API_KEY_LIVE;
}

interface CreateMolliePaymentInput {
  amount: number; // in EUR (e.g. 300.00)
  description: string;
  redirectUrl: string;
  webhookUrl: string;
  metadata: Record<string, string>;
  method?: string;
}

/**
 * Create a Mollie payment (defaults to bank transfer / SEPA)
 */
export async function createMolliePayment(input: CreateMolliePaymentInput) {
  const mollieClient = getMollieClient();

  // Calculate dueDate: 3 days from now for payment expiration
  // Mollie requires YYYY-MM-DD format, minimum is tomorrow, max 100 days
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 3);
  const dueDateStr = dueDate.toISOString().split("T")[0];

  const payment = await mollieClient.payments.create({
    amount: {
      currency: "EUR",
      value: input.amount.toFixed(2),
    },
    description: input.description,
    redirectUrl: input.redirectUrl,
    webhookUrl: input.webhookUrl,
    metadata: input.metadata,
    method: PaymentMethod.banktransfer,
    dueDate: dueDateStr,
  } as any);

  console.log(`[Mollie] Payment created: ${payment.id} - Status: ${payment.status} - Amount: ${input.amount.toFixed(2)} EUR`);

  return {
    id: payment.id,
    status: payment.status,
    checkoutUrl: payment.getCheckoutUrl(),
    // Bank transfer details (available after creation for banktransfer method)
    details: (payment as any).details || null,
    expiresAt: (payment as any).expiresAt || null,
  };
}

/**
 * Get a Mollie payment by ID
 */
export async function getMolliePaymentById(paymentId: string) {
  const mollieClient = getMollieClient();
  const payment = await mollieClient.payments.get(paymentId);

  return {
    id: payment.id,
    status: payment.status,
    amount: payment.amount,
    description: payment.description,
    metadata: payment.metadata,
    method: payment.method,
    details: (payment as any).details || null,
    paidAt: (payment as any).paidAt || null,
    expiresAt: (payment as any).expiresAt || null,
    cancelledAt: (payment as any).cancelledAt || null,
    failedAt: (payment as any).failedAt || null,
  };
}

/**
 * Mollie payment status constants
 */
export const MOLLIE_STATUS = {
  OPEN: "open",           // Payment created, waiting for customer action
  PENDING: "pending",     // Bank transfer initiated, waiting for funds
  PAID: "paid",           // Payment confirmed
  FAILED: "failed",       // Payment failed
  CANCELLED: "canceled",  // Payment cancelled
  EXPIRED: "expired",     // Payment expired
} as const;
