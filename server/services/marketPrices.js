import { pool } from '../config/db.js';

// Official Open Government Data (OGD) Platform India - AGMARKNET Resource
export const DATA_GOV_RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
export const DATA_GOV_API_BASE = 'https://api.data.gov.in/resource';
export const OFFICIAL_SOURCE_NAME = 'Government of India / AGMARKNET / data.gov.in';

/**
 * Standardizes various date string formats (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD)
 * into MySQL DATE format: YYYY-MM-DD.
 * @param {string|Date} dateStr 
 * @returns {string|null}
 */
export function parseDateToMySQL(dateStr) {
  if (!dateStr) return null;
  const trimmed = String(dateStr).trim();

  // Match DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Match YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = trimmed.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Fallback to JS Date parser
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return null;
}

/**
 * Normalizes and validates a single raw government record from AGMARKNET / data.gov.in.
 * Returns null if required fields are missing or invalid.
 * @param {object} raw 
 * @returns {object|null}
 */
export function normalizeGovernmentRecord(raw) {
  if (!raw || typeof raw !== 'object') return null;

  // Extract fields handling various casing conventions in data.gov.in responses
  const state = (raw.state || raw.State || '').trim();
  const district = (raw.district || raw.District || '').trim();
  const marketName = (raw.market || raw.Market || raw.market_name || raw.Market_Name || '').trim();
  const commodity = (raw.commodity || raw.Commodity || '').trim();
  const variety = (raw.variety || raw.Variety || 'Other').trim() || 'Other';
  const rawDate = raw.arrival_date || raw.Arrival_Date || raw.date || raw.Date;

  const arrivalDate = parseDateToMySQL(rawDate);

  // Validate core categorical identifiers
  if (!state || !district || !marketName || !commodity || !arrivalDate) {
    return null;
  }

  // Parse numeric price fields (usually reported in Rs / quintal)
  const rawMin = raw.min_price !== undefined ? raw.min_price : raw.Min_Price;
  const rawMax = raw.max_price !== undefined ? raw.max_price : raw.Max_Price;
  const rawModal = raw.modal_price !== undefined ? raw.modal_price : raw.Modal_Price;

  const minVal = parseFloat(rawMin);
  const maxVal = parseFloat(rawMax);
  const modalVal = parseFloat(rawModal);

  // Must have at least one valid price
  const validModal = !isNaN(modalVal) && modalVal >= 0 ? modalVal : null;
  const validMin = !isNaN(minVal) && minVal >= 0 ? minVal : (validModal !== null ? validModal : null);
  const validMax = !isNaN(maxVal) && maxVal >= 0 ? maxVal : (validModal !== null ? validModal : null);

  if (validModal === null && validMin === null && validMax === null) {
    return null;
  }

  const finalModal = validModal !== null ? validModal : (validMin !== null ? validMin : validMax);
  let finalMin = validMin !== null ? validMin : finalModal;
  let finalMax = validMax !== null ? validMax : finalModal;

  // Sanity check: Ensure min <= max
  if (finalMin > finalMax) {
    const temp = finalMin;
    finalMin = finalMax;
    finalMax = temp;
  }

  return {
    state,
    district,
    market_name: marketName,
    commodity,
    variety,
    arrival_date: arrivalDate,
    min_price: Number(finalMin.toFixed(2)),
    max_price: Number(finalMax.toFixed(2)),
    modal_price: Number(finalModal.toFixed(2)),
    source: OFFICIAL_SOURCE_NAME
  };
}

/**
 * Fetches official daily mandi prices from data.gov.in and syncs to MySQL.
 * 
 * @param {object} options
 * @param {string} [options.state] Optional state filter
 * @param {string} [options.district] Optional district filter
 * @param {string} [options.commodity] Optional commodity filter
 * @param {number} [options.limit=100] Maximum records to fetch per batch
 * @param {number} [options.offset=0] Pagination offset
 * @returns {Promise<{ success: boolean, recordsFetched: number, recordsInserted: number, recordsUpdated: number, recordsSkipped: number, sourceDate: string|null, message: string }>}
 */
export async function syncMarketPrices(options = {}) {
  const apiKey = process.env.DATA_GOV_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    const error = new Error('DATA_GOV_API_KEY is not configured in server/.env');
    error.statusCode = 503;
    error.requiredConfig = {
      keyName: 'DATA_GOV_API_KEY',
      datasetName: 'Current Daily Price of Various Commodities from Various Markets (Mandi)',
      portalUrl: 'https://data.gov.in',
      resourceId: DATA_GOV_RESOURCE_ID,
      instruction: 'Register at data.gov.in, generate your API key, and set DATA_GOV_API_KEY=your_key in server/.env'
    };
    throw error;
  }

  const defaultLimit = options.state || options.district ? 500 : 500;
  const limit = Math.min(Math.max(parseInt(options.limit, 10) || defaultLimit, 1), 1000);
  const offset = Math.max(parseInt(options.offset, 10) || 0, 0);

  /**
   * Helper to execute a single GET request to official data.gov.in API
   */
  async function fetchGovBatch(params = {}) {
    const url = new URL(`${DATA_GOV_API_BASE}/${DATA_GOV_RESOURCE_ID}`);
    url.searchParams.set('api-key', apiKey.trim());
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', String(params.limit || limit));
    url.searchParams.set('offset', String(params.offset || offset));

    if (params.state) {
      url.searchParams.set('filters[state]', params.state.trim());
    }
    if (params.district) {
      url.searchParams.set('filters[district]', params.district.trim());
    }
    if (params.commodity) {
      url.searchParams.set('filters[commodity]', params.commodity.trim());
    }
    if (params.market) {
      url.searchParams.set('filters[market]', params.market.trim());
    }
    if (params.date || params.arrival_date) {
      const dateVal = String(params.date || params.arrival_date).trim();
      const dmyMatch = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      const formattedForGov = dmyMatch ? `${dmyMatch[3]}/${dmyMatch[2]}/${dmyMatch[1]}` : dateVal;
      url.searchParams.set('filters[arrival_date]', formattedForGov);
    }

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AgriQueue-Backend/1.0 (Government-Mandi-Integration)'
      }
    });

    if (!res.ok) {
      let errorDetail = `HTTP ${res.status} ${res.statusText}`;
      try {
        const errBody = await res.json();
        if (errBody.error) {
          errorDetail = typeof errBody.error === 'string' ? errBody.error : JSON.stringify(errBody.error);
        } else if (errBody.message) {
          errorDetail = errBody.message;
        }
      } catch {
        // Body not JSON
      }
      const err = new Error(`data.gov.in API request failed: ${errorDetail}`);
      err.statusCode = res.status === 401 || res.status === 403 ? 401 : 502;
      throw err;
    }

    const payload = await res.json();
    return Array.isArray(payload.records) ? payload.records : [];
  }

  let rawRecords = [];

  try {
    if (options.state || options.district || options.commodity || options.market) {
      // 1. Single targeted fetch for specified filters
      rawRecords = await fetchGovBatch(options);
    } else {
      // 2. Comprehensive multi-batch fetch:
      // Priority Batch 1: Telangana (capturing Karimnagar and regional APMCs)
      // Batch 2: National / General daily arrivals
      const [telanganaRecords, nationalRecords] = await Promise.all([
        fetchGovBatch({ state: 'Telangana', limit: 500 }),
        fetchGovBatch({ limit: 500 })
      ]);

      // Deduplicate records across batches by composite key
      const seen = new Set();
      const combined = [];
      for (const rec of [...telanganaRecords, ...nationalRecords]) {
        const st = (rec.state || rec.State || '').trim();
        const dist = (rec.district || rec.District || '').trim();
        const mkt = (rec.market || rec.Market || rec.market_name || '').trim();
        const cmd = (rec.commodity || rec.Commodity || '').trim();
        const varType = (rec.variety || rec.Variety || 'Other').trim();
        const dt = rec.arrival_date || rec.Arrival_Date || '';
        const key = `${st}|${dist}|${mkt}|${cmd}|${varType}|${dt}`;
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(rec);
        }
      }
      rawRecords = combined;
    }
  } catch (networkError) {
    if (networkError.statusCode) throw networkError;
    const error = new Error(`Network failure connecting to data.gov.in: ${networkError.message}`);
    error.statusCode = 502;
    throw error;
  }

  const fetchedAt = new Date();

  let recordsFetched = rawRecords.length;
  let recordsInserted = 0;
  let recordsUpdated = 0;
  let recordsSkipped = 0;
  let latestSourceDate = null;

  if (rawRecords.length === 0) {
    return {
      success: true,
      recordsFetched: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      sourceDate: null,
      message: 'No records returned from data.gov.in for the given filters.'
    };
  }


  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const upsertSql = `
      INSERT INTO market_prices 
        (state, district, market_name, commodity, variety, arrival_date, min_price, max_price, modal_price, source, fetched_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        min_price = VALUES(min_price),
        max_price = VALUES(max_price),
        modal_price = VALUES(modal_price),
        source = VALUES(source),
        fetched_at = VALUES(fetched_at),
        updated_at = CURRENT_TIMESTAMP
    `;

    for (const raw of rawRecords) {
      const normalized = normalizeGovernmentRecord(raw);

      if (!normalized) {
        recordsSkipped++;
        continue;
      }

      if (!latestSourceDate || normalized.arrival_date > latestSourceDate) {
        latestSourceDate = normalized.arrival_date;
      }

      const [result] = await connection.execute(upsertSql, [
        normalized.state,
        normalized.district,
        normalized.market_name,
        normalized.commodity,
        normalized.variety,
        normalized.arrival_date,
        normalized.min_price,
        normalized.max_price,
        normalized.modal_price,
        normalized.source,
        fetchedAt
      ]);

      // MySQL affectedRows: 1 = inserted, 2 = updated, 0 = unchanged existing
      if (result.affectedRows === 1) {
        recordsInserted++;
      } else if (result.affectedRows === 2) {
        recordsUpdated++;
      }
    }

    await connection.commit();
  } catch (dbErr) {
    await connection.rollback();
    throw dbErr;
  } finally {
    connection.release();
  }

  return {
    success: true,
    recordsFetched,
    recordsInserted,
    recordsUpdated,
    recordsSkipped,
    sourceDate: latestSourceDate,
    message: `Successfully synchronized ${recordsInserted + recordsUpdated} records (${recordsInserted} inserted, ${recordsUpdated} updated, ${recordsSkipped} skipped) from data.gov.in.`
  };
}

/**
 * Retrieves market price records from MySQL based on filters.
 * 
 * @param {object} filters
 * @param {string} [filters.state]
 * @param {string} [filters.district]
 * @param {string} [filters.commodity]
 * @param {string} [filters.market]
 * @param {string} [filters.date]
 * @param {number} [filters.limit=50]
 * @param {number} [filters.page=1]
 * @returns {Promise<{ records: Array, total: number, page: number, limit: number }>}
 */
export async function getMarketPrices(filters = {}) {
  const whereClauses = [];
  const params = [];

  if (filters.state) {
    whereClauses.push('state = ?');
    params.push(filters.state.trim());
  }
  if (filters.district) {
    whereClauses.push('district = ?');
    params.push(filters.district.trim());
  }
  if (filters.commodity) {
    whereClauses.push('commodity = ?');
    params.push(filters.commodity.trim());
  }
  if (filters.market) {
    whereClauses.push('market_name = ?');
    params.push(filters.market.trim());
  }
  if (filters.date) {
    const formattedDate = parseDateToMySQL(filters.date);
    if (formattedDate) {
      whereClauses.push('arrival_date = ?');
      params.push(formattedDate);
    }
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const page = Math.max(parseInt(filters.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(filters.limit, 10) || 50, 1), 1000);
  const offset = (page - 1) * limit;

  // Count total matching records
  const countSql = `SELECT COUNT(*) AS total FROM market_prices ${whereSql}`;
  const [countRows] = await pool.query(countSql, params);
  const total = countRows[0]?.total || 0;

  // Fetch paginated records ordered by arrival_date DESC, commodity ASC
  const querySql = `
    SELECT 
      id,
      state,
      district,
      market_name,
      commodity,
      variety,
      DATE_FORMAT(arrival_date, '%Y-%m-%d') AS arrival_date,
      CAST(min_price AS DOUBLE) AS min_price,
      CAST(max_price AS DOUBLE) AS max_price,
      CAST(modal_price AS DOUBLE) AS modal_price,
      source,
      fetched_at,
      created_at,
      updated_at
    FROM market_prices
    ${whereSql}
    ORDER BY arrival_date DESC, state ASC, district ASC, market_name ASC, commodity ASC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query(querySql, [...params, limit, offset]);

  return {
    records: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
}

/**
 * Retrieves market price trends based on stored records in market_prices.
 * Strictly uses real recorded data without fabricating missing dates.
 * 
 * @param {object} filters
 * @param {string} [filters.state]
 * @param {string} [filters.district]
 * @param {string} [filters.commodity]
 * @param {string} [filters.market]
 * @param {string} [filters.period='7d'] 'today', '7d', '30d', '1y'
 * @returns {Promise<{ period: string, summary: object, points: Array }>}
 */
export async function getMarketPriceTrends(filters = {}) {
  const period = (filters.period || '7d').toLowerCase();
  const validPeriods = ['today', '7d', '30d', '1y'];
  const effectivePeriod = validPeriods.includes(period) ? period : '7d';

  const whereClauses = [];
  const params = [];

  if (filters.state) {
    whereClauses.push('state = ?');
    params.push(filters.state.trim());
  }
  if (filters.district) {
    whereClauses.push('district = ?');
    params.push(filters.district.trim());
  }
  if (filters.commodity) {
    whereClauses.push('commodity = ?');
    params.push(filters.commodity.trim());
  }
  if (filters.market) {
    whereClauses.push('market_name = ?');
    params.push(filters.market.trim());
  }

  // Determine date filter based on requested period
  if (effectivePeriod === 'today') {
    // Arrival date is latest date recorded (or CURDATE())
    whereClauses.push('arrival_date = (SELECT MAX(arrival_date) FROM market_prices)');
  } else if (effectivePeriod === '7d') {
    whereClauses.push(`
      arrival_date >= (
        SELECT DATE_SUB(COALESCE(MAX(arrival_date), CURDATE()), INTERVAL 7 DAY) 
        FROM market_prices
      )
    `);
  } else if (effectivePeriod === '30d') {
    whereClauses.push(`
      arrival_date >= (
        SELECT DATE_SUB(COALESCE(MAX(arrival_date), CURDATE()), INTERVAL 30 DAY) 
        FROM market_prices
      )
    `);
  } else if (effectivePeriod === '1y') {
    whereClauses.push(`
      arrival_date >= (
        SELECT DATE_SUB(COALESCE(MAX(arrival_date), CURDATE()), INTERVAL 1 YEAR) 
        FROM market_prices
      )
    `);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  if (effectivePeriod === '1y') {
    // For 1 year, aggregate existing data by calendar month
    const sql = `
      SELECT 
        DATE_FORMAT(arrival_date, '%Y-%m') AS time_bucket,
        ROUND(AVG(modal_price), 2) AS avg_modal_price,
        ROUND(MIN(min_price), 2) AS min_price,
        ROUND(MAX(max_price), 2) AS max_price,
        COUNT(*) AS record_count
      FROM market_prices
      ${whereSql}
      GROUP BY DATE_FORMAT(arrival_date, '%Y-%m')
      ORDER BY time_bucket ASC
    `;

    const [rows] = await pool.query(sql, params);

    // Calculate overall stats from returned rows
    let overallMin = null;
    let overallMax = null;
    let totalModal = 0;
    let count = 0;

    rows.forEach(r => {
      const mn = parseFloat(r.min_price);
      const mx = parseFloat(r.max_price);
      const md = parseFloat(r.avg_modal_price);
      if (overallMin === null || mn < overallMin) overallMin = mn;
      if (overallMax === null || mx > overallMax) overallMax = mx;
      totalModal += md;
      count++;
    });

    return {
      period: '1y',
      aggregation: 'monthly',
      summary: {
        recordsFound: rows.length,
        overallMinPrice: overallMin,
        overallMaxPrice: overallMax,
        averageModalPrice: count > 0 ? Number((totalModal / count).toFixed(2)) : null
      },
      points: rows.map(r => ({
        label: r.time_bucket,
        date: `${r.time_bucket}-01`,
        minPrice: parseFloat(r.min_price),
        maxPrice: parseFloat(r.max_price),
        modalPrice: parseFloat(r.avg_modal_price),
        recordCount: r.record_count
      }))
    };
  }

  // Daily points for today, 7d, 30d
  const sql = `
    SELECT 
      DATE_FORMAT(arrival_date, '%Y-%m-%d') AS date_str,
      commodity,
      state,
      district,
      market_name,
      variety,
      CAST(min_price AS DOUBLE) AS min_price,
      CAST(max_price AS DOUBLE) AS max_price,
      CAST(modal_price AS DOUBLE) AS modal_price,
      source
    FROM market_prices
    ${whereSql}
    ORDER BY arrival_date ASC, state ASC, district ASC, market_name ASC, commodity ASC
  `;

  const [rows] = await pool.query(sql, params);

  let overallMin = null;
  let overallMax = null;
  let totalModal = 0;

  rows.forEach(r => {
    if (overallMin === null || r.min_price < overallMin) overallMin = r.min_price;
    if (overallMax === null || r.max_price > overallMax) overallMax = r.max_price;
    totalModal += r.modal_price;
  });

  return {
    period: effectivePeriod,
    aggregation: 'daily',
    summary: {
      recordsFound: rows.length,
      overallMinPrice: overallMin,
      overallMaxPrice: overallMax,
      averageModalPrice: rows.length > 0 ? Number((totalModal / rows.length).toFixed(2)) : null
    },
    points: rows.map(r => ({
      date: r.date_str,
      state: r.state,
      district: r.district,
      marketName: r.market_name,
      commodity: r.commodity,
      variety: r.variety,
      minPrice: r.min_price,
      maxPrice: r.max_price,
      modalPrice: r.modal_price
    }))
  };
}
