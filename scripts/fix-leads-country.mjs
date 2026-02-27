/**
 * Script de correction en masse des leads :
 * 1. Corrige le pays via préfixe téléphonique et réponses formulaire
 * 2. Extrait le code postal des customFields si manquant
 * 3. Réassigne au bon partenaire selon le mapping département/province
 */
import mysql2 from 'mysql2/promise';

// Mapping département FR → partenaire (ID)
const DEPT_TO_PARTNER_ID = {
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
const BE_PREFIX_TO_PARTNER_ID = {};
// Liège (40-49) et Namur (50-59) → Tahiti Piscines
for (let i = 40; i <= 59; i++) BE_PREFIX_TO_PARTNER_ID[String(i)] = 60013;
// Tout le reste → Market Spas Bruxelles
for (let i = 10; i <= 39; i++) BE_PREFIX_TO_PARTNER_ID[String(i)] = 60009;
for (let i = 60; i <= 99; i++) BE_PREFIX_TO_PARTNER_ID[String(i)] = 60009;

function resolveCountryFromPhone(phone) {
  if (!phone) return null;
  const p = phone.replace(/\s/g, '');
  if (p.startsWith('+33') || p.startsWith('0033')) return 'FR';
  if (p.startsWith('+32') || p.startsWith('0032')) return 'BE';
  if (p.startsWith('+352')) return 'LU';
  if (p.startsWith('+49') || p.startsWith('0049')) return 'DE';
  if (p.startsWith('+31') || p.startsWith('0031')) return 'NL';
  if (p.startsWith('+34') || p.startsWith('0034')) return 'ES';
  if (p.startsWith('+41') || p.startsWith('0041')) return 'CH';
  return null;
}

function resolveCountryFromForm(customFields) {
  if (!customFields) return null;
  try {
    const data = JSON.parse(customFields);
    const pays = data.pays || data.country || data.land || '';
    if (!pays) return null;
    const p = pays.toLowerCase().trim();
    if (p === 'fr' || p === 'france') return 'FR';
    if (p === 'be' || p === 'belgique' || p === 'belgium') return 'BE';
    if (p === 'lu' || p === 'luxembourg') return 'LU';
    if (p === 'de' || p === 'allemagne' || p === 'germany') return 'DE';
    if (p === 'nl' || p === 'pays-bas' || p === 'netherlands') return 'NL';
    if (p === 'es' || p === 'espagne' || p === 'spain') return 'ES';
    if (p === 'ch' || p === 'suisse' || p === 'switzerland') return 'CH';
    return null;
  } catch { return null; }
}

function extractPostalCode(customFields) {
  if (!customFields) return null;
  try {
    const data = JSON.parse(customFields);
    return data.post_code || data.postal_code || data.zip || data.code_postal || data.postcode || null;
  } catch { return null; }
}

function normalizeCountryName(code) {
  if (code === 'FR') return 'France';
  if (code === 'BE') return 'Belgium';
  if (code === 'LU') return 'Luxembourg';
  if (code === 'DE') return 'Germany';
  if (code === 'NL') return 'Netherlands';
  if (code === 'ES') return 'Spain';
  if (code === 'CH') return 'Switzerland';
  return code;
}

function normalizeCountryCode(country) {
  if (!country) return null;
  const c = country.toLowerCase().trim();
  if (c === 'france' || c === 'fr') return 'FR';
  if (c === 'belgique' || c === 'belgie' || c === 'belgium' || c === 'be') return 'BE';
  if (c === 'luxembourg' || c === 'lu') return 'LU';
  if (c === 'espagne' || c === 'spain' || c === 'españa' || c === 'es') return 'ES';
  if (c === 'allemagne' || c === 'germany' || c === 'deutschland' || c === 'de') return 'DE';
  if (c === 'pays-bas' || c === 'netherlands' || c === 'nederland' || c === 'nl') return 'NL';
  if (c === 'suisse' || c === 'switzerland' || c === 'schweiz' || c === 'ch') return 'CH';
  return null;
}

function findPartner(postalCode, countryCode) {
  // 1. Département FR
  if (countryCode === 'FR' && postalCode && postalCode.length >= 2) {
    const dept = postalCode.substring(0, 2);
    if (DEPT_TO_PARTNER_ID[dept]) return { id: DEPT_TO_PARTNER_ID[dept], reason: `dept_${dept}` };
  }
  // 2. Province BE
  if (countryCode === 'BE' && postalCode && postalCode.length >= 2) {
    const prefix = postalCode.substring(0, 2);
    if (BE_PREFIX_TO_PARTNER_ID[prefix]) return { id: BE_PREFIX_TO_PARTNER_ID[prefix], reason: `be_province_${prefix}` };
  }
  // 3. Fallback pays
  if (countryCode === 'FR') return { id: 60002, reason: 'country_fallback_FR' };
  if (countryCode === 'BE') return { id: 60009, reason: 'country_fallback_BE' };
  if (countryCode === 'LU') return { id: 60015, reason: 'country_LU' };
  if (countryCode === 'ES') return { id: 60001, reason: 'country_ES' };
  return null;
}

async function main() {
  const conn = await mysql2.createConnection(process.env.DATABASE_URL);

  // Récupérer TOUS les leads
  const [allLeads] = await conn.execute(
    'SELECT id, phone, postalCode, country, customFields, assignedPartnerId, assignmentReason FROM leads ORDER BY id'
  );

  console.log(`Total leads: ${allLeads.length}`);

  let countryFixed = 0;
  let postalCodeFixed = 0;
  let reassigned = 0;
  let alreadyCorrect = 0;

  for (const lead of allLeads) {
    let postalCode = lead.postalCode || '';
    let country = lead.country || '';
    let needsUpdate = false;
    const updates = {};

    // 1. Extraire le CP des customFields si manquant
    if (!postalCode) {
      const extractedCP = extractPostalCode(lead.customFields);
      if (extractedCP && extractedCP.length <= 10 && /^[0-9]{4,5}$/.test(extractedCP)) {
        postalCode = extractedCP;
        updates.postalCode = postalCode;
        postalCodeFixed++;
        needsUpdate = true;
      }
    }

    // 2. Résoudre le vrai pays
    // Priorité : réponse formulaire > préfixe téléphonique > pays existant
    const formCountry = resolveCountryFromForm(lead.customFields);
    const phoneCountry = resolveCountryFromPhone(lead.phone);
    
    let resolvedCountryCode = null;
    if (formCountry) {
      resolvedCountryCode = formCountry;
    } else if (phoneCountry) {
      resolvedCountryCode = phoneCountry;
    } else {
      resolvedCountryCode = normalizeCountryCode(country);
    }

    // Vérifier si le pays actuel est incorrect
    const currentCountryCode = normalizeCountryCode(country);
    if (resolvedCountryCode && resolvedCountryCode !== currentCountryCode) {
      const newCountryName = normalizeCountryName(resolvedCountryCode);
      updates.country = newCountryName;
      countryFixed++;
      needsUpdate = true;
      country = newCountryName;
    }

    // 3. Trouver le bon partenaire
    const countryCode = resolvedCountryCode || currentCountryCode;
    if (countryCode) {
      const partner = findPartner(postalCode, countryCode);
      if (partner && partner.id !== lead.assignedPartnerId) {
        updates.assignedPartnerId = partner.id;
        updates.assignedAt = new Date();
        updates.assignmentReason = partner.reason;
        updates.status = 'ASSIGNED';
        reassigned++;
        needsUpdate = true;
      } else if (partner && partner.id === lead.assignedPartnerId) {
        alreadyCorrect++;
      }
    }

    // 4. Appliquer les mises à jour
    if (needsUpdate && Object.keys(updates).length > 0) {
      const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = Object.values(updates);
      values.push(lead.id);
      await conn.execute(`UPDATE leads SET ${setClauses} WHERE id = ?`, values);
    }
  }

  console.log(`\n=== Résultats ===`);
  console.log(`Pays corrigés: ${countryFixed}`);
  console.log(`Codes postaux extraits: ${postalCodeFixed}`);
  console.log(`Leads réassignés: ${reassigned}`);
  console.log(`Déjà corrects: ${alreadyCorrect}`);

  // Stats finales
  const [stats] = await conn.execute(`
    SELECT 
      country, 
      COUNT(*) as total,
      SUM(CASE WHEN assignedPartnerId IS NOT NULL THEN 1 ELSE 0 END) as assigned
    FROM leads 
    GROUP BY country 
    ORDER BY total DESC
  `);
  console.log('\n=== Distribution par pays (après correction) ===');
  for (const s of stats) {
    console.log(`  ${s.country || 'VIDE'}: ${s.total} leads (${s.assigned} assignés)`);
  }

  await conn.end();
}

main().catch(console.error);
