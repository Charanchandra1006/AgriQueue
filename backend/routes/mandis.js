import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

/**
 * Converts 24-hour SQL time string (HH:MM:SS) to 12-hour AM/PM format
 */
function formatTime12h(timeStr) {
  if (!timeStr) return '08:00 AM';
  const parts = String(timeStr).split(':');
  let hour = parseInt(parts[0], 10);
  const minute = parts[1] || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${String(hour).padStart(2, '0')}:${minute} ${ampm}`;
}

/**
 * Default major commodities by state based on Agmarknet standards
 */
function getCommoditiesForState(state) {
  const s = String(state).toLowerCase();
  if (s.includes('punjab') || s.includes('haryana')) {
    return ['Wheat', 'Paddy (Basmati)', 'Cotton', 'Mustard', 'Maize'];
  }
  if (s.includes('rajasthan')) {
    return ['Bajra', 'Mustard', 'Wheat', 'Guar Seed', 'Gram'];
  }
  if (s.includes('uttar pradesh')) {
    return ['Wheat', 'Paddy', 'Sugarcane', 'Potato', 'Mustard'];
  }
  if (s.includes('madhya pradesh')) {
    return ['Soyabean', 'Wheat', 'Gram', 'Garlic', 'Onion'];
  }
  if (s.includes('maharashtra') || s.includes('gujarat')) {
    return ['Cotton', 'Groundnut', 'Soyabean', 'Onion', 'Wheat'];
  }
  if (s.includes('karnataka') || s.includes('andhra') || s.includes('telangana')) {
    return ['Paddy', 'Maize', 'Cotton', 'Chilli', 'Turmeric'];
  }
  return ['Wheat', 'Paddy', 'Maize', 'Vegetables'];
}

/**
 * Transforms a database row into API response with adapter for existing UI
 */
function transformMandiRow(row) {
  const hasCoordinates = row.latitude !== null && row.longitude !== null;
  const lat = hasCoordinates ? parseFloat(row.latitude) : null;
  const lng = hasCoordinates ? parseFloat(row.longitude) : null;
  const openStr = formatTime12h(row.opening_time || '08:00:00');
  const closeStr = formatTime12h(row.closing_time || '18:00:00');

  let commoditiesList = [];
  if (row.commodities) {
    try {
      commoditiesList = JSON.parse(row.commodities);
    } catch {
      commoditiesList = String(row.commodities).split(',').map(s => s.trim()).filter(Boolean);
    }
  } else {
    commoditiesList = getCommoditiesForState(row.state);
  }

  const effectiveCenterType = row.center_type || (row.source && row.source.includes('e-NAM') ? 'APMC / Market Committee' : 'Agricultural Market Facility');

  return {
    id: row.id,
    name: row.name,
    state: row.state,
    district: row.district,
    mandal: row.mandal || null,
    village: row.village || null,
    center_type: effectiveCenterType,
    centerType: effectiveCenterType,
    commodities: commoditiesList,
    location: row.location || `${row.district}, ${row.state}`,
    latitude: lat,
    longitude: lng,
    opening_time: row.opening_time,
    closing_time: row.closing_time,
    is_active: Boolean(row.is_active),
    source: row.source,
    source_url: row.source_url || null,
    source_name: row.source_name || null,
    source_updated_at: row.source_updated_at || null,
    hasCoordinates,
    // UI compatibility adapter
    external: {
      name: row.name,
      state: row.state,
      district: row.district,
      mandal: row.mandal || null,
      village: row.village || null,
      centerType: effectiveCenterType,
      location: row.location || `${row.district}, ${row.state}`,
      coordinates: hasCoordinates ? { latitude: lat, longitude: lng } : null,
      operatingHours: {
        openingTime: openStr,
        closingTime: closeStr
      },
      commodities: commoditiesList
    },
    // AgriQueue placeholders (to be replaced by live booking/queue tables in future steps)
    agriQueue: {
      availableSlots: 10,
      totalSlots: 20,
      queueLength: 5,
      estimatedWaitMinutes: 30
    },
    internal: {
      availableSlots: 10,
      totalSlots: 20,
      queueLength: 5,
      estimatedWaitMinutes: 30
    },
    fallbackDistance: '15 km'
  };
}

/**
 * GET /api/mandis
 * Query real mandi master records from MySQL
 * Supports: ?state=Punjab&district=Karimnagar&mandal=Choppadandi&centerType=...&search=...&hasCoordinates=true
 */
router.get('/', async (req, res) => {
  try {
    const { state, district, mandal, centerType, search, hasCoordinates } = req.query;

    let sql = `
      SELECT 
        id, 
        name, 
        state, 
        district, 
        mandal,
        village,
        center_type,
        commodities,
        location, 
        latitude, 
        longitude, 
        opening_time, 
        closing_time, 
        is_active, 
        source, 
        source_url,
        source_name,
        source_updated_at,
        created_at, 
        updated_at 
      FROM mandis 
      WHERE is_active = TRUE
    `;

    const params = [];

    if (state && state.trim()) {
      sql += ' AND LOWER(state) = LOWER(?)';
      params.push(state.trim());
    }

    if (district && district.trim()) {
      sql += ' AND LOWER(district) = LOWER(?)';
      params.push(district.trim());
    }

    if (mandal && mandal.trim()) {
      sql += ' AND LOWER(mandal) = LOWER(?)';
      params.push(mandal.trim());
    }

    if (centerType && centerType.trim()) {
      sql += ' AND LOWER(center_type) = LOWER(?)';
      params.push(centerType.trim());
    }

    if (search && search.trim()) {
      sql += ' AND (LOWER(name) LIKE ? OR LOWER(district) LIKE ? OR LOWER(state) LIKE ? OR LOWER(location) LIKE ? OR LOWER(IFNULL(mandal,"")) LIKE ? OR LOWER(IFNULL(village,"")) LIKE ?)';
      const term = `%${search.trim().toLowerCase()}%`;
      params.push(term, term, term, term, term, term);
    }

    if (hasCoordinates === 'true') {
      sql += ' AND latitude IS NOT NULL AND longitude IS NOT NULL';
    }

    sql += ' ORDER BY state ASC, district ASC, mandal ASC, name ASC';

    const [rows] = await pool.query(sql, params);
    const mandis = rows.map(transformMandiRow);

    return res.status(200).json({
      success: true,
      count: mandis.length,
      data: mandis
    });

  } catch (error) {
    console.error('Error in GET /api/mandis:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch mandi records'
    });
  }
});

/**
 * GET /api/mandis/hierarchy/karimnagar
 * Returns verified Karimnagar District hierarchy:
 * Karimnagar District -> Mandal -> Village -> Verified Mandis / Procurement Centers
 */
router.get('/hierarchy/karimnagar', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id, 
        name, 
        state, 
        district, 
        mandal,
        village,
        center_type,
        commodities,
        location, 
        latitude, 
        longitude, 
        opening_time, 
        closing_time, 
        is_active, 
        source, 
        source_url,
        source_name,
        source_updated_at
      FROM mandis 
      WHERE district = 'Karimnagar' AND is_active = TRUE
      ORDER BY mandal ASC, village ASC, name ASC
    `);

    // Group into 4-level hierarchy: District -> Mandal -> Village -> Centers
    const mandalsMap = new Map();

    rows.forEach(r => {
      // If a legacy national record has null mandal, map gracefully to its matching mandal in hierarchy view without touching DB
      let mandalName = r.mandal;
      if (!mandalName && r.name && r.name.toLowerCase().includes('saidapur')) {
        mandalName = 'V. Saidapur';
      }
      mandalName = mandalName || 'Other / District Level';

      const villageName = r.village || (mandalName === 'V. Saidapur' ? 'Saidapur' : 'General Area');

      if (!mandalsMap.has(mandalName)) {
        mandalsMap.set(mandalName, {
          mandal: mandalName,
          villagesMap: new Map(),
          totalCenters: 0
        });
      }

      const mandalObj = mandalsMap.get(mandalName);
      mandalObj.totalCenters++;

      if (!mandalObj.villagesMap.has(villageName)) {
        mandalObj.villagesMap.set(villageName, {
          village: villageName,
          centers: []
        });
      }

      mandalObj.villagesMap.get(villageName).centers.push(transformMandiRow(r));
    });

    const hierarchy = Array.from(mandalsMap.values()).map(m => ({
      mandal: m.mandal,
      totalCenters: m.totalCenters,
      villagesCount: m.villagesMap.size,
      villages: Array.from(m.villagesMap.values())
    }));

    return res.status(200).json({
      success: true,
      district: 'Karimnagar',
      state: 'Telangana',
      administrativeSource: 'https://karimnagar.telangana.gov.in/about-district/administrative-setup/mandals-and-villages/',
      totalCenters: rows.length,
      mandalsCount: hierarchy.length,
      mandals: hierarchy
    });

  } catch (error) {
    console.error('Error in GET /api/mandis/hierarchy/karimnagar:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch Karimnagar hierarchy'
    });
  }
});

/**
 * GET /api/mandis/meta/locations
 * Returns list of distinct states, districts, and mandals for dropdown filters
 */
router.get('/meta/locations', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT state, district, mandal 
      FROM mandis 
      WHERE is_active = TRUE 
      ORDER BY state ASC, district ASC, mandal ASC
    `);

    const stateMap = {};
    const mandalsByDistrict = {};

    rows.forEach(r => {
      if (!stateMap[r.state]) {
        stateMap[r.state] = [];
      }
      if (r.district && !stateMap[r.state].includes(r.district)) {
        stateMap[r.state].push(r.district);
      }

      if (r.district && r.mandal) {
        if (!mandalsByDistrict[r.district]) {
          mandalsByDistrict[r.district] = [];
        }
        if (!mandalsByDistrict[r.district].includes(r.mandal)) {
          mandalsByDistrict[r.district].push(r.mandal);
        }
      }
    });

    return res.status(200).json({
      success: true,
      states: Object.keys(stateMap).sort(),
      stateMap,
      mandalsByDistrict
    });
  } catch (error) {
    console.error('Error in GET /api/mandis/meta/locations:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch location metadata'
    });
  }
});

/**
 * Standard hourly procurement slots definition
 */
const DEFAULT_TIME_SLOTS = [
  { start: '09:00:00', end: '10:00:00', label: '09:00 AM – 10:00 AM' },
  { start: '10:00:00', end: '11:00:00', label: '10:00 AM – 11:00 AM' },
  { start: '11:00:00', end: '12:00:00', label: '11:00 AM – 12:00 PM' },
  { start: '12:00:00', end: '13:00:00', label: '12:00 PM – 01:00 PM' },
  { start: '13:00:00', end: '14:00:00', label: '01:00 PM – 02:00 PM' },
  { start: '14:00:00', end: '15:00:00', label: '02:00 PM – 03:00 PM' },
  { start: '15:00:00', end: '16:00:00', label: '03:00 PM – 04:00 PM' },
  { start: '16:00:00', end: '17:00:00', label: '04:00 PM – 05:00 PM' }
];

/**
 * GET /api/mandis/:id/slots
 * Returns real procurement slot availability for a mandi and date from MySQL mandi_slots table.
 * Supports: ?date=YYYY-MM-DD
 */
router.get('/:id/slots', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    const [mandiRows] = await pool.query(
      'SELECT id, name, district, state, opening_time, closing_time FROM mandis WHERE id = ? LIMIT 1',
      [parseInt(id, 10)]
    );

    if (mandiRows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Mandi with ID '${id}' not found`
      });
    }

    const mandi = mandiRows[0];
    const cleanDate = date ? String(date).slice(0, 10) : new Date().toISOString().slice(0, 10);

    // Query existing slot records in mandi_slots for this mandi & date
    const [existingSlots] = await pool.query(
      `SELECT id, slot_date, start_time, end_time, maximum_bookings, current_bookings, status 
       FROM mandi_slots 
       WHERE mandi_id = ? AND slot_date = ?`,
      [mandi.id, cleanDate]
    );

    const existingByTime = {};
    existingSlots.forEach(s => {
      const st = String(s.start_time).slice(0, 8);
      existingByTime[st] = s;
    });

    const slots = DEFAULT_TIME_SLOTS.map(def => {
      const match = existingByTime[def.start];
      const maxBookings = match ? match.maximum_bookings : 50;
      const currentBookings = match ? match.current_bookings : 0;
      const slotsLeft = Math.max(0, maxBookings - currentBookings);

      let status = 'AVAILABLE';
      let statusLabel = '🟢 Available';
      let isAvailable = true;

      if (currentBookings >= maxBookings) {
        status = 'FULL';
        statusLabel = '🔴 Full';
        isAvailable = false;
      } else if (currentBookings >= Math.floor(maxBookings * 0.75)) {
        status = 'FAST_FILLING';
        statusLabel = '🟡 Few slots';
        isAvailable = true;
      }

      return {
        id: match ? match.id : null,
        time: def.label,
        startTime: def.start,
        endTime: def.end,
        currentBookings,
        maxBookings,
        slotsLeft,
        status,
        statusLabel,
        isAvailable
      };
    });

    return res.status(200).json({
      success: true,
      mandiId: mandi.id,
      mandiName: mandi.name,
      date: cleanDate,
      slots
    });

  } catch (error) {
    console.error('Error in GET /api/mandis/:id/slots:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch mandi slots'
    });
  }
});

/**
 * GET /api/mandis/:id
 * Retrieves a single mandi by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT id, name, state, district, location, latitude, longitude, opening_time, closing_time, is_active, source, created_at, updated_at 
       FROM mandis 
       WHERE id = ? OR LOWER(name) = LOWER(?) LIMIT 1`,
      [id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Mandi with ID '${id}' not found`
      });
    }

    return res.status(200).json({
      success: true,
      data: transformMandiRow(rows[0])
    });

  } catch (error) {
    console.error('Error in GET /api/mandis/:id:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch mandi record'
    });
  }
});

export default router;
