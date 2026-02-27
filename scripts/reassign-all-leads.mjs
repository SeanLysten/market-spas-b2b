/**
 * Réassigne TOUS les leads existants en utilisant la table partner_territories en BDD.
 * 
 * Logique :
 * 1. Déterminer le pays via : préfixe téléphonique → réponses formulaire → champ country
 * 2. Extraire le code postal des customFields si absent
 * 3. Convertir CP → code région ISO (ex: "17810" → "FR-17")
 * 4. Chercher dans partner_territories quel partenaire couvre cette région
 * 5. Si aucun match → fallback Les Valentins (60006)
 */

import mysql from 'mysql2/promise';

const DEFAULT_FALLBACK = 60006; // Valentin (Les Valentins)

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

function normalizeCountry(country) {
  if (!country) return null;
  const c = country.toLowerCase().trim();
  if (c === 'france' || c === 'fr') return 'FR';
  if (c === 'belgique' || c === 'belgie' || c === 'belgium' || c === 'be') return 'BE';
  if (c === 'luxembourg' || c === 'lu') return 'LU';
  if (c === 'espagne' || c === 'spain' || c === 'españa' || c === 'es') return 'ES';
  if (c === 'allemagne' || c === 'germany' || c === 'deutschland' || c === 'de') return 'DE';
  if (c === 'pays-bas' || c === 'netherlands' || c === 'nederland' || c === 'nl') return 'NL';
  if (c === 'suisse' || c === 'switzerland' || c === 'ch') return 'CH';
  if (c.length === 2) return c.toUpperCase();
  return null;
}

function postalCodeToRegionCode(postalCode, countryCode) {
  if (!postalCode || !countryCode) return null;
  
  if (countryCode === 'FR') {
    let dept = postalCode.substring(0, 2);
    if (dept === '20') {
      const cp = parseInt(postalCode, 10);
      dept = cp >= 20200 ? '2B' : '2A';
    }
    return `FR-${dept}`;
  }
  
  if (countryCode === 'BE') {
    const prefix = parseInt(postalCode.substring(0, 2), 10);
    if (prefix >= 10 && prefix <= 12) return 'BE-BRU';
    if (prefix >= 13 && prefix <= 14) return 'BE-WBR';
    if (prefix >= 15 && prefix <= 19) return 'BE-VBR';
    if (prefix >= 20 && prefix <= 29) return 'BE-VAN';
    if (prefix >= 30 && prefix <= 34) return 'BE-VBR';
    if (prefix >= 35 && prefix <= 39) return 'BE-VLI';
    if (prefix >= 40 && prefix <= 49) return 'BE-WLG';
    if (prefix >= 50 && prefix <= 59) return 'BE-WNA';
    if (prefix >= 60 && prefix <= 65) return 'BE-WHT';
    if (prefix >= 66 && prefix <= 69) return 'BE-WLX';
    if (prefix >= 70 && prefix <= 79) return 'BE-WHT';
    if (prefix >= 80 && prefix <= 89) return 'BE-VWV';
    if (prefix >= 90 && prefix <= 99) return 'BE-VOV';
    return null;
  }
  
  if (countryCode === 'LU') return 'LU-L';
  return null;
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Charger les territoires en mémoire
  const [territories] = await conn.execute(`
    SELECT pt.partnerId, r.code as regionCode, p.companyName
    FROM partner_territories pt
    JOIN regions r ON r.id = pt.regionId
    JOIN partners p ON p.id = pt.partnerId
    WHERE p.status = 'APPROVED'
  `);
  
  const territoryMap = {};
  for (const t of territories) {
    territoryMap[t.regionCode] = { partnerId: t.partnerId, partnerName: t.companyName };
  }
  console.log(`Loaded ${Object.keys(territoryMap).length} territory mappings`);
  
  // Charger tous les leads
  const [leads] = await conn.execute('SELECT id, phone, postalCode, country, customFields FROM leads');
  console.log(`Processing ${leads.length} leads...`);
  
  let updated = 0;
  let unchanged = 0;
  let fallback = 0;
  const stats = {};
  
  for (const lead of leads) {
    let { phone, postalCode, country } = lead;
    let customFields = {};
    
    // Parser les customFields
    try {
      if (lead.customFields) {
        customFields = typeof lead.customFields === 'string' ? JSON.parse(lead.customFields) : lead.customFields;
      }
    } catch {}
    
    // 1. Extraire le CP des customFields si absent
    if (!postalCode || postalCode.trim() === '') {
      postalCode = customFields.post_code || customFields.postal_code || customFields.zip || customFields.code_postal || '';
      if (postalCode && postalCode.length > 10) postalCode = '';
    }
    
    // 2. Résoudre le pays
    // Priorité 1 : préfixe téléphonique
    let countryCode = null;
    if (phone) {
      countryCode = resolveCountryFromPhone(phone.replace(/\s/g, ''));
    }
    // Priorité 2 : réponses formulaire
    if (!countryCode) {
      const formCountry = customFields.pays || customFields.country || customFields.PAYS;
      if (formCountry) {
        countryCode = normalizeCountry(formCountry);
      }
    }
    // Priorité 3 : champ country du lead
    if (!countryCode && country) {
      countryCode = normalizeCountry(country);
    }
    
    // 3. Convertir CP → code région
    let newPartnerId = null;
    let reason = '';
    
    if (postalCode && countryCode) {
      const regionCode = postalCodeToRegionCode(postalCode, countryCode);
      if (regionCode && territoryMap[regionCode]) {
        newPartnerId = territoryMap[regionCode].partnerId;
        reason = `territory_${regionCode}`;
      }
    }
    
    // 4. Fallback → Les Valentins
    if (!newPartnerId) {
      newPartnerId = DEFAULT_FALLBACK;
      reason = 'default_fallback';
      fallback++;
    }
    
    // Mettre à jour le lead
    const correctCountry = countryCode || normalizeCountry(country) || '';
    const correctCP = postalCode || '';
    
    if (lead.assignedPartnerId !== newPartnerId || lead.country !== correctCountry) {
      await conn.execute(
        'UPDATE leads SET assignedPartnerId = ?, assignmentReason = ?, country = ?, postalCode = COALESCE(NULLIF(?, ""), postalCode) WHERE id = ?',
        [newPartnerId, reason, correctCountry || lead.country, correctCP, lead.id]
      );
      updated++;
    } else {
      unchanged++;
    }
    
    // Stats
    const partnerName = territoryMap[postalCodeToRegionCode(postalCode, countryCode)]?.partnerName || 'Valentin (fallback)';
    stats[partnerName] = (stats[partnerName] || 0) + 1;
  }
  
  console.log(`\n=== Résumé ===`);
  console.log(`Leads mis à jour: ${updated}`);
  console.log(`Leads inchangés: ${unchanged}`);
  console.log(`Leads en fallback (Les Valentins): ${fallback}`);
  console.log(`\n=== Distribution par partenaire ===`);
  const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
  for (const [name, count] of sorted) {
    console.log(`  ${name}: ${count} leads`);
  }
  
  await conn.end();
}

main().catch(console.error);
