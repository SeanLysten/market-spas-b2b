import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  const [total] = await conn.execute("SELECT COUNT(*) as cnt FROM leads");
  console.log("Total leads:", (total as any)[0].cnt);

  const [hasCf] = await conn.execute(
    "SELECT COUNT(*) as cnt FROM leads WHERE customFields IS NOT NULL AND LENGTH(customFields) > 5"
  );
  console.log("customFields non-empty:", (hasCf as any)[0].cnt);

  const [samples] = await conn.execute(
    "SELECT id, firstName, lastName, email, LEFT(customFields, 500) as cf FROM leads WHERE customFields IS NOT NULL AND LENGTH(customFields) > 5 ORDER BY id DESC LIMIT 5"
  );
  for (const s of samples as any[]) {
    console.log(`\nLead #${s.id}: ${s.firstName} ${s.lastName} (${s.email})`);
    console.log("customFields:", s.cf);
  }

  const [pc] = await conn.execute(
    "SELECT COUNT(*) as cnt FROM leads WHERE customFields LIKE '%company_name%'"
  );
  console.log("\nLeads avec company_name:", (pc as any)[0].cnt);

  const [sr] = await conn.execute(
    "SELECT COUNT(*) as cnt FROM leads WHERE customFields LIKE '%showroom%'"
  );
  console.log("Leads avec showroom:", (sr as any)[0].cnt);

  // Show partner-type leads
  const [partnerSamples] = await conn.execute(
    "SELECT id, firstName, lastName, email, customFields FROM leads WHERE customFields LIKE '%company_name%' OR customFields LIKE '%showroom%' LIMIT 3"
  );
  for (const s of partnerSamples as any[]) {
    console.log(`\n=== PARTNER LEAD #${s.id}: ${s.firstName} ${s.lastName} ===`);
    console.log("customFields:", s.customFields?.toString().substring(0, 800));
  }

  await conn.end();
}

main().catch(console.error);
