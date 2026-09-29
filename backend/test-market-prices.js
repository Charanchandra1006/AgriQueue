import { pool } from './config/db.js';
import app from './index.js';
import { parseDateToMySQL, normalizeGovernmentRecord } from './services/marketPrices.js';

async function runTests() {
  console.log('\n======================================================');
  console.log('       Market Prices Backend Verification Suite       ');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`);
      failed++;
    }
  }

  try {
    // 1. Database table check
    console.log('--- Step 1: Database Table and Schema Checks ---');
    const [tableRows] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'agriqueue' AND TABLE_NAME = 'market_prices'
      ORDER BY ORDINAL_POSITION;
    `);

    assert(tableRows.length >= 13, `market_prices has ${tableRows.length} columns (expected >= 13)`);
    const colNames = tableRows.map(c => c.COLUMN_NAME);
    const requiredCols = [
      'id', 'state', 'district', 'market_name', 'commodity', 'variety',
      'arrival_date', 'min_price', 'max_price', 'modal_price',
      'source', 'fetched_at', 'created_at', 'updated_at'
    ];
    for (const col of requiredCols) {
      assert(colNames.includes(col), `Column '${col}' exists in market_prices`);
    }

    // Check unique key and indexes
    const [indexes] = await pool.query(`
      SHOW INDEX FROM market_prices;
    `);
    const indexNames = indexes.map(i => i.Key_name);
    assert(indexNames.includes('uq_market_prices_daily'), 'Unique constraint uq_market_prices_daily exists');
    assert(indexNames.includes('idx_market_prices_state'), 'Index idx_market_prices_state exists');
    assert(indexNames.includes('idx_market_prices_commodity'), 'Index idx_market_prices_commodity exists');
    assert(indexNames.includes('idx_market_prices_arrival_date'), 'Index idx_market_prices_arrival_date exists');

    // 2. Integrity check on existing tables
    console.log('\n--- Step 2: Existing Mandis & Records Integrity ---');
    const [mandiCountRows] = await pool.query('SELECT COUNT(*) AS total FROM mandis;');
    const totalMandis = mandiCountRows[0]?.total;
    assert(totalMandis === 302, `Existing mandi records intact: exactly 302 (found ${totalMandis})`);

    // 3. Unit test date parsing
    console.log('\n--- Step 3: Date Parsing & Data Normalization Units ---');
    assert(parseDateToMySQL('15/09/2026') === '2026-09-15', 'Parses DD/MM/YYYY correctly');
    assert(parseDateToMySQL('15-09-2026') === '2026-09-15', 'Parses DD-MM-YYYY correctly');
    assert(parseDateToMySQL('2026-09-15') === '2026-09-15', 'Parses YYYY-MM-DD correctly');
    assert(parseDateToMySQL('invalid') === null, 'Returns null on invalid date');

    // Unit test normalization
    const mockGovRecord = {
      State: 'Telangana',
      District: 'Karimnagar',
      Market: 'Karimnagar',
      Commodity: 'Paddy (Dhan)(Common)',
      Variety: 'Common',
      Arrival_Date: '15/09/2026',
      Min_Price: '2183',
      Max_Price: '2300',
      Modal_Price: '2203'
    };
    const norm = normalizeGovernmentRecord(mockGovRecord);
    assert(norm !== null, 'Normalizes valid government record successfully');
    assert(norm?.state === 'Telangana', 'Normalized state matches');
    assert(norm?.district === 'Karimnagar', 'Normalized district matches');
    assert(norm?.market_name === 'Karimnagar', 'Normalized market_name matches');
    assert(norm?.commodity === 'Paddy (Dhan)(Common)', 'Normalized commodity matches');
    assert(norm?.arrival_date === '2026-09-15', 'Normalized arrival_date is YYYY-MM-DD');
    assert(norm?.min_price === 2183, 'min_price parsed as number');
    assert(norm?.max_price === 2300, 'max_price parsed as number');
    assert(norm?.modal_price === 2203, 'modal_price parsed as number');
    assert(norm?.source.includes('Government of India'), 'Official source recorded');

    // Unit test rejection of invalid records
    const invalidRecord = {
      State: '',
      District: 'Karimnagar'
    };
    assert(normalizeGovernmentRecord(invalidRecord) === null, 'Rejects incomplete/invalid record without fake filling');

    // 4. Test API Endpoints via HTTP requests to local Express server
    console.log('\n--- Step 4: Testing API Routes on Server ---');
    const serverPort = 5000;
    
    // Test GET /api/market-prices
    const resGet = await fetch(`http://localhost:${serverPort}/api/market-prices?state=Telangana&district=Karimnagar`);
    assert(resGet.status === 200, 'GET /api/market-prices returns 200 OK');
    const jsonGet = await resGet.json();
    assert(jsonGet.success === true, 'GET /api/market-prices returns success: true');
    assert(Array.isArray(jsonGet.data), 'GET /api/market-prices returns data array');
    assert(jsonGet.source.includes('Government of India'), 'Source includes Government of India / AGMARKNET');

    // Test GET /api/market-prices/trends
    const resTrends = await fetch(`http://localhost:${serverPort}/api/market-prices/trends?period=7d`);
    assert(resTrends.status === 200, 'GET /api/market-prices/trends returns 200 OK');
    const jsonTrends = await resTrends.json();
    assert(jsonTrends.success === true, 'GET /api/market-prices/trends returns success: true');
    assert(jsonTrends.period === '7d', 'GET /api/market-prices/trends respects requested period');
    assert(Array.isArray(jsonTrends.points), 'GET /api/market-prices/trends returns points array');

    // Test GET /api/market-prices/trends?period=1y
    const resYearTrends = await fetch(`http://localhost:${serverPort}/api/market-prices/trends?period=1y`);
    assert(resYearTrends.status === 200, 'GET /api/market-prices/trends?period=1y returns 200 OK');
    const jsonYear = await resYearTrends.json();
    assert(jsonYear.aggregation === 'monthly', '1y period uses monthly aggregation');

    // Test POST /api/market-prices/sync (when key is empty)
    const resSync = await fetch(`http://localhost:${serverPort}/api/market-prices/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'Telangana' })
    });
    const jsonSync = await resSync.json();
    if (process.env.DATA_GOV_API_KEY) {
      console.log('DATA_GOV_API_KEY is present, sync executed:', jsonSync);
    } else {
      assert(resSync.status === 503, 'POST /api/market-prices/sync returns 503 when DATA_GOV_API_KEY is not set');
      assert(jsonSync.success === false, 'Sync correctly fails safely without fake data');
      assert(jsonSync.requiredConfiguration?.keyName === 'DATA_GOV_API_KEY', 'Clear instructions provided for DATA_GOV_API_KEY');
    }

    console.log(`\n======================================================`);
    console.log(`Total tests passed: ${passed}, failed: ${failed}`);
    console.log(`======================================================\n`);

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Test run failed with error:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
    process.exit(process.exitCode || 0);
  }
}

runTests();

