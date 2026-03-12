import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = createPool(process.env.DATABASE_URL);

async function check() {
  console.log("=== VÉRIFICATION DE COHÉRENCE ===\n");

  // 1. Check users and their roles
  const [users] = await pool.execute('SELECT id, name, email, role, partnerId, isActive FROM users ORDER BY id');
  console.log("--- UTILISATEURS ---");
  for (const u of users) {
    const partnerInfo = u.partnerId ? `partnerId=${u.partnerId}` : 'NO PARTNER';
    const status = u.isActive ? 'ACTIF' : 'INACTIF';
    console.log(`  [${u.id}] ${u.name} <${u.email}> role=${u.role} ${partnerInfo} ${status}`);
  }

  // 2. Check partners
  const [partners] = await pool.execute('SELECT id, companyName, primaryContactEmail, status FROM partners WHERE deletedAt IS NULL ORDER BY id');
  console.log("\n--- PARTENAIRES ---");
  for (const p of partners) {
    console.log(`  [${p.id}] ${p.companyName} <${p.primaryContactEmail}> status=${p.status}`);
  }

  // 3. Check for partners without associated users
  console.log("\n--- INCOHÉRENCES ---");
  
  // Partners without users
  const [orphanPartners] = await pool.execute(`
    SELECT p.id, p.companyName, p.primaryContactEmail 
    FROM partners p 
    LEFT JOIN users u ON u.partnerId = p.id 
    WHERE u.id IS NULL AND p.deletedAt IS NULL
  `);
  if (orphanPartners.length > 0) {
    console.log(`  ⚠ ${orphanPartners.length} partenaire(s) sans compte utilisateur:`);
    for (const p of orphanPartners) {
      console.log(`    - [${p.id}] ${p.companyName} <${p.primaryContactEmail}>`);
    }
  } else {
    console.log("  ✓ Tous les partenaires ont au moins un compte utilisateur");
  }

  // Users with PARTNER role (should be PARTNER_ADMIN)
  const [partnerRoleUsers] = await pool.execute("SELECT id, name, email, role, partnerId FROM users WHERE role = 'PARTNER'");
  if (partnerRoleUsers.length > 0) {
    console.log(`  ⚠ ${partnerRoleUsers.length} utilisateur(s) avec rôle PARTNER (devrait être PARTNER_ADMIN):`);
    for (const u of partnerRoleUsers) {
      console.log(`    - [${u.id}] ${u.name} <${u.email}> partnerId=${u.partnerId}`);
    }
  } else {
    console.log("  ✓ Aucun utilisateur avec le rôle PARTNER obsolète");
  }

  // Users with partner role but no partnerId
  const [noPartnerIdUsers] = await pool.execute("SELECT id, name, email, role FROM users WHERE role IN ('PARTNER_ADMIN', 'PARTNER', 'PARTNER_USER', 'PARTNER_ORDERS', 'PARTNER_FULL') AND partnerId IS NULL");
  if (noPartnerIdUsers.length > 0) {
    console.log(`  ⚠ ${noPartnerIdUsers.length} utilisateur(s) partenaire(s) sans partnerId:`);
    for (const u of noPartnerIdUsers) {
      console.log(`    - [${u.id}] ${u.name} <${u.email}> role=${u.role}`);
    }
  } else {
    console.log("  ✓ Tous les utilisateurs partenaires ont un partnerId");
  }

  // Users with partnerId pointing to non-existent or deleted partner
  const [brokenPartnerLinks] = await pool.execute(`
    SELECT u.id, u.name, u.email, u.partnerId 
    FROM users u 
    LEFT JOIN partners p ON u.partnerId = p.id AND p.deletedAt IS NULL
    WHERE u.partnerId IS NOT NULL AND p.id IS NULL
  `);
  if (brokenPartnerLinks.length > 0) {
    console.log(`  ⚠ ${brokenPartnerLinks.length} utilisateur(s) liés à un partenaire supprimé/inexistant:`);
    for (const u of brokenPartnerLinks) {
      console.log(`    - [${u.id}] ${u.name} <${u.email}> partnerId=${u.partnerId}`);
    }
  } else {
    console.log("  ✓ Tous les liens utilisateur-partenaire sont valides");
  }

  // Multiple PARTNER_ADMIN for same partner (not necessarily an error but worth noting)
  const [multiAdmins] = await pool.execute(`
    SELECT partnerId, COUNT(*) as cnt, GROUP_CONCAT(name SEPARATOR ', ') as names
    FROM users 
    WHERE role = 'PARTNER_ADMIN' AND partnerId IS NOT NULL AND isActive = 1
    GROUP BY partnerId 
    HAVING cnt > 1
  `);
  if (multiAdmins.length > 0) {
    console.log(`  ℹ ${multiAdmins.length} partenaire(s) avec plusieurs PARTNER_ADMIN:`);
    for (const m of multiAdmins) {
      console.log(`    - partnerId=${m.partnerId}: ${m.names} (${m.cnt} admins)`);
    }
  }

  // Check team invitations consistency
  const [pendingInvitations] = await pool.execute(`
    SELECT ti.id, ti.email, ti.partnerId, ti.role, ti.invitation_status
    FROM team_invitations ti
    WHERE ti.invitation_status = 'PENDING'
  `);
  console.log(`\n  ℹ ${pendingInvitations.length} invitation(s) d'équipe en attente`);

  // Check invitation tokens
  const [unusedTokens] = await pool.execute(`
    SELECT id, email, partnerId, role, expiresAt 
    FROM invitation_tokens 
    WHERE usedAt IS NULL AND expiresAt > NOW()
  `);
  console.log(`  ℹ ${unusedTokens.length} token(s) d'invitation non utilisé(s) et valide(s)`);

  await pool.end();
  console.log("\n=== FIN DE LA VÉRIFICATION ===");
}

check().catch(console.error);
