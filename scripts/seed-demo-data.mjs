import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

async function seedDemoData() {
  const connection = await mysql.createConnection(DATABASE_URL);

  console.log("🌱 Seeding demo data...");

  try {
    // Insert demo products
    const products = [
      {
        sku: "SPA-JACUZZI-001",
        name: "Jacuzzi Premium 6 places",
        description: "Jacuzzi haut de gamme avec jets massants, éclairage LED et système de filtration avancé. Parfait pour les installations professionnelles.",
        category: "Jacuzzis",
        brand: "Wellis",
        priceHT: 8500.00,
        vatRate: 21.00,
        stockQuantity: 15,
        minOrderQuantity: 1,
        weight: 450.00,
        dimensions: "220x220x90cm",
        isActive: true,
        isVisible: true,
      },
      {
        sku: "SPA-JACUZZI-002",
        name: "Jacuzzi Compact 4 places",
        description: "Jacuzzi compact idéal pour les petits espaces. Équipé de 30 jets et système de chauffage économique.",
        category: "Jacuzzis",
        brand: "Wellis",
        priceHT: 5200.00,
        vatRate: 21.00,
        stockQuantity: 22,
        minOrderQuantity: 1,
        weight: 280.00,
        dimensions: "180x180x80cm",
        isActive: true,
        isVisible: true,
      },
      {
        sku: "SPA-SWIM-001",
        name: "Swim Spa Pro 5m",
        description: "Swim spa professionnel avec système de nage à contre-courant. Idéal pour l'entraînement et la relaxation.",
        category: "Swim Spas",
        brand: "Wellis",
        priceHT: 18500.00,
        vatRate: 21.00,
        stockQuantity: 5,
        minOrderQuantity: 1,
        weight: 1200.00,
        dimensions: "500x230x140cm",
        isActive: true,
        isVisible: true,
      },
      {
        sku: "SPA-SAUNA-001",
        name: "Sauna Infrarouge 2 places",
        description: "Sauna infrarouge en bois de cèdre rouge. Chauffage rapide et consommation réduite.",
        category: "Saunas",
        brand: "Tylö",
        priceHT: 3200.00,
        vatRate: 21.00,
        stockQuantity: 18,
        minOrderQuantity: 1,
        weight: 180.00,
        dimensions: "120x100x190cm",
        isActive: true,
        isVisible: true,
      },
      {
        sku: "SPA-SAUNA-002",
        name: "Sauna Traditionnel 4 places",
        description: "Sauna traditionnel finlandais avec poêle électrique. Construction en épicéa de qualité supérieure.",
        category: "Saunas",
        brand: "Tylö",
        priceHT: 5800.00,
        vatRate: 21.00,
        stockQuantity: 8,
        minOrderQuantity: 1,
        weight: 350.00,
        dimensions: "200x180x200cm",
        isActive: true,
        isVisible: true,
      },
      {
        sku: "ACC-COVER-001",
        name: "Couverture Isotherme Premium",
        description: "Couverture isotherme haute densité pour jacuzzi. Réduit la consommation énergétique de 30%.",
        category: "Accessoires",
        brand: "SpaCover",
        priceHT: 450.00,
        vatRate: 21.00,
        stockQuantity: 45,
        minOrderQuantity: 2,
        weight: 25.00,
        dimensions: "220x220x10cm",
        isActive: true,
        isVisible: true,
      },
      {
        sku: "ACC-FILTER-001",
        name: "Filtre à Cartouche Standard",
        description: "Filtre de remplacement compatible avec la plupart des jacuzzis. Durée de vie: 6-12 mois.",
        category: "Accessoires",
        brand: "Pleatco",
        priceHT: 45.00,
        vatRate: 21.00,
        stockQuantity: 200,
        minOrderQuantity: 5,
        weight: 0.5,
        dimensions: "25x12cm",
        isActive: true,
        isVisible: true,
      },
      {
        sku: "CHEM-CHLORE-001",
        name: "Chlore Granulé 5kg",
        description: "Chlore granulé à dissolution rapide pour traitement de l'eau. Efficace contre les bactéries et algues.",
        category: "Produits chimiques",
        brand: "HTH",
        priceHT: 35.00,
        vatRate: 21.00,
        stockQuantity: 150,
        minOrderQuantity: 10,
        weight: 5.00,
        dimensions: "20x15x30cm",
        isActive: true,
        isVisible: true,
      },
      {
        sku: "CHEM-PH-001",
        name: "pH Minus 5kg",
        description: "Réducteur de pH pour maintenir l'équilibre de l'eau. Application facile et résultats rapides.",
        category: "Produits chimiques",
        brand: "HTH",
        priceHT: 28.00,
        vatRate: 21.00,
        stockQuantity: 180,
        minOrderQuantity: 10,
        weight: 5.00,
        dimensions: "20x15x25cm",
        isActive: true,
        isVisible: true,
      },
      {
        sku: "SPA-JACUZZI-003",
        name: "Jacuzzi Lounge 8 places",
        description: "Grand jacuzzi avec zone lounge intégrée. 60 jets, système audio Bluetooth et cascade d'eau.",
        category: "Jacuzzis",
        brand: "Wellis",
        priceHT: 12500.00,
        vatRate: 21.00,
        stockQuantity: 6,
        minOrderQuantity: 1,
        weight: 580.00,
        dimensions: "280x230x95cm",
        isActive: true,
        isVisible: true,
      },
    ];

    console.log("📦 Inserting products...");
    for (const product of products) {
      await connection.execute(
        `INSERT INTO products (sku, name, description, pricePublicHT, pricePartnerHT, vatRate, stockQuantity, weight, isActive, isVisible, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [
          product.sku,
          product.name,
          product.description,
          product.priceHT,
          product.priceHT * 0.85, // Partner price with 15% discount
          product.vatRate,
          product.stockQuantity,
          product.weight,
          product.isActive,
          product.isVisible,
        ]
      );
    }
    console.log(`✅ Inserted ${products.length} products`);

    // Insert demo partners
    const partners = [
      {
        companyName: "Spa Paradise SPRL",
        tradeName: "Spa Paradise",
        vatNumber: "BE0123456789",
        addressStreet: "Rue du Commerce 45",
        addressCity: "Bruxelles",
        addressPostalCode: "1000",
        addressCountry: "BE",
        primaryContactName: "Jean Dupont",
        primaryContactEmail: "contact@spaparadise.be",
        primaryContactPhone: "+32 2 123 45 67",
        level: "GOLD",
        discountPercent: "15.00",
        status: "APPROVED",
      },
      {
        companyName: "Wellness Center NV",
        tradeName: "Wellness Center",
        vatNumber: "BE0987654321",
        addressStreet: "Grote Markt 12",
        addressCity: "Antwerpen",
        addressPostalCode: "2000",
        addressCountry: "BE",
        primaryContactName: "Marie Janssen",
        primaryContactEmail: "info@wellnesscenter.be",
        primaryContactPhone: "+32 3 987 65 43",
        level: "PLATINUM",
        discountPercent: "20.00",
        status: "APPROVED",
      },
      {
        companyName: "Aqua Dreams SA",
        tradeName: "Aqua Dreams",
        vatNumber: "BE0456789123",
        addressStreet: "Avenue Louise 200",
        addressCity: "Bruxelles",
        addressPostalCode: "1050",
        addressCountry: "BE",
        primaryContactName: "Pierre Martin",
        primaryContactEmail: "sales@aquadreams.be",
        primaryContactPhone: "+32 2 456 78 90",
        level: "SILVER",
        discountPercent: "10.00",
        status: "APPROVED",
      },
      {
        companyName: "Relax Zone BVBA",
        tradeName: "Relax Zone",
        vatNumber: "BE0789123456",
        addressStreet: "Korenmarkt 8",
        addressCity: "Gent",
        addressPostalCode: "9000",
        addressCountry: "BE",
        primaryContactName: "Sophie Peeters",
        primaryContactEmail: "info@relaxzone.be",
        primaryContactPhone: "+32 9 789 12 34",
        level: "BRONZE",
        discountPercent: "5.00",
        status: "PENDING",
      },
    ];

    console.log("🏢 Inserting partners...");
    for (const partner of partners) {
      await connection.execute(
        `INSERT INTO partners (companyName, tradeName, vatNumber, addressStreet, addressCity, addressPostalCode, addressCountry, primaryContactName, primaryContactEmail, primaryContactPhone, level, discountPercent, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE companyName = VALUES(companyName)`,
        [
          partner.companyName,
          partner.tradeName,
          partner.vatNumber,
          partner.addressStreet,
          partner.addressCity,
          partner.addressPostalCode,
          partner.addressCountry,
          partner.primaryContactName,
          partner.primaryContactEmail,
          partner.primaryContactPhone,
          partner.level,
          partner.discountPercent,
          partner.status,
        ]
      );
    }
    console.log(`✅ Inserted ${partners.length} partners`);

    // Insert incoming stock
    const currentYear = new Date().getFullYear();
    const currentWeek = Math.ceil((new Date() - new Date(currentYear, 0, 1)) / (7 * 24 * 60 * 60 * 1000));

    console.log("📅 Inserting incoming stock...");
    const [productRows] = await connection.execute("SELECT id, sku FROM products LIMIT 5");
    
    for (const product of productRows) {
      await connection.execute(
        `INSERT INTO incoming_stock (productId, quantity, expectedWeek, expectedYear, status, notes, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 'PENDING', 'Commande fournisseur standard', NOW(), NOW())`,
        [product.id, Math.floor(Math.random() * 10) + 5, currentWeek + 2, currentYear]
      );
    }
    console.log("✅ Inserted incoming stock entries");

    console.log("\n🎉 Demo data seeded successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - ${products.length} products`);
    console.log(`   - ${partners.length} partners`);
    console.log(`   - ${productRows.length} incoming stock entries`);

  } catch (error) {
    console.error("❌ Error seeding data:", error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

seedDemoData().catch(console.error);
