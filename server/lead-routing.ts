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
    // Un seul mot-clé spam : vérifier si un mot-clé lead compense
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
      // Normaliser le téléphone (supprimer espaces, tirets, points)
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

    // Construire la mise à jour : ne mettre à jour que les champs vides
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
      // Ajouter le message en annexe (ne pas écraser)
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
 * Inclut la classification et la détection de doublon.
 */
export function parseEmailForLead(
  subject: string,
  body: string,
  fromEmail: string
): ParsedEmail {
  const { category, confidence, productType } = classifyEmail(subject, body, fromEmail);
  const isLead = category === 'LEAD_VENTE' || category === 'LEAD_PARTENARIAT';

  if (!isLead) {
    return {
      category,
      isLead: false,
      confidence,
      source: 'EMAIL',
    };
  }

  // Extraction des champs depuis le corps de l'email
  const extractField = (labels: string[]): string | undefined => {
    for (const label of labels) {
      const pattern = new RegExp(`${label}[:\\s]+([^\\n<]{2,80})`, 'i');
      const match = body.match(pattern);
      if (match) return match[1].trim().replace(/\s+/g, ' ');
    }
    return undefined;
  };

  // Code postal (4 ou 5 chiffres)
  const cpMatch = body.match(/\b(\d{4,5})\b/);
  const postalCode = cpMatch ? cpMatch[1] : undefined;

  // Téléphone
  const phoneMatch =
    body.match(/(?:téléphone|phone|tel|tél|gsm|mobile)[:\s]*([+\d\s().\-]{8,20})/i) ||
    body.match(/\b((?:\+32|0032|04|0[1-9])[\s.\-]?\d{2}[\s.\-]?\d{2}[\s.\-]?\d{2}[\s.\-]?\d{2})\b/) ||
    body.match(/\b((?:\+33|0033|0)[1-9](?:[\s.\-]?\d{2}){4})\b/);
  const phone = phoneMatch ? phoneMatch[1].trim() : undefined;

  // Email (depuis le corps ou l'expéditeur)
  const emailMatch = body.match(/\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/);
  const email = emailMatch ? emailMatch[1] : fromEmail;

  return {
    category,
    isLead: true,
    confidence,
    source: 'EMAIL',
    productType,
    email,
    phone,
    postalCode,
    city: extractField(['ville', 'city', 'stad', 'ciudad', 'ort']),
    country: extractField(['pays', 'country', 'land', 'país']),
    firstName: extractField(['prénom', 'prenom', 'first name', 'voornaam', 'nombre', 'vorname']),
    lastName: extractField(['nom', 'last name', 'achternaam', 'apellido', 'nachname']),
    productInterest: extractField(['projet', 'project', 'produit', 'product', 'type de spa', 'spa type']),
    budget: extractField(['budget', 'montant', 'amount']),
    message: body.substring(0, 1000),
  };
}

// ─── Routing géographique ─────────────────────────────────────────────────────

/**
 * Trouve le partenaire le plus approprié pour un lead
 * selon son code postal et son pays.
 */
export async function findBestPartnerForLead(params: {
  postalCode?: string;
  city?: string;
  country?: string;
}): Promise<{ partnerId: number | null; reason: string }> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return { partnerId: null, reason: 'database_unavailable' };

  const { postalCode, city, country } = params;
  const countryCode = normalizeCountry(country);

  console.log(`[LeadRouting] Routing lead: CP=${postalCode} Country=${country} → CountryCode=${countryCode}`);

  let conn: mysql.Connection | null = null;
  try {
    conn = await mysql.createConnection(dbUrl);

    // 1. Correspondance exacte par code postal
    if (postalCode) {
      const [rows] = await conn.execute<mysql.RowDataPacket[]>(
        'SELECT id FROM partners WHERE addressPostalCode = ? AND status = ? LIMIT 1',
        [postalCode, 'APPROVED']
      );
      if (rows.length > 0) {
        return { partnerId: rows[0].id, reason: `exact_postal_code_${postalCode}` };
      }
    }

    // 2. Correspondance par département FR (mapping statique)
    if (postalCode && countryCode === 'FR' && postalCode.length >= 2) {
      const dept = postalCode.substring(0, 2);
      if (DEPT_TO_PARTNER_ID[dept]) {
        return { partnerId: DEPT_TO_PARTNER_ID[dept], reason: `dept_${dept}` };
      }
      // Fallback DB si le département n'est pas dans le mapping
      const [rows] = await conn.execute<mysql.RowDataPacket[]>(
        'SELECT id FROM partners WHERE addressCountry = ? AND status = ? AND addressPostalCode LIKE ? LIMIT 1',
        ['FR', 'APPROVED', `${dept}%`]
      );
      if (rows.length > 0) {
        return { partnerId: rows[0].id, reason: `dept_db_${dept}` };
      }
    }

    // 3. Correspondance par province BE (mapping statique)
    if (postalCode && countryCode === 'BE' && postalCode.length >= 2) {
      const prefix = postalCode.substring(0, 2);
      if (BE_PREFIX_TO_PARTNER_ID[prefix]) {
        return { partnerId: BE_PREFIX_TO_PARTNER_ID[prefix], reason: `be_province_${prefix}` };
      }
    }

    // 4. Correspondance par pays (fallback)
    if (countryCode === 'FR') {
      return { partnerId: 60002, reason: 'country_fallback_FR' }; // Fab'Elec
    }
    if (countryCode === 'BE') {
      return { partnerId: 60009, reason: 'country_fallback_BE' }; // Market Spas Bruxelles
    }
    if (countryCode === 'LU') {
      return { partnerId: 60015, reason: 'country_LU' }; // SaniDesign
    }
    if (countryCode === 'ES') {
      return { partnerId: 60001, reason: 'country_ES' }; // Market Spas Palmones
    }
    // Fallback DB générique
    if (countryCode) {
      const [rows] = await conn.execute<mysql.RowDataPacket[]>(
        'SELECT id FROM partners WHERE addressCountry = ? AND status = ? LIMIT 1',
        [countryCode, 'APPROVED']
      );
      if (rows.length > 0) {
        return { partnerId: rows[0].id, reason: `country_db_${countryCode}` };
      }
    }

    return { partnerId: null, reason: 'no_match' };
  } catch (err) {
    console.error('[LeadRouting] Error:', err);
    return { partnerId: null, reason: 'error' };
  } finally {
    if (conn) await conn.end();
  }
}

// Mapping département FR → partenaire (ID)
const DEPT_TO_PARTNER_ID: Record<string, number> = {
  // Normandie
  '14': 60002, '27': 60002, '50': 60002, '61': 60002, '76': 60004,
  // Hauts-de-France
  '59': 60007, '60': 60008, '62': 60007, '80': 60006, '02': 60006,
  // Nouvelle-Aquitaine
  '16': 60003, '17': 60003, '19': 60005, '23': 60005, '24': 60003,
  '33': 60003, '40': 60003, '47': 60003, '64': 60003, '79': 60003,
  '86': 60003, '87': 60005,
  // Auvergne-Rhône-Alpes
  '01': 60010, '03': 60010, '07': 60010, '15': 60010, '26': 60010,
  '38': 60012, '42': 60010, '43': 60010, '63': 60010, '69': 60010,
  '73': 60010, '74': 60010,
  // Bourgogne-Franche-Comté
  '21': 60011, '25': 60014, '39': 60011, '58': 60011, '70': 60014,
  '71': 60011, '89': 60011, '90': 60014,
  // Grand Est
  '08': 60016, '10': 60016, '51': 60016, '52': 60016, '54': 60016,
  '55': 60016, '57': 60016, '67': 60016, '68': 60016, '88': 60016,
  // Île-de-France
  '75': 60008, '77': 60008, '78': 60008, '91': 60008, '92': 60008,
  '93': 60008, '94': 60008, '95': 60008,
  // Bretagne
  '22': 60002, '29': 60002, '35': 60002, '56': 60002,
  // Pays de la Loire
  '44': 60002, '49': 60002, '53': 60002, '72': 60002, '85': 60002,
  // Centre-Val de Loire
  '18': 60011, '28': 60008, '36': 60011, '37': 60011, '41': 60011, '45': 60008,
  // PACA
  '04': 60012, '05': 60012, '06': 60012, '13': 60012, '83': 60012, '84': 60012,
  // Occitanie
  '09': 60003, '11': 60003, '12': 60003, '30': 60012, '31': 60003,
  '32': 60003, '34': 60003, '46': 60003, '48': 60003, '65': 60003,
  '66': 60003, '81': 60003, '82': 60003,
};

// Mapping province BE (2 premiers chiffres CP) → partenaire
const BE_PREFIX_TO_PARTNER_ID: Record<string, number> = {
  // Bruxelles + Brabant (10-19)
  '10': 60009, '11': 60009, '12': 60009, '13': 60009, '14': 60009,
  '15': 60009, '16': 60009, '17': 60009, '18': 60009, '19': 60009,
  // Anvers (20-29)
  '20': 60009, '21': 60009, '22': 60009, '23': 60009, '24': 60009,
  '25': 60009, '26': 60009, '27': 60009, '28': 60009, '29': 60009,
  // Limbourg (30-39)
  '30': 60009, '31': 60009, '32': 60009, '33': 60009, '34': 60009,
  '35': 60009, '36': 60009, '37': 60009, '38': 60009, '39': 60009,
  // Liège (40-49)
  '40': 60013, '41': 60013, '42': 60013, '43': 60013, '44': 60013,
  '45': 60013, '46': 60013, '47': 60013, '48': 60013, '49': 60013,
  // Namur (50-59)
  '50': 60013, '51': 60013, '52': 60013, '53': 60013, '54': 60013,
  '55': 60013, '56': 60013, '57': 60013, '58': 60013, '59': 60013,
  // Hainaut + Luxembourg belge (60-79)
  '60': 60009, '61': 60009, '62': 60009, '63': 60009, '64': 60009,
  '65': 60009, '66': 60009, '67': 60009, '68': 60009, '69': 60009,
  '70': 60009, '71': 60009, '72': 60009, '73': 60009, '74': 60009,
  '75': 60009, '76': 60009, '77': 60009, '78': 60009, '79': 60009,
  // Flandre (80-99)
  '80': 60009, '81': 60009, '82': 60009, '83': 60009, '84': 60009,
  '85': 60009, '86': 60009, '87': 60009, '88': 60009, '89': 60009,
  '90': 60009, '91': 60009, '92': 60009, '93': 60009, '94': 60009,
  '95': 60009, '96': 60009, '97': 60009, '98': 60009, '99': 60009,
};

function normalizeCountry(country?: string): string | null {
  if (!country) return null;
  const c = country.toLowerCase().trim();
  if (c === 'france' || c === 'fr') return 'FR';
  if (c === 'belgique' || c === 'belgie' || c === 'belgium' || c === 'be') return 'BE';
  if (c === 'luxembourg' || c === 'lu') return 'LU';
  if (c === 'espagne' || c === 'spain' || c === 'españa' || c === 'es') return 'ES';
  if (c === 'allemagne' || c === 'germany' || c === 'deutschland' || c === 'de') return 'DE';
  if (c === 'pays-bas' || c === 'netherlands' || c === 'nederland' || c === 'nl') return 'NL';
  return country.substring(0, 2).toUpperCase();
}

function getRegionFromPostalCode(postalCode: string): string | null {
  const cp = parseInt(postalCode.substring(0, 2), 10);
  if (isNaN(cp)) return null;
  if ([75, 77, 78, 91, 92, 93, 94, 95].includes(cp)) return 'Île-de-France';
  if ([59, 60, 62, 80, 2].includes(cp)) return 'Hauts-de-France';
  if ([14, 27, 50, 61, 76].includes(cp)) return 'Normandie';
  if ([8, 10, 51, 52, 54, 55, 57, 67, 68, 88].includes(cp)) return 'Grand Est';
  if ([21, 25, 39, 58, 70, 71, 89, 90].includes(cp)) return 'Bourgogne-Franche-Comté';
  if ([1, 3, 7, 15, 26, 38, 42, 43, 63, 69, 73, 74].includes(cp)) return 'Auvergne-Rhône-Alpes';
  if ([4, 5, 6, 13, 83, 84].includes(cp)) return "Provence-Alpes-Côte d'Azur";
  if ([9, 11, 12, 30, 31, 32, 34, 46, 48, 65, 66, 81, 82].includes(cp)) return 'Occitanie';
  if ([16, 17, 19, 23, 24, 33, 40, 47, 64, 79, 86, 87].includes(cp)) return 'Nouvelle-Aquitaine';
  if ([44, 49, 53, 72, 85].includes(cp)) return 'Pays de la Loire';
  if ([22, 29, 35, 56].includes(cp)) return 'Bretagne';
  if ([18, 28, 36, 37, 41, 45].includes(cp)) return 'Centre-Val de Loire';
  return null;
}
