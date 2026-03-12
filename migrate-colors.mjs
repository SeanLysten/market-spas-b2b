import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log("=== Migration des couleurs et fusion des variantes doublons ===\n");

// Step 1: For the 5 supplier products, merge duplicates into the new color variants
// Noir → Midnight Opal, Gris → Odyssey, Blanc → Sterling Marble (= Sterling Silver renamed)

const supplierProducts = [
  { name: "Neptune V2", productId: 60004 },
  { name: "Easy Relax", productId: 60001 },
  { name: "Volcano", productId: 60005 },
  { name: "Mykonos", productId: 60003 },
];

for (const prod of supplierProducts) {
  console.log(`\n--- ${prod.name} (id: ${prod.productId}) ---`);

  // Get all variants for this product
  const [variants] = await conn.execute(
    'SELECT id, name, color, stockQuantity, supplierProductCode, ean13, imageUrl FROM product_variants WHERE productId = ?',
    [prod.productId]
  );

  const findVariant = (color) => variants.find(v => v.color === color);

  // 1. Rename Sterling Silver → Sterling Marble
  const sterlingSilver = findVariant("Sterling Silver");
  if (sterlingSilver) {
    await conn.execute(
      'UPDATE product_variants SET color = ?, name = ? WHERE id = ?',
      ["Sterling Marble", `${prod.name} - Sterling Marble`, sterlingSilver.id]
    );
    console.log(`  ✅ Sterling Silver (${sterlingSilver.id}) → Sterling Marble`);
  }

  // 2. Merge Blanc into Sterling Marble (transfer stock if any)
  const blanc = findVariant("Blanc");
  if (blanc && sterlingSilver) {
    // Transfer any references (cart_items, order_items, favorites) from Blanc to Sterling Marble
    await conn.execute('UPDATE cart_items SET variantId = ? WHERE variantId = ?', [sterlingSilver.id, blanc.id]);
    await conn.execute('UPDATE order_items SET variantId = ? WHERE variantId = ?', [sterlingSilver.id, blanc.id]);
    await conn.execute('UPDATE incoming_stock SET variantId = ? WHERE variantId = ?', [sterlingSilver.id, blanc.id]);
    // Add stock from Blanc to Sterling Marble
    if (blanc.stockQuantity > 0) {
      await conn.execute(
        'UPDATE product_variants SET stockQuantity = stockQuantity + ? WHERE id = ?',
        [blanc.stockQuantity, sterlingSilver.id]
      );
    }
    // Transfer image if Sterling Marble doesn't have one
    if (!sterlingSilver.imageUrl && blanc.imageUrl) {
      await conn.execute('UPDATE product_variants SET imageUrl = ? WHERE id = ?', [blanc.imageUrl, sterlingSilver.id]);
    }
    // Delete Blanc variant
    await conn.execute('DELETE FROM product_variants WHERE id = ?', [blanc.id]);
    console.log(`  ✅ Blanc (${blanc.id}) merged into Sterling Marble (${sterlingSilver.id}) and deleted`);
  }

  // 3. Merge Noir into Midnight Opal
  const noir = findVariant("Noir");
  const midnightOpal = findVariant("Midnight Opal");
  if (noir && midnightOpal) {
    await conn.execute('UPDATE cart_items SET variantId = ? WHERE variantId = ?', [midnightOpal.id, noir.id]);
    await conn.execute('UPDATE order_items SET variantId = ? WHERE variantId = ?', [midnightOpal.id, noir.id]);
    await conn.execute('UPDATE incoming_stock SET variantId = ? WHERE variantId = ?', [midnightOpal.id, noir.id]);
    if (noir.stockQuantity > 0) {
      await conn.execute(
        'UPDATE product_variants SET stockQuantity = stockQuantity + ? WHERE id = ?',
        [noir.stockQuantity, midnightOpal.id]
      );
    }
    if (!midnightOpal.imageUrl && noir.imageUrl) {
      await conn.execute('UPDATE product_variants SET imageUrl = ? WHERE id = ?', [noir.imageUrl, midnightOpal.id]);
    }
    await conn.execute('DELETE FROM product_variants WHERE id = ?', [noir.id]);
    console.log(`  ✅ Noir (${noir.id}) merged into Midnight Opal (${midnightOpal.id}) and deleted`);
  }

  // 4. Merge Gris into Odyssey
  const gris = findVariant("Gris");
  const odyssey = findVariant("Odyssey");
  if (gris && odyssey) {
    await conn.execute('UPDATE cart_items SET variantId = ? WHERE variantId = ?', [odyssey.id, gris.id]);
    await conn.execute('UPDATE order_items SET variantId = ? WHERE variantId = ?', [odyssey.id, gris.id]);
    await conn.execute('UPDATE incoming_stock SET variantId = ? WHERE variantId = ?', [odyssey.id, gris.id]);
    if (gris.stockQuantity > 0) {
      await conn.execute(
        'UPDATE product_variants SET stockQuantity = stockQuantity + ? WHERE id = ?',
        [gris.stockQuantity, odyssey.id]
      );
    }
    if (!odyssey.imageUrl && gris.imageUrl) {
      await conn.execute('UPDATE product_variants SET imageUrl = ? WHERE id = ?', [gris.imageUrl, odyssey.id]);
    }
    await conn.execute('DELETE FROM product_variants WHERE id = ?', [gris.id]);
    console.log(`  ✅ Gris (${gris.id}) merged into Odyssey (${odyssey.id}) and deleted`);
  }

  // 5. Remove Beige and Brun variants if they exist (these are not in the supplier's catalog)
  const beige = findVariant("Beige");
  if (beige) {
    await conn.execute('UPDATE cart_items SET variantId = NULL WHERE variantId = ?', [beige.id]);
    await conn.execute('DELETE FROM product_variants WHERE id = ?', [beige.id]);
    console.log(`  ✅ Beige (${beige.id}) deleted (not in supplier catalog)`);
  }
  const brun = findVariant("Brun");
  if (brun) {
    await conn.execute('UPDATE cart_items SET variantId = NULL WHERE variantId = ?', [brun.id]);
    await conn.execute('DELETE FROM product_variants WHERE id = ?', [brun.id]);
    console.log(`  ✅ Brun (${brun.id}) deleted (not in supplier catalog)`);
  }
}

// Step 2: For the other products (Ecstatic, Euphoria, Happy, Kos), rename colors
const otherProducts = [
  { name: "Ecstatic", productId: 60008 },
  { name: "Euphoria", productId: 60006 },
  { name: "Happy", productId: 60007 },
  { name: "Kos", productId: 60002 },
];

for (const prod of otherProducts) {
  console.log(`\n--- ${prod.name} (id: ${prod.productId}) ---`);

  const [variants] = await conn.execute(
    'SELECT id, name, color, stockQuantity, imageUrl FROM product_variants WHERE productId = ?',
    [prod.productId]
  );

  const findVariant = (color) => variants.find(v => v.color === color);

  // Rename Blanc → Sterling Marble
  const blanc = findVariant("Blanc");
  const sterlingSilver = findVariant("Sterling Silver");
  
  if (blanc && sterlingSilver) {
    // Both exist - merge Sterling Silver into Blanc (renamed to Sterling Marble)
    await conn.execute(
      'UPDATE product_variants SET color = ?, name = ? WHERE id = ?',
      ["Sterling Marble", `${prod.name} - Sterling Marble`, blanc.id]
    );
    // Transfer references from Sterling Silver to the renamed Blanc
    await conn.execute('UPDATE cart_items SET variantId = ? WHERE variantId = ?', [blanc.id, sterlingSilver.id]);
    await conn.execute('UPDATE order_items SET variantId = ? WHERE variantId = ?', [blanc.id, sterlingSilver.id]);
    await conn.execute('UPDATE incoming_stock SET variantId = ? WHERE variantId = ?', [blanc.id, sterlingSilver.id]);
    if (sterlingSilver.stockQuantity > 0) {
      await conn.execute(
        'UPDATE product_variants SET stockQuantity = stockQuantity + ? WHERE id = ?',
        [sterlingSilver.stockQuantity, blanc.id]
      );
    }
    await conn.execute('DELETE FROM product_variants WHERE id = ?', [sterlingSilver.id]);
    console.log(`  ✅ Blanc (${blanc.id}) → Sterling Marble, Sterling Silver (${sterlingSilver.id}) merged and deleted`);
  } else if (blanc) {
    await conn.execute(
      'UPDATE product_variants SET color = ?, name = ? WHERE id = ?',
      ["Sterling Marble", `${prod.name} - Sterling Marble`, blanc.id]
    );
    console.log(`  ✅ Blanc (${blanc.id}) → Sterling Marble`);
  } else if (sterlingSilver) {
    await conn.execute(
      'UPDATE product_variants SET color = ?, name = ? WHERE id = ?',
      ["Sterling Marble", `${prod.name} - Sterling Marble`, sterlingSilver.id]
    );
    console.log(`  ✅ Sterling Silver (${sterlingSilver.id}) → Sterling Marble`);
  }

  // Rename Noir → Midnight Opal
  const noir = findVariant("Noir");
  if (noir) {
    await conn.execute(
      'UPDATE product_variants SET color = ?, name = ? WHERE id = ?',
      ["Midnight Opal", `${prod.name} - Midnight Opal`, noir.id]
    );
    console.log(`  ✅ Noir (${noir.id}) → Midnight Opal`);
  }

  // Rename Gris → Odyssey
  const gris = findVariant("Gris");
  if (gris) {
    await conn.execute(
      'UPDATE product_variants SET color = ?, name = ? WHERE id = ?',
      ["Odyssey", `${prod.name} - Odyssey`, gris.id]
    );
    console.log(`  ✅ Gris (${gris.id}) → Odyssey`);
  }
}

// Step 3: Also rename Sterling Silver → Sterling Marble on Twin Plug & Play
console.log("\n--- Twin Plug & Play (id: 90001) ---");
const [twinVariants] = await conn.execute(
  'SELECT id, color FROM product_variants WHERE productId = 90001 AND color = ?',
  ["Sterling Silver"]
);
if (twinVariants.length > 0) {
  await conn.execute(
    'UPDATE product_variants SET color = ?, name = ? WHERE id = ?',
    ["Sterling Marble", "Twin Plug & Play - Sterling Marble", twinVariants[0].id]
  );
  console.log(`  ✅ Sterling Silver (${twinVariants[0].id}) → Sterling Marble`);
}

// Step 4: Update parent product stock totals
console.log("\n--- Updating parent product stock totals ---");
const [allProducts] = await conn.execute('SELECT id, name FROM products');
for (const p of allProducts) {
  const [vars] = await conn.execute(
    'SELECT SUM(stockQuantity) as total FROM product_variants WHERE productId = ?',
    [p.id]
  );
  const total = vars[0].total || 0;
  await conn.execute('UPDATE products SET stockQuantity = ? WHERE id = ?', [total, p.id]);
}
console.log("  ✅ All product stock totals updated");

// Final verification
console.log("\n=== Résultat final ===");
const [finalVariants] = await conn.execute(
  'SELECT pv.id, p.name as product, pv.color, pv.supplierProductCode, pv.ean13, pv.stockQuantity FROM product_variants pv JOIN products p ON p.id = pv.productId ORDER BY p.name, pv.color'
);
for (const v of finalVariants) {
  console.log(
    v.product.padEnd(20),
    (v.color || '-').padEnd(18),
    ('id:'+v.id).padEnd(10),
    (v.supplierProductCode || '-').padEnd(16),
    (v.ean13 || '-').padEnd(16),
    'stock:' + v.stockQuantity
  );
}

await conn.end();
console.log("\n✅ Migration terminée avec succès!");
