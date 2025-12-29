/**
 * Meta Lead Ads Integration Module
 * 
 * Ce module gère :
 * 1. La réception des webhooks Meta Lead Ads
 * 2. La récupération des données complètes du lead via Graph API
 * 3. La distribution automatique des leads aux partenaires par code postal
 * 4. La synchronisation des statistiques de campagnes
 */

import { drizzle } from "drizzle-orm/mysql2";
import { leads, leadStatusHistory, partnerPostalCodes, metaCampaigns, partners, notifications } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// Lazy DB connection
let _db: ReturnType<typeof drizzle> | null = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _db = drizzle(process.env.DATABASE_URL);
  }
  return _db;
}

// Types pour Meta Lead Ads
interface MetaWebhookEntry {
  id: string;
  time: number;
  changes: Array<{
    field: string;
    value: {
      leadgen_id: string;
      page_id: string;
      form_id: string;
      adgroup_id: string;
      ad_id: string;
      created_time: number;
    };
  }>;
}

interface MetaWebhookPayload {
  object: string;
  entry: MetaWebhookEntry[];
}

interface MetaLeadData {
  id: string;
  created_time: string;
  ad_id?: string;
  form_id?: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
}

// Configuration Meta (à stocker dans les secrets)
const META_CONFIG = {
  appId: process.env.META_APP_ID || "",
  appSecret: process.env.META_APP_SECRET || "",
  pageAccessToken: process.env.META_PAGE_ACCESS_TOKEN || "",
  verifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || "market_spas_b2b_verify",
  graphApiVersion: "v24.0",
};

/**
 * Vérifie le webhook Meta (challenge de vérification)
 */
export function verifyMetaWebhook(
  mode: string,
  token: string,
  challenge: string
): string | null {
  if (mode === "subscribe" && token === META_CONFIG.verifyToken) {
    return challenge;
  }
  return null;
}

/**
 * Traite un webhook Meta Lead Ads entrant
 */
export async function processMetaWebhook(payload: MetaWebhookPayload): Promise<void> {
  if (payload.object !== "page") {
    console.log("[Meta] Webhook ignoré - object n'est pas 'page'");
    return;
  }

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (change.field === "leadgen") {
        const leadgenId = change.value.leadgen_id;
        console.log(`[Meta] Nouveau lead reçu: ${leadgenId}`);
        
        try {
          // Récupérer les données complètes du lead
          const leadData = await fetchLeadData(leadgenId);
          
          if (leadData) {
            // Créer le lead en base de données
            const lead = await createLeadFromMeta(leadData, change.value);
            
            // Distribuer le lead au partenaire approprié
            await distributeLeadToPartner(lead.id);
          }
        } catch (error) {
          console.error(`[Meta] Erreur traitement lead ${leadgenId}:`, error);
        }
      }
    }
  }
}

/**
 * Récupère les données complètes d'un lead via Graph API
 */
async function fetchLeadData(leadgenId: string): Promise<MetaLeadData | null> {
  if (!META_CONFIG.pageAccessToken) {
    console.error("[Meta] Page access token non configuré");
    return null;
  }

  try {
    const url = `https://graph.facebook.com/${META_CONFIG.graphApiVersion}/${leadgenId}?access_token=${META_CONFIG.pageAccessToken}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`[Meta] Erreur Graph API: ${error}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error("[Meta] Erreur fetch lead data:", error);
    return null;
  }
}

/**
 * Crée un lead en base de données à partir des données Meta
 */
async function createLeadFromMeta(
  leadData: MetaLeadData,
  webhookValue: MetaWebhookEntry["changes"][0]["value"]
): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Parser les champs du formulaire
  const fields: Record<string, string> = {};
  for (const field of leadData.field_data) {
    fields[field.name.toLowerCase()] = field.values[0] || "";
  }

  // Mapper les champs standards
  const firstName = fields.first_name || fields.prenom || fields.firstname || "";
  const lastName = fields.last_name || fields.nom || fields.lastname || "";
  const email = fields.email || "";
  const phone = fields.phone_number || fields.phone || fields.telephone || "";
  const postalCode = fields.postal_code || fields.zip || fields.code_postal || "";
  const city = fields.city || fields.ville || "";
  const productInterest = fields.product_interest || fields.produit || fields.interest || "";
  const budget = fields.budget || "";
  const timeline = fields.timeline || fields.delai || "";
  const message = fields.message || fields.comments || "";

  // Stocker les champs personnalisés
  const customFields = JSON.stringify(fields);

  const [result] = await db.insert(leads).values({
    firstName,
    lastName,
    email,
    phone,
    postalCode,
    city,
    source: "META_ADS",
    status: "NEW",
    metaLeadgenId: leadData.id,
    metaFormId: webhookValue.form_id,
    metaAdId: webhookValue.ad_id,
    metaAdsetId: webhookValue.adgroup_id,
    metaPageId: webhookValue.page_id,
    productInterest,
    budget,
    timeline,
    message,
    customFields,
    receivedAt: new Date(),
  });

  return { id: result.insertId };
}

/**
 * Distribue un lead au partenaire approprié selon le code postal
 */
export async function distributeLeadToPartner(leadId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Récupérer le lead
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
  
  if (!lead || !lead.postalCode) {
    console.log(`[Lead] Lead ${leadId} sans code postal - non distribué`);
    return;
  }

  // Chercher un partenaire qui couvre ce code postal
  const [postalCodeMatch] = await db
    .select({
      partnerId: partnerPostalCodes.partnerId,
      priority: partnerPostalCodes.priority,
    })
    .from(partnerPostalCodes)
    .innerJoin(partners, eq(partners.id, partnerPostalCodes.partnerId))
    .where(
      and(
        eq(partnerPostalCodes.postalCode, lead.postalCode),
        eq(partners.status, "APPROVED")
      )
    )
    .orderBy(desc(partnerPostalCodes.priority))
    .limit(1);

  if (postalCodeMatch) {
    // Assigner le lead au partenaire
    await db
      .update(leads)
      .set({
        assignedPartnerId: postalCodeMatch.partnerId,
        assignedAt: new Date(),
        assignmentReason: "postal_code_match",
        status: "ASSIGNED",
      })
      .where(eq(leads.id, leadId));

    // Créer l'historique de statut
    await db.insert(leadStatusHistory).values({
      leadId,
      previousStatus: "NEW",
      newStatus: "ASSIGNED",
      notes: `Assigné automatiquement au partenaire ${postalCodeMatch.partnerId} (code postal ${lead.postalCode})`,
    });

    // Notifier le partenaire
    await notifyPartnerNewLead(postalCodeMatch.partnerId, lead);
    
    console.log(`[Lead] Lead ${leadId} assigné au partenaire ${postalCodeMatch.partnerId}`);
  } else {
    console.log(`[Lead] Aucun partenaire trouvé pour le code postal ${lead.postalCode}`);
  }
}

/**
 * Notifie un partenaire d'un nouveau lead
 */
async function notifyPartnerNewLead(partnerId: number, lead: any): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Trouver les utilisateurs du partenaire
  const partnerUsers = await db
    .select({ id: sql<number>`id` })
    .from(sql`users`)
    .where(sql`partner_id = ${partnerId}`);

  for (const user of partnerUsers) {
    await db.insert(notifications).values({
      userId: user.id,
      type: "SYSTEM_ALERT",
      title: "Nouveau lead reçu !",
      message: `Un nouveau prospect ${lead.firstName} ${lead.lastName} de ${lead.city || lead.postalCode} vous a été attribué.`,
      isRead: false,
    });
  }
}

/**
 * Met à jour le statut d'un lead
 */
export async function updateLeadStatus(
  leadId: number,
  newStatus: string,
  userId: number,
  notes?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Récupérer le statut actuel
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
  
  if (!lead) {
    throw new Error("Lead non trouvé");
  }

  const previousStatus = lead.status;

  // Mettre à jour le lead
  const updateData: any = {
    status: newStatus,
  };

  // Mettre à jour les timestamps selon le statut
  if (newStatus === "CONTACTED" && !lead.firstContactAt) {
    updateData.firstContactAt = new Date();
  }
  if (["CONTACTED", "NO_RESPONSE", "QUALIFIED", "NOT_QUALIFIED", "MEETING_SCHEDULED", "QUOTE_SENT", "NEGOTIATION"].includes(newStatus)) {
    updateData.lastContactAt = new Date();
    updateData.contactAttempts = (lead.contactAttempts || 0) + 1;
  }
  if (newStatus === "CONVERTED") {
    updateData.convertedAt = new Date();
  }
  if (newStatus === "LOST" && notes) {
    updateData.lostReason = notes;
  }

  await db.update(leads).set(updateData).where(eq(leads.id, leadId));

  // Créer l'historique
  await db.insert(leadStatusHistory).values({
    leadId,
    previousStatus: previousStatus as any,
    newStatus: newStatus as any,
    changedBy: userId,
    notes,
  });
}

/**
 * Récupère les statistiques de leads pour un partenaire
 */
export async function getPartnerLeadStats(partnerId: number) {
  const db = await getDb();
  if (!db) return null;

  const stats = await db
    .select({
      total: sql<number>`COUNT(*)`,
      new: sql<number>`SUM(CASE WHEN status = 'NEW' OR status = 'ASSIGNED' THEN 1 ELSE 0 END)`,
      contacted: sql<number>`SUM(CASE WHEN status = 'CONTACTED' THEN 1 ELSE 0 END)`,
      qualified: sql<number>`SUM(CASE WHEN status = 'QUALIFIED' THEN 1 ELSE 0 END)`,
      converted: sql<number>`SUM(CASE WHEN status = 'CONVERTED' THEN 1 ELSE 0 END)`,
      lost: sql<number>`SUM(CASE WHEN status = 'LOST' THEN 1 ELSE 0 END)`,
    })
    .from(leads)
    .where(eq(leads.assignedPartnerId, partnerId));

  return stats[0];
}

/**
 * Récupère les statistiques globales de leads pour l'admin
 */
export async function getAdminLeadStats() {
  const db = await getDb();
  if (!db) return null;

  const stats = await db
    .select({
      total: sql<number>`COUNT(*)`,
      unassigned: sql<number>`SUM(CASE WHEN assigned_partner_id IS NULL THEN 1 ELSE 0 END)`,
      assigned: sql<number>`SUM(CASE WHEN assigned_partner_id IS NOT NULL THEN 1 ELSE 0 END)`,
      contacted: sql<number>`SUM(CASE WHEN status IN ('CONTACTED', 'QUALIFIED', 'MEETING_SCHEDULED', 'QUOTE_SENT', 'NEGOTIATION', 'CONVERTED') THEN 1 ELSE 0 END)`,
      converted: sql<number>`SUM(CASE WHEN status = 'CONVERTED' THEN 1 ELSE 0 END)`,
      conversionRate: sql<number>`ROUND(SUM(CASE WHEN status = 'CONVERTED' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2)`,
    })
    .from(leads);

  return stats[0];
}

/**
 * Récupère les leads par partenaire avec statistiques
 */
export async function getLeadsByPartner() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      partnerId: leads.assignedPartnerId,
      partnerName: partners.companyName,
      total: sql<number>`COUNT(*)`,
      contacted: sql<number>`SUM(CASE WHEN ${leads.status} IN ('CONTACTED', 'QUALIFIED', 'MEETING_SCHEDULED', 'QUOTE_SENT', 'NEGOTIATION', 'CONVERTED') THEN 1 ELSE 0 END)`,
      notContacted: sql<number>`SUM(CASE WHEN ${leads.status} IN ('NEW', 'ASSIGNED') THEN 1 ELSE 0 END)`,
      converted: sql<number>`SUM(CASE WHEN ${leads.status} = 'CONVERTED' THEN 1 ELSE 0 END)`,
    })
    .from(leads)
    .leftJoin(partners, eq(leads.assignedPartnerId, partners.id))
    .where(sql`${leads.assignedPartnerId} IS NOT NULL`)
    .groupBy(leads.assignedPartnerId, partners.companyName);

  return result;
}

/**
 * Synchronise les statistiques d'une campagne Meta
 */
export async function syncMetaCampaignStats(metaCampaignId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  if (!META_CONFIG.pageAccessToken) {
    console.error("[Meta] Page access token non configuré");
    return;
  }

  try {
    const url = `https://graph.facebook.com/${META_CONFIG.graphApiVersion}/${metaCampaignId}/insights?fields=spend,impressions,clicks,actions&access_token=${META_CONFIG.pageAccessToken}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("[Meta] Erreur récupération stats campagne");
      return;
    }
    
    const data = await response.json();
    
    if (data.data && data.data[0]) {
      const insights = data.data[0];
      const leadActions = insights.actions?.find((a: any) => a.action_type === "lead") || { value: 0 };
      
      await db
        .update(metaCampaigns)
        .set({
          totalSpend: insights.spend || "0",
          totalImpressions: parseInt(insights.impressions) || 0,
          totalClicks: parseInt(insights.clicks) || 0,
          totalLeads: parseInt(leadActions.value) || 0,
          costPerLead: leadActions.value > 0 ? (parseFloat(insights.spend) / parseInt(leadActions.value)).toFixed(2) : null,
          lastSyncedAt: new Date(),
        })
        .where(eq(metaCampaigns.metaCampaignId, metaCampaignId));
    }
  } catch (error) {
    console.error("[Meta] Erreur sync stats campagne:", error);
  }
}
