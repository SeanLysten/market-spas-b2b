import { createPool } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const pool = createPool(process.env.DATABASE_URL);

async function fixVatRates() {
  // Fix products
  const [prodResult] = await pool.execute(
    "UPDATE products SET vatRate = 20.00 WHERE vatRate = 21.00"
  );
  console.log(`Products updated: ${prodResult.affectedRows}`);

  // Fix spare_parts
  const [spareResult] = await pool.execute(
    "UPDATE spare_parts SET vatRate = 20.00 WHERE vatRate = 21.00"
  );
  console.log(`Spare parts updated: ${spareResult.affectedRows}`);

  // Check for TEST-MOLLIE product specifically
  const [testProducts] = await pool.execute(
    "SELECT id, sku, name, vatRate FROM products WHERE sku LIKE '%TEST%' OR name LIKE '%Test%Mollie%'"
  );
  console.log("Test products:", testProducts);

  await pool.end();
}

fixVatRates().catch(console.error);
