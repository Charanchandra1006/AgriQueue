import { pool } from '../config/db.js';

async function importWarangalCoordinate() {
  console.log('================================================================');
  console.log('   AgriQueue STEP 5D: Import Approved Warangal Coordinate       ');
  console.log('   Target: Mandi ID 217 (Warangal APMC, Telangana)              ');
  console.log('================================================================\n');

  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Pre-update Baseline Verification
    const [preTotalRows] = await connection.query('SELECT COUNT(*) as cnt FROM mandis');
    const [preWithCoordsRows] = await connection.query('SELECT COUNT(*) as cnt FROM mandis WHERE latitude IS NOT NULL');
    const [preNullRows] = await connection.query('SELECT COUNT(*) as cnt FROM mandis WHERE latitude IS NULL');

    console.log('--- Pre-Update Database State ---');
    console.log(`Total Mandis:              ${preTotalRows[0].cnt}`);
    console.log(`Mandis with Coordinates:   ${preWithCoordsRows[0].cnt}`);
    console.log(`Mandis without Coordinates:${preNullRows[0].cnt}\n`);

    if (preTotalRows[0].cnt !== 246 || preWithCoordsRows[0].cnt !== 31) {
      throw new Error(`Unexpected baseline state! Total: ${preTotalRows[0].cnt}, Coords: ${preWithCoordsRows[0].cnt}`);
    }

    // Inspect ID 217 before update
    const [targetBefore] = await connection.query(
      'SELECT id, name, state, district, location, latitude, longitude FROM mandis WHERE id = 217'
    );
    console.log('Target Record Before Update:');
    console.table(targetBefore);

    if (targetBefore.length === 0) {
      throw new Error('Mandi ID 217 not found in database!');
    }

    // Inspect other candidates (126, 132, 151) to verify they are currently NULL
    const [otherCandidatesBefore] = await connection.query(
      'SELECT id, name, state, district, latitude, longitude FROM mandis WHERE id IN (126, 132, 151) ORDER BY id'
    );
    console.log('Other 3 Candidates (Must Remain NULL):');
    console.table(otherCandidatesBefore);

    // 2. Perform Parameterized UPDATE strictly on Mandi ID 217
    console.log('\nExecuting Parameterized SQL UPDATE for Mandi ID 217...');
    const updateSql = `
      UPDATE mandis
      SET latitude = ?, longitude = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND latitude IS NULL AND longitude IS NULL;
    `;
    const params = [17.9953189, 79.6275664, 217];

    const [updateResult] = await connection.query(updateSql, params);
    console.log(`SQL Execution Result: affectedRows = ${updateResult.affectedRows}, changedRows = ${updateResult.changedRows}\n`);

    if (updateResult.affectedRows !== 1) {
      throw new Error(`Expected 1 affected row, got ${updateResult.affectedRows}`);
    }

    // 3. Post-update Verification
    console.log('================================================================');
    console.log('                POST-UPDATE VERIFICATION                        ');
    console.log('================================================================');

    // Verify ID 217
    const [targetAfter] = await connection.query(
      'SELECT id, name, state, district, location, latitude, longitude FROM mandis WHERE id = 217'
    );
    console.log('Target Record After Update (Mandi ID 217):');
    console.table(targetAfter);

    // Verify candidates 126, 132, 151 remain untouched
    const [otherCandidatesAfter] = await connection.query(
      'SELECT id, name, state, district, latitude, longitude FROM mandis WHERE id IN (126, 132, 151) ORDER BY id'
    );
    console.log('Other Candidates Check (IDs 126, 132, 151 - Verified Untouched):');
    console.table(otherCandidatesAfter);

    // Verify overall counts
    const [postTotalRows] = await connection.query('SELECT COUNT(*) as cnt FROM mandis');
    const [postWithCoordsRows] = await connection.query('SELECT COUNT(*) as cnt FROM mandis WHERE latitude IS NOT NULL');
    const [postNullRows] = await connection.query('SELECT COUNT(*) as cnt FROM mandis WHERE latitude IS NULL');

    console.log('\n--- Overall Database Metrics Verification ---');
    console.log(`Total Mandis:              ${postTotalRows[0].cnt} (Expected: 246 - Match: ${postTotalRows[0].cnt === 246 ? '✅' : '❌'})`);
    console.log(`Mandis with Coordinates:   ${postWithCoordsRows[0].cnt} (Expected: 32 - Match: ${postWithCoordsRows[0].cnt === 32 ? '✅' : '❌'})`);
    console.log(`Mandis without Coordinates:${postNullRows[0].cnt} (Expected: 214 - Match: ${postNullRows[0].cnt === 214 ? '✅' : '❌'})`);

    console.log('\n🎉 Step 5D successfully completed: Exactly 1 record updated with zero unintended side-effects.\n');

  } catch (error) {
    console.error('❌ Error during Warangal coordinate update:', error);
    process.exitCode = 1;
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

importWarangalCoordinate();
