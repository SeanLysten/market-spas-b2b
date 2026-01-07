import * as db from "./db";
import { notifyOwner } from "./_core/notification";
import { notifyPartner, notifyAdmins } from "./_core/websocket";

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
  newStatus: string
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

    await notifyOwner({
      title: `📦 Commande ${order.orderNumber} - Changement de statut`,
      content: `Partenaire: ${partner.companyName}\nStatut: ${statusLabels[oldStatus] || oldStatus} → ${statusLabels[newStatus] || newStatus}\nMontant: ${order.totalTTC} €\n\nConsulter la commande dans l'admin.`,
    });

    // Send real-time WebSocket notification to partner
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

    console.log(`[Alerts] New order notification sent for order ${orderId}`);
    return { success: true };
  } catch (error) {
    console.error("[Alerts] Error sending new order notification:", error);
    return { success: false, error };
  }
}
