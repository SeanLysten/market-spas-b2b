import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // 1. Rename Neptune to Neptune V2
  console.log("Renaming Neptune to Neptune V2...");
  await conn.execute("UPDATE products SET name = 'Neptune V2' WHERE id = 60004");
  // Update variant names too
  await conn.execute("UPDATE product_variants SET name = REPLACE(name, 'Neptune -', 'Neptune V2 -') WHERE productId = 60004");

  // 2. Create Twin Plug & Play product
  console.log("Creating Twin Plug & Play product...");
  const [existingTwin] = await conn.execute("SELECT id FROM products WHERE name = 'Twin Plug & Play' LIMIT 1");
  let twinProductId;
  if (existingTwin.length > 0) {
    twinProductId = existingTwin[0].id;
    console.log(`Twin Plug & Play already exists with id ${twinProductId}`);
  } else {
    const [result] = await conn.execute(
      `INSERT INTO products (sku, name, category, pricePublicHT, pricePartnerHT, vatRate, trackStock, stockQuantity, isActive, isVisible, createdAt, updatedAt)
       VALUES ('SPA-TWIN-PLUG-PLAY', 'Twin Plug & Play', 'SPAS', '4990.00', '3990.00', '21', true, 0, true, true, NOW(), NOW())`
    );
    twinProductId = result.insertId;
    console.log(`Created Twin Plug & Play with id ${twinProductId}`);
  }

  // 3. Mapping of supplier codes to products/variants
  const supplierData = [
    // Neptune V2 (productId: 60004)
    { productId: 60004, color: "Sterling Silver", supplierCode: "662201 078 38", ean13: "3364549284619" },
    { productId: 60004, color: "Odyssey", supplierCode: "662201 079 38", ean13: "3364549284626" },
    { productId: 60004, color: "Midnight Opal", supplierCode: "662201 080 38", ean13: "3364549284633" },
    // Easy Relax (productId: 60001)
    { productId: 60001, color: "Sterling Silver", supplierCode: "662600 078 38", ean13: "3364549284640" },
    { productId: 60001, color: "Odyssey", supplierCode: "662600 079 38", ean13: "3364549284657" },
    { productId: 60001, color: "Midnight Opal", supplierCode: "662600 080 38", ean13: "3364549284664" },
    // Volcano (productId: 60005)
    { productId: 60005, color: "Sterling Silver", supplierCode: "662700 078 38", ean13: "3364549284718" },
    { productId: 60005, color: "Odyssey", supplierCode: "662700 079 38", ean13: "3364549284725" },
    { productId: 60005, color: "Midnight Opal", supplierCode: "662700 080 38", ean13: "3364549284732" },
    // Mykonos (productId: 60003)
    { productId: 60003, color: "Sterling Silver", supplierCode: "662800 078 38", ean13: "3364549284749" },
    { productId: 60003, color: "Odyssey", supplierCode: "662800 079 38", ean13: "3364549284756" },
    { productId: 60003, color: "Midnight Opal", supplierCode: "662800 080 38", ean13: "3364549284763" },
    // Twin Plug & Play (productId: dynamic)
    { productId: "TWIN", color: "Sterling Silver", supplierCode: "662900 078 38", ean13: "3364549284770" },
    { productId: "TWIN", color: "Odyssey", supplierCode: "662900 079 38", ean13: "3364549284787" },
    { productId: "TWIN", color: "Midnight Opal", supplierCode: "662900 080 38", ean13: "3364549284794" },
  ];

  // Product name map for variant naming
  const productNames = {
    60004: "Neptune V2",
    60001: "Easy Relax",
    60005: "Volcano",
    60003: "Mykonos",
  };

  for (const item of supplierData) {
    const actualProductId = item.productId === "TWIN" ? twinProductId : item.productId;
    const productName = item.productId === "TWIN" ? "Twin Plug & Play" : productNames[item.productId];

    // Check if variant exists for this product + color
    const [existing] = await conn.execute(
      "SELECT id FROM product_variants WHERE productId = ? AND color = ? LIMIT 1",
      [actualProductId, item.color]
    );

    if (existing.length > 0) {
      // Update existing variant
      console.log(`Updating variant ${productName} - ${item.color} (id: ${existing[0].id})`);
      await conn.execute(
        "UPDATE product_variants SET supplierProductCode = ?, ean13 = ?, updatedAt = NOW() WHERE id = ?",
        [item.supplierCode, item.ean13, existing[0].id]
      );
    } else {
      // Create new variant
      const variantName = `${productName} - ${item.color}`;
      const variantSku = `SPA-${productName.toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-')}-${item.color.toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-')}`;
      console.log(`Creating variant: ${variantName} (sku: ${variantSku})`);
      await conn.execute(
        `INSERT INTO product_variants (productId, sku, name, color, supplierProductCode, ean13, stockQuantity, stockReserved, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, 0, 0, true, NOW(), NOW())`,
        [actualProductId, variantSku, variantName, item.color, item.supplierCode, item.ean13]
      );
    }
  }

  // 4. Also set the supplier product code at the product level (base code without color suffix)
  const productCodes = [
    { id: 60004, code: "662201" },  // Neptune V2
    { id: 60001, code: "662600" },  // Easy Relax
    { id: 60005, code: "662700" },  // Volcano
    { id: 60003, code: "662800" },  // Mykonos
  ];
  for (const pc of productCodes) {
    await conn.execute("UPDATE products SET supplierProductCode = ? WHERE id = ?", [pc.code, pc.id]);
  }
  // Twin Plug & Play
  await conn.execute("UPDATE products SET supplierProductCode = ? WHERE id = ?", ["662900", twinProductId]);

  console.log("\nDone! All supplier codes and EAN13 have been set.");

  // Verify
  const [variants] = await conn.execute(
    "SELECT pv.id, pv.productId, pv.name, pv.color, pv.supplierProductCode, pv.ean13 FROM product_variants pv WHERE pv.supplierProductCode IS NOT NULL ORDER BY pv.productId, pv.id"
  );
  console.log("\nVariants with supplier codes:");
  console.table(variants);

  await conn.end();
}

main().catch(console.error);
