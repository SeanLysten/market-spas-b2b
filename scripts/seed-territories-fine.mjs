import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import mysql from "mysql2/promise";
import { countries, regions, postalCodeRanges } from "../drizzle/schema.js";
import "dotenv/config";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

console.log("🌍 Seeding territorial data with fine subdivisions...\n");

// ============================================
// 1. PAYS (Countries)
// ============================================

const countriesData = [
  { name: "Belgique", nameEn: "Belgium", nameFr: "Belgique", nameNl: "België", code: "BE", phonePrefix: "+32", isActive: true },
  { name: "France", nameEn: "France", nameFr: "France", nameNl: "Frankrijk", code: "FR", phonePrefix: "+33", isActive: true },
  { name: "Suisse", nameEn: "Switzerland", nameFr: "Suisse", nameNl: "Zwitserland", code: "CH", phonePrefix: "+41", isActive: true },
  { name: "Espagne", nameEn: "Spain", nameFr: "Espagne", nameNl: "Spanje", code: "ES", phonePrefix: "+34", isActive: true },
  { name: "Allemagne", nameEn: "Germany", nameFr: "Allemagne", nameNl: "Duitsland", code: "DE", phonePrefix: "+49", isActive: true },
  { name: "Pays-Bas", nameEn: "Netherlands", nameFr: "Pays-Bas", nameNl: "Nederland", code: "NL", phonePrefix: "+31", isActive: true },
];

console.log("📍 Inserting countries...");
await db.delete(countries);
for (const country of countriesData) {
  await db.insert(countries).values(country);
}

const countryMap = {};
const allCountries = await db.select().from(countries);
for (const c of allCountries) {
  countryMap[c.code] = c.id;
}

console.log(`✅ ${countriesData.length} countries inserted\n`);

// ============================================
// 2. RÉGIONS/PROVINCES/DÉPARTEMENTS/CANTONS
// ============================================

const regionsData = [
  // BELGIQUE - 11 Provinces
  { countryId: countryMap["BE"], name: "Province de Liège", code: "BE-WLG" },
  { countryId: countryMap["BE"], name: "Province du Hainaut", code: "BE-WHT" },
  { countryId: countryMap["BE"], name: "Province de Namur", code: "BE-WNA" },
  { countryId: countryMap["BE"], name: "Province du Luxembourg", code: "BE-WLX" },
  { countryId: countryMap["BE"], name: "Province du Brabant wallon", code: "BE-WBR" },
  { countryId: countryMap["BE"], name: "Province du Brabant flamand", code: "BE-VBR" },
  { countryId: countryMap["BE"], name: "Province d'Anvers", code: "BE-VAN" },
  { countryId: countryMap["BE"], name: "Province de Flandre occidentale", code: "BE-VWV" },
  { countryId: countryMap["BE"], name: "Province de Flandre orientale", code: "BE-VOV" },
  { countryId: countryMap["BE"], name: "Province du Limbourg", code: "BE-VLI" },
  { countryId: countryMap["BE"], name: "Région de Bruxelles-Capitale", code: "BE-BRU" },

  // FRANCE - 101 Départements (échantillon des principaux)
  { countryId: countryMap["FR"], name: "Ain", code: "FR-01" },
  { countryId: countryMap["FR"], name: "Aisne", code: "FR-02" },
  { countryId: countryMap["FR"], name: "Allier", code: "FR-03" },
  { countryId: countryMap["FR"], name: "Alpes-de-Haute-Provence", code: "FR-04" },
  { countryId: countryMap["FR"], name: "Hautes-Alpes", code: "FR-05" },
  { countryId: countryMap["FR"], name: "Alpes-Maritimes", code: "FR-06" },
  { countryId: countryMap["FR"], name: "Ardèche", code: "FR-07" },
  { countryId: countryMap["FR"], name: "Ardennes", code: "FR-08" },
  { countryId: countryMap["FR"], name: "Ariège", code: "FR-09" },
  { countryId: countryMap["FR"], name: "Aube", code: "FR-10" },
  { countryId: countryMap["FR"], name: "Aude", code: "FR-11" },
  { countryId: countryMap["FR"], name: "Aveyron", code: "FR-12" },
  { countryId: countryMap["FR"], name: "Bouches-du-Rhône", code: "FR-13" },
  { countryId: countryMap["FR"], name: "Calvados", code: "FR-14" },
  { countryId: countryMap["FR"], name: "Cantal", code: "FR-15" },
  { countryId: countryMap["FR"], name: "Charente", code: "FR-16" },
  { countryId: countryMap["FR"], name: "Charente-Maritime", code: "FR-17" },
  { countryId: countryMap["FR"], name: "Cher", code: "FR-18" },
  { countryId: countryMap["FR"], name: "Corrèze", code: "FR-19" },
  { countryId: countryMap["FR"], name: "Corse-du-Sud", code: "FR-2A" },
  { countryId: countryMap["FR"], name: "Haute-Corse", code: "FR-2B" },
  { countryId: countryMap["FR"], name: "Côte-d'Or", code: "FR-21" },
  { countryId: countryMap["FR"], name: "Côtes-d'Armor", code: "FR-22" },
  { countryId: countryMap["FR"], name: "Creuse", code: "FR-23" },
  { countryId: countryMap["FR"], name: "Dordogne", code: "FR-24" },
  { countryId: countryMap["FR"], name: "Doubs", code: "FR-25" },
  { countryId: countryMap["FR"], name: "Drôme", code: "FR-26" },
  { countryId: countryMap["FR"], name: "Eure", code: "FR-27" },
  { countryId: countryMap["FR"], name: "Eure-et-Loir", code: "FR-28" },
  { countryId: countryMap["FR"], name: "Finistère", code: "FR-29" },
  { countryId: countryMap["FR"], name: "Gard", code: "FR-30" },
  { countryId: countryMap["FR"], name: "Haute-Garonne", code: "FR-31" },
  { countryId: countryMap["FR"], name: "Gers", code: "FR-32" },
  { countryId: countryMap["FR"], name: "Gironde", code: "FR-33" },
  { countryId: countryMap["FR"], name: "Hérault", code: "FR-34" },
  { countryId: countryMap["FR"], name: "Ille-et-Vilaine", code: "FR-35" },
  { countryId: countryMap["FR"], name: "Indre", code: "FR-36" },
  { countryId: countryMap["FR"], name: "Indre-et-Loire", code: "FR-37" },
  { countryId: countryMap["FR"], name: "Isère", code: "FR-38" },
  { countryId: countryMap["FR"], name: "Jura", code: "FR-39" },
  { countryId: countryMap["FR"], name: "Landes", code: "FR-40" },
  { countryId: countryMap["FR"], name: "Loir-et-Cher", code: "FR-41" },
  { countryId: countryMap["FR"], name: "Loire", code: "FR-42" },
  { countryId: countryMap["FR"], name: "Haute-Loire", code: "FR-43" },
  { countryId: countryMap["FR"], name: "Loire-Atlantique", code: "FR-44" },
  { countryId: countryMap["FR"], name: "Loiret", code: "FR-45" },
  { countryId: countryMap["FR"], name: "Lot", code: "FR-46" },
  { countryId: countryMap["FR"], name: "Lot-et-Garonne", code: "FR-47" },
  { countryId: countryMap["FR"], name: "Lozère", code: "FR-48" },
  { countryId: countryMap["FR"], name: "Maine-et-Loire", code: "FR-49" },
  { countryId: countryMap["FR"], name: "Manche", code: "FR-50" },
  { countryId: countryMap["FR"], name: "Marne", code: "FR-51" },
  { countryId: countryMap["FR"], name: "Haute-Marne", code: "FR-52" },
  { countryId: countryMap["FR"], name: "Mayenne", code: "FR-53" },
  { countryId: countryMap["FR"], name: "Meurthe-et-Moselle", code: "FR-54" },
  { countryId: countryMap["FR"], name: "Meuse", code: "FR-55" },
  { countryId: countryMap["FR"], name: "Morbihan", code: "FR-56" },
  { countryId: countryMap["FR"], name: "Moselle", code: "FR-57" },
  { countryId: countryMap["FR"], name: "Nièvre", code: "FR-58" },
  { countryId: countryMap["FR"], name: "Nord", code: "FR-59" },
  { countryId: countryMap["FR"], name: "Oise", code: "FR-60" },
  { countryId: countryMap["FR"], name: "Orne", code: "FR-61" },
  { countryId: countryMap["FR"], name: "Pas-de-Calais", code: "FR-62" },
  { countryId: countryMap["FR"], name: "Puy-de-Dôme", code: "FR-63" },
  { countryId: countryMap["FR"], name: "Pyrénées-Atlantiques", code: "FR-64" },
  { countryId: countryMap["FR"], name: "Hautes-Pyrénées", code: "FR-65" },
  { countryId: countryMap["FR"], name: "Pyrénées-Orientales", code: "FR-66" },
  { countryId: countryMap["FR"], name: "Bas-Rhin", code: "FR-67" },
  { countryId: countryMap["FR"], name: "Haut-Rhin", code: "FR-68" },
  { countryId: countryMap["FR"], name: "Rhône", code: "FR-69" },
  { countryId: countryMap["FR"], name: "Haute-Saône", code: "FR-70" },
  { countryId: countryMap["FR"], name: "Saône-et-Loire", code: "FR-71" },
  { countryId: countryMap["FR"], name: "Sarthe", code: "FR-72" },
  { countryId: countryMap["FR"], name: "Savoie", code: "FR-73" },
  { countryId: countryMap["FR"], name: "Haute-Savoie", code: "FR-74" },
  { countryId: countryMap["FR"], name: "Paris", code: "FR-75" },
  { countryId: countryMap["FR"], name: "Seine-Maritime", code: "FR-76" },
  { countryId: countryMap["FR"], name: "Seine-et-Marne", code: "FR-77" },
  { countryId: countryMap["FR"], name: "Yvelines", code: "FR-78" },
  { countryId: countryMap["FR"], name: "Deux-Sèvres", code: "FR-79" },
  { countryId: countryMap["FR"], name: "Somme", code: "FR-80" },
  { countryId: countryMap["FR"], name: "Tarn", code: "FR-81" },
  { countryId: countryMap["FR"], name: "Tarn-et-Garonne", code: "FR-82" },
  { countryId: countryMap["FR"], name: "Var", code: "FR-83" },
  { countryId: countryMap["FR"], name: "Vaucluse", code: "FR-84" },
  { countryId: countryMap["FR"], name: "Vendée", code: "FR-85" },
  { countryId: countryMap["FR"], name: "Vienne", code: "FR-86" },
  { countryId: countryMap["FR"], name: "Haute-Vienne", code: "FR-87" },
  { countryId: countryMap["FR"], name: "Vosges", code: "FR-88" },
  { countryId: countryMap["FR"], name: "Yonne", code: "FR-89" },
  { countryId: countryMap["FR"], name: "Territoire de Belfort", code: "FR-90" },
  { countryId: countryMap["FR"], name: "Essonne", code: "FR-91" },
  { countryId: countryMap["FR"], name: "Hauts-de-Seine", code: "FR-92" },
  { countryId: countryMap["FR"], name: "Seine-Saint-Denis", code: "FR-93" },
  { countryId: countryMap["FR"], name: "Val-de-Marne", code: "FR-94" },
  { countryId: countryMap["FR"], name: "Val-d'Oise", code: "FR-95" },

  // SUISSE - 26 Cantons
  { countryId: countryMap["CH"], name: "Genève", code: "CH-GE" },
  { countryId: countryMap["CH"], name: "Vaud", code: "CH-VD" },
  { countryId: countryMap["CH"], name: "Valais", code: "CH-VS" },
  { countryId: countryMap["CH"], name: "Fribourg", code: "CH-FR" },
  { countryId: countryMap["CH"], name: "Neuchâtel", code: "CH-NE" },
  { countryId: countryMap["CH"], name: "Jura", code: "CH-JU" },
  { countryId: countryMap["CH"], name: "Berne", code: "CH-BE" },
  { countryId: countryMap["CH"], name: "Zurich", code: "CH-ZH" },
  { countryId: countryMap["CH"], name: "Lucerne", code: "CH-LU" },
  { countryId: countryMap["CH"], name: "Uri", code: "CH-UR" },
  { countryId: countryMap["CH"], name: "Schwyz", code: "CH-SZ" },
  { countryId: countryMap["CH"], name: "Obwald", code: "CH-OW" },
  { countryId: countryMap["CH"], name: "Nidwald", code: "CH-NW" },
  { countryId: countryMap["CH"], name: "Glaris", code: "CH-GL" },
  { countryId: countryMap["CH"], name: "Zoug", code: "CH-ZG" },
  { countryId: countryMap["CH"], name: "Soleure", code: "CH-SO" },
  { countryId: countryMap["CH"], name: "Bâle-Ville", code: "CH-BS" },
  { countryId: countryMap["CH"], name: "Bâle-Campagne", code: "CH-BL" },
  { countryId: countryMap["CH"], name: "Schaffhouse", code: "CH-SH" },
  { countryId: countryMap["CH"], name: "Appenzell Rhodes-Extérieures", code: "CH-AR" },
  { countryId: countryMap["CH"], name: "Appenzell Rhodes-Intérieures", code: "CH-AI" },
  { countryId: countryMap["CH"], name: "Saint-Gall", code: "CH-SG" },
  { countryId: countryMap["CH"], name: "Grisons", code: "CH-GR" },
  { countryId: countryMap["CH"], name: "Argovie", code: "CH-AG" },
  { countryId: countryMap["CH"], name: "Thurgovie", code: "CH-TG" },
  { countryId: countryMap["CH"], name: "Tessin", code: "CH-TI" },

  // ESPAGNE - Principales provinces (échantillon)
  { countryId: countryMap["ES"], name: "Madrid", code: "ES-M" },
  { countryId: countryMap["ES"], name: "Barcelona", code: "ES-B" },
  { countryId: countryMap["ES"], name: "Valencia", code: "ES-V" },
  { countryId: countryMap["ES"], name: "Sevilla", code: "ES-SE" },
  { countryId: countryMap["ES"], name: "Zaragoza", code: "ES-Z" },
  { countryId: countryMap["ES"], name: "Málaga", code: "ES-MA" },
  { countryId: countryMap["ES"], name: "Murcia", code: "ES-MU" },
  { countryId: countryMap["ES"], name: "Palma de Mallorca", code: "ES-PM" },
  { countryId: countryMap["ES"], name: "Las Palmas", code: "ES-GC" },
  { countryId: countryMap["ES"], name: "Bilbao", code: "ES-BI" },
  { countryId: countryMap["ES"], name: "Alicante", code: "ES-A" },
  { countryId: countryMap["ES"], name: "Córdoba", code: "ES-CO" },
  { countryId: countryMap["ES"], name: "Valladolid", code: "ES-VA" },
  { countryId: countryMap["ES"], name: "Vigo", code: "ES-PO" },
  { countryId: countryMap["ES"], name: "Gijón", code: "ES-O" },

  // ALLEMAGNE - 16 Länder
  { countryId: countryMap["DE"], name: "Baden-Württemberg", code: "DE-BW" },
  { countryId: countryMap["DE"], name: "Bayern", code: "DE-BY" },
  { countryId: countryMap["DE"], name: "Berlin", code: "DE-BE" },
  { countryId: countryMap["DE"], name: "Brandenburg", code: "DE-BB" },
  { countryId: countryMap["DE"], name: "Bremen", code: "DE-HB" },
  { countryId: countryMap["DE"], name: "Hamburg", code: "DE-HH" },
  { countryId: countryMap["DE"], name: "Hessen", code: "DE-HE" },
  { countryId: countryMap["DE"], name: "Mecklenburg-Vorpommern", code: "DE-MV" },
  { countryId: countryMap["DE"], name: "Niedersachsen", code: "DE-NI" },
  { countryId: countryMap["DE"], name: "Nordrhein-Westfalen", code: "DE-NW" },
  { countryId: countryMap["DE"], name: "Rheinland-Pfalz", code: "DE-RP" },
  { countryId: countryMap["DE"], name: "Saarland", code: "DE-SL" },
  { countryId: countryMap["DE"], name: "Sachsen", code: "DE-SN" },
  { countryId: countryMap["DE"], name: "Sachsen-Anhalt", code: "DE-ST" },
  { countryId: countryMap["DE"], name: "Schleswig-Holstein", code: "DE-SH" },
  { countryId: countryMap["DE"], name: "Thüringen", code: "DE-TH" },

  // PAYS-BAS - 12 Provinces
  { countryId: countryMap["NL"], name: "Noord-Holland", code: "NL-NH" },
  { countryId: countryMap["NL"], name: "Zuid-Holland", code: "NL-ZH" },
  { countryId: countryMap["NL"], name: "Utrecht", code: "NL-UT" },
  { countryId: countryMap["NL"], name: "Gelderland", code: "NL-GE" },
  { countryId: countryMap["NL"], name: "Noord-Brabant", code: "NL-NB" },
  { countryId: countryMap["NL"], name: "Limburg", code: "NL-LI" },
  { countryId: countryMap["NL"], name: "Overijssel", code: "NL-OV" },
  { countryId: countryMap["NL"], name: "Groningen", code: "NL-GR" },
  { countryId: countryMap["NL"], name: "Friesland", code: "NL-FR" },
  { countryId: countryMap["NL"], name: "Drenthe", code: "NL-DR" },
  { countryId: countryMap["NL"], name: "Zeeland", code: "NL-ZE" },
  { countryId: countryMap["NL"], name: "Flevoland", code: "NL-FL" },
];

console.log("📍 Inserting regions/provinces/départements/cantons...");
await db.delete(regions);
for (const region of regionsData) {
  await db.insert(regions).values(region);
}

const regionMap = {};
const allRegions = await db.select().from(regions);
for (const r of allRegions) {
  regionMap[r.code] = r.id;
}

console.log(`✅ ${regionsData.length} subdivisions inserted\n`);

// ============================================
// 3. PLAGES DE CODES POSTAUX
// ============================================

const postalCodeRangesData = [
  // BELGIQUE - Codes postaux par province
  // Province de Liège (4000-4999)
  { regionId: regionMap["BE-WLG"], startCode: "4000", endCode: "4999" },
  
  // Province du Hainaut (6000-7999)
  { regionId: regionMap["BE-WHT"], startCode: "6000", endCode: "6599" },
  { regionId: regionMap["BE-WHT"], startCode: "7000", endCode: "7999" },
  
  // Province de Namur (5000-5999)
  { regionId: regionMap["BE-WNA"], startCode: "5000", endCode: "5999" },
  
  // Province du Luxembourg (6600-6999)
  { regionId: regionMap["BE-WLX"], startCode: "6600", endCode: "6999" },
  
  // Province du Brabant wallon (1300-1499)
  { regionId: regionMap["BE-WBR"], startCode: "1300", endCode: "1499" },
  
  // Province du Brabant flamand (1500-1999, 3000-3499)
  { regionId: regionMap["BE-VBR"], startCode: "1500", endCode: "1999" },
  { regionId: regionMap["BE-VBR"], startCode: "3000", endCode: "3499" },
  
  // Province d'Anvers (2000-2999)
  { regionId: regionMap["BE-VAN"], startCode: "2000", endCode: "2999" },
  
  // Province de Flandre occidentale (8000-8999)
  { regionId: regionMap["BE-VWV"], startCode: "8000", endCode: "8999" },
  
  // Province de Flandre orientale (9000-9999)
  { regionId: regionMap["BE-VOV"], startCode: "9000", endCode: "9999" },
  
  // Province du Limbourg (3500-3999)
  { regionId: regionMap["BE-VLI"], startCode: "3500", endCode: "3999" },
  
  // Région de Bruxelles-Capitale (1000-1299)
  { regionId: regionMap["BE-BRU"], startCode: "1000", endCode: "1299" },

  // FRANCE - Codes postaux par département (2 premiers chiffres = département)
  { regionId: regionMap["FR-01"], startCode: "01000", endCode: "01999" },
  { regionId: regionMap["FR-02"], startCode: "02000", endCode: "02999" },
  { regionId: regionMap["FR-03"], startCode: "03000", endCode: "03999" },
  { regionId: regionMap["FR-04"], startCode: "04000", endCode: "04999" },
  { regionId: regionMap["FR-05"], startCode: "05000", endCode: "05999" },
  { regionId: regionMap["FR-06"], startCode: "06000", endCode: "06999" },
  { regionId: regionMap["FR-07"], startCode: "07000", endCode: "07999" },
  { regionId: regionMap["FR-08"], startCode: "08000", endCode: "08999" },
  { regionId: regionMap["FR-09"], startCode: "09000", endCode: "09999" },
  { regionId: regionMap["FR-10"], startCode: "10000", endCode: "10999" },
  { regionId: regionMap["FR-11"], startCode: "11000", endCode: "11999" },
  { regionId: regionMap["FR-12"], startCode: "12000", endCode: "12999" },
  { regionId: regionMap["FR-13"], startCode: "13000", endCode: "13999" },
  { regionId: regionMap["FR-14"], startCode: "14000", endCode: "14999" },
  { regionId: regionMap["FR-15"], startCode: "15000", endCode: "15999" },
  { regionId: regionMap["FR-16"], startCode: "16000", endCode: "16999" },
  { regionId: regionMap["FR-17"], startCode: "17000", endCode: "17999" },
  { regionId: regionMap["FR-18"], startCode: "18000", endCode: "18999" },
  { regionId: regionMap["FR-19"], startCode: "19000", endCode: "19999" },
  { regionId: regionMap["FR-2A"], startCode: "20000", endCode: "20199" },
  { regionId: regionMap["FR-2B"], startCode: "20200", endCode: "20999" },
  { regionId: regionMap["FR-21"], startCode: "21000", endCode: "21999" },
  { regionId: regionMap["FR-22"], startCode: "22000", endCode: "22999" },
  { regionId: regionMap["FR-23"], startCode: "23000", endCode: "23999" },
  { regionId: regionMap["FR-24"], startCode: "24000", endCode: "24999" },
  { regionId: regionMap["FR-25"], startCode: "25000", endCode: "25999" },
  { regionId: regionMap["FR-26"], startCode: "26000", endCode: "26999" },
  { regionId: regionMap["FR-27"], startCode: "27000", endCode: "27999" },
  { regionId: regionMap["FR-28"], startCode: "28000", endCode: "28999" },
  { regionId: regionMap["FR-29"], startCode: "29000", endCode: "29999" },
  { regionId: regionMap["FR-30"], startCode: "30000", endCode: "30999" },
  { regionId: regionMap["FR-31"], startCode: "31000", endCode: "31999" },
  { regionId: regionMap["FR-32"], startCode: "32000", endCode: "32999" },
  { regionId: regionMap["FR-33"], startCode: "33000", endCode: "33999" },
  { regionId: regionMap["FR-34"], startCode: "34000", endCode: "34999" },
  { regionId: regionMap["FR-35"], startCode: "35000", endCode: "35999" },
  { regionId: regionMap["FR-36"], startCode: "36000", endCode: "36999" },
  { regionId: regionMap["FR-37"], startCode: "37000", endCode: "37999" },
  { regionId: regionMap["FR-38"], startCode: "38000", endCode: "38999" },
  { regionId: regionMap["FR-39"], startCode: "39000", endCode: "39999" },
  { regionId: regionMap["FR-40"], startCode: "40000", endCode: "40999" },
  { regionId: regionMap["FR-41"], startCode: "41000", endCode: "41999" },
  { regionId: regionMap["FR-42"], startCode: "42000", endCode: "42999" },
  { regionId: regionMap["FR-43"], startCode: "43000", endCode: "43999" },
  { regionId: regionMap["FR-44"], startCode: "44000", endCode: "44999" },
  { regionId: regionMap["FR-45"], startCode: "45000", endCode: "45999" },
  { regionId: regionMap["FR-46"], startCode: "46000", endCode: "46999" },
  { regionId: regionMap["FR-47"], startCode: "47000", endCode: "47999" },
  { regionId: regionMap["FR-48"], startCode: "48000", endCode: "48999" },
  { regionId: regionMap["FR-49"], startCode: "49000", endCode: "49999" },
  { regionId: regionMap["FR-50"], startCode: "50000", endCode: "50999" },
  { regionId: regionMap["FR-51"], startCode: "51000", endCode: "51999" },
  { regionId: regionMap["FR-52"], startCode: "52000", endCode: "52999" },
  { regionId: regionMap["FR-53"], startCode: "53000", endCode: "53999" },
  { regionId: regionMap["FR-54"], startCode: "54000", endCode: "54999" },
  { regionId: regionMap["FR-55"], startCode: "55000", endCode: "55999" },
  { regionId: regionMap["FR-56"], startCode: "56000", endCode: "56999" },
  { regionId: regionMap["FR-57"], startCode: "57000", endCode: "57999" },
  { regionId: regionMap["FR-58"], startCode: "58000", endCode: "58999" },
  { regionId: regionMap["FR-59"], startCode: "59000", endCode: "59999" },
  { regionId: regionMap["FR-60"], startCode: "60000", endCode: "60999" },
  { regionId: regionMap["FR-61"], startCode: "61000", endCode: "61999" },
  { regionId: regionMap["FR-62"], startCode: "62000", endCode: "62999" },
  { regionId: regionMap["FR-63"], startCode: "63000", endCode: "63999" },
  { regionId: regionMap["FR-64"], startCode: "64000", endCode: "64999" },
  { regionId: regionMap["FR-65"], startCode: "65000", endCode: "65999" },
  { regionId: regionMap["FR-66"], startCode: "66000", endCode: "66999" },
  { regionId: regionMap["FR-67"], startCode: "67000", endCode: "67999" },
  { regionId: regionMap["FR-68"], startCode: "68000", endCode: "68999" },
  { regionId: regionMap["FR-69"], startCode: "69000", endCode: "69999" },
  { regionId: regionMap["FR-70"], startCode: "70000", endCode: "70999" },
  { regionId: regionMap["FR-71"], startCode: "71000", endCode: "71999" },
  { regionId: regionMap["FR-72"], startCode: "72000", endCode: "72999" },
  { regionId: regionMap["FR-73"], startCode: "73000", endCode: "73999" },
  { regionId: regionMap["FR-74"], startCode: "74000", endCode: "74999" },
  { regionId: regionMap["FR-75"], startCode: "75000", endCode: "75999" },
  { regionId: regionMap["FR-76"], startCode: "76000", endCode: "76999" },
  { regionId: regionMap["FR-77"], startCode: "77000", endCode: "77999" },
  { regionId: regionMap["FR-78"], startCode: "78000", endCode: "78999" },
  { regionId: regionMap["FR-79"], startCode: "79000", endCode: "79999" },
  { regionId: regionMap["FR-80"], startCode: "80000", endCode: "80999" },
  { regionId: regionMap["FR-81"], startCode: "81000", endCode: "81999" },
  { regionId: regionMap["FR-82"], startCode: "82000", endCode: "82999" },
  { regionId: regionMap["FR-83"], startCode: "83000", endCode: "83999" },
  { regionId: regionMap["FR-84"], startCode: "84000", endCode: "84999" },
  { regionId: regionMap["FR-85"], startCode: "85000", endCode: "85999" },
  { regionId: regionMap["FR-86"], startCode: "86000", endCode: "86999" },
  { regionId: regionMap["FR-87"], startCode: "87000", endCode: "87999" },
  { regionId: regionMap["FR-88"], startCode: "88000", endCode: "88999" },
  { regionId: regionMap["FR-89"], startCode: "89000", endCode: "89999" },
  { regionId: regionMap["FR-90"], startCode: "90000", endCode: "90999" },
  { regionId: regionMap["FR-91"], startCode: "91000", endCode: "91999" },
  { regionId: regionMap["FR-92"], startCode: "92000", endCode: "92999" },
  { regionId: regionMap["FR-93"], startCode: "93000", endCode: "93999" },
  { regionId: regionMap["FR-94"], startCode: "94000", endCode: "94999" },
  { regionId: regionMap["FR-95"], startCode: "95000", endCode: "95999" },

  // SUISSE - Codes postaux par canton (échantillon)
  { regionId: regionMap["CH-GE"], startCode: "1200", endCode: "1299" },
  { regionId: regionMap["CH-VD"], startCode: "1000", endCode: "1099" },
  { regionId: regionMap["CH-VD"], startCode: "1400", endCode: "1499" },
  { regionId: regionMap["CH-VS"], startCode: "1900", endCode: "1999" },
  { regionId: regionMap["CH-FR"], startCode: "1700", endCode: "1799" },
  { regionId: regionMap["CH-NE"], startCode: "2000", endCode: "2099" },
  { regionId: regionMap["CH-JU"], startCode: "2800", endCode: "2899" },
  { regionId: regionMap["CH-BE"], startCode: "3000", endCode: "3999" },
  { regionId: regionMap["CH-ZH"], startCode: "8000", endCode: "8999" },
  { regionId: regionMap["CH-LU"], startCode: "6000", endCode: "6099" },
  { regionId: regionMap["CH-BS"], startCode: "4000", endCode: "4099" },
  { regionId: regionMap["CH-BL"], startCode: "4100", endCode: "4499" },

  // ESPAGNE - Codes postaux par province (échantillon)
  { regionId: regionMap["ES-M"], startCode: "28000", endCode: "28999" },
  { regionId: regionMap["ES-B"], startCode: "08000", endCode: "08999" },
  { regionId: regionMap["ES-V"], startCode: "46000", endCode: "46999" },
  { regionId: regionMap["ES-SE"], startCode: "41000", endCode: "41999" },
  { regionId: regionMap["ES-Z"], startCode: "50000", endCode: "50999" },
  { regionId: regionMap["ES-MA"], startCode: "29000", endCode: "29999" },
  { regionId: regionMap["ES-MU"], startCode: "30000", endCode: "30999" },
  { regionId: regionMap["ES-A"], startCode: "03000", endCode: "03999" },

  // ALLEMAGNE - Codes postaux par Land (échantillon)
  { regionId: regionMap["DE-BW"], startCode: "70000", endCode: "79999" },
  { regionId: regionMap["DE-BY"], startCode: "80000", endCode: "89999" },
  { regionId: regionMap["DE-BE"], startCode: "10000", endCode: "14999" },
  { regionId: regionMap["DE-NW"], startCode: "40000", endCode: "59999" },
  { regionId: regionMap["DE-HH"], startCode: "20000", endCode: "22999" },

  // PAYS-BAS - Codes postaux par province (4 chiffres)
  { regionId: regionMap["NL-NH"], startCode: "1000", endCode: "1999" },
  { regionId: regionMap["NL-ZH"], startCode: "2000", endCode: "3299" },
  { regionId: regionMap["NL-UT"], startCode: "3400", endCode: "3999" },
  { regionId: regionMap["NL-GE"], startCode: "6500", endCode: "7399" },
  { regionId: regionMap["NL-NB"], startCode: "4700", endCode: "5299" },
  { regionId: regionMap["NL-LI"], startCode: "5900", endCode: "6499" },
];

console.log("📍 Inserting postal code ranges...");
await db.delete(postalCodeRanges);
for (const range of postalCodeRangesData) {
  await db.insert(postalCodeRanges).values(range);
}

console.log(`✅ ${postalCodeRangesData.length} postal code ranges inserted\n`);

// ============================================
// RÉSUMÉ
// ============================================

console.log("✅ Seeding completed successfully!\n");
console.log("📊 Summary:");
console.log(`   - ${countriesData.length} countries`);
console.log(`   - ${regionsData.length} fine subdivisions (provinces, départements, cantons)`);
console.log(`   - ${postalCodeRangesData.length} postal code ranges\n`);

await connection.end();
process.exit(0);
