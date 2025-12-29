import mysql from 'mysql2/promise';

async function seedEvents() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Ajouter des événements de démonstration
  const events = [
    {
      title: "Promotion Nouvel An 2025",
      description: "Profitez de -15% sur tous les spas et jacuzzis jusqu'au 31 janvier. Code promo: NEWYEAR25",
      type: "PROMOTION",
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
      allDay: true,
      discountPercent: 15,
      promoCode: "NEWYEAR25",
      isPublished: true
    },
    {
      title: "Formation Technique Saunas",
      description: "Formation en ligne sur l'installation et la maintenance des saunas infrarouges. Inscription obligatoire.",
      type: "TRAINING",
      startDate: new Date('2025-01-15T10:00:00'),
      endDate: new Date('2025-01-15T16:00:00'),
      allDay: false,
      isPublished: true
    },
    {
      title: "Webinaire: Nouveautés 2025",
      description: "Découvrez en avant-première les nouveaux modèles de spas et accessoires pour 2025.",
      type: "WEBINAR",
      startDate: new Date('2025-01-20T14:00:00'),
      endDate: new Date('2025-01-20T15:30:00'),
      allDay: false,
      isPublished: true
    },
    {
      title: "Salon Piscine & Spa Bruxelles",
      description: "Retrouvez-nous au salon Piscine & Spa de Bruxelles. Stand B12. Entrée gratuite pour les partenaires.",
      type: "EVENT",
      startDate: new Date('2025-02-10'),
      endDate: new Date('2025-02-13'),
      allDay: true,
      isPublished: true
    },
    {
      title: "Promotion Saint-Valentin",
      description: "Offre spéciale couples: -10% sur les spas 2 places. Code promo: LOVE25",
      type: "PROMOTION",
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-02-14'),
      allDay: true,
      discountPercent: 10,
      promoCode: "LOVE25",
      isPublished: true
    },
    {
      title: "Lancement Swim Spa 2025",
      description: "Présentation officielle du nouveau Swim Spa Pro 6m avec système de nage à contre-courant amélioré.",
      type: "ANNOUNCEMENT",
      startDate: new Date('2025-03-01'),
      endDate: null,
      allDay: true,
      isPublished: true
    },
    {
      title: "Formation Installation Jacuzzis",
      description: "Formation pratique sur l'installation des jacuzzis. Lieu: Centre de formation Market Spas, Bruxelles.",
      type: "TRAINING",
      startDate: new Date('2025-03-15T09:00:00'),
      endDate: new Date('2025-03-15T17:00:00'),
      allDay: false,
      isPublished: true
    },
    {
      title: "Promotion Printemps",
      description: "Préparez la saison avec -20% sur les accessoires spa (couvertures, escaliers, produits d'entretien).",
      type: "PROMOTION",
      startDate: new Date('2025-03-20'),
      endDate: new Date('2025-04-15'),
      allDay: true,
      discountPercent: 20,
      promoCode: "SPRING25",
      isPublished: true
    }
  ];
  
  for (const event of events) {
    await connection.execute(
      `INSERT INTO events (title, description, type, startDate, endDate, allDay, discountPercent, promoCode, isPublished, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        event.title,
        event.description,
        event.type,
        event.startDate,
        event.endDate,
        event.allDay ? 1 : 0,
        event.discountPercent || null,
        event.promoCode || null,
        event.isPublished ? 1 : 0
      ]
    );
    console.log(`✅ Événement créé: ${event.title}`);
  }
  
  await connection.end();
  console.log('\n✅ Tous les événements ont été créés avec succès!');
}

seedEvents().catch(console.error);
