import mysql from 'mysql2/promise';

async function checkUser() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  const [rows] = await connection.execute(
    'SELECT id, email, name, role, loginMethod, LEFT(passwordHash, 20) as passwordHashPreview FROM users WHERE email = ?',
    ['marketing@spas-wellis.com']
  );
  
  console.log('User details:');
  console.log(JSON.stringify(rows[0], null, 2));
  
  await connection.end();
  process.exit(0);
}

checkUser().catch(console.error);
