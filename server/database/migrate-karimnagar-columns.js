import { pool } from '../config/db.js';

async function migrate() {
  console.log('======================================================');
  console.log('   AgriQueue: Karimnagar Mandis Schema Migration      ');
  console.log('======================================================\n');

  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Verify existing records before migration
    const [beforeRows] = await connection.query('SELECT COUNT(*) AS total FROM mandis');
    const totalBefore = beforeRows[0].total;
    console.log(`Initial records in mandis table: ${totalBefore}`);

    if (totalBefore !== 246) {
      console.warn(`⚠️ Warning: Expected 246 national records, found ${totalBefore}`);
    }

    // 2. Add columns if not already present
    const columnsToAdd = [
      { name: 'mandal', type: 'VARCHAR(100) DEFAULT NULL' },
      { name: 'village', type: 'VARCHAR(100) DEFAULT NULL' },
      { name: 'center_type', type: 'VARCHAR(100) DEFAULT NULL' },
      { name: 'commodities', type: 'TEXT DEFAULT NULL' },
      { name: 'source_url', type: 'VARCHAR(500) DEFAULT NULL' },
      { name: 'source_name', type: 'VARCHAR(150) DEFAULT NULL' }
    ];

    // Check existing columns
    const [colRows] = await connection.query('DESCRIBE mandis');
    const existingCols = new Set(colRows.map(c => c.Field.toLowerCase()));

    for (const col of columnsToAdd) {
      if (!existingCols.has(col.name.toLowerCase())) {
        console.log(`Adding column: ${col.name} (${col.type})...`);
        await connection.query(`ALTER TABLE mandis ADD COLUMN \`${col.name}\` ${col.type}`);
        console.log(`✅ Column '${col.name}' added.`);
      } else {
        console.log(`ℹ️ Column '${col.name}' already exists.`);
      }
    }

    // 3. Add composite index for mandal and village searches if not present
    const [indexRows] = await connection.query('SHOW INDEX FROM mandis');
    const existingIndices = new Set(indexRows.map(i => i.Key_name));

    if (!existingIndices.has('idx_mandis_mandal_village')) {
      console.log('Adding index `idx_mandis_mandal_village`...');
      await connection.query('ALTER TABLE mandis ADD INDEX `idx_mandis_mandal_village` (`district`, `mandal`, `village`)');
      console.log('✅ Index `idx_mandis_mandal_village` added.');
    } else {
      console.log('ℹ️ Index `idx_mandis_mandal_village` already exists.');
    }

    if (!existingIndices.has('idx_mandis_center_type')) {
      console.log('Adding index `idx_mandis_center_type`...');
      await connection.query('ALTER TABLE mandis ADD INDEX `idx_mandis_center_type` (`center_type`)');
      console.log('✅ Index `idx_mandis_center_type` added.');
    } else {
      console.log('ℹ️ Index `idx_mandis_center_type` already exists.');
    }

    // 4. Verify count after migration
    const [afterRows] = await connection.query('SELECT COUNT(*) AS total FROM mandis');
    const totalAfter = afterRows[0].total;
    console.log(`Records in mandis table after migration: ${totalAfter}`);

    if (totalAfter !== totalBefore) {
      throw new Error(`Record count mismatch! Before: ${totalBefore}, After: ${totalAfter}`);
    }

    console.log('\n🎉 Migration completed successfully with 100% data preservation!\n');

  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exitCode = 1;
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

migrate();
