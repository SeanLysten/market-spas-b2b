/**
 * Push Notifications Service
 * 
 * Uses Expo Push Notification service which handles both FCM (Android) and APNs (iOS).
 * This avoids needing separate Firebase/APNs configurations.
 * 
 * The mobile app (React Native/Expo) registers its push token via:
 *   POST /api/mobile/push/register { pushToken, platform, deviceId, deviceName }
 * 
 * This service sends notifications to those registered tokens.
 */

import type { DevicePushToken } from "../drizzle/schema";

// ============================================
// TYPES
// ============================================
interface PushMessage {
  to: string; // Expo push token
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
  priority?: "default" | "normal" | "high";
  categoryId?: string;
}

interface PushTicket {
  id?: string;
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
}

// ============================================
// EXPO PUSH API
// ============================================
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

async function sendExpoPushNotifications(messages: PushMessage[]): Promise<PushTicket[]> {
  if (messages.length === 0) return [];

  // Expo accepts batches of up to 100 messages
  const batches: PushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    batches.push(messages.slice(i, i + 100));
  }

  const allTickets: PushTicket[] = [];

  for (const batch of batches) {
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      });

      const result = await response.json() as { data: PushTicket[] };
      allTickets.push(...(result.data || []));
    } catch (err) {
      console.error("[Push] Expo API error:", err);
      // Add error tickets for this batch
      allTickets.push(...batch.map(() => ({
        status: "error" as const,
        message: "Failed to send to Expo API",
      })));
    }
  }

  return allTickets;
}

// ============================================
// HIGH-LEVEL HELPERS
// ============================================

/**
 * Send a push notification to a specific user (all their devices)
 */
export async function sendPushToUser(
  userId: number,
  notification: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
    sound?: "default" | null;
    badge?: number;
    channelId?: string;
  }
): Promise<{ sent: number; failed: number }> {
  const { getDb } = await import("./db");
  const { devicePushTokens } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  const drizzleDb = await getDb();
  const tokens = await drizzleDb
    .select()
    .from(devicePushTokens)
    .where(
      and(
        eq(devicePushTokens.userId, userId),
        eq(devicePushTokens.isActive, true)
      )
    );

  if (tokens.length === 0) {
    console.log(`[Push] No active tokens for user #${userId}`);
    return { sent: 0, failed: 0 };
  }

  const messages: PushMessage[] = tokens.map((t) => ({
    to: t.pushToken,
    title: notification.title,
    body: notification.body,
    data: notification.data,
    sound: notification.sound ?? "default",
    badge: notification.badge,
    channelId: notification.channelId,
    priority: "high" as const,
  }));

  const tickets = await sendExpoPushNotifications(messages);

  let sent = 0;
  let failed = 0;
  const tokensToDeactivate: number[] = [];

  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    if (ticket.status === "ok") {
      sent++;
    } else {
      failed++;
      // If token is invalid, mark it as inactive
      if (
        ticket.details?.error === "DeviceNotRegistered" ||
        ticket.details?.error === "InvalidCredentials"
      ) {
        tokensToDeactivate.push(tokens[i].id);
      }
    }
  }

  // Deactivate invalid tokens
  if (tokensToDeactivate.length > 0) {
    const { inArray } = await import("drizzle-orm");
    await drizzleDb
      .update(devicePushTokens)
      .set({ isActive: false })
      .where(inArray(devicePushTokens.id, tokensToDeactivate));
    console.log(`[Push] Deactivated ${tokensToDeactivate.length} invalid tokens`);
  }

  console.log(`[Push] User #${userId}: ${sent} sent, ${failed} failed`);
  return { sent, failed };
}

/**
 * Send a push notification to multiple users
 */
export async function sendPushToUsers(
  userIds: number[],
  notification: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
    sound?: "default" | null;
    channelId?: string;
  }
): Promise<{ totalSent: number; totalFailed: number }> {
  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const result = await sendPushToUser(userId, notification);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return { totalSent, totalFailed };
}

/**
 * Send a push notification to all admins
 */
export async function sendPushToAdmins(
  notification: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }
): Promise<void> {
  const { getDb } = await import("./db");
  const { users, devicePushTokens } = await import("../drizzle/schema");
  const { eq, and, inArray } = await import("drizzle-orm");

  const drizzleDb = await getDb();

  // Get all admin user IDs
  const adminUsers = await drizzleDb
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.isActive, true),
        inArray(users.role, ["SUPER_ADMIN", "ADMIN"])
      )
    );

  if (adminUsers.length === 0) return;

  await sendPushToUsers(
    adminUsers.map((u) => u.id),
    notification
  );
}

/**
 * Send push notification for order status change
 */
export async function sendOrderStatusPush(
  userId: number,
  orderNumber: string,
  newStatus: string
): Promise<void> {
  const statusLabels: Record<string, string> = {
    PENDING_APPROVAL: "En attente de validation",
    PENDING_DEPOSIT: "En attente d'acompte",
    DEPOSIT_PAID: "Acompte reçu",
    IN_PRODUCTION: "En production",
    READY_TO_SHIP: "Prêt à expédier",
    SHIPPED: "Expédié",
    DELIVERED: "Livré",
    COMPLETED: "Terminée",
    CANCELLED: "Annulée",
  };

  const statusLabel = statusLabels[newStatus] || newStatus;

  await sendPushToUser(userId, {
    title: `Commande ${orderNumber}`,
    body: `Statut mis à jour : ${statusLabel}`,
    data: {
      type: "order_status",
      orderNumber,
      status: newStatus,
      screen: "OrderDetail",
    },
    channelId: "orders",
  });
}

/**
 * Send push notification for new resource uploaded
 */
export async function sendNewResourcePush(
  userIds: number[],
  resourceTitle: string,
  folderName?: string
): Promise<void> {
  await sendPushToUsers(userIds, {
    title: "Nouvelle ressource disponible",
    body: folderName
      ? `${resourceTitle} ajouté dans ${folderName}`
      : `${resourceTitle} est maintenant disponible`,
    data: {
      type: "new_resource",
      screen: "Resources",
    },
    channelId: "resources",
  });
}

/**
 * Send push notification for new message/notification
 */
export async function sendNotificationPush(
  userId: number,
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<void> {
  await sendPushToUser(userId, {
    title,
    body: message,
    data: {
      type: "notification",
      ...data,
    },
    channelId: "general",
  });
}
