/**
 * Meta Lead Ads Integration Module
 * 
 * Ce module gère :
 * 1. La réception des webhooks Meta Lead Ads
 * 2. La récupération des données complètes du lead via Graph API
 * 3. La détection automatique des leads "Devenir Partenaire" vs clients finaux
 * 4. La distribution automatique des leads clients aux partenaires par code postal
 * 5. La création automatique de candidats partenaires dans la Carte du Réseau
 * 6. La synchronisation des statistiques de campagnes
 */

import { drizzle } from "drizzle-orm/mysql2";
import { leads, leadStatusHistory, partnerPostalCodes, metaCampaigns, partners, notifications, partnerCandidates, users } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { notifyAdmins } from "./_core/websocket";
import { findBestPartnerForPostalCode } from "./territories-db";

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

// ============================================
// COUNTRY RESOLUTION
// ============================================

/**
 * Détermine le pays réel d'un lead en utilisant plusieurs sources de vérité.
 * Priorité : réponse formulaire > préfixe téléphonique > fallback
 * 
 * Le champ "country" de Meta est souvent incorrect (ex: "Belgium" pour des leads français)
 * car il reflète le pays de la page Facebook, pas celui du lead.
 */
export function resolveCountry(formCountry: string, phone: string): string {
  // 1. Champ pays du formulaire (PRIORITAIRE)
  // Si le lead a renseigné son pays, on le prend tel quel.
  if (formCountry) {
    const fc = formCountry.toLowerCase().trim();
    if (fc === 'fr' || fc === 'france') return 'France';
    if (fc === 'be' || fc === 'belgique' || fc === 'belgium' || fc === 'belgie') return 'Belgium';
    if (fc === 'lu' || fc === 'luxembourg') return 'Luxembourg';
    if (fc === 'de' || fc === 'allemagne' || fc === 'germany' || fc === 'deutschland') return 'Germany';
    if (fc === 'nl' || fc === 'pays-bas' || fc === 'netherlands' || fc === 'nederland') return 'Netherlands';
    if (fc === 'es' || fc === 'espagne' || fc === 'spain' || fc === 'españa') return 'Spain';
    if (fc === 'ch' || fc === 'suisse' || fc === 'switzerland' || fc === 'schweiz') return 'Switzerland';
    // Si la réponse est déjà un nom de pays complet
    if (fc.length > 2) return formCountry;
  }

  // 2. Préfixe téléphonique (fallback si pas de champ pays)
  const cleanPhone = (phone || '').replace(/\s/g, '');
  if (cleanPhone.startsWith('+33') || cleanPhone.startsWith('0033')) return 'France';
  if (cleanPhone.startsWith('+32') || cleanPhone.startsWith('0032')) return 'Belgium';
  if (cleanPhone.startsWith('+352')) return 'Luxembourg';
  if (cleanPhone.startsWith('+49') || cleanPhone.startsWith('0049')) return 'Germany';
  if (cleanPhone.startsWith('+31') || cleanPhone.startsWith('0031')) return 'Netherlands';
  if (cleanPhone.startsWith('+34') || cleanPhone.startsWith('0034')) return 'Spain';
  if (cleanPhone.startsWith('+41') || cleanPhone.startsWith('0041')) return 'Switzerland';
  if (cleanPhone.startsWith('+39')) return 'Italy';
  if (cleanPhone.startsWith('+44')) return 'United Kingdom';
  if (cleanPhone.startsWith('+351')) return 'Portugal';

  // 3. Aucune info fiable → retourner vide (sera géré par le routing)
  return '';
}

// ============================================
// PARTNER LEAD DETECTION
// ============================================

/**
 * Clés spécifiques aux formulaires "Devenir Partenaire" dans les customFields.
 * Si un lead contient l'une de ces clés, il est considéré comme un candidat partenaire.
 */
const PARTNER_LEAD_INDICATOR_KEYS = [
  "company_name",
  "possédez-vous_un_showroom_?_",
  "travaillez-vous_déjà_dans_la_vente_de_spa_?_",
  "vendez-vous_actuellement_une_autre_marque_?",
  "travaillez-vous_dans_un_domaine_similaire_?_",
];

/**
 * Détecte si un lead est de type "Devenir Partenaire" en analysant ses customFields.
 * Retourne true si le lead contient au moins un champ indicateur de candidature partenaire.
 */
export function isPartnerLead(fields: Record<string, string>): boolean {
  const fieldKeys = Object.keys(fields).map(k => k.toLowerCase());
  return PARTNER_LEAD_INDICATOR_KEYS.some(indicator => 
    fieldKeys.includes(indicator.toLowerCase())
  );
}

/**
 * Normalise une réponse oui/non depuis les formulaires Meta.
 * Les réponses peuvent être "oui", "non", "oui_(_piscine_ou_mobilier_de_jardin_)", etc.
 */
function normalizeYesNo(value: string | undefined): string {
  if (!value) return "non";
  const lower = value.toLowerCase().trim().replace(/_/g, " ");
  if (lower.startsWith("oui")) return "oui";
  if (lower.startsWith("non")) return "non";
  return value;
}

/**
 * Calcule le score de priorité (0-8) pour un candidat partenaire.
 * +2 points pour chaque critère positif :
 * - Possède un showroom
 * - Travaille déjà dans la vente de spa
 * - Vend actuellement une autre marque
 * - Travaille dans un domaine similaire (piscine, mobilier de jardin)
 */
export function calculatePartnerScore(fields: Record<string, string>): {
  score: number;
  showroom: string;
  vendSpa: string;
  autreMarque: string;
  domaineSimilaire: string;
} {
  const showroom = normalizeYesNo(fields["possédez-vous_un_showroom_?_"]);
  const vendSpa = normalizeYesNo(fields["travaillez-vous_déjà_dans_la_vente_de_spa_?_"]);
  const autreMarque = normalizeYesNo(fields["vendez-vous_actuellement_une_autre_marque_?"]);
  const domaineSimilaire = normalizeYesNo(fields["travaillez-vous_dans_un_domaine_similaire_?_"]);

  let score = 1; // Score minimum de 1 pour tout lead partenariat
  if (showroom === "oui") score += 2;        // +2 si showroom
  if (vendSpa === "oui") score += 3;          // +3 si vend déjà des spas (le plus important)
  if (autreMarque === "oui") score += 1;      // +1 si vend une autre marque
  if (domaineSimilaire === "oui") score += 1; // +1 si domaine similaire
  // Score max = 1 + 2 + 3 + 1 + 1 = 8

  return { score: Math.min(score, 8), showroom, vendSpa, autreMarque, domaineSimilaire };
}

/**
 * Crée un candidat partenaire dans la table partner_candidates à partir d'un lead Meta.
 * Vérifie d'abord qu'un candidat avec le même email n'existe pas déjà.
 */
async function createPartnerCandidateFromLead(
  leadId: number,
  fields: Record<string, string>
): Promise<{ id: number; isNew: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const email = fields.email || "";
  const fullName = fields.full_name || "";
  const city = fields.city || "";
  const phoneNumber = fields.phone_number || fields.phone || "";
  // Utiliser le nom complet comme nom d'entreprise si company_name absent
  const companyName = fields.company_name || fields.nom_entreprise || fields.entreprise || fullName || city || "Non renseigné";

  // Vérifier si un candidat avec le même email existe déjà
  if (email) {
    const existing = await db
      .select()
      .from(partnerCandidates)
      .where(eq(partnerCandidates.email, email))
      .limit(1);

    if (existing.length > 0) {
      console.log(`[Meta] Candidat partenaire déjà existant pour ${email} (ID: ${existing[0].id})`);
      // Mettre à jour le metaLeadId si pas encore lié
      if (!existing[0].metaLeadId) {
        await db
          .update(partnerCandidates)
          .set({ metaLeadId: leadId, source: "meta_lead" })
          .where(eq(partnerCandidates.id, existing[0].id));
      }
      return { id: existing[0].id, isNew: false };
    }
  }

  // Calculer le score de priorité
  const { score, showroom, vendSpa, autreMarque, domaineSimilaire } = calculatePartnerScore(fields);

  // Créer le candidat partenaire
  const [result] = await db.insert(partnerCandidates).values({
    companyName,
    fullName,
    city,
    phoneNumber,
    email,
    priorityScore: score,
    showroom,
    vendSpa,
    autreMarque,
    domaineSimilaire,
    metaLeadId: leadId,
    source: "meta_lead",
    notes: `Créé automatiquement depuis un lead Meta Ads (Lead ID: ${leadId})`,
    status: "non_contacte",
  });

  console.log(`[Meta] Nouveau candidat partenaire créé (ID: ${result.insertId}, Score: ${score}/8) depuis lead ${leadId}`);
  return { id: result.insertId, isNew: true };
}

// ============================================
// WEBHOOK PROCESSING
// ============================================

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
 * Traite un webhook Meta Lead Ads entrant.
 * Détecte automatiquement le type de lead et route vers le bon flux :
 * - Lead "Devenir Partenaire" → création de candidat dans la Carte du Réseau
 * - Lead client final → distribution au partenaire approprié
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
        const pageId = change.value.page_id;
        console.log(`[Meta] Nouveau lead reçu: ${leadgenId} (page: ${pageId})`);
        
        try {
          // Récupérer les données complètes du lead via Graph API
          const leadData = await fetchLeadData(leadgenId, pageId);
          
          if (leadData) {
            // Créer le lead en base de données avec les données complètes
            const lead = await createLeadFromMeta(leadData, change.value);
            
            // Parser les champs pour détecter le type de lead
            const fields: Record<string, string> = {};
            for (const field of leadData.field_data || []) {
              fields[field.name.toLowerCase()] = field.values[0] || "";
            }

            if (isPartnerLead(fields)) {
              // === LEAD "DEVENIR PARTENAIRE" ===
              // Ces leads ne sont PAS assignés à un partenaire.
              // Ils apparaissent uniquement dans la Carte du Réseau.
              console.log(`[Meta] Lead ${leadgenId} détecté comme candidat partenaire`);
              
              // Marquer le lead comme candidat partenaire avec leadType = PARTENARIAT
              const db = await getDb();
              if (db) {
                await db.update(leads)
                  .set({ 
                    leadType: "PARTENARIAT" as any,
                    status: "QUALIFIED" as any,
                    notes: "Lead Devenir Partenaire - Redirigé vers la Carte du Réseau",
                    assignmentReason: "partner_candidate",
                    assignedPartnerId: null,
                  })
                  .where(eq(leads.id, lead.id));
              }
              
              // Créer le candidat partenaire
              const candidate = await createPartnerCandidateFromLead(lead.id, fields);
              
              // Notifier les admins
              notifyAdmins("lead:new", {
                leadId: lead.id,
                customerName: fields.full_name || "Nouveau candidat partenaire",
                city: fields.city || "",
                type: "partner_candidate",
                candidateId: candidate.id,
              });
              notifyAdmins("leads:refresh", { timestamp: Date.now() });
              notifyAdmins("candidates:refresh", { timestamp: Date.now() });
            } else {
              // === LEAD CLIENT FINAL ===
              console.log(`[Meta] Lead ${leadgenId} détecté comme client final`);
              
              // Distribuer le lead au partenaire approprié
              await distributeLeadToPartner(lead.id);
              
              // Notifier les admins
              notifyAdmins("lead:new", {
                leadId: lead.id,
                customerName: fields.full_name || leadData.field_data?.find((f: any) => f.name === "full_name")?.values?.[0] || "Nouveau lead",
                city: fields.city || leadData.field_data?.find((f: any) => f.name === "city")?.values?.[0] || "",
                type: "customer",
              });
              notifyAdmins("leads:refresh", { timestamp: Date.now() });
            }
          } else {
            // FALLBACK: Créer le lead avec les données minimales du webhook
            console.log(`[Meta] Création du lead avec données minimales (fallback)`);
            const lead = await createLeadFromWebhookOnly(change.value);
            
            // Tenter la distribution même avec les données minimales
            await distributeLeadToPartner(lead.id);
            
            notifyAdmins("lead:new", {
              leadId: lead.id,
              customerName: "Nouveau lead (données partielles)",
              city: "",
              type: "unknown",
            });
            notifyAdmins("leads:refresh", { timestamp: Date.now() });
          }
        } catch (error) {
          console.error(`[Meta] Erreur traitement lead ${leadgenId}:`, error);
          
          // DERNIER RECOURS: Essayer de créer le lead avec les données minimales
          try {
            console.log(`[Meta] Tentative de création en dernier recours`);
            const lead = await createLeadFromWebhookOnly(change.value);
            await distributeLeadToPartner(lead.id);
            
            notifyAdmins("lead:new", {
              leadId: lead.id,
              customerName: "Nouveau lead (récupération partielle)",
              city: "",
              type: "unknown",
            });
            notifyAdmins("leads:refresh", { timestamp: Date.now() });
          } catch (fallbackError) {
            console.error(`[Meta] Échec complet du traitement du lead ${leadgenId}:`, fallbackError);
          }
        }
      }
    }
  }
}

// ============================================
// PAGE TOKEN MANAGEMENT
// ============================================

// Cache des Page Tokens (clé: pageId, valeur: pageAccessToken)
let _pageTokensCache: Map<string, string> | null = null;
let _pageTokensCacheTime = 0;
const PAGE_TOKENS_CACHE_TTL = 3600000; // 1 heure

/**
 * Récupère le Page Access Token pour une page spécifique
 * Utilise le System User Token pour obtenir les Page Tokens via me/accounts
 */
async function getPageToken(pageId: string): Promise<string | null> {
  const systemToken = META_CONFIG.pageAccessToken;
  if (!systemToken) return null;

  // Vérifier le cache
  const now = Date.now();
  if (_pageTokensCache && (now - _pageTokensCacheTime) < PAGE_TOKENS_CACHE_TTL) {
    const cached = _pageTokensCache.get(pageId);
    if (cached) return cached;
  }

  try {
    // Récupérer tous les Page Tokens via me/accounts
    const url = `https://graph.facebook.com/${META_CONFIG.graphApiVersion}/me/accounts?fields=id,access_token&limit=50&access_token=${systemToken}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[Meta] Erreur récupération Page Tokens: ${await response.text()}`);
      return null;
    }
    const data = await response.json();
    
    // Mettre à jour le cache
    _pageTokensCache = new Map();
    _pageTokensCacheTime = now;
    for (const page of data.data || []) {
      _pageTokensCache.set(page.id, page.access_token);
    }

    return _pageTokensCache.get(pageId) || null;
  } catch (error) {
    console.error("[Meta] Erreur récupération Page Tokens:", error);
    return null;
  }
}

// ============================================
// LEAD DATA FETCHING
// ============================================

/**
 * Récupère les données complètes d'un lead via Graph API
 * Utilise le Page Token spécifique de la page (via System User Token)
 * Fallback sur le System User Token directement si le Page Token n'est pas disponible
 */
async function fetchLeadData(leadgenId: string, pageId?: string): Promise<MetaLeadData | null> {
  const systemToken = META_CONFIG.pageAccessToken;
  
  if (!systemToken) {
    console.error("[Meta] Page access token non configuré");
    return null;
  }

  // Essayer d'abord avec le Page Token spécifique
  let token = systemToken;
  if (pageId) {
    const pageToken = await getPageToken(pageId);
    if (pageToken) {
      token = pageToken;
      console.log(`[Meta] Utilisation du Page Token pour la page ${pageId}`);
    } else {
      console.log(`[Meta] Page Token non trouvé pour ${pageId}, utilisation du System User Token`);
    }
  }

  try {
    const url = `https://graph.facebook.com/${META_CONFIG.graphApiVersion}/${leadgenId}?access_token=${token}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Meta] Erreur Graph API (page ${pageId || 'unknown'}): ${errorText}`);
      
      // Si le Page Token a échoué, essayer avec le System User Token
      if (token !== systemToken) {
        console.log(`[Meta] Retry avec le System User Token`);
        const retryUrl = `https://graph.facebook.com/${META_CONFIG.graphApiVersion}/${leadgenId}?access_token=${systemToken}`;
        const retryResponse = await fetch(retryUrl);
        if (retryResponse.ok) {
          return await retryResponse.json();
        }
        console.error(`[Meta] Retry échoué aussi: ${await retryResponse.text()}`);
      }
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error("[Meta] Erreur fetch lead data:", error);
    return null;
  }
}

// ============================================
// LEAD CREATION
// ============================================

/**
 * Crée un lead en base de données avec les données minimales du webhook uniquement
 * Utilisé comme fallback quand fetchLeadData échoue (token expiré, API indisponible, etc.)
 */
async function createLeadFromWebhookOnly(
  webhookValue: MetaWebhookEntry["changes"][0]["value"]
): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(leads).values({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    postalCode: "",
    city: "",
    source: "META_ADS",
    status: "NEW",
    metaLeadgenId: webhookValue.leadgen_id,
    metaFormId: webhookValue.form_id,
    metaAdId: webhookValue.ad_id,
    metaAdsetId: webhookValue.adgroup_id,
    metaPageId: webhookValue.page_id,
    productInterest: "",
    budget: "",
    timeline: "",
    message: `Lead reçu via webhook Meta (données complètes non récupérées - token potentiellement expiré). Leadgen ID: ${webhookValue.leadgen_id}`,
    customFields: JSON.stringify({ _webhook_only: true, _created_time: webhookValue.created_time }),
    receivedAt: new Date(),
  });

  console.log(`[Meta] Lead créé en fallback (ID: ${result.insertId}) - données minimales uniquement`);
  return { id: result.insertId };
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

  const fields: Record<string, string> = {};
  for (const field of leadData.field_data) {
    fields[field.name.toLowerCase()] = field.values[0] || "";
  }

  // Mapper les champs standards
  const firstName = fields.first_name || fields.prenom || fields.firstname || "";
  const lastName = fields.last_name || fields.nom || fields.lastname || "";
  const email = fields.email || "";
  const phone = fields.phone_number || fields.phone || fields.telephone || "";
  const postalCode = fields.post_code || fields.postal_code || fields.zip || fields.code_postal || fields.postcode || "";
  const city = fields.city || fields.ville || "";
  const productInterest = fields.product_interest || fields.produit || fields.interest || fields["que_recherchez-vous_?"] || "";
  const budget = fields.budget || "";
  const timeline = fields.timeline || fields.delai || "";
  const message = fields.message || fields.comments || "";

  // Déterminer le vrai pays : réponse formulaire > préfixe téléphonique > fallback
  const formCountry = fields.pays || fields.country || fields.land || "";
  const realCountry = resolveCountry(formCountry, phone);

  // Stocker les champs personnalisés
  const customFields = JSON.stringify(fields);

  console.log(`[Meta] Lead parsed: CP=${postalCode}, formCountry=${formCountry}, phone=${phone}, resolvedCountry=${realCountry}`);

  const [result] = await db.insert(leads).values({
    firstName,
    lastName,
    email,
    phone,
    postalCode,
    city,
    country: realCountry,
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

// ============================================
// RECLASSIFICATION OF EXISTING LEADS
// ============================================

/**
 * Reclasse les leads existants qui sont des candidats partenaires.
 * Parcourt tous les leads avec company_name dans customFields et les ajoute
 * comme candidats partenaires s'ils ne le sont pas déjà.
 */
export async function reclassifyExistingPartnerLeads(): Promise<{
  processed: number;
  created: number;
  alreadyExists: number;
  errors: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Récupérer TOUS les leads de type PARTENARIAT (y compris ceux sans company_name)
  // ainsi que les leads avec customFields contenant des indicateurs de partenariat
  const allLeads = await db
    .select()
    .from(leads)
    .where(
      sql`leadType = 'PARTENARIAT' OR customFields LIKE '%company_name%' OR customFields LIKE '%showroom%' OR customFields LIKE '%devenir_partenaire%' OR customFields LIKE '%partenaire%'`
    );

  let processed = 0;
  let created = 0;
  let alreadyExists = 0;
  let errors = 0;

  for (const lead of allLeads) {
    processed++;
    try {
      const fields: Record<string, string> = JSON.parse(lead.customFields || "{}");
      
      if (!isPartnerLead(fields)) continue;

      const result = await createPartnerCandidateFromLead(lead.id, fields);
      
      if (result.isNew) {
        created++;
      } else {
        alreadyExists++;
      }

      // Marquer le lead comme candidat partenaire (pas d'assignation partenaire)
      await db.update(leads)
        .set({
          leadType: "PARTENARIAT" as any,
          notes: "Lead Devenir Partenaire - Redirigé vers la Carte du Réseau",
          assignmentReason: "partner_candidate",
          assignedPartnerId: null,
        })
        .where(eq(leads.id, lead.id));

    } catch (error) {
      errors++;
      console.error(`[Meta] Erreur reclassification lead ${lead.id}:`, error);
    }
  }

  return { processed, created, alreadyExists, errors };
}

// ============================================
// NOTIFICATIONS
// ============================================

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
      type: "LEAD_ASSIGNED",
      title: "Nouveau lead reçu !",
      message: `Un nouveau prospect ${lead.firstName} ${lead.lastName} de ${lead.city || lead.postalCode} vous a été attribué.`,
      linkUrl: "/leads",
      linkText: "Voir mes leads",
      isRead: false,
    });
  }
}

// ============================================
// LEAD STATUS MANAGEMENT
// ============================================

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


// ============================================
// DISTRIBUTION DES LEADS AUX PARTENAIRES
// ============================================

/**
 * Distribue un lead au partenaire propriétaire du territoire correspondant.
 * 
 * SOURCE UNIQUE DE VÉRITÉ : territories-db.findBestPartnerForPostalCode
 * qui utilise les tables partner_territories + regions + postal_code_ranges en DB
 * (définies dans "Gestion des Territoires" de l'admin).
 * 
 * Logique :
 * 1. Récupérer le lead en DB (postalCode, country, phone)
 * 2. Résoudre le pays via resolveCountry (préfixe téléphonique > champ country)
 * 3. Chercher le partenaire via findBestPartnerForPostalCode
 * 4. Si trouvé → assigner le lead au partenaire (status = ASSIGNED)
 * 5. Si non trouvé → laisser le lead en NEW (assignation manuelle par l'admin)
 */
export async function distributeLeadToPartner(leadId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error(`[LeadDistribution] DB non disponible pour distribuer le lead #${leadId}`);
    return;
  }

  try {
    // 1. Récupérer les données du lead
    const [lead] = await db
      .select({
        id: leads.id,
        postalCode: leads.postalCode,
        country: leads.country,
        phone: leads.phone,
        city: leads.city,
        assignedPartnerId: leads.assignedPartnerId,
        status: leads.status,
      })
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (!lead) {
      console.error(`[LeadDistribution] Lead #${leadId} non trouvé en DB`);
      return;
    }

    // Si déjà assigné, ne pas réassigner
    if (lead.assignedPartnerId) {
      console.log(`[LeadDistribution] Lead #${leadId} déjà assigné au partenaire #${lead.assignedPartnerId}`);
      return;
    }

    // 2. Résoudre le pays
    const country = resolveCountry(lead.country || '', lead.phone || '');
    console.log(`[LeadDistribution] Lead #${leadId}: CP=${lead.postalCode} Country=${country} Phone=${lead.phone}`);

    // 3. Chercher le partenaire via territories-db (source unique de vérité)
    if (!lead.postalCode) {
      console.log(`[LeadDistribution] Lead #${leadId}: pas de code postal, assignation manuelle requise`);
      return;
    }

    const result = await findBestPartnerForPostalCode(lead.postalCode, country);

    if (result) {
      // 4. Assigner le lead au partenaire
      await db.update(leads)
        .set({
          assignedPartnerId: result.partnerId,
          status: "ASSIGNED" as any,
          assignmentReason: `territory_auto_${result.region}`,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, leadId));

      // Ajouter un historique de statut
      await db.insert(leadStatusHistory).values({
        leadId,
        previousStatus: lead.status || "NEW",
        newStatus: "ASSIGNED" as any,
        notes: `Assigné automatiquement à ${result.partnerName} (territoire: ${result.region}, ${result.country})`,
      });

      console.log(`[LeadDistribution] Lead #${leadId} assigné à ${result.partnerName} (ID ${result.partnerId}) via territoire ${result.region}`);

      // Notifier tous les utilisateurs liés au partenaire
      try {
        const db2 = await getDb();
        if (db2) {
          // Récupérer les userIds des utilisateurs liés à ce partenaire
          const partnerUsers = await db2.select({ id: users.id })
            .from(users)
            .where(eq(users.partnerId, result.partnerId));
          
          if (partnerUsers.length > 0) {
            await db2.insert(notifications).values(
              partnerUsers.map(u => ({
                userId: u.id,
                type: "lead_assigned" as any,
                title: "Nouveau lead assigné",
                message: `Un nouveau lead client (CP: ${lead.postalCode}, ${lead.city || ''}) vous a été assigné automatiquement.`,
                data: JSON.stringify({ leadId, postalCode: lead.postalCode, city: lead.city }),
              }))
            );
          }
        }
      } catch (notifErr) {
        console.error(`[LeadDistribution] Erreur notification partenaire:`, notifErr);
      }
    } else {
      // 5. Aucun partenaire trouvé → laisser en NEW
      console.log(`[LeadDistribution] Lead #${leadId}: aucun partenaire pour CP ${lead.postalCode} (${country}), assignation manuelle requise`);
      
      await db.update(leads)
        .set({
          assignmentReason: "no_territory_match",
          updatedAt: new Date(),
        })
        .where(eq(leads.id, leadId));
    }
  } catch (err) {
    console.error(`[LeadDistribution] Erreur distribution lead #${leadId}:`, err);
  }
}
