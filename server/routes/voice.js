import express from 'express';
import {
  createVoiceSessionContext,
  verifyGeminiLiveConnection,
  GEMINI_LIVE_MODEL
} from '../services/geminiLiveService.js';

const router = express.Router();

/**
 * GET /api/voice/status
 * Health check endpoint for Gemini Live API configuration and connectivity
 */
router.get('/status', async (req, res) => {
  try {
    const isConfigured = Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'PASTE_MY_KEY_HERE' &&
      process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
    );

    if (!isConfigured) {
      return res.status(200).json({
        success: false,
        configured: false,
        model: GEMINI_LIVE_MODEL,
        message: 'GEMINI_API_KEY is not configured in server/.env'
      });
    }

    const verification = await verifyGeminiLiveConnection();

    return res.status(200).json({
      success: true,
      configured: true,
      connected: verification.connected,
      model: verification.model,
      message: 'Gemini Live service is ready for voice communication'
    });
  } catch (error) {
    console.error('[Voice Service Status Error]:', error.message);
    return res.status(500).json({
      success: false,
      configured: Boolean(process.env.GEMINI_API_KEY),
      connected: false,
      model: GEMINI_LIVE_MODEL,
      error: error.message
    });
  }
});

/**
 * POST /api/voice/session
 * Initializes a voice agent session for the authenticated farmer with language context
 */
router.post('/session', (req, res) => {
  try {
    const { farmerId, farmerName, language, district, state } = req.body || {};

    if (!farmerId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: farmerId'
      });
    }

    const session = createVoiceSessionContext({
      farmerId,
      farmerName,
      language: language || 'en',
      district,
      state
    });

    return res.status(201).json({
      success: true,
      sessionId: session.sessionId,
      status: session.status,
      model: session.model,
      language: session.language,
      languageName: session.languageName,
      farmerId: session.farmerId,
      createdAt: session.createdAt,
      message: 'Voice session initialized successfully'
    });
  } catch (error) {
    console.error('[Voice Session Initialization Error]:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
