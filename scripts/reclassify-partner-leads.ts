/**
 * Script de reclassification des leads partenaires existants
 * 
 * 1. Supprime les doublons dans partner_candidates (même email, garde le plus ancien)
 * 2. Parcourt les leads avec company_name dans customFields
 * 3. Pour chaque lead partenaire :
 *    - Si un candidat avec le même email existe déjà → lie le lead au candidat (metaLeadId)
 *    - Sinon → crée un nouveau candidat avec calcul du score
 * 4. Marque les leads comme "partner_candidate" dans assignmentReason
 */

import mysql from "mysql2/promise";

// Score calculation (same logic as meta-leads.ts)
function normalizeYesNo(value: string | undefined): string {
  if (!value) return "non";
  const lower = value.toLowerCase().trim().replace(/_/g, " ");
  if (lower.startsWith("oui")) return "oui";
  if (lower.startsWith("non")) return "non";
  return value;
}

function calculateScore(fields: Record<string, string>) {
  const showroom = normalizeYesNo(fields["possédez-vous_un_showroom_?_"]);
  const vendSpa = normalizeYesNo(fields["travaillez-vous_déjà_dans_la_vente_de_spa_?_"]);
  const autreMarque = normalizeYesNo(fields["vendez-vous_actuellement_une_autre_marque_?"]);
  const domaineSimilaire = normalizeYesNo(fields["travaillez-vous_dans_un_domaine_similaire_?_"]);

  let score = 0;
  if (showroom === "oui") score += 2;
  if (vendSpa === "oui") score += 2;
  if (autreMarque === "oui") score += 2;
  if (domaineSimilaire === "oui") score += 2;

  return { score, showroom, vendSpa, autreMarque, domaineSimilaire };
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log("=== ÉTAPE 1: Suppression des doublons dans partner_candidates ===");
  
  // Trouver les doublons par email
  const [dupes] = await conn.execute(`
    SELECT email, GROUP_CONCAT(id ORDER BY id) as ids, COUNT(*) as cnt
    FROM partner_candidates 
    WHERE email != ''
    GROUP BY email 
    HAVING COUNT(*) > 1
  `);
  
  let deletedCount = 0;
  for (const dupe of dupes as any[]) {
    const ids = dupe.ids.split(",").map(Number);
    const keepId = ids[0]; // Garder le plus ancien
    const deleteIds = ids.slice(1);
    
    console.log(`  Doublon "${dupe.email}": garde #${keepId}, supprime #${deleteIds.join(", #")}`);
    
    for (const deleteId of deleteIds) {
      await conn.execute("DELETE FROM partner_candidates WHERE id = ?", [deleteId]);
      deletedCount++;
    }
  }
  console.log(`  → ${deletedCount} doublons supprimés\n`);

  console.log("=== ÉTAPE 2: Reclassification des leads partenaires ===");
  
  // Récupérer tous les leads avec company_name
  const [partnerLeads] = await conn.execute(
    "SELECT id, email, customFields FROM leads WHERE customFields LIKE '%company_name%'"
  );
  
  let linked = 0;
  let created = 0;
  let errors = 0;
  
  for (const lead of partnerLeads as any[]) {
    try {
      const fields: Record<string, string> = JSON.parse(lead.customFields || "{}");
      const email = fields.email || lead.email || "";
      const companyName = fields.company_name || fields.city || "Non renseigné";
      const fullName = fields.full_name || "";
      const city = fields.city || "";
      const phoneNumber = fields.phone_number || "";
      
      // Vérifier si un candidat avec le même email existe déjà
      let candidateId: number | null = null;
      
      if (email) {
        const [existing] = await conn.execute(
          "SELECT id FROM partner_candidates WHERE LOWER(email) = LOWER(?) LIMIT 1",
          [email]
        );
        
        if ((existing as any[]).length > 0) {
          candidateId = (existing as any[])[0].id;
          
          // Lier le lead au candidat existant
          await conn.execute(
            "UPDATE partner_candidates SET metaLeadId = ?, source = 'meta_lead' WHERE id = ? AND metaLeadId IS NULL",
            [lead.id, candidateId]
          );
          
          linked++;
          console.log(`  Lead #${lead.id} (${email}) → lié au candidat #${candidateId}`);
        }
      }
      
      if (!candidateId) {
        // Créer un nouveau candidat
        const { score, showroom, vendSpa, autreMarque, domaineSimilaire } = calculateScore(fields);
        
        const [result] = await conn.execute(
          `INSERT INTO partner_candidates 
           (companyName, fullName, city, phoneNumber, email, priorityScore, showroom, vendSpa, autreMarque, domaineSimilaire, metaLeadId, source, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'meta_lead', ?)`,
          [
            companyName, fullName, city, phoneNumber, email,
            score, showroom, vendSpa, autreMarque, domaineSimilaire,
            lead.id,
            `Créé automatiquement depuis un lead Meta Ads (Lead ID: ${lead.id})`
          ]
        );
        
        candidateId = (result as any).insertId;
        created++;
        console.log(`  Lead #${lead.id} (${email}) → nouveau candidat #${candidateId} créé (score: ${score}/8)`);
      }
      
      // Marquer le lead comme candidat partenaire
      await conn.execute(
        "UPDATE leads SET assignmentReason = 'partner_candidate', notes = 'Lead Devenir Partenaire - Redirigé vers la Carte du Réseau' WHERE id = ?",
        [lead.id]
      );
      
    } catch (error: any) {
      errors++;
      console.error(`  ERREUR Lead #${lead.id}: ${error.message}`);
    }
  }
  
  console.log("\n=== RÉSUMÉ ===");
  console.log(`Leads partenaires traités: ${(partnerLeads as any[]).length}`);
  console.log(`Doublons supprimés: ${deletedCount}`);
  console.log(`Candidats liés (existants): ${linked}`);
  console.log(`Candidats créés (nouveaux): ${created}`);
  console.log(`Erreurs: ${errors}`);
  
  // Compter le total final
  const [finalCount] = await conn.execute("SELECT COUNT(*) as cnt FROM partner_candidates");
  console.log(`\nTotal candidats dans la Carte du Réseau: ${(finalCount as any)[0].cnt}`);
  
  await conn.end();
}

main().catch(console.error);
