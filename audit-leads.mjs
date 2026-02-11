import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Partenaires
  const [partners] = await conn.query('SELECT id, companyName, partner_level FROM partners ORDER BY id');
  console.log('=== PARTENAIRES ===');
  partners.forEach(p => console.log(p.id, p.companyName, p.partner_level));

  // Test attribution pour chaque lead
  console.log('\n=== TEST ATTRIBUTION LEADS ===');
  const [leadsData] = await conn.query('SELECT id, firstName, lastName, city, postalCode, assignedPartnerId FROM leads ORDER BY id');
  
  let okCount = 0, mismatchCount = 0, noRegionCount = 0, noPartnerCount = 0;
  
  for (const lead of leadsData) {
    if (!lead.postalCode) {
      console.log('NO CP | Lead', lead.id, lead.firstName, lead.lastName);
      continue;
    }
    const normalized = lead.postalCode.replace(/\s/g, '').toUpperCase();
    
    const [match] = await conn.query(
      'SELECT pcr.*, r.name as rname, r.id as rid FROM postal_code_ranges pcr JOIN regions r ON r.id = pcr.regionId WHERE ? >= pcr.startCode AND ? <= pcr.endCode LIMIT 1',
      [normalized, normalized]
    );
    
    if (match.length === 0) {
      noRegionCount++;
      console.log('NO REGION | Lead', lead.id, lead.firstName, lead.lastName, '| CP:', lead.postalCode, '| Assigned:', lead.assignedPartnerId);
      continue;
    }
    
    const [pt] = await conn.query(
      'SELECT pt.partnerId, p.companyName FROM partner_territories pt JOIN partners p ON p.id = pt.partnerId WHERE pt.regionId = ? LIMIT 1',
      [match[0].rid]
    );
    
    if (pt.length === 0) {
      noPartnerCount++;
      console.log('NO PARTNER FOR REGION | Lead', lead.id, lead.firstName, '| CP:', lead.postalCode, '| Region:', match[0].rname, '| Assigned:', lead.assignedPartnerId);
      continue;
    }
    
    const expectedPartner = pt[0];
    const ok = expectedPartner.partnerId === lead.assignedPartnerId;
    if (ok) {
      okCount++;
      console.log('OK | Lead', lead.id, lead.firstName, lead.lastName, '| CP:', lead.postalCode, '| Region:', match[0].rname, '| Partner:', expectedPartner.companyName);
    } else {
      mismatchCount++;
      console.log('MISMATCH | Lead', lead.id, lead.firstName, lead.lastName, '| CP:', lead.postalCode, '| Region:', match[0].rname, '| Assigned:', lead.assignedPartnerId, '| Expected:', expectedPartner.partnerId, '(' + expectedPartner.companyName + ')');
    }
  }
  
  console.log('\n=== RÉSUMÉ ===');
  console.log('Total leads:', leadsData.length);
  console.log('OK (correctement assignés):', okCount);
  console.log('MISMATCH (mal assignés):', mismatchCount);
  console.log('NO REGION (code postal non couvert):', noRegionCount);
  console.log('NO PARTNER (région sans partenaire):', noPartnerCount);
  
  // Test supplémentaire: codes postaux non couverts
  console.log('\n=== TEST CODES POSTAUX SPÉCIFIQUES ===');
  const testCodes = ['1000', '1080', '1332', '1440', '1755', '4000', '4890', '5000', '6043', '7333', '91350'];
  for (const code of testCodes) {
    const [match] = await conn.query(
      'SELECT pcr.*, r.name as rname, r.id as rid, c.code as cc FROM postal_code_ranges pcr JOIN regions r ON r.id = pcr.regionId JOIN countries c ON c.id = r.countryId WHERE ? >= pcr.startCode AND ? <= pcr.endCode',
      [code, code]
    );
    if (match.length === 0) {
      console.log(code, '-> PAS DE RÉGION TROUVÉE');
    } else {
      for (const m of match) {
        const [pt] = await conn.query(
          'SELECT pt.partnerId, p.companyName FROM partner_territories pt JOIN partners p ON p.id = pt.partnerId WHERE pt.regionId = ?',
          [m.rid]
        );
        console.log(code, '->', m.cc, m.rname, '| Partenaire:', pt.length > 0 ? pt.map(p => p.companyName).join(', ') : 'AUCUN');
      }
    }
  }
  
  await conn.end();
}

main().catch(e => console.error(e));
