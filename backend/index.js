import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import healthRouter from './routes/health.js';
import farmersRouter from './routes/farmers.js';
import mandisRouter from './routes/mandis.js';
import bookingsRouter from './routes/bookings.js';
import marketPricesRouter from './routes/marketPrices.js';
import transportRouter from './routes/transport.js';
import voiceRouter from './routes/voice.js';
import { setupVoiceWebSocket, closeVoiceWebSocket } from './services/voiceWebSocket.js';
import { pool } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root info endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AgriQueue Backend API is running',
    version: '1.0.0',
    documentation: 'Check /api/health for system and database status'
  });
});

// Mount Routes
app.use('/api/health', healthRouter);
app.use('/api/farmers', farmersRouter);
app.use('/api/mandis', mandisRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/market-prices', marketPricesRouter);
app.use('/api/transport', transportRouter);
app.use('/api/voice', voiceRouter);


// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, _next) => {
  console.error('[Server Error]:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log('======================================================');
  console.log(`🚀 AgriQueue Express Server listening on port ${PORT}`);
  console.log(`📡 Health Check URL: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Allowed Origin:  ${FRONTEND_URL}`);
  console.log('======================================================');
});

// Mount Gemini Live Voice WebSocket
setupVoiceWebSocket(server);

// Graceful Shutdown
const handleShutdown = async (signal) => {
  console.log(`\n[${signal}] Shutting down server gracefully...`);
  try {
    await closeVoiceWebSocket();
  } catch (err) {
    console.error('Error closing voice websocket:', err);
  }
  server.close(async () => {
    try {
      await pool.end();
      console.log('✅ Database connection pool closed.');
    } catch (err) {
      console.error('Error closing database pool:', err);
    }
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

export default app;
