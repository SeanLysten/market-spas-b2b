import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { users } from './drizzle/schema.ts';

async function updatePassword() {
  const email = 'marketing@spas-wellis.com';
  const newPassword = 'Wellis1518';
  
  // Hash the password
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  // Connect to database
  const db = drizzle(process.env.DATABASE_URL);
  
  // Update the user
  await db.update(users)
    .set({ 
      passwordHash,
      loginMethod: 'local'
    })
    .where(eq(users.email, email));
  
  console.log(`Password updated for ${email}`);
  console.log(`New password: ${newPassword}`);
  process.exit(0);
}

updatePassword().catch(console.error);
