import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const updates = [
  ['Twin Plug&Play', 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031645455/jX4Ppf2KXZ8z9Tppipem7T/TwinP&P_a9c6baaa.jpg'],
  ['Neptune V2', 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031645455/jX4Ppf2KXZ8z9Tppipem7T/NeptuneV2_86696f63.jpg'],
  ['Mykonos', 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031645455/jX4Ppf2KXZ8z9Tppipem7T/Mykonos_28d39a41.jpg'],
  ['Easy Relax Plug&Play', 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031645455/jX4Ppf2KXZ8z9Tppipem7T/EasyRelaxp&p_ce443304.jpg'],
  ['Volcano', 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031645455/jX4Ppf2KXZ8z9Tppipem7T/Volcano_47b1011d.jpg'],
];

for (const [name, url] of updates) {
  const [result] = await conn.execute('UPDATE spa_models SET schemaImageUrl = ? WHERE name = ?', [url, name]);
  console.log(`${name}: ${result.affectedRows} rows updated`);
}

const [rows] = await conn.execute('SELECT name, schemaImageUrl FROM spa_models');
console.log(JSON.stringify(rows, null, 2));

await conn.end();
process.exit(0);
