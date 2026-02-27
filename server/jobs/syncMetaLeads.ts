import * as metaOAuth from "../meta-oauth";
import { getConnectedMetaAdAccounts } from "../db";
import { resolveCountry } from "../meta-leads";
import { findBestPartnerForLead } from "../lead-routing";
import mysql2 from "mysql2/promise";

let isSyncing = false;

/**
 * Synchronise les leads Meta depuis les formulaires Lead Ads
 * Récupère uniquement les leads plus récents que le dernier lead connu
 * Corrige le pays via préfixe téléphonique et réponse formulaire
 */
export async function runMetaLeadsSync() {
  if (isSyncing) {
    console.log("[MetaLeadsSync] Sync déjà en cours, on passe");
    return { imported: 0, skipped: 0 };
  }

  isSyncing = true;
  try {
    // Vérifier qu'un compte Meta est connecté
    const accounts = await getConnectedMetaAdAccounts();
    if (!accounts || accounts.length === 0) {
      return { imported: 0, skipped: 0 };
    }

    const targetAccount = accounts[0];

    // Valider le token
    const isValid = await metaOAuth.validateToken(targetAccount.accessToken);
    if (!isValid) {
      console.warn("[MetaLeadsSync] Token Meta expiré - reconnectez votre compte dans /admin/leads");
      return { imported: 0, skipped: 0 };
    }

    // Récupérer les formulaires Lead Ads
    const forms = await metaOAuth.getLeadForms(targetAccount.accessToken);
    if (!forms || forms.length === 0) {
      return { imported: 0, skipped: 0 };
    }

    // Date de départ : dernier lead Meta connu - 5 minutes (pour éviter les ratages)
    const conn = await mysql2.createConnection(process.env.DATABASE_URL!);
    const [lastLeadRows] = await conn.execute(
      'SELECT MAX(receivedAt) as lastDate FROM leads WHERE source = "META_ADS"'
    ) as any;

    const lastLeadDate = lastLeadRows[0]?.lastDate
      ? new Date(new Date(lastLeadRows[0].lastDate).getTime() - 5 * 60 * 1000)
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // Par défaut : 24h en arrière

    let imported = 0;
    let skipped = 0;

    for (const form of forms) {
      const formLeads = await metaOAuth.getLeadsFromForm(form.id, form.pageToken, lastLeadDate);

      for (const leadData of formLeads) {
        // Anti-doublon : vérifier si le lead existe déjà par metaLeadgenId
        const [existing] = await conn.execute(
          'SELECT id FROM leads WHERE metaLeadgenId = ?',
          [leadData.id]
        ) as any;

        if (existing.length > 0) {
          skipped++;
          continue;
        }

        // Parser les champs du formulaire
        const fields: Record<string, string> = {};
        for (const field of (leadData.field_data || [])) {
          fields[field.name.toLowerCase()] = field.values?.[0] || "";
        }

        const firstName = fields.first_name || fields.full_name?.split(" ")[0] || "";
        const lastName = fields.last_name || fields.full_name?.split(" ").slice(1).join(" ") || "";
        const email = fields.email || "";
        const phone = fields.phone_number || fields.phone || "";
        // Extraire le CP depuis TOUS les noms de champs possibles
        const postalCode = fields.post_code || fields.postal_code || fields.zip || fields.code_postal || fields.postcode || "";
        const city = fields.city || fields.ville || "";
        const message = fields.message || fields.comments || "";
        const productInterest = fields.product_interest || fields.produit || fields["que_recherchez-vous_?"] || "";

        // Résoudre le pays : réponse formulaire > préfixe téléphonique
        const formCountry = fields.pays || fields.country || fields.land || "";
        const country = resolveCountry(formCountry, phone);

        console.log(`[MetaLeadsSync] Lead: ${firstName} ${lastName}, CP=${postalCode}, formCountry=${formCountry}, phone=${phone}, resolvedCountry=${country}`);

        // Insérer le lead avec le bon pays et CP
        const [insertResult] = await conn.execute(
          `INSERT INTO leads (firstName, lastName, email, phone, postalCode, city, country, source, status, metaLeadgenId, metaFormId, productInterest, message, customFields, receivedAt, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'META_ADS', 'NEW', ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            firstName, lastName, email, phone, postalCode, city, country,
            leadData.id, form.id, productInterest, message,
            JSON.stringify(fields),
            new Date(leadData.created_time)
          ]
        ) as any;

        // Assigner au partenaire via le routing
        const newLeadId = insertResult.insertId;
        try {
          const partner = await findBestPartnerForLead({
            postalCode,
            country,
            phone,
          });
          if (partner) {
            await conn.execute(
              'UPDATE leads SET assignedPartnerId = ?, assignedAt = NOW(), assignmentReason = ?, status = "ASSIGNED" WHERE id = ?',
              [partner.partnerId, partner.reason, newLeadId]
            );
            console.log(`[MetaLeadsSync] Lead ${newLeadId} assigné à ${partner.partnerName} (${partner.reason})`);
          }
        } catch (routingErr) {
          console.error(`[MetaLeadsSync] Erreur routing lead ${newLeadId}:`, routingErr);
        }

        imported++;
        console.log(`[MetaLeadsSync] ✓ Nouveau lead importé: ${firstName} ${lastName} <${email}> (${country}, CP: ${postalCode})`);
      }
    }

    await conn.end();

    if (imported > 0) {
      console.log(`[MetaLeadsSync] ✓ ${imported} nouveau(x) lead(s) Meta importé(s)`);
      // Notifier les admins connectés via WebSocket
      try {
        const { notifyAdmins } = await import("../_core/index");
        notifyAdmins("leads:refresh", { timestamp: Date.now(), imported });
      } catch {
        // notifyAdmins peut ne pas être exporté, on ignore
      }
    }

    return { imported, skipped };
  } catch (error) {
    console.error("[MetaLeadsSync] Erreur lors de la synchronisation:", error);
    return { imported: 0, skipped: 0 };
  } finally {
    isSyncing = false;
  }
}

/**
 * Démarre le job périodique de sync Meta (toutes les 60 secondes)
 */
export function startMetaLeadsSyncJob() {
  // Première exécution après 10 secondes (laisser le serveur démarrer)
  setTimeout(() => {
    runMetaLeadsSync().catch(console.error);
  }, 10000);

  // Puis toutes les 60 secondes
  const intervalId = setInterval(() => {
    runMetaLeadsSync().catch(console.error);
  }, 60000);

  console.log("[MetaLeadsSync] Job périodique démarré (sync toutes les 60 secondes)");

  return intervalId;
}
