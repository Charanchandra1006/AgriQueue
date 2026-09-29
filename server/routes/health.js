import express from 'express';
import { testConnection } from '../config/db.js';

const router = express.Router();

/**
 * GET /api/health
 * Returns service uptime and MySQL connection health
 */
router.get('/', async (req, res) => {
  const dbHealth = await testConnection();

  if (dbHealth.success) {
    return res.status(200).json({
      service: 'AgriQueue Backend API',
      status: 'online',
      database: 'connected',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      databaseDetails: dbHealth.serverInfo
    });
  }

  return res.status(503).json({
    service: 'AgriQueue Backend API',
    status: 'online',
    database: 'disconnected',
    databaseError: dbHealth.message,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

export default router;
