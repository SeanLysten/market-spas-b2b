/**
 * Script de synchronisation : crée un compte utilisateur PARTNER_ADMIN
 * pour chaque partenaire qui n'en a pas encore.
 * 
 * Les comptes sont créés avec :
 * - email = primaryContactEmail du partenaire
 * - name = primaryContactName du partenaire
 * - role = PARTNER_ADMIN
 * - partnerId = id du partenaire
 * - openId = "partner-auto-{partnerId}" (temporaire, sera remplacé lors du premier login OAuth)
 * - Pas de mot de passe (login via invitation ou OAuth uniquement)
 */

import mysql from 'mysql2/promise';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const conn = await mysql.createConnection(url);

  // 1. Trouver tous les partenaires sans compte utilisateur associé
  const [partnersWithoutUser] = await conn.execute(`
    SELECT p.id, p.companyName, p.primaryContactEmail, p.primaryContactName, p.primaryContactPhone
    FROM partners p
    LEFT JOIN users u ON u.partnerId = p.id
    WHERE u.id IS NULL
    ORDER BY p.id
  `);

  console.log(`\n=== Synchronisation Partenaires → Utilisateurs ===`);
  console.log(`Partenaires sans compte utilisateur : ${partnersWithoutUser.length}\n`);

  if (partnersWithoutUser.length === 0) {
    console.log("Tous les partenaires ont déjà un compte utilisateur. Rien à faire.");
    await conn.end();
    return;
  }

  // 2. Regrouper par email pour gérer les doublons
  // Certains partenaires partagent le même email (ex: france@marketspas.com)
  const emailToPartners = {};
  for (const p of partnersWithoutUser) {
    const email = p.primaryContactEmail.toLowerCase();
    if (!emailToPartners[email]) {
      emailToPartners[email] = [];
    }
    emailToPartners[email].push(p);
  }

  let created = 0;
  let skipped = 0;

  for (const [email, partnersList] of Object.entries(emailToPartners)) {
    // Vérifier si un utilisateur avec cet email existe déjà
    const [existingUsers] = await conn.execute(
      'SELECT id, email, role, partnerId FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      // Si l'utilisateur existe mais n'a pas de partnerId, le lier au premier partenaire
      if (!existingUser.partnerId && partnersList.length > 0) {
        const firstPartner = partnersList[0];
        await conn.execute(
          'UPDATE users SET partnerId = ?, role = CASE WHEN role IN ("SUPER_ADMIN", "ADMIN") THEN role ELSE "PARTNER_ADMIN" END, updatedAt = NOW() WHERE id = ?',
          [firstPartner.id, existingUser.id]
        );
        console.log(`✓ Lié utilisateur existant #${existingUser.id} (${email}) → Partenaire "${firstPartner.companyName}" (#${firstPartner.id})`);
        created++;

        // Pour les autres partenaires avec le même email, créer des comptes séparés
        for (let i = 1; i < partnersList.length; i++) {
          const p = partnersList[i];
          const openId = `partner-auto-${p.id}-${Date.now()}`;
          await conn.execute(
            `INSERT INTO users (openId, email, name, firstName, lastName, phone, role, partnerId, loginMethod, isActive, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, 'PARTNER_ADMIN', ?, 'invitation', 1, NOW(), NOW())`,
            [openId, email, p.primaryContactName, p.primaryContactName.split(' ')[0] || p.primaryContactName, p.primaryContactName.split(' ').slice(1).join(' ') || '', p.primaryContactPhone || null, p.id]
          );
          console.log(`✓ Créé compte pour "${p.companyName}" (#${p.id}) → ${email}`);
          created++;
        }
      } else {
        // L'utilisateur existe déjà avec un partnerId, créer des comptes séparés pour les autres
        for (const p of partnersList) {
          if (existingUser.partnerId === p.id) {
            console.log(`⊘ Partenaire "${p.companyName}" (#${p.id}) déjà lié à utilisateur #${existingUser.id}`);
            skipped++;
            continue;
          }
          const openId = `partner-auto-${p.id}-${Date.now()}`;
          await conn.execute(
            `INSERT INTO users (openId, email, name, firstName, lastName, phone, role, partnerId, loginMethod, isActive, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, 'PARTNER_ADMIN', ?, 'invitation', 1, NOW(), NOW())`,
            [openId, email, p.primaryContactName, p.primaryContactName.split(' ')[0] || p.primaryContactName, p.primaryContactName.split(' ').slice(1).join(' ') || '', p.primaryContactPhone || null, p.id]
          );
          console.log(`✓ Créé compte pour "${p.companyName}" (#${p.id}) → ${email}`);
          created++;
        }
      }
    } else {
      // Aucun utilisateur avec cet email, créer un compte pour chaque partenaire
      for (const p of partnersList) {
        const openId = `partner-auto-${p.id}-${Date.now()}`;
        await conn.execute(
          `INSERT INTO users (openId, email, name, firstName, lastName, phone, role, partnerId, loginMethod, isActive, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, 'PARTNER_ADMIN', ?, 'invitation', 1, NOW(), NOW())`,
          [openId, email, p.primaryContactName, p.primaryContactName.split(' ')[0] || p.primaryContactName, p.primaryContactName.split(' ').slice(1).join(' ') || '', p.primaryContactPhone || null, p.id]
        );
        console.log(`✓ Créé compte pour "${p.companyName}" (#${p.id}) → ${email}`);
        created++;
      }
    }
  }

  console.log(`\n=== Résultat ===`);
  console.log(`Comptes créés/liés : ${created}`);
  console.log(`Ignorés (déjà liés) : ${skipped}`);
  console.log(`Total partenaires traités : ${partnersWithoutUser.length}\n`);

  await conn.end();
}

main().catch((err) => {
  console.error("Erreur:", err);
  process.exit(1);
});
