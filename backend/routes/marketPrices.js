import express from 'express';
import {
  syncMarketPrices,
  getMarketPrices,
  getMarketPriceTrends,
  OFFICIAL_SOURCE_NAME,
  DATA_GOV_RESOURCE_ID
} from '../services/marketPrices.js';

const router = express.Router();

/**
 * GET /api/market-prices
 * Query parameters:
 *   - state (string)
 *   - district (string)
 *   - commodity (string)
 *   - market (string)
 *   - date (YYYY-MM-DD or DD/MM/YYYY)
 *   - page (number, default 1)
 *   - limit (number, default 50)
 * 
 * Returns real stored Government of India mandi price records.
 */
router.get('/', async (req, res, next) => {
  try {
    const { state, district, commodity, market, date, page, limit } = req.query;

    const result = await getMarketPrices({
      state,
      district,
      commodity,
      market,
      date,
      page,
      limit
    });

    res.json({
      success: true,
      source: OFFICIAL_SOURCE_NAME,
      resourceId: DATA_GOV_RESOURCE_ID,
      count: result.records.length,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      filters: {
        state: state || null,
        district: district || null,
        commodity: commodity || null,
        market: market || null,
        date: date || null
      },
      data: result.records
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/market-prices/trends
 * Query parameters:
 *   - state (string)
 *   - district (string)
 *   - commodity (string)
 *   - market (string)
 *   - period ('today' | '7d' | '30d' | '1y', default '7d')
 * 
 * Returns real price trends aggregated from actual stored database records.
 * For 1 year, aggregates by month. Does not fabricate missing dates.
 */
router.get('/trends', async (req, res, next) => {
  try {
    const { state, district, commodity, market, period } = req.query;

    const trends = await getMarketPriceTrends({
      state,
      district,
      commodity,
      market,
      period: period || '7d'
    });

    res.json({
      success: true,
      source: OFFICIAL_SOURCE_NAME,
      period: trends.period,
      aggregation: trends.aggregation,
      filters: {
        state: state || null,
        district: district || null,
        commodity: commodity || null,
        market: market || null
      },
      summary: trends.summary,
      points: trends.points
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/market-prices/sync
 * 
 * Synchronizes latest daily mandi prices from data.gov.in (AGMARKNET).
 * Supports optional body or query filters:
 *   - state
 *   - district
 *   - commodity
 *   - limit (default 100)
 * 
 * Returns:
 *   - recordsFetched
 *   - recordsInserted
 *   - recordsUpdated
 *   - recordsSkipped
 *   - sourceDate
 */
router.post('/sync', async (req, res, next) => {
  try {
    // Basic protection for local dev: verify client is local or has valid dev header/key if provided
    const clientIp = req.ip || req.connection?.remoteAddress || '';
    const isLocal = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1';
    
    // In production or external calls, can require x-api-secret or admin session
    if (process.env.NODE_ENV === 'production' && !isLocal && !req.headers['x-sync-secret']) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Sync endpoint requires authorized administrative access'
      });
    }

    const { state, district, commodity, market, date, arrival_date, limit, offset } = { ...req.query, ...req.body };

    const syncResult = await syncMarketPrices({
      state,
      district,
      commodity,
      market,
      date: date || arrival_date,
      limit,
      offset
    });


    res.json(syncResult);
  } catch (error) {
    // Handle specific configuration or upstream errors cleanly
    if (error.statusCode === 503 && error.requiredConfig) {
      return res.status(503).json({
        success: false,
        error: error.message,
        requiredConfiguration: error.requiredConfig,
        message: 'The official Government of India data sync cannot run until DATA_GOV_API_KEY is configured in server/.env.'
      });
    }

    if (error.statusCode === 401 || error.statusCode === 502) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        source: OFFICIAL_SOURCE_NAME
      });
    }

    next(error);
  }
});

export default router;
