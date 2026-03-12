import mysql from 'mysql2/promise';
import { writeFileSync } from 'fs';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute(`
  SELECT id, companyName, addressStreet, addressCity, addressPostalCode, addressCountry, addressRegion, territory, status, primaryContactEmail
  FROM partners ORDER BY companyName
`);

writeFileSync('/home/ubuntu/partners.json', JSON.stringify(rows, null, 2));
for (const r of rows) {
  console.log(`${r.id} | ${r.companyName} | ${r.addressStreet}, ${r.addressPostalCode} ${r.addressCity} (${r.addressCountry}) | Territoire: ${r.territory || 'N/A'} | ${r.status}`);
}
console.log(`\nTotal: ${rows.length} partenaires`);
await conn.end();
