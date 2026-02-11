import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  // Count existing candidates
  const [candidates] = await conn.execute("SELECT COUNT(*) as cnt FROM partner_candidates");
  console.log("Total partner_candidates:", (candidates as any)[0].cnt);

  // Count leads with company_name
  const [partnerLeads] = await conn.execute(
    "SELECT COUNT(*) as cnt FROM leads WHERE customFields LIKE '%company_name%'"
  );
  console.log("Leads with company_name:", (partnerLeads as any)[0].cnt);

  // Check overlap: leads with company_name that match existing candidates by email
  const [overlap] = await conn.execute(`
    SELECT l.id, l.email, pc.email as candidate_email, pc.companyName 
    FROM leads l 
    INNER JOIN partner_candidates pc ON LOWER(l.email) = LOWER(pc.email)
    WHERE l.customFields LIKE '%company_name%'
    LIMIT 10
  `);
  console.log("\nOverlap (leads already in candidates):", (overlap as any[]).length);
  for (const o of overlap as any[]) {
    console.log(`  Lead #${o.id}: ${o.email} => Candidate: ${o.companyName}`);
  }

  // Show all distinct keys from partner leads
  const [allPartnerLeads] = await conn.execute(
    "SELECT customFields FROM leads WHERE customFields LIKE '%company_name%'"
  );
  const allKeys = new Set<string>();
  for (const row of allPartnerLeads as any[]) {
    try {
      const cf = JSON.parse(row.customFields);
      for (const key of Object.keys(cf)) {
        allKeys.add(key);
      }
    } catch {}
  }
  console.log("\nAll distinct keys in partner leads:", [...allKeys].join(", "));

  await conn.end();
}

main().catch(console.error);
