/**
 * Centralized Notification Service
 * 
 * All persistent notifications (stored in DB) should go through this service.
 * This ensures consistency and avoids scattered notification logic.
 */
import { getDb } from "./db";
import { notifications, users, orders, partners } from "../drizzle/schema";
import { eq, and, or } from "drizzle-orm";

// ============================================
// CORE: Create a notification in the database
// ============================================

type NotificationType =
  | "ORDER_CREATED"
  | "ORDER_STATUS_CHANGED"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_FAILED"
  | "INVOICE_READY"
  | "STOCK_LOW"
  | "NEW_PARTNER"
  | "PARTNER_APPROVED"
  | "PARTNER_SUSPENDED"
  | "NEW_RESOURCE"
  | "SAV_CREATED"
  | "SAV_STATUS_CHANGED"
  | "LEAD_ASSIGNED"
  | "DEPOSIT_REMINDER"
  | "REFUND_PROCESSED"
  | "SYSTEM_ALERT";

interface CreateNotificationInput {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  linkText?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  const db = await getDb();
  if (!db) {
    console.error("[Notifications] Database not available");
    return;
  }

  try {
    await db.insert(notifications).values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      linkUrl: input.linkUrl || null,
      linkText: input.linkText || null,
      isRead: false,
    });
    console.log(`[Notifications] Created ${input.type} for user ${input.userId}: ${input.title}`);
  } catch (error) {
    console.error(`[Notifications] Failed to create notification:`, error);
  }
}

// ============================================
// HELPERS: Get users by partner ID / Get all admins
// ============================================

async function getPartnerUserIds(partnerId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.partnerId, partnerId), eq(users.isActive, true)));
  return result.map((r) => r.id);
}

async function getAdminUserIds(): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.isActive, true),
        or(eq(users.role, "SUPER_ADMIN"), eq(users.role, "ADMIN"))
      )
    );
  return result.map((r) => r.id);
}

async function getOrderInfo(orderId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      partnerId: orders.partnerId,
      totalTTC: orders.totalTTC,
      status: orders.status,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  return result[0] || null;
}

async function getPartnerInfo(partnerId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({
      id: partners.id,
      companyName: partners.companyName,
    })
    .from(partners)
    .where(eq(partners.id, partnerId))
    .limit(1);
  return result[0] || null;
}

// ============================================
// ORDER NOTIFICATIONS
// ============================================

/** Notify admins when a new order is created */
export async function notifyNewOrderCreated(orderId: number) {
  const order = await getOrderInfo(orderId);
  if (!order) return;
  const partner = await getPartnerInfo(order.partnerId);
  const partnerName = partner?.companyName || "Partenaire inconnu";

  const adminIds = await getAdminUserIds();
  for (const adminId of adminIds) {
    await createNotification({
      userId: adminId,
      type: "ORDER_CREATED",
      title: "Nouvelle commande",
      message: `Commande #${order.orderNumber} de ${partnerName} — ${order.totalTTC} € TTC.`,
      linkUrl: `/admin/orders/${orderId}`,
      linkText: "Voir la commande",
    });
  }
}

/** Notify partner users when their order status changes */
export async function notifyOrderStatusChanged(
  orderId: number,
  oldStatus: string,
  newStatus: string
) {
  const order = await getOrderInfo(orderId);
  if (!order) return;

  const statusLabels: Record<string, string> = {
    PENDING_APPROVAL: "En attente d'approbation",
    PENDING_DEPOSIT: "Acompte requis",
    DEPOSIT_PAID: "Acompte payé",
    IN_PRODUCTION: "En production",
    READY_TO_SHIP: "Prêt à expédier",
    SHIPPED: "Expédié",
    DELIVERED: "Livré",
    COMPLETED: "Terminé",
    CANCELLED: "Annulé",
    PAID: "Payé",
  };

  const newLabel = statusLabels[newStatus] || newStatus;
  const partnerUserIds = await getPartnerUserIds(order.partnerId);

  for (const userId of partnerUserIds) {
    await createNotification({
      userId,
      type: "ORDER_STATUS_CHANGED",
      title: `Commande #${order.orderNumber} — ${newLabel}`,
      message: `Le statut de votre commande est passé à "${newLabel}".`,
      linkUrl: `/orders/${orderId}`,
      linkText: "Suivre la commande",
    });
  }
}

// ============================================
// PAYMENT NOTIFICATIONS
// ============================================

/** Notify partner when payment succeeds */
export async function notifyPaymentReceived(
  orderId: number,
  amount: number,
  paymentMethod: string
) {
  const order = await getOrderInfo(orderId);
  if (!order) return;

  const partnerUserIds = await getPartnerUserIds(order.partnerId);
  for (const userId of partnerUserIds) {
    await createNotification({
      userId,
      type: "PAYMENT_RECEIVED",
      title: `Paiement reçu — ${amount.toFixed(2)} €`,
      message: `Votre paiement de ${amount.toFixed(2)} € pour la commande #${order.orderNumber} a été confirmé (${paymentMethod}).`,
      linkUrl: `/orders/${orderId}`,
      linkText: "Voir la commande",
    });
  }

  // Also notify admins
  const partner = await getPartnerInfo(order.partnerId);
  const partnerName = partner?.companyName || "Partenaire";
  const adminIds = await getAdminUserIds();
  for (const adminId of adminIds) {
    await createNotification({
      userId: adminId,
      type: "PAYMENT_RECEIVED",
      title: `Paiement reçu — #${order.orderNumber}`,
      message: `${partnerName} a payé ${amount.toFixed(2)} € pour la commande #${order.orderNumber}.`,
      linkUrl: `/admin/orders/${orderId}`,
      linkText: "Voir la commande",
    });
  }
}

/** Notify partner when payment fails */
export async function notifyPaymentFailed(
  orderId: number,
  amount: number,
  reason: string
) {
  const order = await getOrderInfo(orderId);
  if (!order) return;

  const partnerUserIds = await getPartnerUserIds(order.partnerId);
  for (const userId of partnerUserIds) {
    await createNotification({
      userId,
      type: "PAYMENT_FAILED",
      title: `Échec de paiement — #${order.orderNumber}`,
      message: `Le paiement de ${amount.toFixed(2)} € pour la commande #${order.orderNumber} a échoué : ${reason}.`,
      linkUrl: `/orders/${orderId}`,
      linkText: "Réessayer le paiement",
    });
  }
}

/** Notify partner when a refund is processed */
export async function notifyRefundProcessed(
  orderId: number,
  amount: number
) {
  const order = await getOrderInfo(orderId);
  if (!order) return;

  const partnerUserIds = await getPartnerUserIds(order.partnerId);
  for (const userId of partnerUserIds) {
    await createNotification({
      userId,
      type: "REFUND_PROCESSED",
      title: `Remboursement — ${amount.toFixed(2)} €`,
      message: `Un remboursement de ${amount.toFixed(2)} € a été effectué pour la commande #${order.orderNumber}.`,
      linkUrl: `/orders/${orderId}`,
      linkText: "Voir la commande",
    });
  }

  // Also notify admins
  const adminIds = await getAdminUserIds();
  const partner = await getPartnerInfo(order.partnerId);
  const partnerName = partner?.companyName || "Partenaire";
  for (const adminId of adminIds) {
    await createNotification({
      userId: adminId,
      type: "REFUND_PROCESSED",
      title: `Remboursement effectué — #${order.orderNumber}`,
      message: `Remboursement de ${amount.toFixed(2)} € pour ${partnerName}, commande #${order.orderNumber}.`,
      linkUrl: `/admin/orders/${orderId}`,
    });
  }
}

/** Notify partner about unpaid deposit reminder */
export async function notifyDepositReminder(
  orderId: number,
  orderNumber: string,
  partnerId: number
) {
  const partnerUserIds = await getPartnerUserIds(partnerId);
  for (const userId of partnerUserIds) {
    await createNotification({
      userId,
      type: "DEPOSIT_REMINDER",
      title: `Rappel d'acompte — #${orderNumber}`,
      message: `L'acompte pour votre commande #${orderNumber} est en attente. Veuillez procéder au paiement pour confirmer votre commande.`,
      linkUrl: `/orders/${orderId}`,
      linkText: "Payer l'acompte",
    });
  }
}

// ============================================
// PARTNER NOTIFICATIONS
// ============================================

/** Notify admins when a new partner registers */
export async function notifyNewPartnerRegistered(partnerId: number, companyName: string) {
  const adminIds = await getAdminUserIds();
  for (const adminId of adminIds) {
    await createNotification({
      userId: adminId,
      type: "NEW_PARTNER",
      title: "Nouveau partenaire inscrit",
      message: `${companyName} vient de s'inscrire et attend votre approbation.`,
      linkUrl: `/admin/partners/${partnerId}`,
      linkText: "Voir le partenaire",
    });
  }
}

/** Notify partner users when their account is approved */
export async function notifyPartnerApproved(partnerId: number) {
  const partner = await getPartnerInfo(partnerId);
  const partnerUserIds = await getPartnerUserIds(partnerId);

  for (const userId of partnerUserIds) {
    await createNotification({
      userId,
      type: "PARTNER_APPROVED",
      title: "Compte approuvé",
      message: `Votre compte partenaire ${partner?.companyName || ""} a été approuvé. Vous avez maintenant accès au catalogue et pouvez passer des commandes.`,
      linkUrl: "/catalog",
      linkText: "Voir le catalogue",
    });
  }
}

/** Notify partner users when their account is suspended */
export async function notifyPartnerSuspended(partnerId: number, reason?: string) {
  const partner = await getPartnerInfo(partnerId);
  // Get ALL users (including those about to be deactivated)
  const db = await getDb();
  if (!db) return;
  const allUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.partnerId, partnerId));

  for (const user of allUsers) {
    await createNotification({
      userId: user.id,
      type: "PARTNER_SUSPENDED",
      title: "Compte suspendu",
      message: `Votre compte partenaire ${partner?.companyName || ""} a été suspendu.${reason ? ` Raison : ${reason}` : ""} Contactez-nous pour plus d'informations.`,
    });
  }
}

// ============================================
// SAV NOTIFICATIONS
// ============================================

/** Notify admins when a new SAV ticket is created */
export async function notifySavTicketCreated(
  ticketNumber: string,
  partnerId: number,
  urgency: string,
  description: string
) {
  const partner = await getPartnerInfo(partnerId);
  const partnerName = partner?.companyName || "Partenaire";
  const urgencyLabel = urgency === "CRITICAL" ? " [CRITIQUE]" : urgency === "URGENT" ? " [URGENT]" : "";

  const adminIds = await getAdminUserIds();
  for (const adminId of adminIds) {
    await createNotification({
      userId: adminId,
      type: "SAV_CREATED",
      title: `Nouveau ticket SAV${urgencyLabel} — ${ticketNumber}`,
      message: `${partnerName} a ouvert le ticket ${ticketNumber}. ${description.substring(0, 150)}${description.length > 150 ? "..." : ""}`,
      linkUrl: `/admin/sav`,
      linkText: "Voir le ticket",
    });
  }
}

/** Notify partner when SAV ticket status changes */
export async function notifySavStatusChanged(
  ticketNumber: string,
  partnerId: number,
  oldStatus: string,
  newStatus: string,
  resolutionNotes?: string
) {
  const statusLabels: Record<string, string> = {
    NEW: "Nouveau",
    ANALYZING: "En analyse",
    INFO_REQUIRED: "Informations requises",
    QUOTE_PENDING: "Devis en attente",
    PAYMENT_PENDING: "Paiement en attente",
    PAYMENT_CONFIRMED: "Paiement confirmé",
    PARTS_ORDERED: "Pièces commandées",
    SHIPPED: "Expédié",
    RESOLVED: "Résolu",
    CLOSED: "Clôturé",
  };

  const newLabel = statusLabels[newStatus] || newStatus;
  const partnerUserIds = await getPartnerUserIds(partnerId);

  for (const userId of partnerUserIds) {
    await createNotification({
      userId,
      type: "SAV_STATUS_CHANGED",
      title: `Ticket SAV ${ticketNumber} — ${newLabel}`,
      message: `Le statut de votre ticket ${ticketNumber} est passé à "${newLabel}".${resolutionNotes ? ` Notes : ${resolutionNotes.substring(0, 100)}` : ""}`,
      linkUrl: `/sav`,
      linkText: "Voir le ticket",
    });
  }
}

// ============================================
// RESOURCE NOTIFICATIONS
// ============================================

/** Notify all active partner users when a new resource is published */
export async function notifyNewResourcePublished(
  resourceTitle: string,
  resourceCategory: string
) {
  const db = await getDb();
  if (!db) return;

  // Get all active partner users
  const activePartnerUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.isActive, true),
        or(eq(users.role, "PARTNER_ADMIN"), eq(users.role, "PARTNER_USER"))
      )
    );

  const categoryLabels: Record<string, string> = {
    PLV: "PLV",
    CATALOG: "Catalogue",
    TECHNICAL: "Documentation technique",
    MARKETING: "Marketing",
    TRAINING: "Formation",
    OTHER: "Autre",
  };

  const catLabel = categoryLabels[resourceCategory] || resourceCategory;

  for (const user of activePartnerUsers) {
    await createNotification({
      userId: user.id,
      type: "NEW_RESOURCE",
      title: `Nouvelle ressource : ${resourceTitle}`,
      message: `Une nouvelle ressource "${resourceTitle}" (${catLabel}) est disponible dans l'espace ressources.`,
      linkUrl: "/resources",
      linkText: "Voir les ressources",
    });
  }
}
