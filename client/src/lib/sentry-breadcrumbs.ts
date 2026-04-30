import * as Sentry from "@sentry/react";

/**
 * Sentry Breadcrumbs — Parcours commande
 * 
 * Trace les étapes clés du parcours utilisateur pour faciliter le debug
 * en cas d'erreur lors d'une commande.
 */

// === CATALOGUE / PRODUIT ===

export function trackProductView(productId: number, productName: string) {
  Sentry.addBreadcrumb({
    category: "order.browse",
    message: `Consultation produit: ${productName}`,
    data: { productId, productName },
    level: "info",
  });
}

// === PANIER ===

export function trackAddToCart(productId: number, productName: string, quantity: number, variantId?: number) {
  Sentry.addBreadcrumb({
    category: "order.cart",
    message: `Ajout au panier: ${productName} x${quantity}`,
    data: { productId, productName, quantity, variantId },
    level: "info",
  });
}

export function trackRemoveFromCart(productId: number, productName: string) {
  Sentry.addBreadcrumb({
    category: "order.cart",
    message: `Retrait du panier: ${productName}`,
    data: { productId, productName },
    level: "info",
  });
}

export function trackUpdateCartQuantity(productId: number, quantity: number) {
  Sentry.addBreadcrumb({
    category: "order.cart",
    message: `Mise à jour quantité: produit ${productId} → ${quantity}`,
    data: { productId, quantity },
    level: "info",
  });
}

export function trackCartExpired() {
  Sentry.addBreadcrumb({
    category: "order.cart",
    message: "Réservation panier expirée — produits remis en stock",
    level: "warning",
  });
}

// === CHECKOUT ===

export function trackCheckoutStarted(itemCount: number, totalHT: number) {
  Sentry.addBreadcrumb({
    category: "order.checkout",
    message: `Checkout démarré: ${itemCount} articles, ${totalHT}€ HT`,
    data: { itemCount, totalHT },
    level: "info",
  });
}

export function trackCheckoutValidation(field: string, error: string) {
  Sentry.addBreadcrumb({
    category: "order.checkout",
    message: `Erreur validation checkout: ${field} — ${error}`,
    data: { field, error },
    level: "warning",
  });
}

export function trackOrderSubmitted(orderData: { paymentMethod: string; deliveryCity?: string }) {
  Sentry.addBreadcrumb({
    category: "order.checkout",
    message: `Commande soumise (${orderData.paymentMethod})`,
    data: orderData,
    level: "info",
  });
}

// === PAIEMENT ===

export function trackPaymentRedirect(provider: string, orderNumber: string) {
  Sentry.addBreadcrumb({
    category: "order.payment",
    message: `Redirection paiement ${provider} — commande ${orderNumber}`,
    data: { provider, orderNumber },
    level: "info",
  });
}

export function trackOrderSuccess(orderNumber: string) {
  Sentry.addBreadcrumb({
    category: "order.payment",
    message: `Commande confirmée: ${orderNumber}`,
    data: { orderNumber },
    level: "info",
  });
}

export function trackOrderError(errorMessage: string) {
  Sentry.addBreadcrumb({
    category: "order.payment",
    message: `Erreur commande: ${errorMessage}`,
    data: { errorMessage },
    level: "error",
  });
}
