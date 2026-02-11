import fs from 'fs';

// Read the CSV-like file
const raw = fs.readFileSync('/home/ubuntu/upload/market-spas-leads-2026-02-11.json', 'utf8');
const lines = raw.split('\n').filter(l => l.trim());

// Merge multi-line records (some addresses span multiple lines)
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

// Better parsing: we know the structure from the right side
// The last 2 fields are latitude,longitude (numbers or empty)
// Before that: status (non_contacte|en_cours|valide|archive)
// The fields from the left: id,company_name,full_name,city,phone,email,priority_score,showroom,vend_spa,autre_marque,domaine_similaire,notes,status,lat,lon

function parseRecord(line) {
  const parts = line.split(',');
  
  // Parse from the right: longitude, latitude, status
  // Find status field by searching from the right
  let statusIdx = -1;
  const validStatuses = ['non_contacte', 'en_cours', 'valide', 'archive'];
  
  for (let j = parts.length - 1; j >= 0; j--) {
    if (validStatuses.includes(parts[j].trim())) {
      statusIdx = j;
      break;
    }
  }
  
  if (statusIdx === -1) {
    console.warn('Could not find status in:', line.substring(0, 80));
    statusIdx = parts.length - 3; // fallback
  }
  
  const status = parts[statusIdx].trim();
  const latitude = (parts[statusIdx + 1] || '').trim() || null;
  const longitude = (parts[statusIdx + 2] || '').trim() || null;
  
  // From the left: id (0), company_name (1), full_name (2)
  const id = parts[0].trim();
  const companyName = parts[1].trim();
  const fullName = parts[2].trim();
  
  // Now find phone field (starts with p:+, +, 00, or "Non renseigné")
  let phoneIdx = -1;
  for (let j = 3; j < statusIdx; j++) {
    const val = parts[j].trim();
    if (/^p:\+|^\+\d|^00\d{2,}|^Non renseigné$/.test(val)) {
      phoneIdx = j;
      break;
    }
  }
  
  // If no phone found, look for email pattern to work backwards
  if (phoneIdx === -1) {
    for (let j = 3; j < statusIdx; j++) {
      if (parts[j].includes('@')) {
        phoneIdx = j - 1;
        break;
      }
    }
  }
  
  if (phoneIdx === -1) phoneIdx = 4; // fallback
  
  const city = parts.slice(3, phoneIdx).join(',').trim() || 'Non renseigné';
  const phone = (parts[phoneIdx] || '').replace('p:', '').trim();
  const email = (parts[phoneIdx + 1] || '').trim();
  const priorityScore = parseInt(parts[phoneIdx + 2]) || 0;
  const showroom = (parts[phoneIdx + 3] || 'non').trim();
  const vendSpa = (parts[phoneIdx + 4] || 'non').trim();
  const autreMarque = (parts[phoneIdx + 5] || 'non').trim();
  const domaineSimilaire = (parts[phoneIdx + 6] || 'non').trim();
  
  // Notes is everything between domaineSimilaire and status
  const notesStartIdx = phoneIdx + 7;
  const notes = parts.slice(notesStartIdx, statusIdx).join(',').trim() || null;
  
  return {
    id, companyName, fullName, city, phone, email,
    priorityScore, showroom, vendSpa, autreMarque, domaineSimilaire,
    notes, status,
    latitude, longitude
  };
}

const parsed = mergedLines.map(parseRecord);

// Verify the Awans record
const awans = parsed.find(r => r.companyName.includes('Tahiti'));
if (awans) {
  console.log('\nAwans record check:', JSON.stringify(awans, null, 2));
}

// Generate SQL INSERT statements
const sqlStatements = [];

for (const r of parsed) {
  const esc = (s) => (s || '').replace(/'/g, "''").replace(/\\/g, '\\\\').substring(0, 250);
  const lat = r.latitude && r.latitude !== '' && !isNaN(parseFloat(r.latitude)) ? `'${r.latitude}'` : 'NULL';
  const lon = r.longitude && r.longitude !== '' && !isNaN(parseFloat(r.longitude)) ? `'${r.longitude}'` : 'NULL';
  const notesVal = r.notes ? `'${esc(r.notes)}'` : 'NULL';
  
  let status = r.status;
  if (!['non_contacte', 'en_cours', 'valide', 'archive'].includes(status)) {
    status = 'non_contacte';
  }
  
  const sql = `INSERT INTO partner_candidates (companyName, fullName, city, phoneNumber, email, priorityScore, showroom, vendSpa, autreMarque, domaineSimilaire, notes, status, latitude, longitude, phoneCallsCount, emailsSentCount, visited, dateAdded, createdAt, updatedAt) VALUES ('${esc(r.companyName)}', '${esc(r.fullName)}', '${esc(r.city)}', '${esc(r.phone)}', '${esc(r.email)}', ${r.priorityScore}, '${esc(r.showroom)}', '${esc(r.vendSpa)}', '${esc(r.autreMarque)}', '${esc(r.domaineSimilaire)}', ${notesVal}, '${status}', ${lat}, ${lon}, 0, 0, 0, NOW(), NOW(), NOW());`;
  
  sqlStatements.push(sql);
}

fs.writeFileSync('/home/ubuntu/import-candidates.sql', sqlStatements.join('\n'), 'utf8');
console.log(`\nWrote ${sqlStatements.length} SQL statements to /home/ubuntu/import-candidates.sql`);

// Summary
const byStatus = {};
parsed.forEach(r => { byStatus[r.status] = (byStatus[r.status] || 0) + 1; });
console.log('\n--- SUMMARY ---');
console.log('By status:', byStatus);
console.log(`With coordinates: ${parsed.filter(r => r.latitude && !isNaN(parseFloat(r.latitude))).length}/${parsed.length}`);
console.log(`High priority (6+): ${parsed.filter(r => r.priorityScore >= 6).length}`);
