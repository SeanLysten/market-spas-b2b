import { db } from './server/db.ts';

async function checkUsers() {
  const users = await db.getAllUsers();
  console.log('Nombre total d utilisateurs:', users.length);
  
  for (const user of users.slice(0, 5)) {
    console.log('---');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Nom:', user.firstName, user.lastName);
    console.log('passwordHash present:', !!user.passwordHash);
    console.log('passwordHash longueur:', user.passwordHash?.length || 0);
    console.log('isActive:', user.isActive);
  }
  process.exit(0);
}

checkUsers().catch(console.error);
