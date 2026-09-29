import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

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
 * Local verified demo driver pool for hackathon simulation.
 * Clearly marked as local demo data. Non-Punjab, regional drivers matching Telangana/local demo context.
 */
const DEMO_DRIVER_POOL = [
  {
    name: 'Srinivas Reddy',
    phone: '+91 94401 82341',
    vehicleNumber: 'TS 02 EA 4419',
    supportedVehicleTypes: ['Tractor Trolley'],
    district: 'Karimnagar',
    notes: 'Demo Driver Data (Telangana Rural Logistics Pool)'
  },
  {
    name: 'Ramesh Goud',
    phone: '+91 98492 56712',
    vehicleNumber: 'TS 02 UB 1842',
    supportedVehicleTypes: ['Small Commercial Truck (Chota Hathi)'],
    district: 'Karimnagar',
    notes: 'Demo Driver Data (Telangana Rural Logistics Pool)'
  },
  {
    name: 'M. Anjaiah',
    phone: '+91 91773 90812',
    vehicleNumber: 'TS 02 T 9871',
    supportedVehicleTypes: ['Heavy Duty 6-Wheeler Truck'],
    district: 'Karimnagar',
    notes: 'Demo Driver Data (Telangana Rural Logistics Pool)'
  },
  {
    name: 'Venkateshwarlu K.',
    phone: '+91 99890 34120',
    vehicleNumber: 'TS 03 EA 3120',
    supportedVehicleTypes: ['Tractor Trolley', 'Small Commercial Truck (Chota Hathi)'],
    district: 'Warangal',
    notes: 'Demo Driver Data (Telangana Rural Logistics Pool)'
  },
  {
    name: 'Sudhakar Rao',
    phone: '+91 94908 67531',
    vehicleNumber: 'TS 03 T 7654',
    supportedVehicleTypes: ['Heavy Duty 6-Wheeler Truck'],
    district: 'Warangal',
    notes: 'Demo Driver Data (Telangana Rural Logistics Pool)'
  }
];

/**
 * Helper to select an appropriate demo driver for a given vehicle and district
 */
function findDemoDriver(vehicleType, district) {
  // First match both vehicle type and district
  let match = DEMO_DRIVER_POOL.find(d => 
    d.supportedVehicleTypes.includes(vehicleType) &&
    d.district.toLowerCase() === (district || '').toLowerCase()
  );

  // Fallback to vehicle type match
  if (!match) {
    match = DEMO_DRIVER_POOL.find(d => d.supportedVehicleTypes.includes(vehicleType));
  }

  // Fallback to first driver
  if (!match) {
    match = DEMO_DRIVER_POOL[0];
  }

  return {
    name: match.name,
    phone: match.phone,
    vehicleNumber: match.vehicleNumber,
    isDemoDriver: true,
    notes: match.notes
  };
}

/**
 * Validates allowed vehicle types
 */
const ALLOWED_VEHICLES = [
  'Tractor Trolley',
  'Small Commercial Truck (Chota Hathi)',
  'Heavy Duty 6-Wheeler Truck'
];

/**
 * Validates allowed transport statuses
 */
const TRANSPORT_STATUS_FLOW = [
  'REQUESTED',
  'DRIVER_ASSIGNED',
  'DRIVER_ARRIVING',
  'CROP_PICKED_UP',
  'COMPLETED'
];

/**
 * Helper to format a transport booking database row into a structured response
 */
function formatTransportRow(row) {
  return {
    id: row.id,
    transportBookingId: row.transport_booking_id,
    farmerId: row.farmer_table_id || row.farmer_id,
    farmer: {
      id: row.farmer_table_id || row.farmer_id,
      farmerId: row.farmer_code || row.farmer_id_code,
      name: row.farmer_name,
      phone: row.farmer_phone
    },
    mandiBooking: row.mandi_booking_id ? {
      id: row.mandi_booking_id,
      bookingId: row.mandi_booking_code,
      tokenNumber: row.mandi_token_number,
      cropName: row.mandi_crop_name,
      slotDate: row.mandi_slot_date,
      slotTime: row.mandi_slot_time,
      mandi: {
        id: row.mandi_id,
        name: row.mandi_name,
        location: row.mandi_location,
        district: row.mandi_district,
        state: row.mandi_state
      }
    } : null,
    vehicleType: row.vehicle_type,
    cropName: row.crop_name,
    estimatedQuantity: parseFloat(row.estimated_quantity),
    pickupLocation: {
      village: row.pickup_village,
      mandal: row.pickup_mandal || '',
      district: row.pickup_district,
      state: row.pickup_state,
      fullAddress: [
        row.pickup_village,
        row.pickup_mandal ? `${row.pickup_mandal} Mandal` : '',
        row.pickup_district,
        row.pickup_state
      ].filter(Boolean).join(', ')
    },
    pickupDate: row.pickup_date ? (new Date(row.pickup_date)).toISOString().split('T')[0] : null,
    pickupTime: row.pickup_time,
    driver: row.driver_name ? {
      name: row.driver_name,
      phone: row.driver_phone,
      vehicleNumber: row.driver_vehicle_number,
      isDemoDriver: true,
      label: 'Local Demo Driver Pool (Hackathon Simulation)'
    } : null,
    transportStatus: row.transport_status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * POST /api/transport/book
 * Creates a new transport haulage request for a farmer with confirmed mandi booking.
 * 
 * INITIAL STATUS IS STRICTLY 'REQUESTED'.
 * Does NOT falsely claim driver assignment immediately.
 */
router.post('/book', async (req, res) => {
  let connection;
  try {
    const {
      farmerId,
      mandiBookingId,
      vehicleType,
      cropName,
      estimatedQuantity,
      pickupVillage,
      pickupMandal,
      pickupDistrict,
      pickupState,
      pickupDate,
      pickupTime,
      notes
    } = req.body;

    // 1. Validate farmer
    if (!farmerId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Farmer identifier is required to book transport.'
      });
    }

    const farmer = await resolveFarmer(farmerId);
    if (!farmer) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Farmer profile could not be found. Please check registration.'
      });
    }

    // 2. Validate Vehicle Type
    if (!ALLOWED_VEHICLES.includes(vehicleType)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid vehicle type '${vehicleType}'. Allowed: ${ALLOWED_VEHICLES.join(', ')}`
      });
    }

    // 3. Validate Crop & Load
    const cleanCrop = (cropName || '').trim();
    if (!cleanCrop) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Crop name is required.'
      });
    }

    const numQuantity = parseFloat(estimatedQuantity);
    if (isNaN(numQuantity) || numQuantity <= 0 || numQuantity > 500) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Estimated load quantity must be a valid positive number in quintals (max 500).'
      });
    }

    // 4. Validate Location
    const cleanVillage = (pickupVillage || farmer.village || '').trim();
    const cleanDistrict = (pickupDistrict || farmer.district || '').trim();
    const cleanState = (pickupState || farmer.state || '').trim();
    const cleanMandal = (pickupMandal || '').trim();

    if (!cleanVillage || !cleanDistrict || !cleanState) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Complete pickup location (Village, District, State) is required.'
      });
    }

    // 5. Validate Date & Time
    if (!pickupDate) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Pickup date is required.'
      });
    }
    if (!pickupTime) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Pickup time is required.'
      });
    }

    // 6. Check Mandi Booking
    let verifiedMandiBookingId = null;
    if (mandiBookingId) {
      const [mbRows] = await pool.query(
        `SELECT id, booking_id, farmer_id, mandi_id, slot_id, crop_name, token_number, booking_status 
         FROM bookings 
         WHERE (id = ? OR booking_id = ?) AND farmer_id = ? 
         LIMIT 1`,
        [isNaN(mandiBookingId) ? -1 : parseInt(mandiBookingId, 10), String(mandiBookingId), farmer.id]
      );

      if (mbRows.length > 0) {
        verifiedMandiBookingId = mbRows[0].id;
      }
    }

    // 7. Generate Unique Transport Reference ID (e.g. TR-26-8812)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const transportBookingId = `TR-26-${randomSuffix}`;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 8. Insert record with status 'REQUESTED' and NULL driver details
    const insertSql = `
      INSERT INTO transport_bookings (
        transport_booking_id,
        farmer_id,
        mandi_booking_id,
        vehicle_type,
        crop_name,
        estimated_quantity,
        pickup_village,
        pickup_mandal,
        pickup_district,
        pickup_state,
        pickup_date,
        pickup_time,
        driver_name,
        driver_phone,
        driver_vehicle_number,
        transport_status,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, 'REQUESTED', ?)
    `;

    const [insertResult] = await connection.query(insertSql, [
      transportBookingId,
      farmer.id,
      verifiedMandiBookingId,
      vehicleType,
      cleanCrop,
      numQuantity,
      cleanVillage,
      cleanMandal,
      cleanDistrict,
      cleanState,
      pickupDate,
      pickupTime,
      notes || 'Farmer requested transport via AgriQueue'
    ]);

    await connection.commit();

    // Fetch the newly created full record
    const [fetchedRows] = await pool.query(`
      SELECT 
        tb.*,
        f.id AS farmer_table_id,
        f.farmer_id AS farmer_code,
        f.name AS farmer_name,
        f.phone AS farmer_phone,
        b.booking_id AS mandi_booking_code,
        b.token_number AS mandi_token_number,
        b.crop_name AS mandi_crop_name,
        ms.slot_date AS mandi_slot_date,
        CONCAT(ms.start_time, ' – ', ms.end_time) AS mandi_slot_time,
        m.id AS mandi_id,
        m.name AS mandi_name,
        m.location AS mandi_location,
        m.district AS mandi_district,
        m.state AS mandi_state
      FROM transport_bookings tb
      JOIN farmers f ON tb.farmer_id = f.id
      LEFT JOIN bookings b ON tb.mandi_booking_id = b.id
      LEFT JOIN mandi_slots ms ON b.slot_id = ms.id
      LEFT JOIN mandis m ON b.mandi_id = m.id
      WHERE tb.id = ?
      LIMIT 1
    `, [insertResult.insertId]);

    const formattedData = formatTransportRow(fetchedRows[0]);

    return res.status(201).json({
      success: true,
      message: 'Transport haulage requested successfully. Looking for available village drivers.',
      data: formattedData
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error in POST /api/transport/book:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create transport booking in database.'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

/**
 * GET /api/transport/active/:farmerId
 * Retrieves the latest active transport booking for a farmer.
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

    const querySql = `
      SELECT 
        tb.*,
        f.id AS farmer_table_id,
        f.farmer_id AS farmer_code,
        f.name AS farmer_name,
        f.phone AS farmer_phone,
        b.booking_id AS mandi_booking_code,
        b.token_number AS mandi_token_number,
        b.crop_name AS mandi_crop_name,
        ms.slot_date AS mandi_slot_date,
        CONCAT(ms.start_time, ' – ', ms.end_time) AS mandi_slot_time,
        m.id AS mandi_id,
        m.name AS mandi_name,
        m.location AS mandi_location,
        m.district AS mandi_district,
        m.state AS mandi_state
      FROM transport_bookings tb
      JOIN farmers f ON tb.farmer_id = f.id
      LEFT JOIN bookings b ON tb.mandi_booking_id = b.id
      LEFT JOIN mandi_slots ms ON b.slot_id = ms.id
      LEFT JOIN mandis m ON b.mandi_id = m.id
      WHERE tb.farmer_id = ? AND tb.transport_status NOT IN ('CANCELLED', 'COMPLETED')
      ORDER BY tb.created_at DESC
      LIMIT 1
    `;

    const [rows] = await pool.query(querySql, [farmer.id]);

    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active transport booking found for this farmer.'
      });
    }

    return res.status(200).json({
      success: true,
      data: formatTransportRow(rows[0])
    });

  } catch (error) {
    console.error('Error in GET /api/transport/active/:farmerId:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve active transport booking.'
    });
  }
});

/**
 * GET /api/transport/history/:farmerId
 * Retrieves all transport bookings for a farmer.
 */
router.get('/history/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    const farmer = await resolveFarmer(farmerId);
    if (!farmer) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    const [rows] = await pool.query(`
      SELECT 
        tb.*,
        f.id AS farmer_table_id,
        f.farmer_id AS farmer_code,
        f.name AS farmer_name,
        f.phone AS farmer_phone,
        b.booking_id AS mandi_booking_code,
        b.token_number AS mandi_token_number,
        b.crop_name AS mandi_crop_name,
        ms.slot_date AS mandi_slot_date,
        CONCAT(ms.start_time, ' – ', ms.end_time) AS mandi_slot_time,
        m.id AS mandi_id,
        m.name AS mandi_name,
        m.location AS mandi_location,
        m.district AS mandi_district,
        m.state AS mandi_state
      FROM transport_bookings tb
      JOIN farmers f ON tb.farmer_id = f.id
      LEFT JOIN bookings b ON tb.mandi_booking_id = b.id
      LEFT JOIN mandi_slots ms ON b.slot_id = ms.id
      LEFT JOIN mandis m ON b.mandi_id = m.id
      WHERE tb.farmer_id = ?
      ORDER BY tb.created_at DESC
    `, [farmer.id]);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map(formatTransportRow)
    });

  } catch (error) {
    console.error('Error in GET /api/transport/history/:farmerId:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve transport history.'
    });
  }
});

/**
 * POST /api/transport/:bookingId/assign-driver
 * Simulates driver dispatch/assignment by the system.
 * Updates status from 'REQUESTED' to 'DRIVER_ASSIGNED' and assigns a local demo driver.
 */
router.post('/:bookingId/assign-driver', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const [rows] = await pool.query(
      `SELECT * FROM transport_bookings WHERE id = ? OR transport_booking_id = ? LIMIT 1`,
      [isNaN(bookingId) ? -1 : parseInt(bookingId, 10), String(bookingId)]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Transport booking not found.'
      });
    }

    const currentBooking = rows[0];
    const demoDriver = findDemoDriver(currentBooking.vehicle_type, currentBooking.pickup_district);

    await pool.query(`
      UPDATE transport_bookings 
      SET 
        driver_name = ?,
        driver_phone = ?,
        driver_vehicle_number = ?,
        transport_status = 'DRIVER_ASSIGNED',
        notes = 'Demo driver assigned by system'
      WHERE id = ?
    `, [demoDriver.name, demoDriver.phone, demoDriver.vehicleNumber, currentBooking.id]);

    // Return updated record
    const [updatedRows] = await pool.query(`
      SELECT 
        tb.*,
        f.id AS farmer_table_id,
        f.farmer_id AS farmer_code,
        f.name AS farmer_name,
        f.phone AS farmer_phone,
        b.booking_id AS mandi_booking_code,
        b.token_number AS mandi_token_number,
        b.crop_name AS mandi_crop_name,
        ms.slot_date AS mandi_slot_date,
        CONCAT(ms.start_time, ' – ', ms.end_time) AS mandi_slot_time,
        m.id AS mandi_id,
        m.name AS mandi_name,
        m.location AS mandi_location,
        m.district AS mandi_district,
        m.state AS mandi_state
      FROM transport_bookings tb
      JOIN farmers f ON tb.farmer_id = f.id
      LEFT JOIN bookings b ON tb.mandi_booking_id = b.id
      LEFT JOIN mandi_slots ms ON b.slot_id = ms.id
      LEFT JOIN mandis m ON b.mandi_id = m.id
      WHERE tb.id = ?
    `, [currentBooking.id]);

    return res.status(200).json({
      success: true,
      message: 'Local demo driver successfully assigned to haulage request.',
      data: formatTransportRow(updatedRows[0])
    });

  } catch (error) {
    console.error('Error in POST /api/transport/:bookingId/assign-driver:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to assign driver.'
    });
  }
});

/**
 * POST /api/transport/:bookingId/step-status
 * Advances the transport journey through the farmer progress lifecycle:
 * REQUESTED -> DRIVER_ASSIGNED -> DRIVER_ARRIVING -> CROP_PICKED_UP -> COMPLETED
 */
router.post('/:bookingId/step-status', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { targetStatus } = req.body;

    const [rows] = await pool.query(
      `SELECT * FROM transport_bookings WHERE id = ? OR transport_booking_id = ? LIMIT 1`,
      [isNaN(bookingId) ? -1 : parseInt(bookingId, 10), String(bookingId)]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Transport booking not found.'
      });
    }

    const currentBooking = rows[0];
    const currentIndex = TRANSPORT_STATUS_FLOW.indexOf(currentBooking.transport_status);

    let nextStatus = targetStatus;
    if (!nextStatus) {
      if (currentIndex >= 0 && currentIndex < TRANSPORT_STATUS_FLOW.length - 1) {
        nextStatus = TRANSPORT_STATUS_FLOW[currentIndex + 1];
      } else {
        nextStatus = currentBooking.transport_status;
      }
    }

    if (!TRANSPORT_STATUS_FLOW.includes(nextStatus)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid target status '${nextStatus}'.`
      });
    }

    // If moving to DRIVER_ASSIGNED or beyond and driver was not yet set, assign demo driver
    let driverName = currentBooking.driver_name;
    let driverPhone = currentBooking.driver_phone;
    let driverVeh = currentBooking.driver_vehicle_number;

    if (!driverName && nextStatus !== 'REQUESTED') {
      const demoDriver = findDemoDriver(currentBooking.vehicle_type, currentBooking.pickup_district);
      driverName = demoDriver.name;
      driverPhone = demoDriver.phone;
      driverVeh = demoDriver.vehicleNumber;
    }

    await pool.query(`
      UPDATE transport_bookings 
      SET 
        transport_status = ?,
        driver_name = ?,
        driver_phone = ?,
        driver_vehicle_number = ?
      WHERE id = ?
    `, [nextStatus, driverName, driverPhone, driverVeh, currentBooking.id]);

    const [updatedRows] = await pool.query(`
      SELECT 
        tb.*,
        f.id AS farmer_table_id,
        f.farmer_id AS farmer_code,
        f.name AS farmer_name,
        f.phone AS farmer_phone,
        b.booking_id AS mandi_booking_code,
        b.token_number AS mandi_token_number,
        b.crop_name AS mandi_crop_name,
        ms.slot_date AS mandi_slot_date,
        CONCAT(ms.start_time, ' – ', ms.end_time) AS mandi_slot_time,
        m.id AS mandi_id,
        m.name AS mandi_name,
        m.location AS mandi_location,
        m.district AS mandi_district,
        m.state AS mandi_state
      FROM transport_bookings tb
      JOIN farmers f ON tb.farmer_id = f.id
      LEFT JOIN bookings b ON tb.mandi_booking_id = b.id
      LEFT JOIN mandi_slots ms ON b.slot_id = ms.id
      LEFT JOIN mandis m ON b.mandi_id = m.id
      WHERE tb.id = ?
    `, [currentBooking.id]);

    return res.status(200).json({
      success: true,
      message: `Transport status advanced to ${nextStatus}`,
      data: formatTransportRow(updatedRows[0])
    });

  } catch (error) {
    console.error('Error in POST /api/transport/:bookingId/step-status:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update transport status.'
    });
  }
});

/**
 * POST /api/transport/:bookingId/cancel
 * Cancels a transport booking
 */
router.post('/:bookingId/cancel', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const [rows] = await pool.query(
      `SELECT * FROM transport_bookings WHERE id = ? OR transport_booking_id = ? LIMIT 1`,
      [isNaN(bookingId) ? -1 : parseInt(bookingId, 10), String(bookingId)]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Transport booking not found.'
      });
    }

    const currentBooking = rows[0];
    if (currentBooking.transport_status === 'COMPLETED') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Completed transport bookings cannot be cancelled.'
      });
    }

    await pool.query(
      `UPDATE transport_bookings SET transport_status = 'CANCELLED' WHERE id = ?`,
      [currentBooking.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Transport booking cancelled successfully.'
    });

  } catch (error) {
    console.error('Error in POST /api/transport/:bookingId/cancel:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to cancel transport booking.'
    });
  }
});

export default router;
