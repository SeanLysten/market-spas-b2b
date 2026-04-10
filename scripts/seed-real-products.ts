import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { sql } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL!;

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  console.log("=== Suppression des produits de test existants ===");

  // Supprimer les variantes, arrivages, favoris, items panier liés aux produits existants
  const tablesToClean = [
    "variant_options",
    "cart_items",
    "favorites",
    "scheduled_arrivals",
    "order_items",
    "product_variants",
    "products"
  ];
  
  for (const table of tablesToClean) {
    try {
      await db.execute(sql.raw(`DELETE FROM ${table}`));
      console.log(`  ✓ ${table} supprimés`);
    } catch (e: any) {
      if (e?.cause?.code === 'ER_NO_SUCH_TABLE') {
        console.log(`  ⚠ ${table} n'existe pas, ignoré`);
      } else if (e?.cause?.code === 'ER_ROW_IS_REFERENCED_2') {
        console.log(`  ⚠ ${table} a des références, ignoré (sera nettoyé après)`);
      } else {
        console.log(`  ⚠ ${table}: ${e?.cause?.sqlMessage || e.message}`);
      }
    }
  }

  console.log("\n=== Ajout des 10 spas réels ===\n");

  const spas = [
    {
      sku: "SPA-EASYRELAX",
      name: "Easy Relax",
      shortDescription: "Spa 5 places Plug & Play 16A avec 42 jets et système Bluetooth",
      description: "Le spa Easy Relax est un modèle compact et accessible de 5 places (2 allongées et 3 assises) doté de 42 jets pour un massage complet. Équipé d'un panneau de contrôle Balboa TP 200, d'un système de musique Bluetooth et d'un traitement de l'eau par lampe UV, il offre une expérience de relaxation complète. Sa connexion Plug & Play en 16A permet une installation simplifiée sans travaux électriques majeurs. Dimensions : 200x200x83 cm.",
      category: "SPAS",
      weight: 280,
      length: 200,
      width: 200,
      height: 83,
      specs: {
        weightFilled: "1245 kg",
        waterVolume: "965 L",
        seats: "5 places (2 allongées + 3 assises)",
        jets: "42 jets",
        pumps: "1x 3 HP + 1x 0.35 HP (circulation)",
        heater: "3 kW",
        filtration: "Filtre standard + Lampe UV",
        lighting: "Éclairage d'angle LED",
        controlPanel: "Balboa TP 200",
        insulation: "Isolation standard",
        shell: "Acrylique",
        electrical: "16A Plug & Play",
        features: "Musique Bluetooth, Lampe UV",
        cabinet: "Gris / Garniture en chêne"
      }
    },
    {
      sku: "SPA-KOS",
      name: "Kos",
      shortDescription: "Spa 3 places Plug & Play 16A avec 37 jets et panneau Gecko INK 336",
      description: "Le spa Kos est un modèle intimiste de 3 places (2 allongées et 1 assise) idéal pour les espaces réduits. Avec ses 37 jets, une pompe de 3 HP et un panneau de contrôle Gecko INK 336, il offre un massage puissant dans un format compact. Équipé d'un système Bluetooth et d'un traitement UV, il combine confort et praticité avec sa connexion Plug & Play en 16A. Dimensions : 200x165x78 cm.",
      category: "SPAS",
      weight: 350,
      length: 200,
      width: 165,
      height: 78,
      specs: {
        weightFilled: "1020 kg",
        waterVolume: "670 L",
        seats: "3 places (2 allongées + 1 assise)",
        jets: "37 jets",
        pumps: "1x 3 HP + 1x 0.35 HP (circulation)",
        heater: "2 kW",
        filtration: "Filtre + Lampe UV",
        lighting: "Éclairage d'angle LED",
        controlPanel: "Gecko INK 336",
        insulation: "Standard",
        shell: "Acrylique Odyssey",
        electrical: "16A Plug & Play",
        features: "Musique Bluetooth, Lampe UV",
        cabinet: "Gris / Garniture en chêne"
      }
    },
    {
      sku: "SPA-MYKONOS",
      name: "Mykonos",
      shortDescription: "Spa 3 places 20A avec 60 jets et panneau Smart Touch Balboa",
      description: "Le spa Mykonos est un modèle 3 places (1 couchée et 2 assises) offrant une expérience de massage intense avec ses 60 jets alimentés par 2 pompes de 2 HP. Son panneau de contrôle Smart Touch Balboa offre une interface intuitive et moderne. Équipé d'un système Bluetooth et d'un traitement UV, il allie performance et design dans un format généreux. Dimensions : 220x180x78 cm.",
      category: "SPAS",
      weight: 350,
      length: 220,
      width: 180,
      height: 78,
      specs: {
        weightFilled: "1010 kg",
        waterVolume: "660 L",
        seats: "3 places (1 couchée + 2 assises)",
        jets: "60 jets",
        pumps: "2x 2 HP + 1x 0.35 HP (circulation)",
        heater: "3 kW",
        filtration: "Filtre + Lampe UV",
        lighting: "Éclairage d'angle LED",
        controlPanel: "Smart Touch Balboa",
        insulation: "Standard",
        shell: "Acrylique Sterling White",
        electrical: "20A",
        features: "Musique Bluetooth, Lampe UV",
        cabinet: "Gris / Finition chêne"
      }
    },
    {
      sku: "SPA-NEPTUNE",
      name: "Neptune",
      shortDescription: "Spa 5 places 32A avec 88 jets, 3 pompes et isolation Termal Wrap",
      description: "Le spa Neptune est un modèle 5 places (3 assises et 2 allongées) haut de gamme doté de 88 jets pour un massage complet et puissant. Équipé de 3 pompes de 2 HP, d'une isolation Termal Wrap et d'un panneau de contrôle TP 600, il offre des performances exceptionnelles. Son système de traitement de l'eau par UV-Light assure une eau propre et saine. Marches incluses. Dimensions : 220x220x82 cm.",
      category: "SPAS",
      weight: 275,
      length: 220,
      width: 220,
      height: 82,
      specs: {
        weightFilled: "1425 kg",
        waterVolume: "1150 L",
        seats: "5 places (3 assises + 2 allongées)",
        jets: "88 jets",
        pumps: "3x 2 HP + 1x 0.35 HP (circulation)",
        heater: "3 kW",
        filtration: "Filtre + UV-Light",
        lighting: "LED",
        controlPanel: "TP 600",
        insulation: "Termal Wrap",
        shell: "Acrylique Sterling Silver",
        electrical: "230V / 32A",
        features: "Musique Bluetooth, UV-Light, Marches incluses",
        cabinet: "Gris"
      }
    },
    {
      sku: "SPA-VOLCANO",
      name: "Volcano",
      shortDescription: "Spa 5 places 32A avec 94 jets, écran tactile et 3 pompes de 3 HP",
      description: "Le spa Volcano est un modèle premium 5 places (3 assises et 2 allongées) avec 94 jets alimentés par 3 pompes de 3 HP et une pompe à air pour un massage d'exception. Son écran tactile offre un contrôle intuitif de toutes les fonctions. Doté d'un système UV, d'un éclairage LED et d'un système musical Bluetooth, il représente le summum du confort. Dimensions : 220x220x92 cm.",
      category: "SPAS",
      weight: 350,
      length: 220,
      width: 220,
      height: 92,
      specs: {
        weightFilled: "1242 kg",
        waterVolume: "956 L",
        seats: "5 places (3 assises + 2 allongées)",
        jets: "94 jets",
        pumps: "3x 3 HP + 1 pompe à air + 1x 0.35 HP (circulation)",
        heater: "3 kW",
        filtration: "2 filtres + Système UV",
        lighting: "LED",
        controlPanel: "Écran tactile",
        insulation: "18-20M",
        shell: "Acrylique Sterling Silver / Midnight Opal",
        electrical: "32A",
        features: "Musique Bluetooth, Système UV",
        cabinet: "Gris"
      }
    },
    {
      sku: "SPA-DELIGHT",
      name: "Delight",
      shortDescription: "Spa 5 places 20A avec 60 jets, 2 pompes de 5 HP et système Ozone + UV",
      description: "Le spa Delight est un modèle 5 places (3 assises et 2 couchées) offrant un volume d'eau généreux de 1420 L. Équipé de 60 jets, 2 pompes de 5 HP et une pompe à air, il délivre un massage puissant et enveloppant. Son système de traitement de l'eau combinant Ozone et UV garantit une eau toujours pure. Panneau de contrôle Balboa TB600. Dimensions : 213x213x91 cm.",
      category: "SPAS",
      weight: 380,
      length: 213,
      width: 213,
      height: 91,
      specs: {
        weightFilled: "1800 kg",
        waterVolume: "1420 L",
        seats: "5 places (3 assises + 2 couchées)",
        jets: "60 jets",
        pumps: "2x 5 HP + 1 pompe à air + 1x 0.35 HP (circulation)",
        heater: "3 kW",
        filtration: "Ozone + UV",
        lighting: "Éclairage d'angle LED",
        controlPanel: "Balboa TB600",
        insulation: "Standard",
        shell: "Acrylique Sterling White",
        electrical: "20A",
        features: "Musique Bluetooth, Ozone, UV",
        cabinet: "Gris / Finition chêne"
      }
    },
    {
      sku: "SPA-DEVOTION",
      name: "Devotion",
      shortDescription: "Spa 5 places 20A avec 82 jets, 2 pompes de 5 HP et système SW Ozone + UV",
      description: "Le spa Devotion est un modèle spacieux de 5 places (2 couchées et 3 semi-couchées) avec un volume d'eau de 1480 L. Ses 82 jets alimentés par 2 pompes de 5 HP et une pompe à air offrent un massage profond et relaxant. Le système de traitement SW Ozone + UV assure une qualité d'eau optimale. Panneau de contrôle Balboa TB600. Dimensions : 230x230x91 cm.",
      category: "SPAS",
      weight: 360,
      length: 230,
      width: 230,
      height: 91,
      specs: {
        weightFilled: "1840 kg",
        waterVolume: "1480 L",
        seats: "5 places (2 couchées + 3 semi-couchées)",
        jets: "82 jets",
        pumps: "2x 5 HP + 1 pompe à air + 1x 0.35 HP (circulation)",
        heater: "3 kW",
        filtration: "SW Ozone + UV",
        lighting: "Éclairage d'angle LED",
        controlPanel: "Balboa TB600",
        insulation: "Standard",
        shell: "Acrylique Sterling White",
        electrical: "20A",
        features: "Musique Bluetooth, SW Ozone + UV",
        cabinet: "Non spécifié"
      }
    },
    {
      sku: "SPA-ECSTATIC",
      name: "Ecstatic",
      shortDescription: "Spa 7 places 32A avec 170 jets, 3 pompes de 5 HP et pompe à vagues",
      description: "Le spa Ecstatic est un modèle grand format de 7 places (2 couchées et 5 assises) offrant une expérience de relaxation inégalée. Avec ses 170 jets alimentés par 3 pompes de 5 HP, une pompe à vagues et une pompe à air, il délivre un massage d'une puissance exceptionnelle. Son panneau de contrôle Balboa TB800, son système SW Ozone + UV et son volume de 1650 L en font le choix idéal pour les familles et les réceptions. Dimensions : 305x228x91 cm.",
      category: "SPAS",
      weight: 500,
      length: 305,
      width: 228,
      height: 91,
      specs: {
        weightFilled: "2150 kg",
        waterVolume: "1650 L",
        seats: "7 places (2 couchées + 5 assises)",
        jets: "170 jets",
        pumps: "3x 5 HP + 1 pompe à vagues + 1 pompe à air + 1x 0.35 HP (circulation)",
        heater: "3 kW",
        filtration: "SW Ozone + UV",
        lighting: "Éclairage d'angle LED",
        controlPanel: "Balboa TB800",
        insulation: "Standard",
        shell: "Acrylique Sterling White",
        electrical: "32A",
        features: "Musique Bluetooth, SW Ozone + UV, Pompe à vagues",
        cabinet: "Gris / Chêne"
      }
    },
    {
      sku: "SPA-EUPHORIA",
      name: "Euphoria",
      shortDescription: "Spa 4 places 25A avec 115 jets, 2 pompes de 5 HP et Balboa TB800",
      description: "Le spa Euphoria est un modèle luxueux de 4 places (2 assises et 2 allongées) conçu pour une relaxation profonde. Avec ses 115 jets alimentés par 2 pompes de 5 HP et une pompe à air, il offre un massage puissant et personnalisé. Son panneau de contrôle Balboa TB800, son système de traitement SW Ozone + UV et son volume généreux de 1550 L garantissent une expérience haut de gamme. Dimensions : 230x230x91 cm.",
      category: "SPAS",
      weight: 405,
      length: 230,
      width: 230,
      height: 91,
      specs: {
        weightFilled: "1955 kg",
        waterVolume: "1550 L",
        seats: "4 places (2 assises + 2 allongées)",
        jets: "115 jets",
        pumps: "2x 5 HP + 1 pompe à air + 1x 0.35 HP (circulation)",
        heater: "3 kW",
        filtration: "SW Ozone + UV",
        lighting: "Éclairage d'angle LED",
        controlPanel: "Balboa TB800",
        insulation: "Standard",
        shell: "Acrylique Sterling White",
        electrical: "230V / 25A",
        features: "Musique Bluetooth, SW Ozone + UV",
        cabinet: "Non spécifié"
      }
    },
    {
      sku: "SPA-HAPPY",
      name: "Happy",
      shortDescription: "Spa 4 places 20A avec 55 jets, 2 pompes de 5 HP et Balboa TB600",
      description: "Le spa Happy est un modèle convivial de 4 places (3 assises et 1 allongée) offrant un excellent rapport qualité-massage. Avec ses 55 jets alimentés par 2 pompes de 5 HP et une pompe à air, il délivre un massage complet et relaxant. Équipé d'un panneau Balboa TB600, d'un système Ozone + UV et d'un volume de 1050 L, il est idéal pour les familles. Dimensions : 213x175x83 cm.",
      category: "SPAS",
      weight: 275,
      length: 213,
      width: 175,
      height: 83,
      specs: {
        weightFilled: "1325 kg",
        waterVolume: "1050 L",
        seats: "4 places (3 assises + 1 allongée)",
        jets: "55 jets",
        pumps: "2x 5 HP + 1 pompe à air + 1x 0.35 HP (circulation)",
        heater: "3 kW",
        filtration: "SW Ozone + UV",
        lighting: "Éclairage d'angle LED",
        controlPanel: "Balboa TB600",
        insulation: "Standard",
        shell: "Acrylique Sterling White",
        electrical: "230V / 20A",
        features: "Musique Bluetooth, Ozone, UV",
        cabinet: "Gris / Finition chêne"
      }
    }
  ];

  const colors = ["Blanc", "Sterling Silver", "Noir", "Gris"];

  for (const spa of spas) {
    console.log(`Ajout du spa: ${spa.name}`);

    // Build the full description with specs as JSON in the description field
    const specsJson = JSON.stringify(spa.specs);

    // Insert product
    const [result] = await db.execute(sql`
      INSERT INTO products (sku, name, shortDescription, description, category, pricePublicHT, pricePartnerHT, vatRate, weight, length, width, height, stockQuantity, stockReserved, lowStockThreshold, trackStock, isActive, isVisible, isFeatured)
      VALUES (
        ${spa.sku},
        ${spa.name},
        ${spa.shortDescription},
        ${spa.description + "\n\n---\n\nSpécifications techniques:\n" + Object.entries(spa.specs).map(([k, v]) => `• ${k}: ${v}`).join("\n")},
        ${spa.category},
        ${0},
        ${0},
        ${"20"},
        ${spa.weight},
        ${spa.length},
        ${spa.width},
        ${spa.height},
        ${0},
        ${0},
        ${5},
        ${true},
        ${true},
        ${true},
        ${false}
      )
    `);

    const productId = (result as any).insertId;
    console.log(`  ✓ Produit créé (ID: ${productId})`);

    // Create 4 color variants
    for (const color of colors) {
      const variantSku = `${spa.sku}-${color.toUpperCase().replace(/ /g, "-")}`;
      const variantName = `${spa.name} - ${color}`;

      await db.execute(sql`
        INSERT INTO product_variants (productId, sku, name, color, pricePublicHT, pricePartnerHT, stockQuantity, stockReserved, isActive)
        VALUES (
          ${productId},
          ${variantSku},
          ${variantName},
          ${color},
          ${null},
          ${null},
          ${0},
          ${0},
          ${true}
        )
      `);
      console.log(`    ✓ Variante: ${variantName}`);
    }
  }

  console.log("\n=== Résumé ===");
  const [productCount] = await db.execute(sql`SELECT COUNT(*) as count FROM products`);
  const [variantCount] = await db.execute(sql`SELECT COUNT(*) as count FROM product_variants`);
  console.log(`Produits: ${(productCount as any)[0].count}`);
  console.log(`Variantes: ${(variantCount as any)[0].count}`);

  await connection.end();
  console.log("\n✅ Terminé avec succès !");
}

main().catch(console.error);
