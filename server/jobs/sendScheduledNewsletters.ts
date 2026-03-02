import * as db from "../db";

const INTERVAL_MS = 60_000; // Check every minute

async function processScheduledNewsletters() {
  try {
    const pending = await db.getPendingScheduledNewsletters();
    if (pending.length === 0) return;

    const { sendNewsletterEmail } = await import("../email");

    for (const nl of pending) {
      try {
        // Get recipients
        let recipientEmails: string[] = [];
        const allUsers = await db.getAllUsers();

        if (nl.recipients === "ALL") {
          recipientEmails = allUsers.filter((u: any) => u.isActive && u.email).map((u: any) => u.email);
        } else if (nl.recipients === "PARTNERS_ONLY") {
          recipientEmails = allUsers
            .filter((u: any) => u.isActive && u.email && u.role === "PARTNER")
            .map((u: any) => u.email);
        } else if (nl.recipients === "ADMINS_ONLY") {
          recipientEmails = allUsers
            .filter((u: any) => u.isActive && u.email && (u.role === "ADMIN" || u.role === "SUPER_ADMIN"))
            .map((u: any) => u.email);
        }

        if (recipientEmails.length === 0) {
          await db.updateScheduledNewsletterStatus(nl.id, "FAILED", {
            errorMessage: "Aucun destinataire trouvé",
          });
          continue;
        }

        const result = await sendNewsletterEmail(
          recipientEmails,
          nl.subject,
          nl.htmlContent
        );

        const successCount = result.results.filter((r: any) => r.success).length;
        const failureCount = result.results.filter((r: any) => !r.success).length;

        await db.updateScheduledNewsletterStatus(nl.id, "SENT", {
          sentAt: new Date(),
          totalRecipients: recipientEmails.length,
          successCount,
          failureCount,
        });

        console.log(
          `[Newsletter Cron] Sent newsletter #${nl.id} "${nl.subject}" to ${successCount}/${recipientEmails.length} recipients`
        );
      } catch (err: any) {
        console.error(`[Newsletter Cron] Failed to send newsletter #${nl.id}:`, err);
        await db.updateScheduledNewsletterStatus(nl.id, "FAILED", {
          errorMessage: err.message || "Erreur inconnue",
        });
      }
    }
  } catch (err) {
    console.error("[Newsletter Cron] Error checking scheduled newsletters:", err);
  }
}

export function startScheduledNewsletterJob() {
  console.log("[Newsletter Cron] Started - checking every 60s");
  setInterval(processScheduledNewsletters, INTERVAL_MS);
  // Also run once immediately
  processScheduledNewsletters();
}
