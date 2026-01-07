import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { afterSalesServices } from '../drizzle/schema.ts';

// Configuration de la base de données
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Fonction pour générer un numéro de série aléatoire
function generateSerialNumber() {
  const prefixes = ['SPA-WELLIS', 'SPA-AQUA', 'SPA-RELAX', 'SPA-WELLNESS'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const year = 2024;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${year}-${number}`;
}

// Fonction pour générer une date aléatoire dans les N dernières semaines
function getRandomDateInLastWeeks(weeks) {
  const now = new Date();
  const weeksAgo = new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
  const randomTime = weeksAgo.getTime() + Math.random() * (now.getTime() - weeksAgo.getTime());
  return new Date(randomTime);
}

// Données de test
const partners = [
  { id: 1, name: 'Relax Zone BVBA' },
  { id: 2, name: 'Aqua Dreams SA' },
  { id: 3, name: 'Spa Paradise SPRL' },
  { id: 4, name: 'Wellness Center NV' },
];

const issueTypes = ['TECHNICAL', 'LEAK', 'ELECTRICAL', 'HEATING', 'JETS', 'CONTROL_PANEL', 'OTHER'];
const statuses = ['NEW', 'IN_PROGRESS', 'WAITING_PARTS', 'RESOLVED', 'CLOSED'];
const urgencies = ['NORMAL', 'URGENT', 'CRITICAL'];

const problemDescriptions = [
  'Le spa ne chauffe plus correctement depuis quelques jours.',
  'Problème de filtration, l\'eau reste trouble malgré le traitement.',
  'Le panneau de contrôle affiche un code d\'erreur E03.',
  'Fuite d\'eau détectée au niveau de la pompe principale.',
  'Le système de jets ne fonctionne plus sur un côté du spa.',
  'Bruit anormal au niveau de la pompe de circulation.',
  'L\'éclairage LED ne s\'allume plus.',
  'Le spa se met en mode sécurité de façon aléatoire.',
  'Problème d\'étanchéité au niveau du couvercle.',
  'Le chauffage s\'arrête automatiquement après 2 heures.',
  'Les jets d\'air ne fonctionnent pas correctement.',
  'Dysfonctionnement du système de désinfection automatique.',
  'Le spa ne maintient pas la température programmée.',
  'Vibrations excessives lors du fonctionnement des pompes.',
  'Problème de communication entre le panneau et le système.',
];

const clientNames = [
  'Jean Dupont',
  'Marie Martin',
  'Pierre Dubois',
  'Sophie Laurent',
  'Luc Bernard',
  'Anne Petit',
  'François Durand',
  'Isabelle Moreau',
  'Michel Simon',
  'Catherine Thomas',
  'Jacques Robert',
  'Nathalie Lefebvre',
  'Philippe Roux',
  'Valérie Garcia',
  'Alain Martinez',
];

async function seedSAVTickets() {
  console.log('🌱 Starting SAV tickets seeding...');

  // Créer la connexion à la base de données
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  try {
    // Générer 15 tickets répartis sur 8 semaines
    const tickets = [];
    
    for (let i = 0; i < 15; i++) {
      const partner = partners[Math.floor(Math.random() * partners.length)];
      const issueType = issueTypes[Math.floor(Math.random() * issueTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const urgency = urgencies[Math.floor(Math.random() * urgencies.length)];
      const description = problemDescriptions[Math.floor(Math.random() * problemDescriptions.length)];
      const clientName = clientNames[Math.floor(Math.random() * clientNames.length)];
      const createdAt = getRandomDateInLastWeeks(8);
      
      // Générer un numéro de ticket unique
      const timestamp = createdAt.getTime();
      const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      const ticketNumber = `SAV-${timestamp}-${randomSuffix}`;

      tickets.push({
        ticketNumber,
        partnerId: partner.id,
        serialNumber: generateSerialNumber(),
        issueType,
        description,
        status,
        urgency,
        clientName,
        clientEmail: `${clientName.toLowerCase().replace(' ', '.')}@example.com`,
        clientPhone: `+32 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10}`,
        createdAt,
        updatedAt: createdAt,
      });
    }

    // Trier les tickets par date de création
    tickets.sort((a, b) => a.createdAt - b.createdAt);

    // Insérer les tickets dans la base de données
    for (const ticket of tickets) {
      await db.insert(afterSalesServices).values(ticket);
      console.log(`✅ Created ticket: ${ticket.ticketNumber} (${ticket.status}, ${ticket.urgency}) for ${ticket.clientName} - ${ticket.createdAt.toISOString().split('T')[0]}`);
    }

    console.log(`\n🎉 Successfully created ${tickets.length} SAV tickets!`);
    console.log('\nStatistics:');
    console.log(`- Partners: ${new Set(tickets.map(t => t.partnerId)).size}`);
    console.log(`- Statuses: ${Object.entries(tickets.reduce((acc, t) => ({ ...acc, [t.status]: (acc[t.status] || 0) + 1 }), {})).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
    console.log(`- Urgencies: ${Object.entries(tickets.reduce((acc, t) => ({ ...acc, [t.urgency]: (acc[t.urgency] || 0) + 1 }), {})).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
    console.log(`- Date range: ${tickets[0].createdAt.toISOString().split('T')[0]} to ${tickets[tickets.length - 1].createdAt.toISOString().split('T')[0]}`);

  } catch (error) {
    console.error('❌ Error seeding SAV tickets:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Exécuter le script
seedSAVTickets()
  .then(() => {
    console.log('\n✅ Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  });
