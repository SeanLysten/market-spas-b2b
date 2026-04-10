import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// 1. Pays Luxembourg
const [luCountry] = await conn.query("SELECT * FROM countries WHERE code = 'LU'");
console.log('=== PAYS LUXEMBOURG ===');
console.log(JSON.stringify(luCountry, null, 2));

if (luCountry.length > 0) {
  const luId = luCountry[0].id;

  // 2. Régions du Luxembourg
  const [luRegions] = await conn.query("SELECT * FROM regions WHERE countryId = ?", [luId]);
  console.log('\n=== RÉGIONS LUXEMBOURG ===');
  console.log(JSON.stringify(luRegions, null, 2));

  // 3. Postal code ranges pour ces régions
  for (const r of luRegions) {
    const [ranges] = await conn.query("SELECT * FROM postal_code_ranges WHERE regionId = ?", [r.id]);
    console.log(`\n=== POSTAL CODE RANGES pour ${r.name} (${r.code}) ===`);
    console.log(JSON.stringify(ranges, null, 2));
  }

  // 4. Territoires partenaires Luxembourg
  const [territories] = await conn.query(`
    SELECT pt.id, pt.partnerId, pt.regionId, r.name as region_name, r.code as region_code, p.companyName
    FROM partner_territories pt
    INNER JOIN regions r ON r.id = pt.regionId
    INNER JOIN partners p ON p.id = pt.partnerId
    WHERE r.countryId = ?
  `, [luId]);
  console.log('\n=== TERRITOIRES PARTENAIRES LUXEMBOURG ===');
  console.log(JSON.stringify(territories, null, 2));
}

// 5. Vérifier le lead Juan-Cristobal
const [juanLeads] = await conn.query("SELECT id, firstName, lastName, postalCode, country, phone, assignedPartnerId, status, assignmentReason FROM leads WHERE postalCode = '6740'");
console.log('\n=== LEADS AVEC CP 6740 ===');
console.log(JSON.stringify(juanLeads, null, 2));

// 6. Chercher toutes les ranges qui matchent CP 6740
const [matching] = await conn.query(`
  SELECT pcr.regionId, pcr.startCode, pcr.endCode, r.name as region_name, r.code as region_code, c.name as country_name
  FROM postal_code_ranges pcr
  INNER JOIN regions r ON r.id = pcr.regionId
  INNER JOIN countries c ON c.id = r.countryId
  WHERE '6740' >= pcr.startCode AND '6740' <= pcr.endCode
`);
console.log('\n=== RANGES QUI MATCHENT CP 6740 ===');
console.log(JSON.stringify(matching, null, 2));

// 7. Vérifier SaniDesign
const [sani] = await conn.query("SELECT id, companyName FROM partners WHERE companyName LIKE '%Sani%'");
console.log('\n=== PARTENAIRE SANIDESIGN ===');
console.log(JSON.stringify(sani, null, 2));

await conn.end();
