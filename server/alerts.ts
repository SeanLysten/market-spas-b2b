import * as db from "./db";
import { notifyOwner } from "./_core/notification";
import { ENV } from "./_core/env";
import { notifyPartner, notifyAdmins } from "./_core/websocket";
import { sendNewOrderNotificationToAdmins, sendOrderStatusChangeToPartner, sendDepositReminderEmail } from "./email";
import { notifyOrderStatusChanged, notifyNewOrderCreated, notifyDepositReminder } from "./notification-service";

/**
 * Check for low stock products and send alerts
 */
export async function checkLowStockAlerts() {
  try {
    const products = await db.getAllProducts({ limit: 1000 });
    const lowStockProducts = products.filter((p: any) => {
      const stock = p.stockQuantity || 0;
      const threshold = p.lowStockThreshold || 5;
      return stock > 0 && stock <= threshold;
    });

    if (lowStockProducts.length > 0) {
      const productList = lowStockProducts
        .map((p: any) => `- ${p.name} (${p.sku}): ${p.stockQuantity} en stock`)
        .join("\n");

      await notifyOwner({
        title: `⚠️ Alerte Stock Bas (${lowStockProducts.length} produits)`,
        content: `Les produits suivants ont un stock bas :\n\n${productList}\n\nAction recommandée : Vérifier les arrivages prévus ou passer commande.`,
      });

      console.log(`[Alerts] Low stock alert sent for ${lowStockProducts.length} products`);
      return { success: true, count: lowStockProducts.length };
    }

    return { success: true, count: 0 };
  } catch (error) {
    console.error("[Alerts] Error checking low stock:", error);
    return { success: false, error };
  }
}

/**
 * Check for pending partners and send alert
 */
export async function checkPendingPartnersAlert() {
  try {
    const partners = await db.getAllPartners({ status: "PENDING" });

    if (partners.length > 0) {
      const partnerList = partners
        .map((p: any) => `- ${p.companyName} (${p.primaryContactEmail})`)
        .join("\n");

      await notifyOwner({
        title: `🔔 Nouveaux Partenaires en Attente (${partners.length})`,
        content: `Les partenaires suivants attendent validation :\n\n${partnerList}\n\nAction recommandée : Vérifier et approuver dans l'admin.`,
      });

      console.log(`[Alerts] Pending partners alert sent for ${partners.length} partners`);
      return { success: true, count: partners.length };
    }

    return { success: true, count: 0 };
  } catch (error) {
    console.error("[Alerts] Error checking pending partners:", error);
    return { success: false, error };
  }
}

/**
 * Send order status change notification
 */
export async function notifyOrderStatusChange(
  orderId: number,
  oldStatus: string,
  newStatus: string,
  changedByUserId?: number,
  options?: { skipHistory?: boolean }
) {
  try {
    const order = await db.getOrderById(orderId);
    if (!order) {
      console.error(`[Alerts] Order ${orderId} not found`);
      return { success: false };
    }

    // Get partner info
    const partner = await db.getPartnerById(order.partnerId);
    if (!partner) {
      console.error(`[Alerts] Partner ${order.partnerId} not found`);
      return { success: false };
    }

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
    };

    // 1. Record status change in order_status_history (skip if already recorded by caller)
    if (!options?.skipHistory) {
      try {
        const { getDb } = await import("./db");
        const { orderStatusHistory } = await import("../drizzle/schema");
        const drizzleDb = await getDb();
        await drizzleDb.insert(orderStatusHistory).values({
          orderId,
          oldStatus,
          newStatus,
          changedByUserId: changedByUserId || null,
          trackingNumber: order.trackingNumber || null,
          trackingCarrier: order.shippingCarrier || null,
          trackingUrl: order.trackingUrl || null,
        });
        console.log(`[Alerts] Status history recorded for order ${orderId}: ${oldStatus} → ${newStatus}`);
      } catch (err) {
        console.error("[Alerts] Failed to record status history:", err);
      }
    }

    await notifyOwner({
      title: `📦 Commande ${order.orderNumber} - Changement de statut`,
      content: `Partenaire: ${partner.companyName}\nStatut: ${statusLabels[oldStatus] || oldStatus} → ${statusLabels[newStatus] || newStatus}\nMontant: ${order.totalTTC} €\n\nConsulter la commande dans l'admin.`,
    });

    // 2. Send real-time WebSocket notification to partner
    try {
      notifyPartner(order.partnerId, "order:status_changed", {
        orderId: order.id,
        orderNumber: order.orderNumber,
        oldStatus,
        newStatus,
      });
    } catch (err) {
      console.error("[Alerts] Failed to send WebSocket notification:", err);
    }

    // 3. Send email notification to partner
    try {
      const partnerEmail = partner.primaryContactEmail;
      if (partnerEmail) {
        const portalUrl = ENV.siteUrl;
        const emailResult = await sendOrderStatusChangeToPartner(partnerEmail, {
          orderNumber: order.orderNumber,
          partnerName: partner.companyName,
          contactName: partner.primaryContactName || partner.companyName,
          oldStatus,
          newStatus,
          totalTTC: order.totalTTC,
          portalUrl,
        });
        console.log(`[Alerts] Email notification sent to partner ${partnerEmail}:`, emailResult);
      } else {
        console.log("[Alerts] No partner email found for notification");
      }
    } catch (err) {
      console.error("[Alerts] Failed to send email notification to partner:", err);
    }

    // 4. Persistent DB notification for partner
    try {
      await notifyOrderStatusChanged(orderId, oldStatus, newStatus);
    } catch (err) {
      console.error("[Alerts] Failed to create persistent notification:", err);
    }

    // 5. Send push notifications to all partner users' mobile devices
    try {
      const { sendOrderStatusPush } = await import("./push-notifications");
      const { getDb } = await import("./db");
      const { users } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const drizzleDb = await getDb();

      // Get all active users of this partner
      const partnerUsers = await drizzleDb
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.partnerId, order.partnerId),
            eq(users.isActive, true)
          )
        );

      // Send push to each user
      for (const pu of partnerUsers) {
        await sendOrderStatusPush(pu.id, order.orderNumber, newStatus);
      }
      console.log(`[Alerts] Push notifications sent to ${partnerUsers.length} partner users for order ${orderId}`);
    } catch (err) {
      console.error("[Alerts] Failed to send push notifications:", err);
    }

    console.log(`[Alerts] Order status change notification sent for order ${orderId}`);
    return { success: true };
  } catch (error) {
    console.error("[Alerts] Error sending order status notification:", error);
    return { success: false, error };
  }
}

/**
 * Send new order notification
 */
export async function notifyNewOrder(orderId: number) {
  try {
    const order = await db.getOrderById(orderId);
    if (!order) {
      console.error(`[Alerts] Order ${orderId} not found`);
      return { success: false };
    }

    const partner = await db.getPartnerById(order.partnerId);
    if (!partner) {
      console.error(`[Alerts] Partner ${order.partnerId} not found`);
      return { success: false };
    }

    // Get order items for the email
    const orderWithItems = await db.getOrderWithItems(orderId);
    const items = orderWithItems?.items || [];

    await notifyOwner({
      title: `🎉 Nouvelle Commande ${order.orderNumber}`,
      content: `Partenaire: ${partner.companyName}\nMontant HT: ${order.subtotalHT} €\nMontant TTC: ${order.totalTTC} €\nStatut: En attente d'approbation\n\nConsulter la commande dans l'admin.`,
    });

    // Send real-time WebSocket notification to admins
    try {
      notifyAdmins("order:new", {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: parseFloat(order.totalTTC),
      });
    } catch (err) {
      console.error("[Alerts] Failed to send WebSocket notification:", err);
    }

    // Send email notification to all admins
    try {
      const adminEmails = await db.getAdminEmails();
      if (adminEmails.length > 0) {
        const portalUrl = ENV.siteUrl;
        const emailResult = await sendNewOrderNotificationToAdmins(adminEmails, {
          orderNumber: order.orderNumber,
          partnerName: partner.companyName,
          partnerEmail: partner.primaryContactEmail || '',
          items: items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            unitPriceHT: item.unitPriceHT,
            totalTTC: item.totalTTC,
          })),
          totalHT: order.totalHT,
          totalTTC: order.totalTTC,
          deliveryCity: order.deliveryCity || '',
          deliveryPostalCode: order.deliveryPostalCode || '',
          createdAt: order.createdAt,
          portalUrl,
        });
        console.log(`[Alerts] Email notifications sent to ${adminEmails.length} admins:`, emailResult);
      } else {
        console.log("[Alerts] No admin emails found for notification");
      }
    } catch (err) {
      console.error("[Alerts] Failed to send email notification:", err);
    }

    // Persistent DB notification for admins
    try {
      await notifyNewOrderCreated(orderId);
    } catch (err) {
      console.error("[Alerts] Failed to create persistent notification:", err);
    }

    console.log(`[Alerts] New order notification sent for order ${orderId}`);
    return { success: true };
  } catch (error) {
    console.error("[Alerts] Error sending new order notification:", error);
    return { success: false, error };
  }
}


/**
 * Process deposit reminders for orders pending deposit for more than 48 hours
 * This function should be called by a cron job
 */
export async function processDepositReminders(hoursThreshold: number = 48) {
  try {
    // Get orders pending deposit reminder
    const pendingOrders = await db.getOrdersPendingDepositReminder(hoursThreshold);
    
    if (pendingOrders.length === 0) {
      console.log("[Alerts] No orders pending deposit reminder");
      return { success: true, processed: 0, sent: 0 };
    }

    console.log(`[Alerts] Found ${pendingOrders.length} orders pending deposit reminder`);

    const portalUrl = process.env.SITE_URL || process.env.VITE_APP_URL || 'https://marketspas.pro';
    let sentCount = 0;
    const results: Array<{ orderId: number; orderNumber: string; success: boolean; error?: string }> = [];

    for (const order of pendingOrders) {
      try {
        // Get partner info
        const partner = await db.getPartnerById(order.partnerId);
        if (!partner) {
          console.error(`[Alerts] Partner ${order.partnerId} not found for order ${order.orderNumber}`);
          results.push({ orderId: order.id, orderNumber: order.orderNumber, success: false, error: "Partner not found" });
          continue;
        }

        const partnerEmail = partner.primaryContactEmail;
        if (!partnerEmail) {
          console.error(`[Alerts] No email for partner ${order.partnerId} (order ${order.orderNumber})`);
          results.push({ orderId: order.id, orderNumber: order.orderNumber, success: false, error: "No partner email" });
          continue;
        }

        // Send reminder email
        const emailResult = await sendDepositReminderEmail(partnerEmail, {
          orderNumber: order.orderNumber,
          partnerName: partner.companyName,
          contactName: partner.primaryContactName || partner.companyName,
          depositAmount: order.depositAmount,
          totalTTC: order.totalTTC,
          orderDate: order.createdAt,
          portalUrl,
          hoursOverdue: order.hoursOverdue,
        });

        if (emailResult.success) {
          // Mark reminder as sent
          await db.markDepositReminderSent(order.id);
          sentCount++;
          results.push({ orderId: order.id, orderNumber: order.orderNumber, success: true });
          console.log(`[Alerts] Deposit reminder sent for order ${order.orderNumber} to ${partnerEmail}`);

          // Persistent DB notification for partner
          try {
            await notifyDepositReminder(order.id, order.orderNumber, order.partnerId);
          } catch (err) {
            console.error("[Alerts] Failed to create deposit reminder notification:", err);
          }
        } else {
          results.push({ orderId: order.id, orderNumber: order.orderNumber, success: false, error: emailResult.error });
          console.error(`[Alerts] Failed to send deposit reminder for order ${order.orderNumber}:`, emailResult.error);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        results.push({ orderId: order.id, orderNumber: order.orderNumber, success: false, error: errorMsg });
        console.error(`[Alerts] Error processing deposit reminder for order ${order.orderNumber}:`, err);
      }
    }

    // Notify owner about reminders sent
    if (sentCount > 0) {
      await notifyOwner({
        title: `💳 Rappels d'acompte envoyés (${sentCount})`,
        content: `${sentCount} rappel(s) d'acompte ont été envoyés aux partenaires pour des commandes en attente depuis plus de ${hoursThreshold} heures.`,
      });
    }

    console.log(`[Alerts] Deposit reminders processed: ${sentCount}/${pendingOrders.length} sent`);
    return { success: true, processed: pendingOrders.length, sent: sentCount, results };
  } catch (error) {
    console.error("[Alerts] Error processing deposit reminders:", error);
    return { success: false, error };
  }
}
