import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Luxembourg region ID = 60001 (LU-L)
const regionId = 60001;

// Check if ranges already exist
const [existing] = await conn.query("SELECT * FROM postal_code_ranges WHERE regionId = ?", [regionId]);
if (existing.length > 0) {
  console.log("Luxembourg ranges already exist:", existing);
  await conn.end();
  process.exit(0);
}

// Luxembourg postal codes range from 1000 to 9999 (4 digits)
// We add a single range covering all Luxembourg postal codes
await conn.query(
  "INSERT INTO postal_code_ranges (regionId, startCode, endCode, description) VALUES (?, ?, ?, ?)",
  [regionId, "1000", "9999", "Grand-Duché de Luxembourg — tous codes postaux"]
);

console.log("✅ Added Luxembourg postal code range: 1000-9999 → LU-L (region 60001)");

// Verify
const [verify] = await conn.query("SELECT * FROM postal_code_ranges WHERE regionId = ?", [regionId]);
console.log("Verification:", JSON.stringify(verify, null, 2));

await conn.end();
