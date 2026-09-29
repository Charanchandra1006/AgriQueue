import { pool } from '../config/db.js';

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
 * Normalizes Indian mobile number to 10 digits
 */
function normalizePhone(phone) {
  if (!phone) return '';
  const digitsOnly = String(phone).replace(/\D/g, '');
  if (digitsOnly.length > 10) {
    return digitsOnly.slice(-10);
  }
  return digitsOnly;
}

/**
 * Helper to resolve farmer record by farmer_id, phone, or id
 */
export async function resolveFarmer(farmerIdentifier) {
  if (!farmerIdentifier) return null;
  const clean = String(farmerIdentifier).trim();
  const phone = normalizePhone(clean);

  const [rows] = await pool.query(
    `SELECT id, farmer_id, name, phone, state, district, village 
     FROM farmers 
     WHERE farmer_id = ? OR phone = ? OR id = ? 
     LIMIT 1`,
    [clean, phone, isNaN(clean) ? -1 : parseInt(clean, 10)]
  );

  return rows.length > 0 ? rows[0] : null;
}

/**
 * 1. FIND_AVAILABLE_MANDIS
 * Searches active mandis in the database based on farmer district, state, and optional search term or crop.
 */
export async function findAvailableMandis({ farmerId, state, district, mandiSearch, crop } = {}) {
  try {
    let targetDistrict = district;
    let targetState = state;

    if (!targetDistrict && farmerId) {
      const farmer = await resolveFarmer(farmerId);
      if (farmer) {
        targetDistrict = farmer.district;
        targetState = farmer.state;
      }
    }

    let sql = `
      SELECT id, name, state, district, mandal, village, location, commodities, opening_time, closing_time 
      FROM mandis 
      WHERE is_active = TRUE
    `;
    const params = [];

    // Prioritize district if provided
    if (targetDistrict && targetDistrict.trim()) {
      sql += ' AND LOWER(district) = LOWER(?)';
      params.push(targetDistrict.trim());
    } else if (targetState && targetState.trim()) {
      sql += ' AND LOWER(state) = LOWER(?)';
      params.push(targetState.trim());
    }

    if (mandiSearch && mandiSearch.trim()) {
      const cleanTerm = mandiSearch.trim().toLowerCase();
      const words = cleanTerm.split(/\s+/).filter(w => w.length >= 3);
      if (words.length > 1) {
        const wordClauses = words.map(() => '(LOWER(name) LIKE ? OR LOWER(location) LIKE ? OR LOWER(IFNULL(mandal, "")) LIKE ? OR LOWER(IFNULL(village, "")) LIKE ?)');
        sql += ` AND (${wordClauses.join(' OR ')})`;
        for (const w of words) {
          const pattern = `%${w}%`;
          params.push(pattern, pattern, pattern, pattern);
        }
      } else {
        sql += ' AND (LOWER(name) LIKE ? OR LOWER(location) LIKE ? OR LOWER(IFNULL(mandal, "")) LIKE ? OR LOWER(IFNULL(village, "")) LIKE ?)';
        const term = `%${cleanTerm}%`;
        params.push(term, term, term, term);
      }
    }

    sql += ' ORDER BY name ASC LIMIT 10';

    const [rows] = await pool.query(sql, params);

    // If no results in district, fallback to state search
    if (rows.length === 0 && targetDistrict && targetState) {
      const [stateRows] = await pool.query(
        `SELECT id, name, state, district, mandal, village, location, commodities, opening_time, closing_time 
         FROM mandis 
         WHERE is_active = TRUE AND LOWER(state) = LOWER(?) 
         ORDER BY name ASC LIMIT 10`,
        [targetState.trim()]
      );
      return formatMandisResult(stateRows, crop);
    }

    return formatMandisResult(rows, crop);
  } catch (error) {
    console.error('[mandiBookingService] findAvailableMandis error:', error.message);
    return {
      success: false,
      error: error.message,
      mandis: []
    };
  }
}

function formatMandisResult(rows, crop) {
  const mandis = rows.map(r => {
    let commodities = [];
    if (r.commodities) {
      try {
        commodities = JSON.parse(r.commodities);
      } catch {
        commodities = String(r.commodities).split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    const acceptsCrop = crop ? commodities.some(c => c.toLowerCase().includes(String(crop).toLowerCase())) : true;
    return {
      id: r.id,
      mandiId: r.id,
      name: r.name,
      district: r.district,
      mandal: r.mandal || null,
      village: r.village || null,
      location: r.location || `${r.district}, ${r.state}`,
      commodities: commodities.length > 0 ? commodities : ['Paddy', 'Wheat', 'Cotton', 'Maize'],
      acceptsCrop,
      operatingHours: `${formatTime12h(r.opening_time)} - ${formatTime12h(r.closing_time)}`
    };
  });

  return {
    success: true,
    count: mandis.length,
    mandis,
    message: mandis.length > 0
      ? `Found ${mandis.length} mandis`
      : 'No mandis found matching the criteria'
  };
}

/**
 * 2. CHECK_AVAILABLE_SLOTS
 * Returns available procurement slots for a specific mandi and date from mandi_slots table.
 */
export async function checkAvailableSlots({ mandiId, crop, date } = {}) {
  try {
    if (!mandiId) {
      return {
        success: false,
        error: 'Missing required field: mandiId'
      };
    }

    const [mandiRows] = await pool.query(
      'SELECT id, name, district, state FROM mandis WHERE id = ? LIMIT 1',
      [parseInt(mandiId, 10)]
    );

    if (mandiRows.length === 0) {
      return {
        success: false,
        error: `Mandi with ID '${mandiId}' does not exist.`
      };
    }

    const mandi = mandiRows[0];
    const cleanDate = date ? String(date).slice(0, 10) : new Date().toISOString().slice(0, 10);

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
      let isAvailable = true;

      if (currentBookings >= maxBookings) {
        status = 'FULL';
        isAvailable = false;
      } else if (currentBookings >= Math.floor(maxBookings * 0.75)) {
        status = 'FAST_FILLING';
        isAvailable = true;
      }

      return {
        slotId: match ? match.id : null,
        timeSlot: def.label,
        startTime: def.start,
        endTime: def.end,
        slotsLeft,
        status,
        isAvailable
      };
    });

    const availableSlots = slots.filter(s => s.isAvailable);

    return {
      success: true,
      mandiId: mandi.id,
      mandiName: mandi.name,
      district: mandi.district,
      date: cleanDate,
      crop: crop || 'Paddy',
      hasAvailableSlots: availableSlots.length > 0,
      totalSlotsCount: slots.length,
      availableSlotsCount: availableSlots.length,
      availableSlots,
      message: availableSlots.length > 0
        ? `Found ${availableSlots.length} available slots on ${cleanDate}`
        : `All slots are currently full on ${cleanDate}. Please choose another date.`
    };
  } catch (error) {
    console.error('[mandiBookingService] checkAvailableSlots error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 3. BOOK_MANDI_SLOT
 * Executes the real booking transaction in MySQL database.
 * Enforces validation, duplicate prevention, and generates unique token numbers.
 */
export async function executeMandiBooking({
  farmerId,
  mandiId,
  slotId,
  timeSlot,
  startTime,
  endTime,
  cropName,
  estimatedQuantity,
  slotDate
} = {}) {
  // Input validations
  if (!mandiId) {
    return { success: false, error: 'Mandi ID is required.' };
  }
  if (!cropName || !String(cropName).trim()) {
    return { success: false, error: 'Crop name is required. Please specify the crop to be brought.' };
  }
  const qty = parseFloat(estimatedQuantity);
  if (isNaN(qty) || qty <= 0) {
    return { success: false, error: 'Estimated quantity must be greater than zero. Please specify the quantity in quintals.' };
  }

  const connection = await pool.getConnection();

  try {
    // 1. Resolve Farmer
    let farmer = await resolveFarmer(farmerId);
    if (!farmer) {
      const [allFarmers] = await connection.query('SELECT id, farmer_id, name, phone FROM farmers LIMIT 1');
      if (allFarmers.length > 0) {
        farmer = allFarmers[0];
      } else {
        return { success: false, error: 'Farmer record could not be resolved. Please complete profile registration first.' };
      }
    }

    // 2. Resolve Mandi
    const [mandiRows] = await connection.query(
      'SELECT id, name, state, district, location, opening_time, closing_time FROM mandis WHERE id = ? LIMIT 1',
      [parseInt(mandiId, 10)]
    );
    if (mandiRows.length === 0) {
      return { success: false, error: 'Selected Mandi does not exist.' };
    }
    const mandi = mandiRows[0];

    // 3. Resolve Date and Slot Times
    const cleanDate = slotDate ? String(slotDate).slice(0, 10) : new Date().toISOString().slice(0, 10);
    let startSqlTime = startTime;
    let endSqlTime = endTime;

    if (slotId && !isNaN(parseInt(slotId, 10))) {
      const [slotRow] = await connection.query('SELECT start_time, end_time FROM mandi_slots WHERE id = ?', [parseInt(slotId, 10)]);
      if (slotRow.length > 0) {
        startSqlTime = slotRow[0].start_time;
        endSqlTime = slotRow[0].end_time;
      }
    }

    if (!startSqlTime || !endSqlTime) {
      let chosenSlot = DEFAULT_TIME_SLOTS[0];
      if (timeSlot) {
        const found = DEFAULT_TIME_SLOTS.find(s => s.label.toLowerCase().includes(String(timeSlot).toLowerCase()));
        if (found) chosenSlot = found;
      }
      startSqlTime = chosenSlot.start;
      endSqlTime = chosenSlot.end;
      timeSlot = chosenSlot.label;
    }

    await connection.beginTransaction();

    // 4. Find or Create Slot in mandi_slots with row locking
    const [existingSlots] = await connection.query(
      `SELECT id, current_bookings, maximum_bookings 
       FROM mandi_slots 
       WHERE mandi_id = ? AND slot_date = ? AND start_time = ? AND end_time = ? 
       FOR UPDATE`,
      [mandi.id, cleanDate, startSqlTime, endSqlTime]
    );

    let finalSlotId;
    let currentSlotBookings = 0;

    if (existingSlots.length > 0) {
      finalSlotId = existingSlots[0].id;
      currentSlotBookings = existingSlots[0].current_bookings;

      if (currentSlotBookings >= existingSlots[0].maximum_bookings) {
        await connection.rollback();
        return {
          success: false,
          error: 'This slot is full. Please choose another time slot or date.'
        };
      }

      await connection.query(
        `UPDATE mandi_slots 
         SET current_bookings = current_bookings + 1,
             status = CASE 
               WHEN current_bookings + 1 >= maximum_bookings THEN 'FULL'
               WHEN current_bookings + 1 >= maximum_bookings * 0.75 THEN 'FAST_FILLING'
               ELSE 'AVAILABLE'
             END
         WHERE id = ?`,
        [finalSlotId]
      );
      currentSlotBookings += 1;
    } else {
      const [insertSlotResult] = await connection.query(
        `INSERT INTO mandi_slots (
           mandi_id, slot_date, start_time, end_time, maximum_bookings, current_bookings, status
         ) VALUES (?, ?, ?, ?, 50, 1, 'AVAILABLE')`,
        [mandi.id, cleanDate, startSqlTime, endSqlTime]
      );
      finalSlotId = insertSlotResult.insertId;
      currentSlotBookings = 1;
    }

    // 5. Duplicate Booking Protection
    const [duplicateBooking] = await connection.query(
      `SELECT id, booking_id, token_number FROM bookings 
       WHERE farmer_id = ? AND slot_id = ? AND booking_status = 'CONFIRMED' 
       LIMIT 1`,
      [farmer.id, finalSlotId]
    );

    if (duplicateBooking.length > 0) {
      await connection.rollback();
      return {
        success: false,
        isDuplicate: true,
        error: `You already have a confirmed booking for this procurement slot (Token: ${duplicateBooking[0].token_number}, Booking ID: ${duplicateBooking[0].booking_id}).`,
        existingBooking: {
          bookingId: duplicateBooking[0].booking_id,
          tokenNumber: duplicateBooking[0].token_number
        }
      };
    }

    // 6. Generate Unique Token Number and Booking ID
    const tokenLetter = String.fromCharCode(65 + (mandi.id % 26));
    const tokenSeq = 100 + currentSlotBookings;
    const tokenNumber = `#${tokenLetter}${tokenSeq}`;
    const bookingId = `BK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // 7. Insert into bookings
    const insertBookingSql = `
      INSERT INTO bookings (
        booking_id, farmer_id, mandi_id, slot_id, crop_name, estimated_quantity, token_number, booking_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')
    `;

    const [bookingResult] = await connection.query(insertBookingSql, [
      bookingId,
      farmer.id,
      mandi.id,
      finalSlotId,
      cropName.trim(),
      qty,
      tokenNumber
    ]);

    await connection.commit();

    const farmersAhead = Math.max(0, currentSlotBookings - 1);
    const estimatedWait = farmersAhead === 0 ? '0 min (You are next)' : `~${farmersAhead * 6} min`;

    return {
      success: true,
      bookingId,
      tokenNumber,
      bookingTableId: bookingResult.insertId,
      farmerName: farmer.name,
      farmerId: farmer.farmer_id || farmer.id,
      mandiId: mandi.id,
      mandiName: mandi.name,
      mandiLocation: mandi.location || `${mandi.district}, ${mandi.state}`,
      cropName: cropName.trim(),
      estimatedQuantity: qty,
      slotDate: cleanDate,
      timeSlot: timeSlot || `${formatTime12h(startSqlTime)} – ${formatTime12h(endSqlTime)}`,
      farmersAhead,
      estimatedWait,
      message: `Booking confirmed! Token Number is ${tokenNumber} and Booking ID is ${bookingId}.`
    };
  } catch (error) {
    await connection.rollback();
    console.error('[mandiBookingService] executeMandiBooking error:', error.message);
    return {
      success: false,
      error: error.message
    };
  } finally {
    connection.release();
  }
}
