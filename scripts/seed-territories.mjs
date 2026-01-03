import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import "dotenv/config";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Données de référence pour les territoires
const territoriesData = {
  BE: {
    name: "Belgique",
    nameEn: "Belgium",
    nameFr: "Belgique",
    nameNl: "België",
    regions: [
      {
        code: "BRU",
        name: "Bruxelles-Capitale",
        nameEn: "Brussels-Capital",
        nameFr: "Bruxelles-Capitale",
        nameNl: "Brussels Hoofdstedelijk Gewest",
        postalRanges: [{ start: "1000", end: "1299" }],
      },
      {
        code: "WAL",
        name: "Wallonie",
        nameEn: "Wallonia",
        nameFr: "Wallonie",
        nameNl: "Wallonië",
        postalRanges: [
          { start: "1300", end: "1499", description: "Brabant wallon" },
          { start: "4000", end: "4999", description: "Liège" },
          { start: "5000", end: "5999", description: "Namur" },
          { start: "6000", end: "6999", description: "Hainaut & Luxembourg" },
          { start: "7000", end: "7999", description: "Hainaut" },
        ],
      },
      {
        code: "FLA",
        name: "Flandre",
        nameEn: "Flanders",
        nameFr: "Flandre",
        nameNl: "Vlaanderen",
        postalRanges: [
          { start: "1500", end: "1999", description: "Brabant flamand" },
          { start: "2000", end: "2999", description: "Anvers" },
          { start: "3000", end: "3999", description: "Brabant flamand & Limbourg" },
          { start: "8000", end: "8999", description: "Flandre occidentale" },
          { start: "9000", end: "9999", description: "Flandre orientale" },
        ],
      },
    ],
  },
  CH: {
    name: "Suisse",
    nameEn: "Switzerland",
    nameFr: "Suisse",
    nameNl: "Zwitserland",
    regions: [
      {
        code: "ZH",
        name: "Zurich",
        nameEn: "Zurich",
        nameFr: "Zurich",
        nameNl: "Zürich",
        postalRanges: [{ start: "8000", end: "8999" }],
      },
      {
        code: "GE",
        name: "Genève",
        nameEn: "Geneva",
        nameFr: "Genève",
        nameNl: "Genève",
        postalRanges: [{ start: "1200", end: "1299" }],
      },
      {
        code: "VD",
        name: "Vaud",
        nameEn: "Vaud",
        nameFr: "Vaud",
        nameNl: "Vaud",
        postalRanges: [{ start: "1000", end: "1099" }],
      },
      {
        code: "BE",
        name: "Berne",
        nameEn: "Bern",
        nameFr: "Berne",
        nameNl: "Bern",
        postalRanges: [{ start: "3000", end: "3999" }],
      },
      {
        code: "TI",
        name: "Tessin",
        nameEn: "Ticino",
        nameFr: "Tessin",
        nameNl: "Ticino",
        postalRanges: [{ start: "6500", end: "6999" }],
      },
    ],
  },
  ES: {
    name: "Espagne",
    nameEn: "Spain",
    nameFr: "Espagne",
    nameNl: "Spanje",
    regions: [
      {
        code: "MAD",
        name: "Madrid",
        nameEn: "Madrid",
        nameFr: "Madrid",
        nameNl: "Madrid",
        postalRanges: [{ start: "28000", end: "28999" }],
      },
      {
        code: "BCN",
        name: "Barcelone",
        nameEn: "Barcelona",
        nameFr: "Barcelone",
        nameNl: "Barcelona",
        postalRanges: [{ start: "08000", end: "08999" }],
      },
      {
        code: "VAL",
        name: "Valence",
        nameEn: "Valencia",
        nameFr: "Valence",
        nameNl: "Valencia",
        postalRanges: [{ start: "46000", end: "46999" }],
      },
      {
        code: "SEV",
        name: "Séville",
        nameEn: "Seville",
        nameFr: "Séville",
        nameNl: "Sevilla",
        postalRanges: [{ start: "41000", end: "41999" }],
      },
    ],
  },
  FR: {
    name: "France",
    nameEn: "France",
    nameFr: "France",
    nameNl: "Frankrijk",
    regions: [
      {
        code: "IDF",
        name: "Île-de-France",
        nameEn: "Île-de-France",
        nameFr: "Île-de-France",
        nameNl: "Île-de-France",
        postalRanges: [
          { start: "75000", end: "75999", description: "Paris" },
          { start: "77000", end: "77999", description: "Seine-et-Marne" },
          { start: "78000", end: "78999", description: "Yvelines" },
          { start: "91000", end: "91999", description: "Essonne" },
          { start: "92000", end: "92999", description: "Hauts-de-Seine" },
          { start: "93000", end: "93999", description: "Seine-Saint-Denis" },
          { start: "94000", end: "94999", description: "Val-de-Marne" },
          { start: "95000", end: "95999", description: "Val-d'Oise" },
        ],
      },
      {
        code: "ARA",
        name: "Auvergne-Rhône-Alpes",
        nameEn: "Auvergne-Rhône-Alpes",
        nameFr: "Auvergne-Rhône-Alpes",
        nameNl: "Auvergne-Rhône-Alpes",
        postalRanges: [
          { start: "69000", end: "69999", description: "Rhône" },
          { start: "38000", end: "38999", description: "Isère" },
          { start: "73000", end: "73999", description: "Savoie" },
          { start: "74000", end: "74999", description: "Haute-Savoie" },
        ],
      },
      {
        code: "PAC",
        name: "Provence-Alpes-Côte d'Azur",
        nameEn: "Provence-Alpes-Côte d'Azur",
        nameFr: "Provence-Alpes-Côte d'Azur",
        nameNl: "Provence-Alpes-Côte d'Azur",
        postalRanges: [
          { start: "13000", end: "13999", description: "Bouches-du-Rhône" },
          { start: "06000", end: "06999", description: "Alpes-Maritimes" },
          { start: "83000", end: "83999", description: "Var" },
        ],
      },
      {
        code: "OCC",
        name: "Occitanie",
        nameEn: "Occitanie",
        nameFr: "Occitanie",
        nameNl: "Occitanië",
        postalRanges: [
          { start: "31000", end: "31999", description: "Haute-Garonne" },
          { start: "34000", end: "34999", description: "Hérault" },
        ],
      },
      {
        code: "NAQ",
        name: "Nouvelle-Aquitaine",
        nameEn: "Nouvelle-Aquitaine",
        nameFr: "Nouvelle-Aquitaine",
        nameNl: "Nouvelle-Aquitaine",
        postalRanges: [
          { start: "33000", end: "33999", description: "Gironde" },
          { start: "64000", end: "64999", description: "Pyrénées-Atlantiques" },
        ],
      },
    ],
  },
  DE: {
    name: "Allemagne",
    nameEn: "Germany",
    nameFr: "Allemagne",
    nameNl: "Duitsland",
    regions: [
      {
        code: "BW",
        name: "Bade-Wurtemberg",
        nameEn: "Baden-Württemberg",
        nameFr: "Bade-Wurtemberg",
        nameNl: "Baden-Württemberg",
        postalRanges: [
          { start: "70000", end: "76999", description: "Stuttgart, Karlsruhe" },
          { start: "77000", end: "79999", description: "Freiburg" },
        ],
      },
      {
        code: "BY",
        name: "Bavière",
        nameEn: "Bavaria",
        nameFr: "Bavière",
        nameNl: "Beieren",
        postalRanges: [
          { start: "80000", end: "85999", description: "Munich" },
          { start: "86000", end: "89999", description: "Augsburg" },
          { start: "90000", end: "96999", description: "Nuremberg" },
        ],
      },
      {
        code: "BE",
        name: "Berlin",
        nameEn: "Berlin",
        nameFr: "Berlin",
        nameNl: "Berlijn",
        postalRanges: [{ start: "10000", end: "14999" }],
      },
      {
        code: "HH",
        name: "Hambourg",
        nameEn: "Hamburg",
        nameFr: "Hambourg",
        nameNl: "Hamburg",
        postalRanges: [{ start: "20000", end: "21999" }],
      },
      {
        code: "NW",
        name: "Rhénanie-du-Nord-Westphalie",
        nameEn: "North Rhine-Westphalia",
        nameFr: "Rhénanie-du-Nord-Westphalie",
        nameNl: "Noordrijn-Westfalen",
        postalRanges: [
          { start: "40000", end: "48999", description: "Düsseldorf, Dortmund" },
          { start: "50000", end: "53999", description: "Cologne, Bonn" },
        ],
      },
    ],
  },
};

console.log("🌍 Peuplement des territoires...\n");

// Insérer les pays et régions
for (const [countryCode, countryData] of Object.entries(territoriesData)) {
  console.log(`📍 ${countryData.name} (${countryCode})`);

  // Insérer le pays
  const [countryResult] = await connection.execute(
    `INSERT INTO countries (code, name, nameEn, nameFr, nameNl, isActive) 
     VALUES (?, ?, ?, ?, ?, true)
     ON DUPLICATE KEY UPDATE 
       name = VALUES(name),
       nameEn = VALUES(nameEn),
       nameFr = VALUES(nameFr),
       nameNl = VALUES(nameNl)`,
    [countryCode, countryData.name, countryData.nameEn, countryData.nameFr, countryData.nameNl]
  );

  // Récupérer l'ID du pays
  const [countryRows] = await connection.execute(
    `SELECT id FROM countries WHERE code = ?`,
    [countryCode]
  );
  const countryId = countryRows[0].id;

  // Insérer les régions
  for (const region of countryData.regions) {
    console.log(`  ├─ ${region.name} (${region.code})`);

    const [regionResult] = await connection.execute(
      `INSERT INTO regions (countryId, code, name, nameEn, nameFr, nameNl, isActive) 
       VALUES (?, ?, ?, ?, ?, ?, true)
       ON DUPLICATE KEY UPDATE 
         name = VALUES(name),
         nameEn = VALUES(nameEn),
         nameFr = VALUES(nameFr),
         nameNl = VALUES(nameNl)`,
      [
        countryId,
        region.code,
        region.name,
        region.nameEn || region.name,
        region.nameFr || region.name,
        region.nameNl || region.name,
      ]
    );

    // Récupérer l'ID de la région
    const [regionRows] = await connection.execute(
      `SELECT id FROM regions WHERE countryId = ? AND code = ?`,
      [countryId, region.code]
    );
    const regionId = regionRows[0].id;

    // Insérer les plages de codes postaux
    for (const range of region.postalRanges) {
      await connection.execute(
        `INSERT INTO postal_code_ranges (regionId, startCode, endCode, description) 
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           startCode = VALUES(startCode),
           endCode = VALUES(endCode),
           description = VALUES(description)`,
        [regionId, range.start, range.end, range.description || null]
      );
      console.log(`     └─ ${range.start}-${range.end} ${range.description || ""}`);
    }
  }
  console.log("");
}

console.log("✅ Territoires peuplés avec succès !\n");

// Statistiques
const [countriesCount] = await connection.execute(`SELECT COUNT(*) as count FROM countries`);
const [regionsCount] = await connection.execute(`SELECT COUNT(*) as count FROM regions`);
const [rangesCount] = await connection.execute(`SELECT COUNT(*) as count FROM postal_code_ranges`);

console.log("📊 Statistiques :");
console.log(`   Pays : ${countriesCount[0].count}`);
console.log(`   Régions : ${regionsCount[0].count}`);
console.log(`   Plages de codes postaux : ${rangesCount[0].count}`);

await connection.end();
