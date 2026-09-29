import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  console.log('=== AgriQueue Verified Coordinates Updater ===');

  // 1. Update karimnagar-verified-mandis.json
  const jsonPath = path.join(__dirname, 'mandi-data', 'karimnagar-verified-mandis.json');
  const mandisJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  let updatedInJson = 0;
  for (const m of mandisJson) {
    if (m.name === 'Manakondur Agricultural Market Committee (AMC)') {
      m.latitude = 18.4017477;
      m.longitude = 79.1848585;
      m.source_name = 'OpenStreetMap (Node 3535535566) & Telangana State Agricultural Marketing Department';
      m.source_url = 'https://www.openstreetmap.org/node/3535535566';
      m.source_updated_at = '2026-09-16';
      updatedInJson++;
    } else if (m.name === 'Manakondur Principal Market Yard') {
      m.latitude = 18.4017477;
      m.longitude = 79.1848585;
      m.source_name = 'OpenStreetMap (Node 3535535566) & Telangana State Agricultural Marketing Department';
      m.source_url = 'https://www.openstreetmap.org/node/3535535566';
      m.source_updated_at = '2026-09-16';
      updatedInJson++;
    } else if (m.name === 'Mulkanoor Cooperative Paddy Procurement Center') {
      m.latitude = 18.0775920;
      m.longitude = 79.3583687;
      m.source_name = 'OpenStreetMap (Way 1082311913 / Rythu Vedika 1082311932) & Mulkanoor Cooperative Society';
      m.source_url = 'https://www.openstreetmap.org/way/1082311913';
      m.source_updated_at = '2026-09-16';
      updatedInJson++;
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(mandisJson, null, 2), 'utf8');
  console.log(`[JSON] Updated ${updatedInJson} verified records in karimnagar-verified-mandis.json`);

  // 2. Update MySQL database
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'agriqueue',
    waitForConnections: true,
    connectionLimit: 5
  });

  try {
    const [countBeforeRows] = await pool.query('SELECT COUNT(*) as cnt FROM mandis');
    const countBefore = countBeforeRows[0].cnt;
    console.log(`[DB] Mandis count before update: ${countBefore}`);

    if (countBefore !== 302) {
      throw new Error(`Expected exactly 302 mandis, found ${countBefore}. Aborting!`);
    }

    // Update ID 258: Manakondur AMC
    const [res258] = await pool.query(`
      UPDATE mandis
      SET latitude = 18.40174770,
          longitude = 79.18485850,
          source = 'OpenStreetMap & TSAMB (Verified Facility)',
          source_name = 'OpenStreetMap (Node 3535535566) & Telangana State Agricultural Marketing Department',
          source_url = 'https://www.openstreetmap.org/node/3535535566',
          source_updated_at = '2026-09-16'
      WHERE id = 258 AND name = 'Manakondur Agricultural Market Committee (AMC)'
    `);
    console.log(`[DB] Updated ID 258 (Manakondur AMC): affected ${res258.affectedRows} row(s)`);

    // Update ID 259: Manakondur PMY
    const [res259] = await pool.query(`
      UPDATE mandis
      SET latitude = 18.40174770,
          longitude = 79.18485850,
          source = 'OpenStreetMap & TSAMB (Verified Facility)',
          source_name = 'OpenStreetMap (Node 3535535566) & Telangana State Agricultural Marketing Department',
          source_url = 'https://www.openstreetmap.org/node/3535535566',
          source_updated_at = '2026-09-16'
      WHERE id = 259 AND name = 'Manakondur Principal Market Yard'
    `);
    console.log(`[DB] Updated ID 259 (Manakondur PMY): affected ${res259.affectedRows} row(s)`);

    // Update ID 280: Mulkanoor Cooperative PPC
    const [res280] = await pool.query(`
      UPDATE mandis
      SET latitude = 18.07759200,
          longitude = 79.35836870,
          source = 'OpenStreetMap & TGCSCL (Verified Facility Campus)',
          source_name = 'OpenStreetMap (Way 1082311913 / Rythu Vedika 1082311932) & Mulkanoor Cooperative Society',
          source_url = 'https://www.openstreetmap.org/way/1082311913',
          source_updated_at = '2026-09-16'
      WHERE id = 280 AND name = 'Mulkanoor Cooperative Paddy Procurement Center'
    `);
    console.log(`[DB] Updated ID 280 (Mulkanoor Cooperative PPC): affected ${res280.affectedRows} row(s)`);

    // 3. Verify final count and state
    const [countAfterRows] = await pool.query('SELECT COUNT(*) as cnt FROM mandis');
    const countAfter = countAfterRows[0].cnt;
    console.log(`[DB] Mandis count after update: ${countAfter}`);

    if (countAfter !== 302) {
      throw new Error(`Integrity error: Total mandis changed from 302 to ${countAfter}!`);
    }

    const [karimnagarCoords] = await pool.query(`
      SELECT id, name, latitude, longitude, source, source_name
      FROM mandis
      WHERE district LIKE '%Karimnagar%' AND latitude IS NOT NULL
      ORDER BY id
    `);
    console.log(`\n[DB] Verified Karimnagar Centers with Coordinates (${karimnagarCoords.length}):`);
    console.table(karimnagarCoords);

    const [unverifiedKarimnagar] = await pool.query(`
      SELECT COUNT(*) as cnt
      FROM mandis
      WHERE district LIKE '%Karimnagar%' AND latitude IS NULL
    `);
    console.log(`[DB] Karimnagar Centers with NULL Coordinates (strict anti-centroid compliance): ${unverifiedKarimnagar[0].cnt}`);

    console.log('\n[DB] Database coordinate update completed successfully with 100% integrity!');
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Fatal error during update:', err);
  process.exit(1);
});
