import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute(
  "SELECT id, name, email, role, partnerId FROM users WHERE role IN ('PARTNER', 'PARTNER_ADMIN', 'PARTNER_USER')"
);
console.log("Partner users:", JSON.stringify(rows, null, 2));

const [partners] = await conn.execute("SELECT id, companyName FROM partners LIMIT 5");
console.log("Partners:", JSON.stringify(partners, null, 2));

await conn.end();
