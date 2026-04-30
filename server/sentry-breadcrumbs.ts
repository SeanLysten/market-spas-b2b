import * as Sentry from "@sentry/node";

/**
 * Sentry Breadcrumbs — Serveur (parcours commande)
 * 
 * Trace les étapes clés côté serveur pour faciliter le debug.
 */

export function trackOrderCreated(data: {
  orderId: number;
  orderNumber: string;
  userId: number;
  itemCount: number;
  totalHT: number;
  paymentMethod: string;
}) {
  Sentry.addBreadcrumb({
    category: "order.server",
    message: `Commande créée: ${data.orderNumber} (${data.itemCount} articles, ${data.totalHT}€ HT)`,
    data,
    level: "info",
  });
}

export function trackOrderPaymentInitiated(data: {
  orderNumber: string;
  provider: string;
  amount: number;
}) {
  Sentry.addBreadcrumb({
    category: "order.payment",
    message: `Paiement initié: ${data.provider} — ${data.amount}€ pour ${data.orderNumber}`,
    data,
    level: "info",
  });
}

export function trackOrderPaymentFailed(data: {
  orderNumber: string;
  provider: string;
  error: string;
}) {
  Sentry.addBreadcrumb({
    category: "order.payment",
    message: `Paiement échoué: ${data.provider} — ${data.error}`,
    data,
    level: "error",
  });
}

export function trackStockReserved(data: {
  orderNumber: string;
  productId: number;
  quantity: number;
}) {
  Sentry.addBreadcrumb({
    category: "order.stock",
    message: `Stock réservé: produit ${data.productId} x${data.quantity} pour ${data.orderNumber}`,
    data,
    level: "info",
  });
}

export function trackOrderStatusChanged(data: {
  orderNumber: string;
  oldStatus: string;
  newStatus: string;
  userId?: number;
}) {
  Sentry.addBreadcrumb({
    category: "order.lifecycle",
    message: `Statut commande ${data.orderNumber}: ${data.oldStatus} → ${data.newStatus}`,
    data,
    level: "info",
  });
}

export function trackLeadCreated(data: {
  leadId: number;
  source: string;
  hasEmail: boolean;
  hasPhone: boolean;
}) {
  Sentry.addBreadcrumb({
    category: "lead.server",
    message: `Lead créé: #${data.leadId} via ${data.source}`,
    data,
    level: "info",
  });
}
