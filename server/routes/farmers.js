import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

/**
 * Helper to normalize Indian phone number to 10 digits
 * @param {string} phone
 * @returns {string} 10-digit phone number
 */
const normalizePhone = (phone) => {
  if (!phone) return '';
  const digitsOnly = String(phone).replace(/\D/g, '');
  // If length is 12 and starts with 91 (e.g. +91), extract the last 10 digits
  if (digitsOnly.length > 10) {
    return digitsOnly.slice(-10);
  }
  return digitsOnly;
};

/**
 * Validates 10-digit Indian mobile phone number (starts with 6, 7, 8, or 9)
 * @param {string} phone
 * @returns {boolean}
 */
const isValidIndianMobile = (phone) => {
  const normalized = normalizePhone(phone);
  return /^[6-9]\d{9}$/.test(normalized);
};

/**
 * Generates a unique AgriQueue farmer ID in the format AGQ-26-XXXX
 * @param {object} connection - MySQL pool or connection
 * @returns {Promise<string>}
 */
const generateUniqueFarmerId = async (connection) => {
  let attempts = 0;
  while (attempts < 10) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const candidateId = `AGQ-26-${randomSuffix}`;

    const [existing] = await connection.query(
      'SELECT id FROM farmers WHERE farmer_id = ? LIMIT 1',
      [candidateId]
    );

    if (existing.length === 0) {
      return candidateId;
    }
    attempts++;
  }
  return `AGQ-26-${Date.now().toString().slice(-4)}`;
};

/**
 * POST /api/farmers
 * Registers a new farmer profile in the farmers table.
 */
router.post('/', async (req, res) => {
  try {
    const { name, phone, state, district, village, preferred_language } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Farmer name is required and cannot be empty.'
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Phone number is required.'
      });
    }

    const cleanPhone = normalizePhone(phone);
    if (!isValidIndianMobile(cleanPhone)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Phone number must be a valid 10-digit Indian mobile number.'
      });
    }

    if (!state || !state.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'State is required.'
      });
    }

    if (!district || !district.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'District is required.'
      });
    }

    const cleanName = name.trim();
    const cleanState = state.trim();
    const cleanDistrict = district.trim();
    const cleanVillage = village ? village.trim() : null;
    const cleanLanguage = preferred_language && preferred_language.trim() ? preferred_language.trim().toLowerCase() : 'en';

    // Check if phone number already exists
    const [existingByPhone] = await pool.query(
      'SELECT id, farmer_id, name, phone, state, district, village, preferred_language, created_at FROM farmers WHERE phone = ? LIMIT 1',
      [cleanPhone]
    );

    if (existingByPhone.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A farmer with this mobile number is already registered.',
        existingFarmer: {
          farmer_id: existingByPhone[0].farmer_id,
          name: existingByPhone[0].name,
          state: existingByPhone[0].state,
          district: existingByPhone[0].district,
          village: existingByPhone[0].village,
          preferred_language: existingByPhone[0].preferred_language
        }
      });
    }

    // Generate unique farmer ID
    const farmerId = await generateUniqueFarmerId(pool);

    // Insert new farmer record
    const insertQuery = `
      INSERT INTO farmers (
        farmer_id, name, phone, state, district, village, preferred_language
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [insertResult] = await pool.query(insertQuery, [
      farmerId,
      cleanName,
      cleanPhone,
      cleanState,
      cleanDistrict,
      cleanVillage,
      cleanLanguage
    ]);

    // Retrieve created record
    const [createdRows] = await pool.query(
      'SELECT id, farmer_id, name, phone, state, district, village, preferred_language, created_at, updated_at FROM farmers WHERE id = ?',
      [insertResult.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Farmer registered successfully',
      data: createdRows[0]
    });

  } catch (error) {
    console.error('Error in POST /api/farmers:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while saving the farmer profile. Please try again.'
    });
  }
});

/**
 * GET /api/farmers/:farmerId
 * Retrieves a farmer profile by farmer_id (e.g. AGQ-26-XXXX) or 10-digit phone number.
 */
router.get('/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;

    if (!farmerId || !farmerId.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'farmerId parameter is required.'
      });
    }

    const cleanParam = farmerId.trim();

    const [rows] = await pool.query(
      `SELECT id, farmer_id, name, phone, state, district, village, preferred_language, created_at, updated_at 
       FROM farmers 
       WHERE farmer_id = ? OR phone = ? 
       LIMIT 1`,
      [cleanParam, normalizePhone(cleanParam)]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Farmer with ID or phone '${cleanParam}' was not found.`
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error('Error in GET /api/farmers/:farmerId:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching the farmer profile.'
    });
  }
});

/**
 * PUT /api/farmers/:farmerId
 * Updates an existing farmer profile.
 */
router.put('/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { name, state, district, village, preferred_language } = req.body;

    if (!farmerId || !farmerId.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'farmerId parameter is required.'
      });
    }

    // Verify existence
    const [existing] = await pool.query(
      'SELECT id, farmer_id FROM farmers WHERE farmer_id = ? LIMIT 1',
      [farmerId.trim()]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Farmer with ID '${farmerId}' was not found.`
      });
    }

    // Build update fields
    const updates = [];
    const values = [];

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Bad Request', message: 'Name cannot be empty.' });
      }
      updates.push('name = ?');
      values.push(name.trim());
    }

    if (state !== undefined) {
      if (!state || !state.trim()) {
        return res.status(400).json({ error: 'Bad Request', message: 'State cannot be empty.' });
      }
      updates.push('state = ?');
      values.push(state.trim());
    }

    if (district !== undefined) {
      if (!district || !district.trim()) {
        return res.status(400).json({ error: 'Bad Request', message: 'District cannot be empty.' });
      }
      updates.push('district = ?');
      values.push(district.trim());
    }

    if (village !== undefined) {
      updates.push('village = ?');
      values.push(village ? village.trim() : null);
    }

    if (preferred_language !== undefined) {
      updates.push('preferred_language = ?');
      values.push(preferred_language ? preferred_language.trim().toLowerCase() : 'en');
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No valid fields provided for update.'
      });
    }

    values.push(farmerId.trim());
    const updateQuery = `UPDATE farmers SET ${updates.join(', ')} WHERE farmer_id = ?`;
    await pool.query(updateQuery, values);

    // Fetch updated record
    const [updatedRows] = await pool.query(
      'SELECT id, farmer_id, name, phone, state, district, village, preferred_language, created_at, updated_at FROM farmers WHERE farmer_id = ?',
      [farmerId.trim()]
    );

    return res.status(200).json({
      success: true,
      message: 'Farmer profile updated successfully',
      data: updatedRows[0]
    });

  } catch (error) {
    console.error('Error in PUT /api/farmers/:farmerId:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while updating the farmer profile.'
    });
  }
});

export default router;
