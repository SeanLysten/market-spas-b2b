import mysql from 'mysql2/promise';
import XLSX from 'xlsx';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// ===== CONFIGURATION =====
const EXCEL_FILE = '/home/ubuntu/upload/spa_pieces_detachees.xlsx';
const BRAND = 'MARKET_SPAS';

// Map Excel categories to DB enum values
const CATEGORY_MAP = {
  'Buses d\'eau': 'JETS',
  'Pompes & Chauffage': 'PUMPS',  // Will split pumps vs heating
  'Électronique & Contrôle': 'ELECTRONICS',
  'Accessoires hydrauliques': 'PLUMBING',
  'Confort & Finition': 'OTHER',
  'Zones de massage': 'JETS',
};

// More specific mapping based on part name
function getCategoryForPart(excelCategory, partName) {
  const nameLower = partName.toLowerCase();
  
  if (excelCategory === 'Pompes & Chauffage') {
    if (nameLower.includes('chauffage') || nameLower.includes('heating')) return 'HEATING';
    return 'PUMPS';
  }
  
  if (excelCategory === 'Électronique & Contrôle') {
    if (nameLower.includes('led') || nameLower.includes('light') || nameLower.includes('lumière')) return 'LIGHTING';
    if (nameLower.includes('enceinte') || nameLower.includes('audio') || nameLower.includes('speaker')) return 'AUDIO';
    return 'ELECTRONICS';
  }
  
  if (excelCategory === 'Accessoires hydrauliques') {
    if (nameLower.includes('ozone')) return 'OZONE_UVC';
    if (nameLower.includes('cascade') || nameLower.includes('rideau') || nameLower.includes('fontaine') || nameLower.includes('spray')) return 'PLUMBING';
    return 'PLUMBING';
  }
  
  if (excelCategory === 'Confort & Finition') {
    if (nameLower.includes('oreiller') || nameLower.includes('pillow')) return 'COVERS';
    return 'OTHER';
  }
  
  if (excelCategory === 'Buses d\'eau' || excelCategory === 'Zones de massage') {
    return 'JETS';
  }
  
  return CATEGORY_MAP[excelCategory] || 'OTHER';
}

// ===== PARSE EXCEL =====
function parseExcel() {
  const workbook = XLSX.readFile(EXCEL_FILE);
  
  // Parse Récapitulatif sheet for model specs
  const recapSheet = workbook.Sheets['Récapitulatif'];
  const recapData = XLSX.utils.sheet_to_json(recapSheet);
  
  const models = {};
  for (const row of recapData) {
    const name = row['Modèle'];
    if (!name) continue;
    models[name] = {
      name,
      dimensions: row['Dimensions'] || '',
      specs: {
        totalJets: row['Total buses eau'] || '',
        ledLights: row['LED lights'] || '',
        pump: row['Pompe à eau'] || '',
        heating: row['Chauffage'] || '',
        speakers: row['Enceintes'] || '',
        pillows: row['Oreillers'] || '',
      },
      parts: [],
    };
  }
  
  // Parse each model sheet for parts
  const modelSheets = ['Twin Plug&Play', 'Neptune V2', 'Mykonos', 'Easy Relax Plug&Play', 'Volcano'];
  
  for (const sheetName of modelSheets) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      console.warn(`Sheet "${sheetName}" not found`);
      continue;
    }
    
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    let currentCategory = '';
    
    // Skip header rows (first 2 rows)
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      const col0 = (row[0] || '').toString().trim();
      const col1 = (row[1] || '').toString().trim();
      const col2 = (row[2] || '').toString().trim();
      
      // If col0 has a value, it's a category header
      if (col0) {
        currentCategory = col0;
      }
      
      // If col1 has a value, it's a part name
      if (col1 && col1 !== 'Pièce / Composant') {
        // Skip "Total buses" summary rows
        if (col1 === 'Total buses' || col1 === 'Total buses eau') continue;
        
        const part = {
          name: col1,
          detail: col2,
          excelCategory: currentCategory,
        };
        
        if (models[sheetName]) {
          models[sheetName].parts.push(part);
        }
      }
    }
  }
  
  return models;
}

// ===== GENERATE REFERENCE =====
let refCounter = 1000;
function generateReference(modelShort, partName) {
  refCounter++;
  const prefix = modelShort.substring(0, 3).toUpperCase();
  return `MS-${prefix}-${String(refCounter).padStart(4, '0')}`;
}

function getModelShort(modelName) {
  const shorts = {
    'Twin Plug&Play': 'TWN',
    'Neptune V2': 'NPT',
    'Mykonos': 'MYK',
    'Easy Relax Plug&Play': 'ERL',
    'Volcano': 'VLC',
  };
  return shorts[modelName] || modelName.substring(0, 3).toUpperCase();
}

// ===== MAIN IMPORT =====
async function main() {
  console.log('📦 Parsing Excel file...');
  const models = parseExcel();
  
  console.log(`\n📊 Found ${Object.keys(models).length} models:`);
  for (const [name, model] of Object.entries(models)) {
    console.log(`  - ${name}: ${model.dimensions} (${model.parts.length} parts)`);
  }
  
  const connection = await mysql.createConnection(DATABASE_URL);
  console.log('\n🔌 Connected to database');
  
  try {
    // 1. Check existing data
    const [existingModels] = await connection.execute(
      'SELECT id, name FROM spa_models WHERE brand = ?', [BRAND]
    );
    console.log(`\n📋 Existing models: ${existingModels.length}`);
    
    // 2. Delete existing Market Spas data to avoid duplicates
    if (existingModels.length > 0) {
      const modelIds = existingModels.map(m => m.id);
      console.log(`🗑️  Cleaning existing Market Spas data...`);
      
      // Delete model-part links
      await connection.execute(
        `DELETE FROM spa_model_spare_parts WHERE spaModelId IN (${modelIds.join(',')})`
      );
      
      // Delete models
      await connection.execute(
        `DELETE FROM spa_models WHERE brand = ?`, [BRAND]
      );
      
      console.log(`   Deleted ${existingModels.length} existing models and their links`);
    }
    
    // 3. Create models
    console.log('\n🏗️  Creating models...');
    const modelIdMap = {};
    let sortOrder = 1;
    
    for (const [name, model] of Object.entries(models)) {
      const description = `Spa ${name} — ${model.dimensions}. ${model.specs.totalJets} buses, ${model.specs.pump}, ${model.specs.heating || 'N/A'} chauffage.`;
      
      const [result] = await connection.execute(
        `INSERT INTO spa_models (name, brand, series, dimensions, description, isActive, sortOrder) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, BRAND, 'Market Spas', model.dimensions, description, true, sortOrder++]
      );
      
      modelIdMap[name] = result.insertId;
      console.log(`   ✅ ${name} (ID: ${result.insertId})`);
    }
    
    // 4. Create spare parts and link to models
    console.log('\n🔧 Creating spare parts and linking to models...');
    
    // Track unique parts to avoid duplicates across models
    const partRefMap = {}; // reference -> partId
    let totalParts = 0;
    let totalLinks = 0;
    
    for (const [modelName, model] of Object.entries(models)) {
      const modelId = modelIdMap[modelName];
      const modelShort = getModelShort(modelName);
      
      console.log(`\n   📦 ${modelName}:`);
      
      for (const part of model.parts) {
        const category = getCategoryForPart(part.excelCategory, part.name);
        const reference = generateReference(modelShort, part.name);
        
        // Create the spare part
        const fullName = part.name;
        const description = part.detail ? `${part.detail} — Catégorie: ${part.excelCategory}` : `Catégorie: ${part.excelCategory}`;
        
        try {
          const [result] = await connection.execute(
            `INSERT INTO spare_parts (reference, name, description, category, priceHT, vatRate, stockQuantity, lowStockThreshold, isActive) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [reference, fullName, description, category, '0.00', '20', 0, 3, true]
          );
          
          const partId = result.insertId;
          totalParts++;
          
          // Link to model
          await connection.execute(
            `INSERT INTO spa_model_spare_parts (spaModelId, sparePartId, notes) VALUES (?, ?, ?)`,
            [modelId, partId, part.detail || null]
          );
          totalLinks++;
          
        } catch (err) {
          console.error(`   ❌ Error inserting "${fullName}": ${err.message}`);
        }
      }
      
      console.log(`   ✅ ${model.parts.length} parts created and linked`);
    }
    
    console.log(`\n\n✅ IMPORT COMPLETE:`);
    console.log(`   Models: ${Object.keys(models).length}`);
    console.log(`   Parts: ${totalParts}`);
    console.log(`   Links: ${totalLinks}`);
    
    // 5. Verify
    const [verifyModels] = await connection.execute(
      'SELECT m.id, m.name, m.dimensions, COUNT(l.id) as partCount FROM spa_models m LEFT JOIN spa_model_spare_parts l ON m.id = l.spaModelId WHERE m.brand = ? GROUP BY m.id ORDER BY m.sortOrder',
      [BRAND]
    );
    
    console.log('\n📊 Verification:');
    for (const m of verifyModels) {
      console.log(`   ${m.name} (${m.dimensions}): ${m.partCount} parts`);
    }
    
  } finally {
    await connection.end();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
