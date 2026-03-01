import * as metaOAuth from "../meta-oauth";
import { getConnectedMetaAdAccounts } from "../db";
import { resolveCountry, isPartnerLead, calculatePartnerScore } from "../meta-leads";
import { findBestPartnerForLead } from "../lead-routing";
import mysql2 from "mysql2/promise";

let isSyncing = false;
let syncCycleCount = 0;
let lastTokenValidation: { valid: boolean; timestamp: number } | null = null;

// Cache la validation du token pendant 10 minutes pour éviter le rate limiting
const TOKEN_VALIDATION_CACHE_MS = 10 * 60 * 1000;

/**
 * Synchronise les leads Meta depuis les formulaires Lead Ads
 * Récupère uniquement les leads plus récents que le dernier lead connu
 * Corrige le pays via préfixe téléphonique et réponse formulaire
 * Détecte automatiquement les leads partenariat et les classe correctement
 */
export async function runMetaLeadsSync() {
  if (isSyncing) {
    console.log("[MetaLeadsSync] Sync déjà en cours, on passe");
    return { imported: 0, skipped: 0 };
  }

  isSyncing = true;
  syncCycleCount++;

  try {
    // Vérifier qu'un compte Meta est connecté
    const accounts = await getConnectedMetaAdAccounts();
    if (!accounts || accounts.length === 0) {
      return { imported: 0, skipped: 0 };
    }

    const targetAccount = accounts[0];

    // Valider le token avec cache pour éviter le rate limiting
    const now = Date.now();
    if (lastTokenValidation && (now - lastTokenValidation.timestamp) < TOKEN_VALIDATION_CACHE_MS) {
      if (!lastTokenValidation.valid) {
        console.warn("[MetaLeadsSync] Token Meta invalide (cache) - reconnectez votre compte dans /admin/leads");
        return { imported: 0, skipped: 0 };
      }
    } else {
      // Valider le token seulement si le cache est expiré
      const isValid = await metaOAuth.validateToken(targetAccount.accessToken);
      lastTokenValidation = { valid: isValid, timestamp: now };
      if (!isValid) {
        console.warn("[MetaLeadsSync] Token Meta expiré - reconnectez votre compte dans /admin/leads");
        return { imported: 0, skipped: 0 };
      }
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

        // Détecter le type de lead (PARTENARIAT vs VENTE)
        const isPartner = isPartnerLead(fields);
        const leadType = isPartner ? 'PARTENARIAT' : 'VENTE';

        console.log(`[MetaLeadsSync] Lead: ${firstName} ${lastName}, CP=${postalCode}, type=${leadType}, formCountry=${formCountry}, phone=${phone}, resolvedCountry=${country}`);

        // Insérer le lead avec le bon pays, CP et leadType
        const [insertResult] = await conn.execute(
          `INSERT INTO leads (firstName, lastName, email, phone, postalCode, city, country, source, status, metaLeadgenId, metaFormId, productInterest, message, customFields, leadType, receivedAt, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'META_ADS', ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            firstName, lastName, email, phone, postalCode, city, country,
            isPartner ? 'NEW' : 'NEW',
            leadData.id, form.id, productInterest, message,
            JSON.stringify(fields),
            leadType,
            new Date(leadData.created_time)
          ]
        ) as any;

        const newLeadId = insertResult.insertId;

        if (isPartner) {
          // Lead partenariat : NE PAS assigner à un partenaire
          // Créer un candidat partenaire sur la carte du réseau
          console.log(`[MetaLeadsSync] Lead partenariat ${newLeadId} - création candidat sur la carte du réseau`);
          try {
            const companyName = fields.company_name || fields.nom_de_votre_entreprise || fields.entreprise || `${firstName} ${lastName}`;
            const scoring = calculatePartnerScore(fields);

            // Vérifier si un candidat existe déjà pour cette entreprise + ville
            const [existingCandidate] = await conn.execute(
              'SELECT id FROM partner_candidates WHERE company_name = ? AND city = ?',
              [companyName, city]
            ) as any;

            if (existingCandidate.length === 0) {
              await conn.execute(
                `INSERT INTO partner_candidates (company_name, full_name, email, phone, city, postal_code, country, showroom, vend_spa, autre_marque, domaine_similaire, priority_score, candidate_status, source, notes, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'non_contacte', 'meta_lead', ?, NOW(), NOW())`,
                [
                  companyName,
                  `${firstName} ${lastName}`.trim(),
                  email,
                  phone,
                  city,
                  postalCode,
                  country,
                  scoring.showroom,
                  scoring.vendSpa,
                  scoring.autreMarque,
                  scoring.domaineSimilaire,
                  scoring.score,
                  `Lead Meta importé automatiquement. Score: ${scoring.score}/8`
                ]
              );
              console.log(`[MetaLeadsSync] ✓ Candidat partenaire créé: ${companyName} (score: ${scoring.score}/8)`);
            }
          } catch (candidateErr) {
            console.error(`[MetaLeadsSync] Erreur création candidat pour lead ${newLeadId}:`, candidateErr);
          }
        } else {
          // Lead VENTE : assigner au partenaire via le routing
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
              console.log(`[MetaLeadsSync] Lead VENTE ${newLeadId} assigné à ${partner.partnerName} (${partner.reason})`);
            }
          } catch (routingErr) {
            console.error(`[MetaLeadsSync] Erreur routing lead ${newLeadId}:`, routingErr);
          }
        }

        imported++;
        console.log(`[MetaLeadsSync] ✓ Nouveau lead importé: ${firstName} ${lastName} <${email}> (${country}, CP: ${postalCode}, type: ${leadType})`);
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
 * Démarre le job périodique de sync Meta (toutes les 5 minutes)
 * Réduit la fréquence pour éviter le rate limiting de l'API Meta
 */
export function startMetaLeadsSyncJob() {
  // Première exécution après 15 secondes (laisser le serveur démarrer)
  setTimeout(() => {
    runMetaLeadsSync().catch(console.error);
  }, 15000);

  // Puis toutes les 5 minutes (300 secondes)
  const intervalId = setInterval(() => {
    runMetaLeadsSync().catch(console.error);
  }, 5 * 60 * 1000);

  console.log("[MetaLeadsSync] Job périodique démarré (sync toutes les 5 minutes)");

  return intervalId;
}
