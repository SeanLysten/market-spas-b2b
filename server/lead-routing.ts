/**
 * Lead Routing — Classification, filtrage et attribution automatique des leads
 *
 * Catégories d'emails :
 *  - LEAD_VENTE       → demande de devis, intérêt pour un spa/jacuzzi → crée un lead
 *  - LEAD_PARTENARIAT → demande de revendeur/partenariat              → crée un lead
 *  - SAV              → service après-vente, panne, garantie           → ignoré
 *  - SPAM             → démarchage, pub, newsletter, facture           → ignoré
 *  - UNKNOWN          → inclassable                                    → ignoré
 */
import mysql from 'mysql2/promise';

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
        console.log(`[LeadDedup] Doublon détecté par email: ${normalizedEmail} → lead #${rows[0].id}`);
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
        console.log(`[LeadDedup] Doublon détecté par téléphone: ${normalizedPhone} → lead #${rows[0].id}`);
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

    console.log(`[LeadDedup] Lead #${leadId} enrichi avec nouvelles données`);
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

  // Extraction du téléphone
  const phoneMatch = text.match(/(?:\+?\d{1,4}[\s\-]?)?\(?\d{1,4}\)?[\s\-]?\d{2,4}[\s\-]?\d{2,4}[\s\-]?\d{0,4}/);
  const phone = phoneMatch ? phoneMatch[0].trim() : undefined;

  // Extraction du code postal (5 chiffres FR ou 4 chiffres BE)
  const cpMatch = text.match(/\b(\d{4,5})\b/);
  const postalCode = cpMatch ? cpMatch[1] : undefined;

  // Extraction du nom
  let firstName: string | undefined;
  let lastName: string | undefined;
  if (fromName) {
    const parts = fromName.trim().split(/\s+/);
    firstName = parts[0];
    lastName = parts.slice(1).join(' ') || undefined;
  }

  return {
    category,
    isLead,
    confidence,
    firstName,
    lastName,
    email: fromEmail,
    phone,
    postalCode,
    city: undefined,
    country: undefined,
    productInterest: productType === 'VENTE' ? 'Spa / Jacuzzi' : productType === 'PARTENARIAT' ? 'Partenariat' : undefined,
    budget: undefined,
    message: text.substring(0, 1000),
    source: 'EMAIL',
    productType,
  };
}

// ─── Résolution du pays ──────────────────────────────────────────────────────

/**
 * Résout le pays à partir du préfixe téléphonique.
 * Retourne le code pays ISO 2 lettres ou null.
 */
export function resolveCountryFromPhone(phone: string): string | null {
  if (!phone) return null;
  const p = phone.replace(/\s/g, '');
  if (p.startsWith('+33') || p.startsWith('0033')) return 'FR';
  if (p.startsWith('+32') || p.startsWith('0032')) return 'BE';
  if (p.startsWith('+352')) return 'LU';
  if (p.startsWith('+49') || p.startsWith('0049')) return 'DE';
  if (p.startsWith('+31') || p.startsWith('0031')) return 'NL';
  if (p.startsWith('+34') || p.startsWith('0034')) return 'ES';
  if (p.startsWith('+41') || p.startsWith('0041')) return 'CH';
  if (p.startsWith('+39')) return 'IT';
  if (p.startsWith('+44')) return 'GB';
  if (p.startsWith('+351')) return 'PT';
  return null;
}

export function normalizeCountry(country?: string): string | null {
  if (!country) return null;
  const c = country.toLowerCase().trim();
  if (c === 'france' || c === 'fr') return 'FR';
  if (c === 'belgique' || c === 'belgie' || c === 'belgium' || c === 'be') return 'BE';
  if (c === 'luxembourg' || c === 'lu') return 'LU';
  if (c === 'espagne' || c === 'spain' || c === 'españa' || c === 'es') return 'ES';
  if (c === 'allemagne' || c === 'germany' || c === 'deutschland' || c === 'de') return 'DE';
  if (c === 'pays-bas' || c === 'netherlands' || c === 'nederland' || c === 'nl') return 'NL';
  if (c === 'suisse' || c === 'switzerland' || c === 'schweiz' || c === 'ch') return 'CH';
  if (c === 'italie' || c === 'italy' || c === 'italia' || c === 'it') return 'IT';
  if (c === 'portugal' || c === 'pt') return 'PT';
  if (c.length === 2) return c.toUpperCase();
  return country.substring(0, 2).toUpperCase();
}

// ─── ID du partenaire fallback par défaut (Les Valentins) ────────────────────
const DEFAULT_FALLBACK_PARTNER_ID = 60006; // Valentin (Les Valentins)

// ─── Mapping code postal → code région ISO ──────────────────────────────────

/**
 * Convertit un code postal en code région ISO (ex: "17810" → "FR-17", "4340" → "BE-WLG").
 * Ce code est ensuite utilisé pour chercher dans la table partner_territories.
 */
function postalCodeToRegionCode(postalCode: string, countryCode: string): string | null {
  if (!postalCode || !countryCode) return null;

  if (countryCode === 'FR') {
    // France : les 2 premiers chiffres du CP = numéro de département
    let dept = postalCode.substring(0, 2);
    // Cas spéciaux : Corse (20xxx → 2A ou 2B)
    if (dept === '20') {
      const cp = parseInt(postalCode, 10);
      dept = cp >= 20200 ? '2B' : '2A';
    }
    return `FR-${dept}`;
  }

  if (countryCode === 'BE') {
    // Belgique : les 2 premiers chiffres du CP → province
    const prefix = parseInt(postalCode.substring(0, 2), 10);
    if (prefix >= 10 && prefix <= 12) return 'BE-BRU'; // Bruxelles
    if (prefix >= 13 && prefix <= 14) return 'BE-WBR'; // Brabant wallon
    if (prefix >= 15 && prefix <= 19) return 'BE-VBR'; // Brabant flamand
    if (prefix >= 20 && prefix <= 29) return 'BE-VAN'; // Anvers
    if (prefix >= 30 && prefix <= 34) return 'BE-VBR'; // Brabant flamand (Leuven)
    if (prefix >= 35 && prefix <= 39) return 'BE-VLI'; // Limbourg
    if (prefix >= 40 && prefix <= 49) return 'BE-WLG'; // Liège
    if (prefix >= 50 && prefix <= 59) return 'BE-WNA'; // Namur
    if (prefix >= 60 && prefix <= 65) return 'BE-WHT'; // Hainaut
    if (prefix >= 66 && prefix <= 69) return 'BE-WLX'; // Luxembourg belge
    if (prefix >= 70 && prefix <= 79) return 'BE-WHT'; // Hainaut
    if (prefix >= 80 && prefix <= 84) return 'BE-VWV'; // Flandre occidentale
    if (prefix >= 85 && prefix <= 89) return 'BE-VWV'; // Flandre occidentale
    if (prefix >= 90 && prefix <= 99) return 'BE-VOV'; // Flandre orientale
    return null;
  }

  if (countryCode === 'LU') {
    return 'LU-L'; // Luxembourg n'a qu'une seule région
  }

  if (countryCode === 'DE') {
    const prefix = postalCode.substring(0, 2);
    return `DE-${prefix}`;
  }

  if (countryCode === 'NL') {
    const prefix = postalCode.substring(0, 2);
    return `NL-${prefix}`;
  }

  if (countryCode === 'ES') {
    const prefix = postalCode.substring(0, 2);
    return `ES-${prefix}`;
  }

  if (countryCode === 'CH') {
    const prefix = postalCode.substring(0, 2);
    return `CH-${prefix}`;
  }

  return null;
}

// ─── Attribution automatique des leads ──────────────────────────────────────

/**
 * Trouve le meilleur partenaire pour un lead en utilisant la table partner_territories en BDD.
 * 
 * Logique de résolution :
 * 1. Déterminer le pays : réponses formulaire → préfixe téléphonique → champ country
 * 2. Convertir le code postal en code région ISO (ex: "17810" → "FR-17")
 * 3. Chercher dans partner_territories quel partenaire couvre cette région
 * 4. Si aucun partenaire trouvé → chercher un partenaire qui couvre le pays entier
 * 5. Si toujours rien → fallback vers Les Valentins (ID 60006)
 */
export async function findBestPartnerForLead(params: {
  postalCode?: string;
  city?: string;
  country?: string;
  phone?: string;
}): Promise<{ partnerId: number | null; partnerName?: string; reason: string }> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return { partnerId: DEFAULT_FALLBACK_PARTNER_ID, reason: 'database_unavailable_fallback' };

  const { postalCode, city, phone } = params;
  let { country } = params;

  // ── 1. Résoudre le pays ─────────────────────────────────────────────────────
  // Priorité : préfixe téléphonique > champ country (car Meta met souvent "Belgium" par défaut)
  if (phone) {
    const cleanPhone = phone.replace(/\s/g, '');
    const phoneCountry = resolveCountryFromPhone(cleanPhone);
    if (phoneCountry) {
      if (!country || normalizeCountry(country) !== phoneCountry) {
        console.log(`[LeadRouting] Pays corrigé via téléphone: ${country} → ${phoneCountry} (phone: ${phone})`);
      }
      country = phoneCountry;
    }
  }

  const countryCode = normalizeCountry(country);
  console.log(`[LeadRouting] Routing lead: CP=${postalCode} Country=${country} Phone=${phone} → CountryCode=${countryCode}`);

  let conn: mysql.Connection | null = null;
  try {
    conn = await mysql.createConnection(dbUrl);

    // ── 2. Si on a un code postal, chercher le partenaire via la table partner_territories ──
    if (postalCode && countryCode) {
      const regionCode = postalCodeToRegionCode(postalCode, countryCode);
      console.log(`[LeadRouting] CP ${postalCode} → regionCode ${regionCode}`);

      if (regionCode) {
        // Chercher le partenaire qui a ce territoire assigné
        const [rows] = await conn.execute<mysql.RowDataPacket[]>(
          `SELECT pt.partnerId, p.companyName
           FROM partner_territories pt
           JOIN partners p ON p.id = pt.partnerId
           JOIN regions r ON r.id = pt.regionId
           WHERE r.code = ? AND p.status = 'APPROVED'
           LIMIT 1`,
          [regionCode]
        );
        if (rows.length > 0) {
          console.log(`[LeadRouting] Match territoire: ${regionCode} → ${rows[0].companyName} (ID ${rows[0].partnerId})`);
          return { partnerId: rows[0].partnerId, partnerName: rows[0].companyName, reason: `territory_${regionCode}` };
        }
        console.log(`[LeadRouting] Aucun partenaire pour le territoire ${regionCode}`);
      }
    }

    // ── 3. Chercher un partenaire qui couvre le pays entier ──────────────────
    if (countryCode) {
      // Chercher le pays dans la table countries
      const [countryRows] = await conn.execute<mysql.RowDataPacket[]>(
        'SELECT id FROM countries WHERE code = ?',
        [countryCode]
      );
      if (countryRows.length > 0) {
        const countryId = countryRows[0].id;
        // Chercher un partenaire qui a au moins un territoire dans ce pays
        const [rows] = await conn.execute<mysql.RowDataPacket[]>(
          `SELECT pt.partnerId, p.companyName, COUNT(*) as territoryCount
           FROM partner_territories pt
           JOIN partners p ON p.id = pt.partnerId
           JOIN regions r ON r.id = pt.regionId
           WHERE r.countryId = ? AND p.status = 'APPROVED'
           GROUP BY pt.partnerId, p.companyName
           ORDER BY territoryCount DESC
           LIMIT 1`,
          [countryId]
        );
        if (rows.length > 0) {
          console.log(`[LeadRouting] Fallback pays ${countryCode}: ${rows[0].companyName} (ID ${rows[0].partnerId}, ${rows[0].territoryCount} territoires)`);
          return { partnerId: rows[0].partnerId, partnerName: rows[0].companyName, reason: `country_fallback_${countryCode}` };
        }
      }
    }

    // ── 4. Fallback par défaut → Les Valentins ──────────────────────────────
    console.log(`[LeadRouting] Aucun match, fallback vers Les Valentins (ID ${DEFAULT_FALLBACK_PARTNER_ID})`);
    return { partnerId: DEFAULT_FALLBACK_PARTNER_ID, partnerName: 'Valentin', reason: 'default_fallback' };

  } catch (err) {
    console.error('[LeadRouting] Error:', err);
    return { partnerId: DEFAULT_FALLBACK_PARTNER_ID, partnerName: 'Valentin', reason: 'error_fallback' };
  } finally {
    if (conn) await conn.end();
  }
}
