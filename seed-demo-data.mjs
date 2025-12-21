import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log("🌱 Seeding demo data...");

// Insert demo products
const demoProducts = [
  {
    sku: "SPA-001",
    name: "Spa 4 places Premium",
    description: "Spa extérieur 4 places avec jets hydromassants et éclairage LED",
    shortDescription: "Spa 4 places avec jets et LED",
    pricePublicHT: 4999.00,
    pricePartnerHT: 3999.00,
    vatRate: 21.00,
    stockQuantity: 15,
    weight: 350.5,
    dimensions: "210x210x90cm",
    isActive: true,
    isVisible: true,
    isFeatured: true,
    trackStock: true,
    lowStockThreshold: 5,
  },
  {
    sku: "SPA-002",
    name: "Spa 6 places Deluxe",
    description: "Spa extérieur 6 places avec système de filtration avancé",
    shortDescription: "Spa 6 places haut de gamme",
    pricePublicHT: 7999.00,
    pricePartnerHT: 6399.00,
    vatRate: 21.00,
    stockQuantity: 8,
    weight: 450.0,
    dimensions: "230x230x95cm",
    isActive: true,
    isVisible: true,
    isFeatured: true,
    trackStock: true,
    lowStockThreshold: 3,
  },
  {
    sku: "SPA-003",
    name: "Spa 2 places Compact",
    description: "Spa compact 2 places idéal pour petits espaces",
    shortDescription: "Spa 2 places compact",
    pricePublicHT: 2999.00,
    pricePartnerHT: 2399.00,
    vatRate: 21.00,
    stockQuantity: 25,
    weight: 200.0,
    dimensions: "180x150x80cm",
    isActive: true,
    isVisible: true,
    isFeatured: false,
    trackStock: true,
    lowStockThreshold: 10,
  },
  {
    sku: "ACC-001",
    name: "Couverture thermique",
    description: "Couverture thermique isolante pour spa",
    shortDescription: "Couverture isolante",
    pricePublicHT: 299.00,
    pricePartnerHT: 239.00,
    vatRate: 21.00,
    stockQuantity: 50,
    weight: 15.0,
    isActive: true,
    isVisible: true,
    isFeatured: false,
    trackStock: true,
    lowStockThreshold: 15,
  },
  {
    sku: "ACC-002",
    name: "Kit d'entretien complet",
    description: "Kit complet pour l'entretien de votre spa",
    shortDescription: "Kit d'entretien",
    pricePublicHT: 149.00,
    pricePartnerHT: 119.00,
    vatRate: 21.00,
    stockQuantity: 100,
    weight: 5.0,
    isActive: true,
    isVisible: true,
    isFeatured: false,
    trackStock: true,
    lowStockThreshold: 30,
  },
  {
    sku: "ACC-003",
    name: "Escalier 3 marches",
    description: "Escalier robuste 3 marches pour accès facile au spa",
    shortDescription: "Escalier 3 marches",
    pricePublicHT: 199.00,
    pricePartnerHT: 159.00,
    vatRate: 21.00,
    stockQuantity: 30,
    weight: 12.0,
    dimensions: "80x60x60cm",
    isActive: true,
    isVisible: true,
    isFeatured: false,
    trackStock: true,
    lowStockThreshold: 10,
  },
];

try {
  for (const product of demoProducts) {
    await connection.execute(
      `INSERT INTO products (
        sku, name, description, pricePublicHT, pricePartnerHT, 
        vatRate, stockQuantity, isActive, isVisible
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        pricePublicHT = VALUES(pricePublicHT),
        pricePartnerHT = VALUES(pricePartnerHT),
        stockQuantity = VALUES(stockQuantity)`,
      [
        product.sku,
        product.name,
        product.description,
        product.pricePublicHT,
        product.pricePartnerHT,
        product.vatRate,
        product.stockQuantity,
        product.isActive,
        product.isVisible,
      ]
    );
    console.log(`✅ Product created: ${product.name}`);
  }

  console.log("\n✨ Demo data seeded successfully!");
} catch (error) {
  console.error("❌ Error seeding data:", error);
} finally {
  await connection.end();
}
