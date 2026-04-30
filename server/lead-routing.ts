/**
 * Lead Routing — Classification, filtrage et attribution automatique des leads
 *
 * Catégories d'emails :
 *  - LEAD_VENTE       → demande de devis, intérêt pour un spa/jacuzzi → crée un lead
 *  - LEAD_PARTENARIAT → demande de revendeur/partenariat              → crée un lead
 *  - SAV              → service après-vente, panne, garantie           → ignoré
 *  - SPAM             → démarchage, pub, newsletter, facture           → ignoré
 *  - UNKNOWN          → inclassable                                    → ignoré
 * 
 * ROUTING UNIFIÉ (coherence-guard 2026-04-10) :
 * Source unique de vérité = territories-db.findBestPartnerForPostalCode
 * qui utilise les tables partner_territories + regions + postal_code_ranges en DB.
 * Plus de mapping CP→région en code dur, plus de fallback hardcodé.
 */
import mysql from 'mysql2/promise';
import { findBestPartnerForPostalCode } from './territories-db';
import { resolveCountry } from './meta-leads';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmailCategory =
  | 'LEAD_VENTE'
  | 'LEAD_PARTENARIAT'
  | 'SAV'
  | 'SPAM'
  | 'UNKNOWN';

export interface ParsedEmail {
  category: EmailCategory;
  isLead: boolean;          // true uniquement pour LEAD_VENTE et LEAD_PARTENARIAT
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  productInterest?: string;
  budget?: string;
  message?: string;
  source: 'EMAIL' | 'WEBSITE';
  productType?: 'VENTE' | 'PARTENARIAT';
}

// ─── Mots-clés par catégorie ──────────────────────────────────────────────────

// Mots-clés POSITIFS → lead commercial (vente)
const LEAD_VENTE_KEYWORDS = [
  // Français
  'devis', 'spa', 'jacuzzi', 'balnéo', 'balneo', 'hot tub', 'swim spa',
  'spa de nage', 'prix', 'tarif', 'achat', 'acheter', 'commander',
  'renseignement', 'information', 'intéressé', 'interesse', 'projet',
  'installation', 'livraison', 'disponible', 'disponibilité', 'stock',
  'modèle', 'modele', 'gamme', 'catalogue', 'brochure',
  // Néerlandais
  'offerte', 'prijs', 'kopen', 'aanvraag', 'spa', 'jacuzzi', 'zwembad',
  'interesse', 'project', 'levering',
  // Anglais
  'quote', 'price', 'buy', 'purchase', 'interested', 'inquiry', 'enquiry',
  'hot tub', 'swim spa', 'delivery', 'available',
  // Espagnol
  'presupuesto', 'precio', 'comprar', 'interesado', 'consulta',
];

// Mots-clés POSITIFS → lead partenariat
const LEAD_PARTENARIAT_KEYWORDS = [
  'partenariat', 'partnership', 'revendeur', 'revendeuse', 'reseller',
  'distributeur', 'distributrice', 'dealer', 'franchise', 'franchisé',
  'devenir partenaire', 'become partner', 'wederverkoper', 'verdeler',
  'collaboration', 'représentant', 'agent commercial', 'grossiste',
  'rejoindre', 'réseau', 'réseau market', 'market spas partenaire',
];

// Mots-clés NÉGATIFS → SAV (service après-vente)
const SAV_KEYWORDS = [
  'panne', 'défaut', 'défectueux', 'réparation', 'réparer', 'maintenance',
  'entretien', 'problème', 'erreur', 'dysfonctionnement', 'garantie',
  'sav', 'service après-vente', 'après-vente', 'retour', 'remboursement',
  'rembourser', 'échange', 'rappel', 'recall', 'fuite', 'fissure',
  'pompe', 'filtre', 'chauffage', 'chauffe', 'température', 'produit chimique',
  'chlore', 'ph', 'brome', 'commande n°', 'commande #', 'facture n°',
  'numéro de commande', 'mon spa', 'mon jacuzzi', 'notre spa',
  'kapot', 'defect', 'reparatie', 'garantie', 'onderhoud',
  'repair', 'broken', 'warranty', 'maintenance issue',
];

// Mots-clés NÉGATIFS → SPAM / démarchage
const SPAM_KEYWORDS = [
  // Démarchage commercial entrant
  'référencement', 'seo', 'google ads', 'publicité', 'agence', 'marketing digital',
  'création de site', 'site web', 'développement web', 'application mobile',
  'logiciel', 'crm', 'erp', 'solution', 'plateforme', 'saas',
  'audit', 'formation', 'coaching', 'consultant', 'prestataire',
  'assurance', 'mutuelle', 'prévoyance', 'banque', 'financement',
  'investissement', 'immobilier', 'recrutement', 'offre d\'emploi',
  'candidature', 'cv', 'stage', 'alternance',
  // Newsletters / automatiques
  'unsubscribe', 'désabonner', 'newsletter', 'no-reply', 'noreply',
  'notification', 'automated', 'automatique', 'do not reply',
  // Factures / comptabilité
  'facture', 'invoice', 'paiement reçu', 'payment received',
  'relevé', 'statement', 'reçu', 'receipt',
];

// ─── Classification d'un email ────────────────────────────────────────────────

/**
 * Classifie un email entrant et détermine s'il s'agit d'un lead.
 */
export function classifyEmail(
  subject: string,
  body: string,
  fromEmail: string
): { category: EmailCategory; confidence: 'HIGH' | 'MEDIUM' | 'LOW'; productType?: 'VENTE' | 'PARTENARIAT' } {
  const text = (subject + ' ' + body + ' ' + fromEmail).toLowerCase();

  // ── 1. Détection SPAM en priorité ──────────────────────────────────────────
  const spamScore = SPAM_KEYWORDS.filter(kw => text.includes(kw)).length;
  if (spamScore >= 2) {
    return { category: 'SPAM', confidence: 'HIGH' };
  }
  if (spamScore === 1) {
    const leadScore = LEAD_VENTE_KEYWORDS.filter(kw => text.includes(kw)).length;
    if (leadScore === 0) {
      return { category: 'SPAM', confidence: 'MEDIUM' };
    }
  }

  // ── 2. Détection SAV ───────────────────────────────────────────────────────
  const savScore = SAV_KEYWORDS.filter(kw => text.includes(kw)).length;
  if (savScore >= 2) {
    return { category: 'SAV', confidence: 'HIGH' };
  }
  if (savScore === 1) {
    const leadScore = LEAD_VENTE_KEYWORDS.filter(kw => text.includes(kw)).length;
    if (leadScore <= 1) {
      return { category: 'SAV', confidence: 'MEDIUM' };
    }
  }

  // ── 3. Détection PARTENARIAT ───────────────────────────────────────────────
  const partnerScore = LEAD_PARTENARIAT_KEYWORDS.filter(kw => text.includes(kw)).length;
  if (partnerScore >= 1) {
    return {
      category: 'LEAD_PARTENARIAT',
      confidence: partnerScore >= 2 ? 'HIGH' : 'MEDIUM',
      productType: 'PARTENARIAT',
    };
  }

  // ── 4. Détection LEAD VENTE ────────────────────────────────────────────────
  const venteScore = LEAD_VENTE_KEYWORDS.filter(kw => text.includes(kw)).length;
  if (venteScore >= 3) {
    return { category: 'LEAD_VENTE', confidence: 'HIGH', productType: 'VENTE' };
  }
  if (venteScore >= 1) {
    return { category: 'LEAD_VENTE', confidence: 'MEDIUM', productType: 'VENTE' };
  }

  return { category: 'UNKNOWN', confidence: 'LOW' };
}

// ─── Déduplication ────────────────────────────────────────────────────────────

/**
 * Vérifie si un lead similaire existe déjà (même email ou téléphone dans les 60 jours).
 * Retourne l'ID du lead existant ou null.
 */
export async function findExistingLead(params: {
  email?: string;
  phone?: string;
}): Promise<number | null> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  if (!params.email && !params.phone) return null;

  let conn: mysql.Connection | null = null;
  try {
    conn = await mysql.createConnection(dbUrl);

    // Fenêtre de déduplication : 60 jours
    const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    if (params.email) {
      const normalizedEmail = params.email.toLowerCase().trim();
      const [rows] = await conn.execute<mysql.RowDataPacket[]>(
        'SELECT id FROM leads WHERE LOWER(email) = ? AND createdAt >= ? ORDER BY createdAt DESC LIMIT 1',
        [normalizedEmail, since]
      );
      if (rows.length > 0) {
        console.info(`[LeadDedup] Doublon détecté par email: ${normalizedEmail} → lead #${rows[0].id}`);
        return rows[0].id;
      }
    }

    if (params.phone) {
      const normalizedPhone = params.phone.replace(/[\s\-\.()]/g, '');
      const [rows] = await conn.execute<mysql.RowDataPacket[]>(
        "SELECT id FROM leads WHERE REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '.', '') = ? AND createdAt >= ? ORDER BY createdAt DESC LIMIT 1",
        [normalizedPhone, since]
      );
      if (rows.length > 0) {
        console.info(`[LeadDedup] Doublon détecté par téléphone: ${normalizedPhone} → lead #${rows[0].id}`);
        return rows[0].id;
      }
    }

    return null;
  } catch (err) {
    console.error('[LeadDedup] Error:', err);
    return null;
  } finally {
    if (conn) await conn.end();
  }
}

/**
 * Enrichit un lead existant avec de nouvelles informations (sans écraser les données existantes).
 */
export async function enrichExistingLead(leadId: number, newData: {
  postalCode?: string;
  city?: string;
  country?: string;
  productInterest?: string;
  budget?: string;
  message?: string;
}): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return;

  let conn: mysql.Connection | null = null;
  try {
    conn = await mysql.createConnection(dbUrl);

    const updates: string[] = ['updatedAt = NOW()'];
    const values: any[] = [];

    if (newData.postalCode) {
      updates.push('postalCode = COALESCE(NULLIF(postalCode, ""), ?)');
      values.push(newData.postalCode);
    }
    if (newData.city) {
      updates.push('city = COALESCE(NULLIF(city, ""), ?)');
      values.push(newData.city);
    }
    if (newData.country) {
      updates.push('country = COALESCE(NULLIF(country, ""), ?)');
      values.push(newData.country);
    }
    if (newData.productInterest) {
      updates.push('productInterest = COALESCE(NULLIF(productInterest, ""), ?)');
      values.push(newData.productInterest);
    }
    if (newData.budget) {
      updates.push('budget = COALESCE(NULLIF(budget, ""), ?)');
      values.push(newData.budget);
    }
    if (newData.message) {
      updates.push('notes = CONCAT(COALESCE(notes, ""), "\n\n[Email supplémentaire reçu]\n", ?)');
      values.push(newData.message.substring(0, 500));
    }

    values.push(leadId);
    await conn.execute(
      `UPDATE leads SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    console.info(`[LeadDedup] Lead #${leadId} enrichi avec nouvelles données`);
  } catch (err) {
    console.error('[LeadDedup] Error enriching lead:', err);
  } finally {
    if (conn) await conn.end();
  }
}

// ─── Parsing d'email ──────────────────────────────────────────────────────────

/**
 * Parse un email entrant pour en extraire les données structurées.
 */
export function parseEmailForLead(
  subject: string,
  body: string,
  fromEmail: string,
  fromName?: string
): ParsedEmail {
  const { category, confidence, productType } = classifyEmail(subject, body, fromEmail);
  const isLead = category === 'LEAD_VENTE' || category === 'LEAD_PARTENARIAT';

  const text = body || '';

  // Extraire les données structurées de l'email
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}(?:[\s.-]?\d{2,4})?/);
  const postalCodeMatch = text.match(/\b\d{4,5}\b/);

  // Extraire le nom depuis l'adresse email ou le corps
  let firstName = fromName?.split(' ')[0] || '';
  let lastName = fromName?.split(' ').slice(1).join(' ') || '';

  if (!firstName && fromEmail) {
    const emailPrefix = fromEmail.split('@')[0];
    const parts = emailPrefix.split(/[._-]/);
    if (parts.length >= 2) {
      firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      lastName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    }
  }

  return {
    category,
    isLead,
    confidence,
    firstName,
    lastName,
    email: emailMatch?.[0] || fromEmail,
    phone: phoneMatch?.[0],
    postalCode: postalCodeMatch?.[0],
    city: undefined,
    country: undefined,
    productInterest: productType === 'VENTE' ? extractProductInterest(text) : undefined,
    budget: extractBudget(text),
    message: text.substring(0, 2000),
    source: 'EMAIL',
    productType,
  };
}

function extractProductInterest(text: string): string | undefined {
  const lower = text.toLowerCase();
  const interests: string[] = [];
  if (lower.includes('swim spa') || lower.includes('spa de nage')) interests.push('Spa de nage');
  if (lower.includes('jacuzzi') || (lower.includes('spa') && !lower.includes('spa de nage'))) interests.push('Spa/Jacuzzi');
  if (lower.includes('sauna')) interests.push('Sauna');
  return interests.length > 0 ? interests.join(', ') : undefined;
}

function extractBudget(text: string): string | undefined {
  const budgetMatch = text.match(/(\d[\d\s.,]*)\s*€|€\s*(\d[\d\s.,]*)/);
  return budgetMatch ? (budgetMatch[1] || budgetMatch[2])?.replace(/\s/g, '') + '€' : undefined;
}

// ─── Attribution automatique des leads (UNIFIÉ) ──────────────────────────────

/**
 * Trouve le meilleur partenaire pour un lead.
 * 
 * SOURCE UNIQUE DE VÉRITÉ : territories-db.findBestPartnerForPostalCode
 * qui utilise les tables partner_territories + regions + postal_code_ranges en DB
 * (définies dans "Gestion des Territoires" de l'admin).
 * 
 * Logique :
 * 1. Résoudre le pays via préfixe téléphonique > champ country
 * 2. Déléguer à findBestPartnerForPostalCode (smart disambiguation)
 * 3. Si aucun partenaire trouvé → retourner null (l'admin assignera manuellement)
 *    PAS de fallback hardcodé.
 */
export async function findBestPartnerForLead(params: {
  postalCode?: string;
  city?: string;
  country?: string;
  phone?: string;
}): Promise<{ partnerId: number | null; partnerName?: string; reason: string }> {
  const { postalCode, city, phone } = params;
  let { country } = params;

  // ── 1. Résoudre le pays via préfixe téléphonique (plus fiable que Meta) ────
  if (phone) {
    const resolvedCountry = resolveCountry(country || '', phone);
    if (resolvedCountry) {
      country = resolvedCountry;
    }
  }

  console.info(`[LeadRouting] Routing lead: CP=${postalCode} Country=${country} Phone=${phone}`);

  // ── 2. Si on a un code postal, chercher via territories-db ─────────────────
  if (postalCode) {
    try {
      const result = await findBestPartnerForPostalCode(postalCode, country);
      if (result) {
        console.info(`[LeadRouting] Match territoire: ${result.region} (${result.country}) → ${result.partnerName} (ID ${result.partnerId})`);
        return {
          partnerId: result.partnerId,
          partnerName: result.partnerName,
          reason: `territory_${result.region}`,
        };
      }
      console.info(`[LeadRouting] Aucun partenaire trouvé pour CP ${postalCode} (${country})`);
    } catch (err) {
      console.error('[LeadRouting] Error finding partner by postal code:', err);
    }
  }

  // ── 3. Aucun match → retourner null (pas de fallback hardcodé) ─────────────
  // L'admin pourra assigner manuellement le lead depuis le dashboard.
  console.info(`[LeadRouting] Aucun partenaire trouvé, lead non assigné (assignation manuelle requise)`);
  return { partnerId: null, reason: 'no_territory_match' };
}
