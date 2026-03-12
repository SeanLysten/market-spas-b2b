import mysql from 'mysql2/promise';
import { writeFileSync } from 'fs';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const dbConn = await mysql.createConnection(dbUrl);

const [rows] = await dbConn.execute(`
  SELECT 
    l.id,
    l.firstName,
    l.lastName,
    l.email AS lead_email,
    l.phone AS lead_phone,
    l.postalCode,
    l.city,
    l.productInterest,
    l.receivedAt,
    l.status,
    p.id AS partner_id,
    p.companyName AS partner_name,
    p.primaryContactEmail AS partner_email,
    u.email AS partner_user_email,
    u.name AS partner_user_name
  FROM leads l
  LEFT JOIN partners p ON l.assignedPartnerId = p.id
  LEFT JOIN users u ON p.id = u.partnerId
  WHERE l.leadType = 'VENTE'
    AND l.assignedPartnerId IS NOT NULL
    AND l.receivedAt >= DATE_SUB(NOW(), INTERVAL 3 WEEK)
  ORDER BY p.companyName, l.receivedAt DESC
`);

// Group by partner
const partnerGroups = {};
for (const row of rows) {
  const key = row.partner_id;
  if (!partnerGroups[key]) {
    partnerGroups[key] = {
      partner_name: row.partner_name,
      partner_email: row.partner_email,
      partner_user_email: row.partner_user_email,
      partner_user_name: row.partner_user_name,
      leads: []
    };
  }
  partnerGroups[key].leads.push({
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.lead_email,
    phone: row.lead_phone,
    postalCode: row.postalCode,
    city: row.city,
    productInterest: row.productInterest,
    receivedAt: row.receivedAt,
    status: row.status,
  });
}

writeFileSync('/home/ubuntu/leads_by_partner.json', JSON.stringify(partnerGroups, null, 2));
console.log('Done! Partners:', Object.keys(partnerGroups).length);
for (const [pid, info] of Object.entries(partnerGroups)) {
  const email = info.partner_email || info.partner_user_email || 'PAS D EMAIL';
  console.log(`  ${info.partner_name} (${email}) - ${info.leads.length} leads`);
}
console.log(`Total: ${rows.length} leads`);

await dbConn.end();
