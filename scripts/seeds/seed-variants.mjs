import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log("🌱 Seeding product variants...");

// Get the "Spa 4 places Premium" product
const [products] = await connection.execute(
  "SELECT id FROM products WHERE sku = 'SPA-001' LIMIT 1"
);

if (!products || products.length === 0) {
  console.log("❌ Product SPA-001 not found. Please run seed-demo-data.mjs first.");
  await connection.end();
  process.exit(1);
}

const productId = products[0].id;
console.log(`✅ Found product ID: ${productId}`);

// Create variants for Spa 4 places Premium
const variants = [
  {
    sku: "SPA-001-BLUE",
    name: "Spa 4 places Premium - Bleu",
    priceAdjustmentHT: 0.00,
    stockQuantity: 5,
    isDefault: true,
    options: [
      { optionName: "Couleur", optionValue: "Bleu" },
    ],
  },
  {
    sku: "SPA-001-GREY",
    name: "Spa 4 places Premium - Gris",
    priceAdjustmentHT: 0.00,
    stockQuantity: 7,
    isDefault: false,
    options: [
      { optionName: "Couleur", optionValue: "Gris" },
    ],
  },
  {
    sku: "SPA-001-WHITE",
    name: "Spa 4 places Premium - Blanc",
    priceAdjustmentHT: 150.00,
    stockQuantity: 3,
    isDefault: false,
    options: [
      { optionName: "Couleur", optionValue: "Blanc" },
    ],
  },
];

try {
  for (const variant of variants) {
    // Get color from options
    const colorOption = variant.options.find(o => o.optionName === "Couleur");
    const color = colorOption ? colorOption.optionValue : null;

    // Insert variant using existing structure
    const [result] = await connection.execute(
      `INSERT INTO product_variants (
        productId, sku, name, color, stockQuantity, isActive
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        color = VALUES(color),
        stockQuantity = VALUES(stockQuantity)`,
      [
        productId,
        variant.sku,
        variant.name,
        color,
        variant.stockQuantity,
        true,
      ]
    );

    const variantId = result.insertId;
    console.log(`✅ Variant created: ${variant.name} (ID: ${variantId}) - Couleur: ${color}`);

    // Insert options in variant_options table
    for (const option of variant.options) {
      await connection.execute(
        `INSERT INTO variant_options (variantId, optionName, optionValue)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE optionValue = VALUES(optionValue)`,
        [variantId, option.optionName, option.optionValue]
      );
      console.log(`   ↳ Option: ${option.optionName} = ${option.optionValue}`);
    }
  }

  console.log("\n✨ Variants seeded successfully!");
} catch (error) {
  console.error("❌ Error seeding variants:", error);
} finally {
  await connection.end();
}
