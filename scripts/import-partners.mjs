/**
 * Script d'import des partenaires depuis le CSV Stockist
 * Usage: node scripts/import-partners.mjs
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

// ─── Données des partenaires extraites du CSV ───────────────────────────────
const PARTNERS = [
  {
    stockistId: 'loc_p7vek5rk',
    companyName: 'Market Spas Palmones',
    tradeName: 'Market Spas Palmones',
    addressStreet: 'Ctra. Acceso Central Térmica, Nave 4',
    addressCity: 'Palmones',
    addressPostalCode: '11379',
    addressCountry: 'ES',
    addressRegion: 'Andalousie',
    primaryContactEmail: 'es@spas-wellis.com',
    primaryContactPhone: '+34609450905',
    primaryContactName: 'Contact Market Spas Palmones',
    website: null,
    territory: 'Espagne - Andalousie',
    vatNumber: 'ES-PALMONES-001',
  },
  {
    stockistId: 'loc_9yze65vy',
    companyName: "Fab'Elec",
    tradeName: 'Market Spas Caen',
    addressStreet: '3 Rue des Grands Champs',
    addressCity: 'Villers-Bocage',
    addressPostalCode: '14310',
    addressCountry: 'FR',
    addressRegion: 'Normandie',
    primaryContactEmail: 'france@marketspas.com',
    primaryContactPhone: '+33610622733',
    primaryContactName: "Contact Fab'Elec",
    website: null,
    territory: 'France - Normandie (14)',
    vatNumber: 'FR-FABELEC-14310',
    notes: 'Sur rendez-vous',
  },
  {
    stockistId: 'loc_mgrwn7mv',
    companyName: "Projet d'eau",
    tradeName: 'Market Spas Bordeaux',
    addressStreet: '2 port du Nouguey',
    addressCity: 'Arveyres',
    addressPostalCode: '33500',
    addressCountry: 'FR',
    addressRegion: 'Nouvelle-Aquitaine',
    primaryContactEmail: 'luca.c@edgar-den.fr',
    primaryContactPhone: '+33557240801',
    primaryContactName: "Contact Projet d'eau",
    website: null,
    territory: 'France - Gironde (33)',
    vatNumber: 'FR-PROJETEAUX-33500',
  },
  {
    stockistId: 'loc_p79jkk9k',
    companyName: 'Albatre Piscines & Spas',
    tradeName: 'Market Spas Pourville sur Mer',
    addressStreet: '23 Rue du Casino',
    addressCity: 'Pourville sur Mer',
    addressPostalCode: '76550',
    addressCountry: 'FR',
    addressRegion: 'Normandie',
    primaryContactEmail: 'albatre.piscines@outlook.fr',
    primaryContactPhone: '+33661188461',
    primaryContactName: 'Contact Albatre Piscines',
    website: null,
    territory: 'France - Seine-Maritime (76)',
    vatNumber: 'FR-ALBATRE-76550',
  },
  {
    stockistId: 'loc_qxqjgzwy',
    companyName: 'Piscines Carré Bleu Brive',
    tradeName: 'Market Spas Ussac',
    addressStreet: 'D57E',
    addressCity: 'Ussac',
    addressPostalCode: '19270',
    addressCountry: 'FR',
    addressRegion: 'Nouvelle-Aquitaine',
    primaryContactEmail: 'france@marketspas.com',
    primaryContactPhone: '+33553089824',
    primaryContactName: 'Contact Piscines Carré Bleu',
    website: null,
    territory: 'France - Corrèze (19)',
    vatNumber: 'FR-CARREBLEU-19270',
  },
  {
    stockistId: 'loc_wgepkrxx',
    companyName: 'Valentin',
    tradeName: 'Market Spas Feuquières-en-Vimeu',
    addressStreet: '4 ZAC du Moulin',
    addressCity: 'Feuquières-en-Vimeu',
    addressPostalCode: '80210',
    addressCountry: 'FR',
    addressRegion: 'Hauts-de-France',
    primaryContactEmail: 'france@marketspas.com',
    primaryContactPhone: '+33322603434',
    primaryContactName: 'Contact Valentin',
    website: null,
    territory: 'France - Somme (80)',
    vatNumber: 'FR-VALENTIN-80210',
  },
  {
    stockistId: 'loc_nx7n8525',
    companyName: 'Relax and Co',
    tradeName: 'Market Spas Calais',
    addressStreet: '78 Quai Gustave Lamarle',
    addressCity: 'Calais',
    addressPostalCode: '62100',
    addressCountry: 'FR',
    addressRegion: 'Hauts-de-France',
    primaryContactEmail: 'france@marketspas.com',
    primaryContactPhone: '+33321179555',
    primaryContactName: 'Contact Relax and Co',
    website: null,
    territory: 'France - Pas-de-Calais (62)',
    vatNumber: 'FR-RELAXCO-62100',
  },
  {
    stockistId: 'loc_6j5wger5',
    companyName: 'BluemoonSpas',
    tradeName: 'Market Spas Rantigny',
    addressStreet: 'RN 16 Rte de Neuilly',
    addressCity: 'Rantigny',
    addressPostalCode: '60290',
    addressCountry: 'FR',
    addressRegion: 'Hauts-de-France',
    primaryContactEmail: 'contact@bluemoonspas.fr',
    primaryContactPhone: '+33688706553',
    primaryContactName: 'Contact BluemoonSpas',
    website: null,
    territory: 'France - Oise (60)',
    vatNumber: 'FR-BLUEMOON-60290',
  },
  {
    stockistId: 'loc_jzr8xxye',
    companyName: 'Market Spas Bruxelles',
    tradeName: 'Market Spas Bruxelles',
    addressStreet: 'Kalkoven 31',
    addressCity: 'Steenokkerzeel',
    addressPostalCode: '1820',
    addressCountry: 'BE',
    addressRegion: 'Bruxelles',
    primaryContactEmail: 'rony@spas-wellis.com',
    primaryContactPhone: '+32471872147',
    primaryContactName: 'Rony',
    website: null,
    territory: 'Belgique - Bruxelles',
    vatNumber: 'BE-BRUXELLES-1820',
  },
  {
    stockistId: 'loc_eqrezzxv',
    companyName: 'Blue Home Création',
    tradeName: 'Market Spas Limonest',
    addressStreet: '18 Route nationale 6',
    addressCity: 'Limonest',
    addressPostalCode: '69760',
    addressCountry: 'FR',
    addressRegion: 'Auvergne-Rhône-Alpes',
    primaryContactEmail: 'contact@bluehomecreation.fr',
    primaryContactPhone: '+33665006510',
    primaryContactName: 'Contact Blue Home Création',
    website: 'http://bluehomecreation.fr',
    territory: 'France - Rhône (69)',
    vatNumber: 'FR-BLUEHOME-69760',
  },
  {
    stockistId: 'loc_wgepkkyx',
    companyName: 'Beaune Paysage',
    tradeName: 'Market Spas Sainte-Marie-la-Blanche',
    addressStreet: '3 bis Rte de Laborde',
    addressCity: 'Sainte-Marie-la-Blanche',
    addressPostalCode: '21200',
    addressCountry: 'FR',
    addressRegion: 'Bourgogne-Franche-Comté',
    primaryContactEmail: 'contact@beaune-paysage.fr',
    primaryContactPhone: '+33380802182',
    primaryContactName: 'Contact Beaune Paysage',
    website: 'http://beaune-paysage.fr',
    territory: 'France - Côte-d\'Or (21)',
    vatNumber: 'FR-BEAUNE-21200',
  },
  {
    stockistId: 'loc_2n2v55m9',
    companyName: 'Les Piscines du Sud Est',
    tradeName: 'Market Spas Estrablin',
    addressStreet: '1526 Av. Prte des Alpes',
    addressCity: 'Estrablin',
    addressPostalCode: '38780',
    addressCountry: 'FR',
    addressRegion: 'Auvergne-Rhône-Alpes',
    primaryContactEmail: 'contact@piscines-sud-est.com',
    primaryContactPhone: '+33474545239',
    primaryContactName: 'Contact Piscines du Sud Est',
    website: 'http://piscines-sud-est.com',
    territory: 'France - Isère (38)',
    vatNumber: 'FR-SUDEST-38780',
  },
  {
    stockistId: 'loc_nx7n8995',
    companyName: 'Tahiti Piscines',
    tradeName: 'Market Spas Liège',
    addressStreet: "Rue de l'Estampage 16",
    addressCity: 'Awans',
    addressPostalCode: '4340',
    addressCountry: 'BE',
    addressRegion: 'Liège',
    primaryContactEmail: 'sales@marketspas.com',
    primaryContactPhone: '+32471370109',
    primaryContactName: 'Contact Tahiti Piscines',
    website: null,
    territory: 'Belgique - Liège',
    vatNumber: 'BE-TAHITI-4340',
  },
  {
    stockistId: 'loc_9yze665y',
    companyName: "MAEL'EAUX piscines et spas",
    tradeName: 'Market Spas Franois',
    addressStreet: '1 rue des tailles',
    addressCity: 'Franois',
    addressPostalCode: '25770',
    addressCountry: 'FR',
    addressRegion: 'Bourgogne-Franche-Comté',
    primaryContactEmail: 'Contact@piscines-spas-maeleaux.com',
    primaryContactPhone: '+33381867428',
    primaryContactName: "Contact MAEL'EAUX",
    website: 'http://piscines-spas-maeleaux.com',
    territory: 'France - Doubs (25)',
    vatNumber: 'FR-MAELEAUX-25770',
  },
  {
    stockistId: 'loc_ywgn2mev',
    companyName: 'SaniDesign',
    tradeName: 'Market Spas Mersch',
    addressStreet: '4 Rue Grande-Duchesse Charlotte',
    addressCity: 'Mersch',
    addressPostalCode: '7520',
    addressCountry: 'LU',
    addressRegion: 'Luxembourg',
    primaryContactEmail: 'sanidesign1@gmail.com',
    primaryContactPhone: '+35228221320',
    primaryContactName: 'Contact SaniDesign',
    website: 'https://www.sanidesign.lu/',
    territory: 'Luxembourg',
    vatNumber: 'LU-SANIDESIGN-7520',
  },
  {
    stockistId: 'loc_z752rz6w',
    companyName: 'Espace Aqua Spa',
    tradeName: 'Market Spas Sausheim',
    addressStreet: '2 Rue de l\'Artois',
    addressCity: 'Sierentz',
    addressPostalCode: '68390',
    addressCountry: 'FR',
    addressRegion: 'Grand Est',
    primaryContactEmail: 'france@marketspas.com',
    primaryContactPhone: '+33661449340',
    primaryContactName: 'Contact Espace Aqua Spa',
    website: null,
    territory: 'France - Haut-Rhin (68)',
    vatNumber: 'FR-AQUASPA-68390',
    notes: 'Lundi, Mercredi, Jeudi – Sur Rendez vous. Mardi et Vendredi : 10:00–18:00. Samedi : 10:00–16:00',
  },
];

async function importPartners() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }

  const conn = await mysql.createConnection(dbUrl);
  console.log('✅ Connected to database');

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const p of PARTNERS) {
    try {
      // Check if already exists by vatNumber
      const [existing] = await conn.execute(
        'SELECT id FROM partners WHERE vatNumber = ?',
        [p.vatNumber]
      );

      if (existing.length > 0) {
        console.log(`⏭  Skipped (already exists): ${p.tradeName}`);
        skipped++;
        continue;
      }

      await conn.execute(
        `INSERT INTO partners (
          companyName, tradeName, vatNumber,
          addressStreet, addressCity, addressPostalCode, addressCountry, addressRegion,
          primaryContactName, primaryContactEmail, primaryContactPhone,
          website, territory, status, level,
          internalNotes, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', 'BRONZE', ?, NOW(), NOW())`,
        [
          p.companyName,
          p.tradeName,
          p.vatNumber,
          p.addressStreet,
          p.addressCity,
          p.addressPostalCode,
          p.addressCountry,
          p.addressRegion,
          p.primaryContactName,
          p.primaryContactEmail,
          p.primaryContactPhone,
          p.website || null,
          p.territory,
          p.notes || null,
        ]
      );

      console.log(`✅ Imported: ${p.tradeName} (${p.addressPostalCode} - ${p.territory})`);
      imported++;
    } catch (err) {
      console.error(`❌ Error importing ${p.tradeName}:`, err.message);
      errors++;
    }
  }

  await conn.end();

  console.log('\n─────────────────────────────────────');
  console.log(`📊 Import summary:`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭  Skipped:  ${skipped}`);
  console.log(`   ❌ Errors:   ${errors}`);
  console.log('─────────────────────────────────────');
}

importPartners().catch(console.error);
