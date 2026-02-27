/**
 * Assigne les territoires (départements FR / provinces BE) aux 16 partenaires importés.
 * Utilise la table partner_territories et les régions existantes en BDD.
 * 
 * Mapping basé sur la localisation géographique de chaque partenaire :
 * - Fab'Elec (14310, Caen) → Normandie : 14, 27, 50, 61, 76 + Bretagne + Pays de la Loire
 * - Projet d'eau (33500, Bordeaux) → Nouvelle-Aquitaine + Occitanie
 * - Albatre Piscines (76550) → Seine-Maritime uniquement (76)
 * - Piscines Carré Bleu Brive (19270) → Corrèze + Creuse + Haute-Vienne
 * - Valentin (80210) → Hauts-de-France (fallback par défaut pour les leads sans zone)
 * - Relax and Co (62100) → Nord + Pas-de-Calais
 * - BluemoonSpas (60290) → Île-de-France + Oise + Eure-et-Loir + Loiret
 * - Market Spas Bruxelles (1820) → Bruxelles + Brabant + Anvers + Flandre
 * - Blue Home Création (69760) → Auvergne-Rhône-Alpes
 * - Beaune Paysage (21200) → Bourgogne-Franche-Comté
 * - Les Piscines du Sud Est (38780) → PACA
 * - Tahiti Piscines (4340) → Liège + Namur + Luxembourg belge + Hainaut
 * - MAEL'EAUX (25770) → Doubs + Haute-Saône + Territoire de Belfort + Jura
 * - SaniDesign (7520) → Luxembourg (pays)
 * - Espace Aqua Spa (68390) → Grand Est
 * - Market Spas Palmones (11379) → Espagne
 */

import mysql from 'mysql2/promise';

const PARTNER_TERRITORY_MAP = {
  // Fab'Elec (60002) - Normandie + Bretagne + Pays de la Loire
  60002: [
    'FR-14', // Calvados (Caen)
    'FR-50', // Manche
    'FR-61', // Orne
    // Bretagne
    'FR-22', // Côtes-d'Armor
    'FR-29', // Finistère
    'FR-35', // Ille-et-Vilaine
    'FR-56', // Morbihan
    // Pays de la Loire
    'FR-44', // Loire-Atlantique
    'FR-49', // Maine-et-Loire
    'FR-53', // Mayenne
    'FR-72', // Sarthe
    'FR-85', // Vendée
  ],

  // Albatre Piscines (60004) - Seine-Maritime + Eure
  60004: [
    'FR-76', // Seine-Maritime
    'FR-27', // Eure
  ],

  // Projet d'eau (60003) - Nouvelle-Aquitaine + Occitanie
  60003: [
    // Nouvelle-Aquitaine
    'FR-16', // Charente
    'FR-17', // Charente-Maritime
    'FR-24', // Dordogne
    'FR-33', // Gironde
    'FR-40', // Landes
    'FR-47', // Lot-et-Garonne
    'FR-64', // Pyrénées-Atlantiques
    'FR-79', // Deux-Sèvres
    'FR-86', // Vienne
    // Occitanie
    'FR-09', // Ariège
    'FR-11', // Aude
    'FR-12', // Aveyron
    'FR-31', // Haute-Garonne
    'FR-32', // Gers
    'FR-34', // Hérault
    'FR-46', // Lot
    'FR-48', // Lozère
    'FR-65', // Hautes-Pyrénées
    'FR-66', // Pyrénées-Orientales
    'FR-81', // Tarn
    'FR-82', // Tarn-et-Garonne
  ],

  // Piscines Carré Bleu Brive (60005) - Corrèze + Creuse + Haute-Vienne
  60005: [
    'FR-19', // Corrèze
    'FR-23', // Creuse
    'FR-87', // Haute-Vienne
  ],

  // Valentin (60006) - Hauts-de-France (Somme + Aisne) - FALLBACK PAR DÉFAUT
  60006: [
    'FR-80', // Somme
    'FR-02', // Aisne
  ],

  // Relax and Co (60007) - Nord + Pas-de-Calais
  60007: [
    'FR-59', // Nord
    'FR-62', // Pas-de-Calais
  ],

  // BluemoonSpas (60008) - Île-de-France + Oise + Centre
  60008: [
    'FR-60', // Oise
    'FR-75', // Paris
    'FR-77', // Seine-et-Marne
    'FR-78', // Yvelines
    'FR-91', // Essonne
    'FR-92', // Hauts-de-Seine
    'FR-93', // Seine-Saint-Denis
    'FR-94', // Val-de-Marne
    'FR-95', // Val-d'Oise
    'FR-28', // Eure-et-Loir
    'FR-45', // Loiret
  ],

  // Market Spas Bruxelles (60009) - Bruxelles + Brabant + Anvers + Flandre + Limbourg
  60009: [
    'BE-BRU', // Bruxelles
    'BE-WBR', // Brabant wallon
    'BE-VBR', // Brabant flamand
    'BE-VAN', // Anvers
    'BE-VWV', // Flandre occidentale
    'BE-VOV', // Flandre orientale
    'BE-VLI', // Limbourg
  ],

  // Blue Home Création (60010) - Auvergne-Rhône-Alpes
  60010: [
    'FR-01', // Ain
    'FR-03', // Allier
    'FR-07', // Ardèche
    'FR-15', // Cantal
    'FR-26', // Drôme
    'FR-42', // Loire
    'FR-43', // Haute-Loire
    'FR-63', // Puy-de-Dôme
    'FR-69', // Rhône
    'FR-73', // Savoie
    'FR-74', // Haute-Savoie
  ],

  // Beaune Paysage (60011) - Bourgogne (partie)
  60011: [
    'FR-21', // Côte-d'Or
    'FR-58', // Nièvre
    'FR-71', // Saône-et-Loire
    'FR-89', // Yonne
    // Centre-Val de Loire
    'FR-18', // Cher
    'FR-36', // Indre
    'FR-37', // Indre-et-Loire
    'FR-41', // Loir-et-Cher
  ],

  // Les Piscines du Sud Est (60012) - PACA + Gard
  60012: [
    'FR-04', // Alpes-de-Haute-Provence
    'FR-05', // Hautes-Alpes
    'FR-06', // Alpes-Maritimes
    'FR-13', // Bouches-du-Rhône
    'FR-30', // Gard
    'FR-38', // Isère
    'FR-83', // Var
    'FR-84', // Vaucluse
    // Corse
    'FR-2A', // Corse-du-Sud
    'FR-2B', // Haute-Corse
  ],

  // Tahiti Piscines (60013) - Liège + Namur + Luxembourg belge + Hainaut
  60013: [
    'BE-WLG', // Liège
    'BE-WNA', // Namur
    'BE-WLX', // Luxembourg belge
    'BE-WHT', // Hainaut
  ],

  // MAEL'EAUX (60014) - Franche-Comté
  60014: [
    'FR-25', // Doubs
    'FR-39', // Jura
    'FR-70', // Haute-Saône
    'FR-90', // Territoire de Belfort
  ],

  // Espace Aqua Spa (60016) - Grand Est
  60016: [
    'FR-08', // Ardennes
    'FR-10', // Aube
    'FR-51', // Marne
    'FR-52', // Haute-Marne
    'FR-54', // Meurthe-et-Moselle
    'FR-55', // Meuse
    'FR-57', // Moselle
    'FR-67', // Bas-Rhin
    'FR-68', // Haut-Rhin
    'FR-88', // Vosges
  ],
};

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Supprimer les anciens territoires des partenaires de test (IDs 1, 2, 3)
  // On ne touche pas aux partenaires de test pour ne pas casser l'existant

  // Récupérer les IDs des régions par code
  const [regions] = await conn.execute('SELECT id, code FROM regions');
  const regionByCode = {};
  for (const r of regions) {
    regionByCode[r.code] = r.id;
  }

  let totalAssigned = 0;
  let totalSkipped = 0;

  for (const [partnerIdStr, regionCodes] of Object.entries(PARTNER_TERRITORY_MAP)) {
    const partnerId = parseInt(partnerIdStr, 10);
    
    // Supprimer les territoires existants de ce partenaire
    await conn.execute('DELETE FROM partner_territories WHERE partnerId = ?', [partnerId]);
    
    for (const code of regionCodes) {
      const regionId = regionByCode[code];
      if (!regionId) {
        console.log(`⚠️ Région ${code} non trouvée en BDD, ignorée`);
        totalSkipped++;
        continue;
      }
      
      try {
        await conn.execute(
          'INSERT INTO partner_territories (partnerId, regionId) VALUES (?, ?)',
          [partnerId, regionId]
        );
        totalAssigned++;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️ Territoire ${code} déjà assigné au partenaire ${partnerId}`);
        } else {
          throw err;
        }
      }
    }
    
    const [partner] = await conn.execute('SELECT companyName FROM partners WHERE id = ?', [partnerId]);
    console.log(`✅ ${partner[0].companyName} (${partnerId}): ${regionCodes.length} territoires assignés`);
  }

  console.log(`\n=== Résumé ===`);
  console.log(`Total territoires assignés: ${totalAssigned}`);
  console.log(`Total ignorés: ${totalSkipped}`);

  // Vérification
  const [check] = await conn.execute(`
    SELECT p.id, p.companyName, COUNT(pt.regionId) as territories
    FROM partners p
    LEFT JOIN partner_territories pt ON pt.partnerId = p.id
    WHERE p.id >= 60001
    GROUP BY p.id, p.companyName
    ORDER BY p.id
  `);
  console.log('\n=== Vérification ===');
  for (const row of check) {
    console.log(`${row.companyName} (${row.id}): ${row.territories} territoires`);
  }

  await conn.end();
}

main().catch(console.error);
