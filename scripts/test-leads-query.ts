import { drizzle } from "drizzle-orm/mysql2";
import { leads, partners } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("DATABASE_URL not set!");
    process.exit(1);
  }
  
  const db = drizzle(DATABASE_URL);
  
  // Simulate the exact getLeads query
  const result = await db.select()
    .from(leads)
    .leftJoin(partners, eq(leads.assignedPartnerId, partners.id))
    .orderBy(desc(leads.receivedAt));
  
  console.log(`Total leads returned: ${result.length}`);
  
  if (result.length > 0) {
    console.log("\nFirst lead structure:");
    console.log(JSON.stringify(result[0], null, 2).substring(0, 500));
    
    console.log("\nLast 3 leads:");
    result.slice(-3).forEach(r => {
      const l = r.leads;
      console.log(`  ID: ${l.id}, Name: ${l.firstName} ${l.lastName}, Status: ${l.status}, Source: ${l.source}`);
    });
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
