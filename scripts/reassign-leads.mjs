/**
 * Script pour réassigner automatiquement les leads non assignés aux partenaires
 * selon leur code postal et territoire
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { leads, partners, regions, postalCodeRanges, partnerTerritories } from '../drizzle/schema';
import { eq, and, isNull, gte, lte, sql } from 'drizzle-orm';

async function reassignLeads() {
  console.log('🚀 Démarrage de la réassignation des leads...\n');

  // Connexion à la base de données
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'market_spas',
  });

  const db = drizzle(connection);

  try {
    // Récupérer tous les leads non assignés avec un code postal
    const unassignedLeads = await db
      .select()
      .from(leads)
      .where(and(
        isNull(leads.assignedPartnerId),
        sql`${leads.postalCode} IS NOT NULL AND ${leads.postalCode} != ''`
      ));

    console.log(`📊 ${unassignedLeads.length} leads non assignés trouvés\n`);

    let assignedCount = 0;
    let notFoundCount = 0;

    for (const lead of unassignedLeads) {
      const postalCode = lead.postalCode;
      console.log(`\n🔍 Traitement du lead #${lead.id} - ${lead.firstName || ''} ${lead.lastName || ''} (${lead.email})`);
      console.log(`   Code postal: ${postalCode}`);

      // Normaliser le code postal
      const normalized = postalCode.replace(/\s/g, '').toUpperCase();

      // Trouver la région correspondante
      const regionResult = await db
        .select({
          regionId: regions.id,
          regionName: regions.name,
          countryName: sql`(SELECT name FROM countries WHERE id = ${regions.countryId})`,
        })
        .from(postalCodeRanges)
        .innerJoin(regions, eq(regions.id, postalCodeRanges.regionId))
        .where(
          and(
            sql`${normalized} >= ${postalCodeRanges.startCode}`,
            sql`${normalized} <= ${postalCodeRanges.endCode}`
          )
        )
        .limit(1);

      if (regionResult.length === 0) {
        console.log(`   ❌ Aucune région trouvée pour le code postal ${postalCode}`);
        notFoundCount++;
        continue;
      }

      const region = regionResult[0];
      console.log(`   ✅ Région trouvée: ${region.regionName} (${region.countryName})`);

      // Trouver le partenaire assigné à cette région
      const partnerResult = await db
        .select({
          partnerId: partnerTerritories.partnerId,
          partnerName: sql`(SELECT companyName FROM partners WHERE id = ${partnerTerritories.partnerId})`,
        })
        .from(partnerTerritories)
        .where(eq(partnerTerritories.regionId, region.regionId))
        .limit(1);

      if (partnerResult.length === 0) {
        console.log(`   ❌ Aucun partenaire assigné à la région ${region.regionName}`);
        notFoundCount++;
        continue;
      }

      const partner = partnerResult[0];
      console.log(`   ✅ Partenaire trouvé: ${partner.partnerName}`);

      // Assigner le lead au partenaire
      await db
        .update(leads)
        .set({ 
          assignedPartnerId: partner.partnerId,
          status: 'ASSIGNED',
        })
        .where(eq(leads.id, lead.id));

      console.log(`   ✅ Lead #${lead.id} assigné au partenaire ${partner.partnerName}`);
      assignedCount++;
    }

    console.log(`\n\n📈 Résumé de la réassignation:`);
    console.log(`   ✅ ${assignedCount} leads assignés avec succès`);
    console.log(`   ❌ ${notFoundCount} leads non assignés (région ou partenaire non trouvé)`);
    console.log(`   📊 Total traité: ${unassignedLeads.length} leads\n`);

  } catch (error) {
    console.error('❌ Erreur lors de la réassignation:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

// Exécuter le script
reassignLeads()
  .then(() => {
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
