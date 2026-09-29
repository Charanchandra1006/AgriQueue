import { pool } from '../config/db.js';

async function check() {
  try {
    const [haryana] = await pool.query(`
      SELECT id, name, state, district, latitude, longitude
      FROM mandis
      WHERE state = 'Haryana'
    `);

    console.log('Haryana mandis:');
    console.table(haryana);

    const [withCoords] = await pool.query(`
      SELECT id, name, state, district, latitude, longitude
      FROM mandis
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
    `);

    console.log(
      'Mandis with coordinates (count = ' + withCoords.length + '):'
    );

    console.table(withCoords);
  } catch (error) {
    console.error('Database verification failed:', error);
  } finally {
    await pool.end();
  }
}

check();
