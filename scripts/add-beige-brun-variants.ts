import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { products, productVariants } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  // Get all products
  const allProducts = await db.select().from(products);
  console.log(`Found ${allProducts.length} products`);

  const newColors = ["Beige", "Brun"];
  let created = 0;
  let skipped = 0;

  for (const product of allProducts) {
    for (const color of newColors) {
      // Check if variant already exists
      const existing = await db
        .select()
        .from(productVariants)
        .where(
          and(
            eq(productVariants.productId, product.id),
            eq(productVariants.color, color)
          )
        );

      if (existing.length > 0) {
        console.log(`  SKIP: ${product.name} - ${color} (already exists)`);
        skipped++;
        continue;
      }

      const colorSuffix = color === "Beige" ? "BEI" : "BRN";
      const sku = `${product.sku}-${colorSuffix}`;

      await db.insert(productVariants).values({
        productId: product.id,
        sku,
        name: `${product.name} - ${color}`,
        color,
        stockQuantity: 0,
        priceAdjustmentHT: "0",
        isActive: false, // Désactivé par défaut, l'admin activera manuellement
        isDefault: false,
      });

      console.log(`  CREATED: ${product.name} - ${color} (SKU: ${sku}) [désactivé par défaut]`);
      created++;
    }
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped`);
  await connection.end();
}

main().catch(console.error);
