import fs from 'fs';

// Read the CSV-like file
const raw = fs.readFileSync('/home/ubuntu/upload/market-spas-leads-2026-02-11.json', 'utf8');
const lines = raw.split('\n').filter(l => l.trim());

// Merge multi-line records
const mergedLines = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (/^(lead-|manual-|store-)/.test(line)) {
    mergedLines.push(line);
  } else if (mergedLines.length > 0) {
    mergedLines[mergedLines.length - 1] += ' ' + line;
  }
}

console.log(`Found ${mergedLines.length} records to import`);

function parseRecord(line) {
  const parts = line.split(',');
  const validStatuses = ['non_contacte', 'en_cours', 'valide', 'archive'];
  
  let statusIdx = -1;
  for (let j = parts.length - 1; j >= 0; j--) {
    if (validStatuses.includes(parts[j].trim())) {
      statusIdx = j;
      break;
    }
  }
  if (statusIdx === -1) statusIdx = parts.length - 3;
  
  const status = parts[statusIdx].trim();
  const latitude = (parts[statusIdx + 1] || '').trim() || null;
  const longitude = (parts[statusIdx + 2] || '').trim() || null;
  
  const id = parts[0].trim();
  const companyName = parts[1].trim();
  const fullName = parts[2].trim();
  
  let phoneIdx = -1;
  for (let j = 3; j < statusIdx; j++) {
    const val = parts[j].trim();
    if (/^p:\+|^\+\d|^00\d{2,}|^Non renseigné$/.test(val)) {
      phoneIdx = j;
      break;
    }
  }
  if (phoneIdx === -1) {
    for (let j = 3; j < statusIdx; j++) {
      if (parts[j].includes('@')) {
        phoneIdx = j - 1;
        break;
      }
    }
  }
  if (phoneIdx === -1) phoneIdx = 4;
  
  const city = parts.slice(3, phoneIdx).join(',').trim() || 'Non renseigné';
  const phone = (parts[phoneIdx] || '').replace('p:', '').trim();
  const email = (parts[phoneIdx + 1] || '').trim();
  const priorityScore = parseInt(parts[phoneIdx + 2]) || 0;
  const showroom = (parts[phoneIdx + 3] || 'non').trim();
  const vendSpa = (parts[phoneIdx + 4] || 'non').trim();
  const autreMarque = (parts[phoneIdx + 5] || 'non').trim();
  const domaineSimilaire = (parts[phoneIdx + 6] || 'non').trim();
  const notesStartIdx = phoneIdx + 7;
  const notes = parts.slice(notesStartIdx, statusIdx).join(',').trim() || null;
  
  return {
    id, companyName, fullName, city, phone, email,
    priorityScore, showroom, vendSpa, autreMarque, domaineSimilaire,
    notes, status: validStatuses.includes(status) ? status : 'non_contacte',
    latitude: latitude && !isNaN(parseFloat(latitude)) ? latitude : null,
    longitude: longitude && !isNaN(parseFloat(longitude)) ? longitude : null,
  };
}

const parsed = mergedLines.map(parseRecord);

// Use mysql2 to connect to the database
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);

let inserted = 0;
let errors = 0;

for (const r of parsed) {
  try {
    await connection.execute(
      `INSERT INTO partner_candidates (companyName, fullName, city, phoneNumber, email, priorityScore, showroom, vendSpa, autreMarque, domaineSimilaire, notes, candidate_status, latitude, longitude, phoneCallsCount, emailsSentCount, visited, dateAdded, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, NOW(), NOW(), NOW())`,
      [
        r.companyName, r.fullName, r.city, r.phone, r.email,
        r.priorityScore, r.showroom, r.vendSpa, r.autreMarque, r.domaineSimilaire,
        r.notes, r.status, r.latitude, r.longitude
      ]
    );
    inserted++;
  } catch (err) {
    console.error(`Error inserting ${r.companyName}:`, err.message);
    errors++;
  }
}

console.log(`\nImport complete: ${inserted} inserted, ${errors} errors`);

const [rows] = await connection.execute('SELECT COUNT(*) as count FROM partner_candidates');
console.log(`Total candidates in DB: ${rows[0].count}`);

const [byStatus] = await connection.execute('SELECT candidate_status, COUNT(*) as count FROM partner_candidates GROUP BY candidate_status');
console.log('By status:', byStatus);

await connection.end();
