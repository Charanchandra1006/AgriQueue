import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function cleanText(str) {
  if (!str) return '';
  return String(str).trim().replace(/\s+/g, ' ');
}

function normalizeKey(name, mandal, village) {
  return `${cleanText(name).toLowerCase()}|${cleanText(mandal).toLowerCase()}|${cleanText(village).toLowerCase()}`;
}

async function importKarimnagarMandis() {
  console.log('======================================================');
  console.log('   AgriQueue: Import Verified Karimnagar Hierarchy    ');
  console.log('======================================================\n');

  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Audit national records before starting
    const [nationalRows] = await connection.query(
      "SELECT COUNT(*) AS total FROM mandis WHERE source = 'e-NAM / Agmarknet (data.gov.in)'"
    );
    const initialNationalCount = nationalRows[0].total;
    console.log(`Audited existing national mandi records: ${initialNationalCount}`);

    if (initialNationalCount === 0) {
      console.warn(`⚠️ Integrity Alert: No national records found. (Did you forget to add the DATA_GOV_API_KEY?). Proceeding anyway for local testing...`);
    }

    // 2. Read verified Karimnagar dataset
    const dataPath = path.join(__dirname, 'mandi-data', 'karimnagar-verified-mandis.json');
    if (!fs.existsSync(dataPath)) {
      throw new Error(`Data file not found at: ${dataPath}`);
    }

    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`Loaded ${rawData.length} verified Karimnagar records from: ${dataPath}\n`);

    // 3. Deduplicate in-memory by normalized name + mandal + village
    const dedupeMap = new Map();
    for (const item of rawData) {
      const key = normalizeKey(item.name, item.mandal, item.village);
      if (!dedupeMap.has(key)) {
        dedupeMap.set(key, item);
      } else {
        console.warn(`⚠️ In-memory duplicate detected and skipped: ${item.name} (${item.mandal}, ${item.village})`);
      }
    }

    const uniqueRecords = Array.from(dedupeMap.values());
    console.log(`Unique verified records to process: ${uniqueRecords.length}`);

    // 4. Insert or update without modifying national records
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedNationalCollisions = 0;

    const sourceTag = 'Verified Karimnagar District Data (Administration & TSAMB)';

    for (const r of uniqueRecords) {
      const name = cleanText(r.name);
      const state = 'Telangana';
      const district = 'Karimnagar';
      const mandal = cleanText(r.mandal);
      const village = cleanText(r.village);
      const location = r.location ? cleanText(r.location) : `${village}, ${mandal}, Karimnagar, Telangana`;
      const latitude = r.latitude !== null && r.latitude !== undefined ? Number(r.latitude) : null;
      const longitude = r.longitude !== null && r.longitude !== undefined ? Number(r.longitude) : null;
      const centerType = cleanText(r.center_type);
      const commodities = Array.isArray(r.commodities) ? JSON.stringify(r.commodities) : (r.commodities || null);
      const sourceUrl = r.source_url || 'https://karimnagar.telangana.gov.in/';
      const sourceName = r.source_name || 'Karimnagar District Administration';
      const sourceUpdatedAt = r.source_updated_at || '2026-09-09';

      // Check if this exact (state, district, name) belongs to a national record
      const [existingRows] = await connection.query(
        'SELECT id, source FROM mandis WHERE state = ? AND district = ? AND name = ?',
        [state, district, name]
      );

      if (existingRows.length > 0 && existingRows[0].source === 'e-NAM / Agmarknet (data.gov.in)') {
        console.log(`🛡️ Preserving national record: [ID ${existingRows[0].id}] ${name} (National e-NAM entry preserved untouched)`);
        skippedNationalCollisions++;
        continue;
      }

      if (existingRows.length > 0) {
        // Update existing verified Karimnagar record
        await connection.query(
          `UPDATE mandis SET
            mandal = ?,
            village = ?,
            location = ?,
            latitude = ?,
            longitude = ?,
            center_type = ?,
            commodities = ?,
            source = ?,
            source_url = ?,
            source_name = ?,
            source_updated_at = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
          [
            mandal,
            village,
            location,
            latitude,
            longitude,
            centerType,
            commodities,
            sourceTag,
            sourceUrl,
            sourceName,
            sourceUpdatedAt,
            existingRows[0].id
          ]
        );
        updatedCount++;
      } else {
        // Insert new verified Karimnagar record
        await connection.query(
          `INSERT INTO mandis (
            name, state, district, mandal, village, location, latitude, longitude,
            center_type, commodities, source, source_url, source_name, source_updated_at, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
          [
            name,
            state,
            district,
            mandal,
            village,
            location,
            latitude,
            longitude,
            centerType,
            commodities,
            sourceTag,
            sourceUrl,
            sourceName,
            sourceUpdatedAt
          ]
        );
        insertedCount++;
      }
    }

    console.log('\n======================================================');
    console.log('           Karimnagar Import Summary                  ');
    console.log('======================================================');
    console.log(`New Verified Centers Inserted:   ${insertedCount}`);
    console.log(`Existing Verified Centers Updated: ${updatedCount}`);
    console.log(`National Records Preserved:      ${initialNationalCount}`);
    console.log(`Collisions with National Data:   ${skippedNationalCollisions}`);

    // 5. Verify post-import database integrity
    const [finalNational] = await connection.query(
      "SELECT COUNT(*) AS total FROM mandis WHERE source = 'e-NAM / Agmarknet (data.gov.in)'"
    );
    const [finalKarimnagar] = await connection.query(
      "SELECT COUNT(*) AS total FROM mandis WHERE source = ?",
      [sourceTag]
    );
    const [finalTotal] = await connection.query('SELECT COUNT(*) AS total FROM mandis');

    console.log('\n--- Final Database Status ---');
    console.log(`National Records Count:         ${finalNational[0].total} (Strictly 246 expected)`);
    console.log(`Verified Karimnagar Centers:    ${finalKarimnagar[0].total}`);
    console.log(`Total Active Records in DB:     ${finalTotal[0].total}`);

    if (finalNational[0].total === 0) {
      console.warn(`⚠️ Warning: National records are missing.`);
    }

    console.log('\n🎉 Verified Karimnagar hierarchy successfully imported into MySQL!\n');

  } catch (err) {
    console.error('❌ Import failed:', err);
    process.exitCode = 1;
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

importKarimnagarMandis();
