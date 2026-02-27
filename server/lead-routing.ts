/**
 * Lead Routing — Attribution automatique des leads aux partenaires
 * selon le code postal, la ville et le pays du lead.
 */
import mysql from 'mysql2/promise';

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

    // ── 1. Correspondance exacte par code postal ──────────────────────────────
    if (postalCode) {
      const [rows] = await conn.execute<mysql.RowDataPacket[]>(
        'SELECT id FROM partners WHERE addressPostalCode = ? AND status = ? LIMIT 1',
        [postalCode, 'APPROVED']
      );
      if (rows.length > 0) {
        console.log(`[LeadRouting] Exact match: partner ${rows[0].id} for CP ${postalCode}`);
        return { partnerId: rows[0].id, reason: `exact_postal_code_${postalCode}` };
      }
    }

    // ── 2. Correspondance par département (2 premiers chiffres pour FR) ────────
    if (postalCode && countryCode === 'FR' && postalCode.length >= 2) {
      const dept = postalCode.substring(0, 2);
      const [rows] = await conn.execute<mysql.RowDataPacket[]>(
        'SELECT id FROM partners WHERE addressCountry = ? AND status = ? AND addressPostalCode LIKE ? LIMIT 1',
        ['FR', 'APPROVED', `${dept}%`]
      );
      if (rows.length > 0) {
        console.log(`[LeadRouting] Dept match: partner ${rows[0].id} for dept ${dept}`);
        return { partnerId: rows[0].id, reason: `department_match_${dept}` };
      }
    }

    // ── 3. Correspondance par région ─────────────────────────────────────────
    if (postalCode && countryCode === 'FR') {
      const region = getRegionFromPostalCode(postalCode);
      if (region) {
        const [rows] = await conn.execute<mysql.RowDataPacket[]>(
          'SELECT id FROM partners WHERE addressCountry = ? AND status = ? AND addressRegion LIKE ? LIMIT 1',
          ['FR', 'APPROVED', `%${region}%`]
        );
        if (rows.length > 0) {
          console.log(`[LeadRouting] Region match: partner ${rows[0].id} for region ${region}`);
          return { partnerId: rows[0].id, reason: `region_match_${region}` };
        }
      }
    }

    // ── 4. Correspondance par pays ────────────────────────────────────────────
    if (countryCode) {
      const [rows] = await conn.execute<mysql.RowDataPacket[]>(
        'SELECT id FROM partners WHERE addressCountry = ? AND status = ? LIMIT 1',
        [countryCode, 'APPROVED']
      );
      if (rows.length > 0) {
        console.log(`[LeadRouting] Country match: partner ${rows[0].id} for country ${countryCode}`);
        return { partnerId: rows[0].id, reason: `country_match_${countryCode}` };
      }
    }

    console.log(`[LeadRouting] No match found for CP=${postalCode} Country=${countryCode}`);
    return { partnerId: null, reason: 'no_match' };
  } catch (err) {
    console.error('[LeadRouting] Error:', err);
    return { partnerId: null, reason: 'error' };
  } finally {
    if (conn) await conn.end();
  }
}

/**
 * Normalise le nom de pays en code ISO 2 lettres
 */
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

/**
 * Détermine la région française à partir du code postal
 */
function getRegionFromPostalCode(postalCode: string): string | null {
  const cp = parseInt(postalCode.substring(0, 2), 10);
  if (isNaN(cp)) return null;

  if ([75, 77, 78, 91, 92, 93, 94, 95].includes(cp)) return 'Île-de-France';
  if ([59, 60, 62, 80, 2].includes(cp)) return 'Hauts-de-France';
  if ([14, 27, 50, 61, 76].includes(cp)) return 'Normandie';
  if ([8, 10, 51, 52, 54, 55, 57, 67, 68, 88].includes(cp)) return 'Grand Est';
  if ([21, 25, 39, 58, 70, 71, 89, 90].includes(cp)) return 'Bourgogne-Franche-Comté';
  if ([1, 3, 7, 15, 26, 38, 42, 43, 63, 69, 73, 74].includes(cp)) return 'Auvergne-Rhône-Alpes';
  if ([4, 5, 6, 13, 83, 84].includes(cp)) return 'Provence-Alpes-Côte d\'Azur';
  if ([9, 11, 12, 30, 31, 32, 34, 46, 48, 65, 66, 81, 82].includes(cp)) return 'Occitanie';
  if ([16, 17, 19, 23, 24, 33, 40, 47, 64, 79, 86, 87].includes(cp)) return 'Nouvelle-Aquitaine';
  if ([44, 49, 53, 72, 85].includes(cp)) return 'Pays de la Loire';
  if ([22, 29, 35, 56].includes(cp)) return 'Bretagne';
  if ([18, 28, 36, 37, 41, 45].includes(cp)) return 'Centre-Val de Loire';

  return null;
}

/**
 * Parse un email entrant pour en extraire les données de lead
 */
export function parseEmailForLead(subject: string, body: string, fromEmail: string): {
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
  isLeadEmail: boolean;
} {
  const leadKeywords = [
    'devis', 'quote', 'spa', 'jacuzzi', 'prix', 'price', 'offerte',
    'demande', 'request', 'aanvraag', 'contact', 'renseignement',
    'information', 'acheter', 'buy', 'kopen', 'partenariat', 'partnership',
    'revendeur', 'distributeur', 'reseller', 'dealer'
  ];

  const fullText = (subject + ' ' + body).toLowerCase();
  const isLeadEmail = leadKeywords.some(kw => fullText.includes(kw));

  if (!isLeadEmail) {
    return { isLeadEmail: false };
  }

  const extractField = (label: string): string | undefined => {
    const pattern = new RegExp(`${label}[:\\s]+([^\\n<]+)`, 'i');
    const match = body.match(pattern);
    return match ? match[1].trim() : undefined;
  };

  const cpMatch = body.match(/\b(\d{4,5})\b/);
  const postalCode = cpMatch ? cpMatch[1] : undefined;

  const phoneMatch = body.match(/(?:téléphone|phone|tel|tél)[:\s]*([+\d\s().-]{8,20})/i)
    || body.match(/\b((?:\+33|0033|0)[1-9](?:[\s.-]?\d{2}){4})\b/);
  const phone = phoneMatch ? phoneMatch[1].trim() : undefined;

  const emailMatch = body.match(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/);
  const email = emailMatch ? emailMatch[1] : fromEmail;

  return {
    isLeadEmail: true,
    email,
    phone,
    postalCode,
    city: extractField('ville') || extractField('city') || extractField('stad'),
    country: extractField('pays') || extractField('country') || extractField('land'),
    firstName: extractField('prénom') || extractField('prenom') || extractField('first name') || extractField('voornaam'),
    lastName: extractField('nom') || extractField('last name') || extractField('achternaam'),
    productInterest: extractField('projet') || extractField('project') || extractField('produit'),
    budget: extractField('budget'),
    message: body.substring(0, 1000),
  };
}
