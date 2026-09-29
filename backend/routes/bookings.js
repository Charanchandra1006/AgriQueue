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
async function resolveFarmer(farmerIdentifier) {
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
 * GET /api/bookings/active/:farmerId
 * Retrieves the currently active procurement booking for a farmer.
 * Joins bookings, mandis, and mandi_slots.
 */
router.get('/active/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    if (!farmerId || !farmerId.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Farmer identifier is required.'
      });
    }

    const farmer = await resolveFarmer(farmerId);
    if (!farmer) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'Farmer profile not found.'
      });
    }

    // Query active booking (CONFIRMED status, latest booked)
    const sql = `
      SELECT 
        b.id AS booking_table_id,
        b.booking_id,
        b.farmer_id,
        b.mandi_id,
        b.slot_id,
        b.crop_name,
        b.estimated_quantity,
        b.token_number,
        b.booking_status,
        b.booked_at,
        b.updated_at,
        m.name AS mandi_name,
        m.state AS mandi_state,
        m.district AS mandi_district,
        m.location AS mandi_location,
        m.latitude AS mandi_latitude,
        m.longitude AS mandi_longitude,
        m.opening_time AS mandi_opening_time,
        m.closing_time AS mandi_closing_time,
        ms.slot_date,
        ms.start_time,
        ms.end_time,
        ms.maximum_bookings,
        ms.current_bookings,
        ms.status AS slot_status
      FROM bookings b
      JOIN mandis m ON b.mandi_id = m.id
      JOIN mandi_slots ms ON b.slot_id = ms.id
      WHERE b.farmer_id = ? AND b.booking_status = 'CONFIRMED'
      ORDER BY b.booked_at DESC
      LIMIT 1
    `;

    const [rows] = await pool.query(sql, [farmer.id]);

    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active procurement booking found for this farmer.'
      });
    }

    const booking = rows[0];

    // Compute real queue information:
    // Farmers ahead = count of earlier confirmed bookings in the same slot
    const [queueRows] = await pool.query(
      `SELECT COUNT(*) AS count_ahead 
       FROM bookings 
       WHERE slot_id = ? 
         AND booking_status = 'CONFIRMED' 
         AND (booked_at < ? OR (booked_at = ? AND id < ?))`,
      [booking.slot_id, booking.booked_at, booking.booked_at, booking.booking_table_id]
    );

    const farmersAhead = queueRows[0]?.count_ahead || 0;
    
    // Estimated wait time: ~6 minutes per farmer ahead
    let estimatedWait = '0 min (You are next)';
    if (farmersAhead > 0) {
      const waitMin = farmersAhead * 6;
      if (waitMin >= 60) {
        const hrs = Math.floor(waitMin / 60);
        const mins = waitMin % 60;
        estimatedWait = `~${hrs} hr ${mins > 0 ? mins + ' min' : ''}`.trim();
      } else {
        estimatedWait = `~${waitMin} min`;
      }
    }

    // Format slot schedule
    const startStr = formatTime12h(booking.start_time);
    const endStr = formatTime12h(booking.end_time);
    const slotSchedule = `${startStr} – ${endStr}`;

    const formattedDate = new Date(booking.slot_date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return res.status(200).json({
      success: true,
      data: {
        id: booking.booking_table_id,
        bookingId: booking.booking_id,
        tokenNumber: booking.token_number,
        bookingStatus: booking.booking_status,
        cropName: booking.crop_name,
        estimatedQuantity: parseFloat(booking.estimated_quantity),
        bookedAt: booking.booked_at,
        mandi: {
          id: booking.mandi_id,
          name: booking.mandi_name,
          state: booking.mandi_state,
          district: booking.mandi_district,
          location: booking.mandi_location || `${booking.mandi_district}, ${booking.mandi_state}`,
          coordinates: booking.mandi_latitude && booking.mandi_longitude ? {
            latitude: parseFloat(booking.mandi_latitude),
            longitude: parseFloat(booking.mandi_longitude)
          } : null,
          operatingHours: {
            openingTime: formatTime12h(booking.mandi_opening_time),
            closingTime: formatTime12h(booking.mandi_closing_time)
          }
        },
        slot: {
          id: booking.slot_id,
          date: booking.slot_date,
          displayDate: formattedDate,
          startTime: booking.start_time,
          endTime: booking.end_time,
          formattedTime: slotSchedule
        },
        queue: {
          farmersAhead,
          estimatedWait
        },
        farmer: {
          id: farmer.id,
          farmerId: farmer.farmer_id,
          name: farmer.name,
          phone: farmer.phone
        }
      }
    });

  } catch (error) {
    console.error('Error in GET /api/bookings/active/:farmerId:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch active booking information.'
    });
  }
});

/**
 * GET /api/bookings/history/:farmerId
 * Retrieves all procurement bookings (history) for a farmer from MySQL.
 * Joins bookings, mandis, and mandi_slots.
 */
router.get('/history/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    if (!farmerId || !farmerId.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Farmer identifier is required.'
      });
    }

    const farmer = await resolveFarmer(farmerId);
    if (!farmer) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Farmer profile not found.'
      });
    }

    const sql = `
      SELECT 
        b.id AS booking_table_id,
        b.booking_id,
        b.farmer_id,
        b.mandi_id,
        b.slot_id,
        b.crop_name,
        b.estimated_quantity,
        b.token_number,
        b.booking_status,
        b.booked_at,
        b.updated_at,
        m.name AS mandi_name,
        m.state AS mandi_state,
        m.district AS mandi_district,
        m.mandal AS mandi_mandal,
        m.village AS mandi_village,
        m.location AS mandi_location,
        ms.slot_date,
        ms.start_time,
        ms.end_time
      FROM bookings b
      JOIN mandis m ON b.mandi_id = m.id
      LEFT JOIN mandi_slots ms ON b.slot_id = ms.id
      WHERE b.farmer_id = ?
      ORDER BY b.booked_at DESC
    `;

    const [rows] = await pool.query(sql, [farmer.id]);

    const formattedBookings = rows.map((booking) => {
      let formattedTime = 'All Day';
      if (booking.start_time && booking.end_time) {
        formattedTime = `${formatTime12h(booking.start_time)} – ${formatTime12h(booking.end_time)}`;
      } else if (booking.start_time) {
        formattedTime = formatTime12h(booking.start_time);
      }

      let slotDateStr = null;
      let displayDate = 'Upcoming';
      if (booking.slot_date) {
        const d = new Date(booking.slot_date);
        if (!isNaN(d.getTime())) {
          slotDateStr = d.toISOString().split('T')[0];
          displayDate = d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });
        }
      }

      let bookedAtFormatted = '';
      if (booking.booked_at) {
        const bd = new Date(booking.booked_at);
        bookedAtFormatted = isNaN(bd.getTime())
          ? ''
          : bd.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
      }

      let displayStatus = 'Confirmed';
      const rawStatus = (booking.booking_status || '').toUpperCase();
      if (rawStatus === 'CONFIRMED') {
        displayStatus = 'Confirmed';
      } else if (rawStatus === 'COMPLETED') {
        displayStatus = 'Completed';
      } else if (rawStatus === 'CANCELLED') {
        displayStatus = 'Cancelled';
      } else if (rawStatus === 'FAILED') {
        displayStatus = 'Failed';
      } else {
        displayStatus = booking.booking_status || 'Confirmed';
      }

      return {
        id: booking.booking_table_id,
        bookingId: booking.booking_id,
        bookedAt: booking.booked_at,
        bookedAtFormatted,
        mandiId: booking.mandi_id,
        mandiName: booking.mandi_name,
        state: booking.mandi_state,
        district: booking.mandi_district,
        mandal: booking.mandi_mandal,
        village: booking.mandi_village,
        location: booking.mandi_village
          ? `${booking.mandi_village}${booking.mandi_mandal ? ', ' + booking.mandi_mandal : ''}`
          : (booking.mandi_location || `${booking.mandi_district}, ${booking.mandi_state}`),
        cropName: booking.crop_name,
        estimatedQuantity: parseFloat(booking.estimated_quantity) || 40,
        tokenNumber: booking.token_number,
        bookingStatus: displayStatus,
        rawStatus: booking.booking_status,
        slotDate: slotDateStr,
        displayDate,
        startTime: booking.start_time,
        endTime: booking.end_time,
        formattedSlotTime: formattedTime
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedBookings.length,
      data: formattedBookings
    });

  } catch (error) {
    console.error('Error in GET /api/bookings/history/:farmerId:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve booking history from database.'
    });
  }
});


/**
 * Helper to parse 12h time string like "08:00 AM - 10:00 AM" into SQL TIME formats
 */
function parseTimeSlotToSql(slotString) {
  if (!slotString) {
    return { start: '08:00:00', end: '10:00:00' };
  }
  const parts = slotString.split(/[-–]/);
  if (parts.length !== 2) {
    return { start: '08:00:00', end: '10:00:00' };
  }

  const parseSingle = (str) => {
    const trimmed = str.trim();
    const match = trimmed.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!match) return '08:00:00';
    let hour = parseInt(match[1], 10);
    const minute = match[2];
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${minute}:00`;
  };

  return {
    start: parseSingle(parts[0]),
    end: parseSingle(parts[1])
  };
}

/**
 * POST /api/bookings
 * Books a real slot in MySQL bookings and mandi_slots tables.
 */
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      farmerId,
      mandiId,
      cropName,
      slotDate,
      timeSlot,
      startTime,
      endTime,
      quantity
    } = req.body;

    if (!mandiId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Mandi ID is required.' });
    }

    if (!cropName || !cropName.trim()) {
      return res.status(400).json({ error: 'Bad Request', message: 'Crop name is required.' });
    }

    // 1. Resolve Farmer
    let farmer = await resolveFarmer(farmerId);
    if (!farmer) {
      // If no farmer provided or found, check if there is at least one farmer in DB to associate with
      const [allFarmers] = await connection.query('SELECT id, farmer_id, name, phone FROM farmers LIMIT 1');
      if (allFarmers.length > 0) {
        farmer = allFarmers[0];
      } else {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Farmer record could not be resolved. Please complete profile registration first.'
        });
      }
    }

    // 2. Resolve Mandi
    const [mandiRows] = await connection.query(
      'SELECT id, name, state, district, location, opening_time, closing_time FROM mandis WHERE id = ? LIMIT 1',
      [parseInt(mandiId, 10)]
    );
    if (mandiRows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Selected Mandi does not exist.' });
    }
    const mandi = mandiRows[0];

    // 3. Resolve Date & Slot Times
    const cleanDate = slotDate ? String(slotDate).slice(0, 10) : new Date().toISOString().slice(0, 10);
    let startSqlTime = startTime;
    let endSqlTime = endTime;

    if (!startSqlTime || !endSqlTime) {
      const parsedTimes = parseTimeSlotToSql(timeSlot);
      startSqlTime = parsedTimes.start;
      endSqlTime = parsedTimes.end;
    }

    await connection.beginTransaction();

    // 4. Find or Create Slot in mandi_slots
    const [existingSlots] = await connection.query(
      `SELECT id, current_bookings, maximum_bookings 
       FROM mandi_slots 
       WHERE mandi_id = ? AND slot_date = ? AND start_time = ? AND end_time = ? 
       FOR UPDATE`,
      [mandi.id, cleanDate, startSqlTime, endSqlTime]
    );

    let slotId;
    let currentSlotBookings = 0;

    if (existingSlots.length > 0) {
      slotId = existingSlots[0].id;
      currentSlotBookings = existingSlots[0].current_bookings;

      if (currentSlotBookings >= existingSlots[0].maximum_bookings) {
        await connection.rollback();
        return res.status(409).json({
          error: 'Conflict',
          message: 'This slot is completely full. Please choose another time slot or date.'
        });
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
        [slotId]
      );
      currentSlotBookings += 1;
    } else {
      const [insertSlotResult] = await connection.query(
        `INSERT INTO mandi_slots (
           mandi_id, slot_date, start_time, end_time, maximum_bookings, current_bookings, status
         ) VALUES (?, ?, ?, ?, 50, 1, 'AVAILABLE')`,
        [mandi.id, cleanDate, startSqlTime, endSqlTime]
      );
      slotId = insertSlotResult.insertId;
      currentSlotBookings = 1;
    }

    // Check if farmer already has a confirmed booking for this exact slot
    const [duplicateBooking] = await connection.query(
      `SELECT id, token_number FROM bookings 
       WHERE farmer_id = ? AND slot_id = ? AND booking_status = 'CONFIRMED' 
       LIMIT 1`,
      [farmer.id, slotId]
    );

    if (duplicateBooking.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        error: 'Conflict',
        message: 'You already have a confirmed booking for this procurement slot.',
        existingToken: duplicateBooking[0].token_number
      });
    }

    // 5. Generate Unique Token Number (#A102 format) and Booking ID
    const tokenLetter = String.fromCharCode(65 + (mandi.id % 26)); // A-Z based on mandi
    const tokenSeq = 100 + currentSlotBookings;
    const tokenNumber = `#${tokenLetter}${tokenSeq}`;
    const bookingId = `BK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const estQty = quantity ? Math.max(1, parseFloat(quantity)) : 40.0;

    // 6. Insert into bookings
    const insertBookingSql = `
      INSERT INTO bookings (
        booking_id, farmer_id, mandi_id, slot_id, crop_name, estimated_quantity, token_number, booking_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')
    `;

    const [bookingResult] = await connection.query(insertBookingSql, [
      bookingId,
      farmer.id,
      mandi.id,
      slotId,
      cropName.trim(),
      estQty,
      tokenNumber
    ]);

    await connection.commit();

    const createdBookingId = bookingResult.insertId;

    // 7. Calculate queue count
    const farmersAhead = Math.max(0, currentSlotBookings - 1);
    const estimatedWait = farmersAhead === 0 ? '0 min (You are next)' : `~${farmersAhead * 6} min`;

    const formattedDate = new Date(cleanDate).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return res.status(201).json({
      success: true,
      message: 'Procurement slot booked successfully!',
      data: {
        id: createdBookingId,
        bookingId,
        tokenNumber,
        bookingStatus: 'CONFIRMED',
        cropName: cropName.trim(),
        estimatedQuantity: estQty,
        mandi: {
          id: mandi.id,
          name: mandi.name,
          state: mandi.state,
          district: mandi.district,
          location: mandi.location || `${mandi.district}, ${mandi.state}`,
          operatingHours: {
            openingTime: formatTime12h(mandi.opening_time),
            closingTime: formatTime12h(mandi.closing_time)
          }
        },
        slot: {
          id: slotId,
          date: cleanDate,
          displayDate: formattedDate,
          startTime: startSqlTime,
          endTime: endSqlTime,
          formattedTime: `${formatTime12h(startSqlTime)} – ${formatTime12h(endSqlTime)}`
        },
        queue: {
          farmersAhead,
          estimatedWait
        },
        farmer: {
          id: farmer.id,
          farmerId: farmer.farmer_id,
          name: farmer.name,
          phone: farmer.phone
        }
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error in POST /api/bookings:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to complete slot booking in database.'
    });
  } finally {
    connection.release();
  }
});

/**
 * POST /api/bookings/:id/cancel
 * Cancels a booking and updates slot counts.
 */
router.post('/:id/cancel', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    const [rows] = await connection.query(
      'SELECT id, slot_id, booking_status FROM bookings WHERE id = ? OR booking_id = ? LIMIT 1',
      [id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Booking not found.' });
    }

    const booking = rows[0];
    if (booking.booking_status === 'CANCELLED') {
      return res.status(400).json({ error: 'Bad Request', message: 'Booking is already cancelled.' });
    }

    await connection.beginTransaction();

    await connection.query(
      "UPDATE bookings SET booking_status = 'CANCELLED' WHERE id = ?",
      [booking.id]
    );

    await connection.query(
      `UPDATE mandi_slots 
       SET current_bookings = GREATEST(0, current_bookings - 1),
           status = 'AVAILABLE'
       WHERE id = ?`,
      [booking.slot_id]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error in POST /api/bookings/:id/cancel:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to cancel booking.'
    });
  } finally {
    connection.release();
  }
});

export default router;
