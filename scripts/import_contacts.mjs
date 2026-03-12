import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";

const contacts = JSON.parse(readFileSync("/tmp/contacts_import.json", "utf-8"));

// Map status from Excel to DB enum
function mapStatus(s) {
  if (s === "validated") return "valide";
  if (s === "in_progress") return "en_cours";
  if (s === "archived") return "archive";
  return "non_contacte";
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not found in environment");

  const conn = await createConnection(dbUrl);
  console.log("Connected to DB");

  // Step 1: Get existing candidates
  const [existing] = await conn.execute("SELECT id, companyName, email, phoneNumber FROM partner_candidates");
  console.log(`Existing candidates: ${existing.length}`);

  // Step 2: Detect duplicates in existing DB (same company name or email)
  const existingMap = new Map(); // key: normalized company name -> id
  const emailMap = new Map(); // key: email -> id
  const duplicateIds = new Set();

  for (const row of existing) {
    const key = row.companyName.trim().toLowerCase();
    const emailKey = (row.email || "").trim().toLowerCase();

    if (existingMap.has(key)) {
      // Duplicate by company name - keep the one with higher id (more recent)
      const prevId = existingMap.get(key);
      duplicateIds.add(Math.min(prevId, row.id));
      existingMap.set(key, Math.max(prevId, row.id));
    } else {
      existingMap.set(key, row.id);
    }

    if (emailKey && emailMap.has(emailKey)) {
      const prevId = emailMap.get(emailKey);
      duplicateIds.add(Math.min(prevId, row.id));
      emailMap.set(emailKey, Math.max(prevId, row.id));
    } else if (emailKey) {
      emailMap.set(emailKey, row.id);
    }
  }

  // Delete duplicates
  if (duplicateIds.size > 0) {
    console.log(`Deleting ${duplicateIds.size} duplicate(s): ${[...duplicateIds].join(", ")}`);
    for (const id of duplicateIds) {
      await conn.execute("DELETE FROM partner_candidates WHERE id = ?", [id]);
    }
  }

  // Refresh existing map after deletion
  const [existingAfter] = await conn.execute("SELECT id, companyName, email FROM partner_candidates");
  const existingByCompany = new Map();
  const existingByEmail = new Map();
  for (const row of existingAfter) {
    existingByCompany.set(row.companyName.trim().toLowerCase(), row.id);
    if (row.email) existingByEmail.set(row.email.trim().toLowerCase(), row.id);
  }

  let inserted = 0;
  let updated = 0;

  for (const c of contacts) {
    const companyKey = c.company.trim().toLowerCase();
    const emailKey = (c.email || "").trim().toLowerCase();

    // Find existing by company name or email
    let existingId = existingByCompany.get(companyKey);
    if (!existingId && emailKey) existingId = existingByEmail.get(emailKey);

    const status = mapStatus(c.status);
    const visitedInt = c.visited ? 1 : 0;

    if (existingId) {
      // Update existing
      await conn.execute(
        `UPDATE partner_candidates SET 
          companyName = ?, fullName = ?, city = ?, phoneNumber = ?, email = ?,
          priorityScore = ?, showroom = ?, vendSpa = ?, autreMarque = ?, domaineSimilaire = ?,
          notes = ?, candidate_status = ?, latitude = ?, longitude = ?,
          phoneCallsCount = ?, emailsSentCount = ?, visited = ?,
          source = ?, updatedAt = NOW()
        WHERE id = ?`,
        [
          c.company, c.name || "", c.city || "", c.phone || "", c.email || "",
          c.score, c.hasShowroom ? "oui" : "non", c.sellsSpa ? "oui" : "non",
          c.otherBrand ? "oui" : "non", c.similarDomain ? "oui" : "non",
          c.notes || null, status,
          c.lat ? String(c.lat) : null, c.lng ? String(c.lng) : null,
          c.callCount, c.emailCount, visitedInt,
          "csv_import", existingId
        ]
      );
      updated++;
    } else {
      // Insert new
      await conn.execute(
        `INSERT INTO partner_candidates 
          (companyName, fullName, city, phoneNumber, email, priorityScore, showroom, vendSpa, autreMarque, domaineSimilaire, notes, candidate_status, latitude, longitude, phoneCallsCount, emailsSentCount, visited, source, dateAdded, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
        [
          c.company, c.name || "", c.city || "", c.phone || "", c.email || "",
          c.score, c.hasShowroom ? "oui" : "non", c.sellsSpa ? "oui" : "non",
          c.otherBrand ? "oui" : "non", c.similarDomain ? "oui" : "non",
          c.notes || null, status,
          c.lat ? String(c.lat) : null, c.lng ? String(c.lng) : null,
          c.callCount, c.emailCount, visitedInt, "csv_import"
        ]
      );
      inserted++;
    }
  }

  const [finalCount] = await conn.execute("SELECT COUNT(*) as cnt FROM partner_candidates");
  console.log(`\n✅ Import terminé:`);
  console.log(`   - Doublons supprimés: ${duplicateIds.size}`);
  console.log(`   - Contacts insérés: ${inserted}`);
  console.log(`   - Contacts mis à jour: ${updated}`);
  console.log(`   - Total en BDD: ${finalCount[0].cnt}`);

  await conn.end();
}

main().catch(console.error);
