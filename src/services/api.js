/**
 * AgriQueue Frontend API Service
 * Manages communication between React frontend and Express backend.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Checks the health of the Express backend and the underlying MySQL database.
 * Calls GET /api/health
 * @returns {Promise<{ ok: boolean, status: number, data?: object, error?: string }>}
 */
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err.message
    };
  }
};

/**
 * Development-only connection diagnostic test.
 * Runs once in development mode to log:
 * Frontend → Backend → MySQL connection successful
 */
export const testBackendConnectionDev = async () => {
  if (import.meta.env.DEV) {
    try {
      const health = await checkBackendHealth();
      if (health.ok && health.data?.database === 'connected') {
        console.log(
          '%c[AgriQueue Bridge] Frontend → Backend → MySQL connection successful! ✅',
          'color: #10b981; font-weight: bold; font-size: 12px;',
          {
            backend: health.data?.service,
            status: health.data?.status,
            database: health.data?.database,
            details: health.data?.databaseDetails
          }
        );
      } else if (health.ok) {
        console.warn(
          '[AgriQueue Bridge] Express server is online, but MySQL is disconnected ⚠️',
          health.data?.databaseError
        );
      } else {
        console.info(
          `[AgriQueue Bridge] Express backend at ${API_BASE_URL} is currently unreachable. Start it with 'npm run dev' inside /server.`
        );
      }
    } catch (err) {
      console.warn('[AgriQueue Bridge] Dev health check encountered an error:', err);
    }
  }
};

/**
 * Registers a new farmer profile in MySQL via backend API.
 * Calls POST /api/farmers
 * @param {object} farmerData - { name, phone, state, district, village, preferred_language }
 * @returns {Promise<{ success: boolean, data?: object, message?: string, error?: string, existingFarmer?: object }>}
 */
export const createFarmer = async (farmerData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/farmers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(farmerData),
    });

    const result = await response.json();
    return {
      success: response.ok,
      status: response.status,
      ...result,
    };
  } catch (err) {
    return {
      success: false,
      status: 0,
      error: 'Network Error',
      message: err.message,
    };
  }
};

/**
 * Retrieves a farmer profile from MySQL via backend API.
 * Calls GET /api/farmers/:farmerId
 * @param {string} farmerId - Farmer unique ID (e.g. AGQ-26-XXXX) or 10-digit phone
 * @returns {Promise<{ success: boolean, data?: object, message?: string, error?: string }>}
 */
export const getFarmer = async (farmerId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/farmers/${encodeURIComponent(farmerId)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const result = await response.json();
    return {
      success: response.ok,
      status: response.status,
      ...result,
    };
  } catch (err) {
    return {
      success: false,
      status: 0,
      error: 'Network Error',
      message: err.message,
    };
  }
};

/**
 * Updates an existing farmer profile in MySQL via backend API.
 * Calls PUT /api/farmers/:farmerId
 * @param {string} farmerId
 * @param {object} updateData - { name, state, district, village, preferred_language }
 * @returns {Promise<{ success: boolean, data?: object, message?: string, error?: string }>}
 */
export const updateFarmer = async (farmerId, updateData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/farmers/${encodeURIComponent(farmerId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    const result = await response.json();
    return {
      success: response.ok,
      status: response.status,
      ...result,
    };
  } catch (err) {
    return {
      success: false,
      status: 0,
      error: 'Network Error',
      message: err.message,
    };
  }
};

/**
 * Retrieves real mandi master records from backend MySQL API.
 * Calls GET /api/mandis
 * @param {object} params - { state, district, search, hasCoordinates }
 * @returns {Promise<{ success: boolean, count: number, data: Array, message?: string }>}
 */
export const getMandis = async (params = {}) => {
  try {
    const query = new URLSearchParams();
    if (params.state) query.append('state', params.state);
    if (params.district) query.append('district', params.district);
    if (params.search) query.append('search', params.search);
    if (params.hasCoordinates) query.append('hasCoordinates', 'true');

    const qs = query.toString();
    const url = `${API_BASE_URL}/mandis${qs ? `?${qs}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const result = await response.json();
    return {
      success: response.ok,
      count: result.count || 0,
      data: result.data || [],
      ...result,
    };
  } catch (err) {
    return {
      success: false,
      count: 0,
      data: [],
      error: 'Network Error',
      message: err.message,
    };
  }
};

/**
 * Retrieves location metadata (states and districts) from backend.
 * Calls GET /api/mandis/meta/locations
 */
export const getMandiLocations = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/mandis/meta/locations`, {
      headers: { 'Accept': 'application/json' },
    });
    return await response.json();
  } catch (err) {
    return { success: false, states: [], stateMap: {} };
  }
};

/**
 * Retrieves the complete Karimnagar administrative hierarchy (Mandals -> Villages -> Centers).
 * Calls GET /api/mandis/hierarchy/karimnagar
 */
export const getKarimnagarHierarchy = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/mandis/hierarchy/karimnagar`, {
      headers: { 'Accept': 'application/json' },
    });
    return await response.json();
  } catch (err) {
    return { success: false, mandals: [] };
  }
};


/**
 * Retrieves a single mandi by ID from backend.
 * Calls GET /api/mandis/:id
 */
export const getMandiById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/mandis/${encodeURIComponent(id)}`, {
      headers: { 'Accept': 'application/json' },
    });
    return await response.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Retrieves the active procurement booking for a farmer from MySQL backend.
 * Calls GET /api/bookings/active/:farmerId
 * @param {string} farmerId - Farmer unique ID, phone, or id
 * @returns {Promise<{ success: boolean, data?: object, message?: string }>}
 */
export const getActiveBooking = async (farmerId) => {
  try {
    if (!farmerId) {
      return { success: true, data: null };
    }
    const response = await fetch(`${API_BASE_URL}/bookings/active/${encodeURIComponent(farmerId)}`, {
      headers: { 'Accept': 'application/json' },
    });
    const result = await response.json();
    return {
      success: response.ok,
      status: response.status,
      ...result,
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: 'Network Error',
      message: err.message,
    };
  }
};

/**
 * Retrieves the complete booking history for a farmer from MySQL backend.
 * Calls GET /api/bookings/history/:farmerId
 * @param {string} farmerId - Farmer unique ID, phone, or id
 * @returns {Promise<{ success: boolean, count?: number, data: Array, message?: string }>}
 */
export const getBookingHistory = async (farmerId) => {
  try {
    if (!farmerId) {
      return { success: true, count: 0, data: [] };
    }
    const response = await fetch(`${API_BASE_URL}/bookings/history/${encodeURIComponent(farmerId)}`, {
      headers: { 'Accept': 'application/json' },
    });
    const result = await response.json();
    return {
      success: response.ok,
      status: response.status,
      count: result.count || (result.data ? result.data.length : 0),
      data: result.data || [],
      ...result,
    };
  } catch (err) {
    return {
      success: false,
      count: 0,
      data: [],
      error: 'Network Error',
      message: err.message,
    };
  }
};


/**
 * Creates a real procurement booking in MySQL database.
 * Calls POST /api/bookings
 * @param {object} bookingData - { farmerId, mandiId, cropName, slotDate, timeSlot, quantity }
 * @returns {Promise<{ success: boolean, data?: object, message?: string }>}
 */
export const createBooking = async (bookingData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });
    const result = await response.json();
    return {
      success: response.ok,
      status: response.status,
      ...result,
    };
  } catch (err) {
    return {
      success: false,
      error: 'Network Error',
      message: err.message,
    };
  }
};

/**
 * Cancels an active booking in MySQL database.
 * Calls POST /api/bookings/:id/cancel
 * @param {string|number} bookingId - Booking table id or booking_id string
 */
export const cancelBooking = async (bookingId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${encodeURIComponent(bookingId)}/cancel`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
    });
    return await response.json();
  } catch (err) {
    return {
      success: false,
      error: 'Network Error',
      message: err.message,
    };
  }
};

/**
 * Retrieves procurement slots for a specific mandi and date from MySQL backend.
 * Calls GET /api/mandis/:id/slots?date=YYYY-MM-DD
 * @param {number|string} mandiId
 * @param {string} [date] - Optional date in YYYY-MM-DD
 * @returns {Promise<{ success: boolean, mandiId?: number, mandiName?: string, date?: string, slots?: Array, error?: string }>}
 */
export const getMandiSlots = async (mandiId, date) => {
  try {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    const response = await fetch(`${API_BASE_URL}/mandis/${encodeURIComponent(mandiId)}/slots${qs}`, {
      headers: { 'Accept': 'application/json' },
    });
    const result = await response.json();
    return {
      success: response.ok,
      status: response.status,
      ...result,
    };
  } catch (err) {
    return {
      success: false,
      slots: [],
      error: 'Network Error',
      message: err.message,
    };
  }
};

/**
 * Retrieves official Government of India mandi prices from backend MySQL database.
 * Calls GET /api/market-prices
 * @param {object} params - { state, district, commodity, market, date, page, limit }
 * @returns {Promise<{ success: boolean, count: number, total: number, data: Array, source?: string, error?: string }>}
 */
export const getMarketPrices = async (params = {}) => {
  try {
    const query = new URLSearchParams();
    if (params.state) query.append('state', params.state);
    if (params.district) query.append('district', params.district);
    if (params.commodity) query.append('commodity', params.commodity);
    if (params.market) query.append('market', params.market);
    if (params.date) query.append('date', params.date);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));

    const qs = query.toString();
    const url = `${API_BASE_URL}/market-prices${qs ? `?${qs}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    const result = await response.json();
    return {
      success: response.ok,
      count: result.count || 0,
      total: result.total || 0,
      data: result.data || [],
      ...result,
    };
  } catch (err) {
    return {
      success: false,
      count: 0,
      total: 0,
      data: [],
      error: 'Network Error',
      message: err.message,
    };
  }
};

/**
 * Retrieves official Government of India market price trends from backend MySQL database.
 * Calls GET /api/market-prices/trends
 * @param {object} params - { state, district, commodity, market, period }
 * @returns {Promise<{ success: boolean, period: string, summary: object, points: Array, error?: string }>}
 */
export const getMarketPriceTrends = async (params = {}) => {
  try {
    const query = new URLSearchParams();
    if (params.state) query.append('state', params.state);
    if (params.district) query.append('district', params.district);
    if (params.commodity) query.append('commodity', params.commodity);
    if (params.market) query.append('market', params.market);
    if (params.period) query.append('period', params.period);

    const qs = query.toString();
    const url = `${API_BASE_URL}/market-prices/trends${qs ? `?${qs}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    const result = await response.json();
    return {
      success: response.ok,
      ...result,
    };
  } catch (err) {
    return {
      success: false,
      summary: {},
      points: [],
      error: 'Network Error',
      message: err.message,
    };
  }
};

/**
 * Requests the backend to synchronize latest government data from data.gov.in.
 * Calls POST /api/market-prices/sync
 * @param {object} [params] - { state, district, commodity, market }
 * @returns {Promise<{ success: boolean, recordsFetched?: number, recordsInserted?: number, recordsUpdated?: number, message?: string, error?: string }>}
 */
export const syncMarketPrices = async (params = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/market-prices/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(params)
    });
    const result = await response.json();
    return {
      success: response.ok,
      ...result
    };
  } catch (err) {
    return {
      success: false,
      error: 'Network Error',
      message: err.message
    };
  }
};

/**
 * Creates a real transport haulage request in MySQL backend.
 * Calls POST /api/transport/book
 * @param {object} transportData
 * @returns {Promise<{ success: boolean, data?: object, message?: string, error?: string }>}
 */
export const createTransportBooking = async (transportData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/transport/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(transportData),
    });
    const result = await response.json();
    return {
      success: response.ok,
      status: response.status,
      ...result,
    };
  } catch (err) {
    return {
      success: false,
      status: 0,
      error: 'Network Error',
      message: err.message,
    };
  }
};

/**
 * Retrieves the currently active transport booking for a farmer from MySQL.
 * Calls GET /api/transport/active/:farmerId
 * @param {string} farmerId
 * @returns {Promise<{ success: boolean, data?: object, message?: string }>}
 */
export const getActiveTransportBooking = async (farmerId) => {
  try {
    if (!farmerId) {
      return { success: true, data: null };
    }
    const response = await fetch(`${API_BASE_URL}/transport/active/${encodeURIComponent(farmerId)}`, {
      headers: { 'Accept': 'application/json' },
    });
    const result = await response.json();
    return {
      success: response.ok,
      status: response.status,
      ...result,
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: 'Network Error',
      message: err.message,
    };
  }
};

/**
 * Simulates assigning a verified local demo driver by the system.
 * Calls POST /api/transport/:bookingId/assign-driver
 * @param {string|number} bookingId
 */
export const assignTransportDemoDriver = async (bookingId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/transport/${encodeURIComponent(bookingId)}/assign-driver`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
    });
    const result = await response.json();
    return {
      success: response.ok,
      ...result,
    };
  } catch (err) {
    return {
      success: false,
      error: 'Network Error',
      message: err.message,
    };
  }
};

/**
 * Advances transport status along the farmer progress lifecycle:
 * REQUESTED -> DRIVER_ASSIGNED -> DRIVER_ARRIVING -> CROP_PICKED_UP -> COMPLETED
 * Calls POST /api/transport/:bookingId/step-status
 * @param {string|number} bookingId
 * @param {string} [targetStatus]
 */
export const stepTransportStatus = async (bookingId, targetStatus) => {
  try {
    const response = await fetch(`${API_BASE_URL}/transport/${encodeURIComponent(bookingId)}/step-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ targetStatus }),
    });
    const result = await response.json();
    return {
      success: response.ok,
      ...result,
    };
  } catch (err) {
    return {
      success: false,
      error: 'Network Error',
      message: err.message,
    };
  }
};

/**
 * Cancels an active transport booking.
 * Calls POST /api/transport/:bookingId/cancel
 * @param {string|number} bookingId
 */
export const cancelTransportBooking = async (bookingId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/transport/${encodeURIComponent(bookingId)}/cancel`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
    });
    const result = await response.json();
    return {
      success: response.ok,
      ...result,
    };
  } catch (err) {
    return {
      success: false,
      error: 'Network Error',
      message: err.message,
    };
  }
};

/**
 * Initializes a voice agent session for the authenticated farmer.
 * Calls POST /api/voice/session
 * @param {object} farmerContext
 */
export const initVoiceSession = async (farmerContext) => {
  try {
    const response = await fetch(`${API_BASE_URL}/voice/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(farmerContext)
    });
    const result = await response.json();
    return {
      success: response.ok,
      ...result
    };
  } catch (err) {
    return {
      success: false,
      error: 'Network Error',
      message: err.message
    };
  }
};

/**
 * Checks Gemini Live backend readiness and connectivity status.
 * Calls GET /api/voice/status
 */
export const getVoiceStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/voice/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    const result = await response.json();
    return {
      success: response.ok,
      ...result
    };
  } catch (err) {
    return {
      success: false,
      error: 'Network Error',
      message: err.message
    };
  }
};




