/**
 * Weather Localization Layer
 *
 * Normalizes weather conditions, advisory types, and day labels,
 * resolving them against the centralized AgriQueue i18n system.
 *
 * Handles graceful fallback for unknown API values without breaking UI.
 */

/**
 * Standard mapping from normalized lowercase weather conditions to translation keys
 */
const CONDITION_MAP = {
  // Sunny / Clear
  'sunny': 'weather.condition.sunny',
  'clear': 'weather.condition.clear',
  'clear sky': 'weather.condition.clear',
  'mostly sunny': 'weather.condition.sunny',

  // Cloudy variations
  'cloudy': 'weather.condition.cloudy',
  'partly cloudy': 'weather.condition.partlyCloudy',
  'partly-cloudy': 'weather.condition.partlyCloudy',
  'partially cloudy': 'weather.condition.partlyCloudy',
  'cloud-sun': 'weather.condition.partlyCloudy',
  'overcast': 'weather.condition.overcast',

  // Rain variations
  'rain': 'weather.condition.rain',
  'rainy': 'weather.condition.rainy',
  'cloud-rain': 'weather.condition.rainy',
  'light rain': 'weather.condition.lightRain',
  'light-rain': 'weather.condition.lightRain',
  'heavy rain': 'weather.condition.heavyRain',
  'heavy-rain': 'weather.condition.heavyRain',
  'cloud-showers-heavy': 'weather.condition.showers',
  'showers': 'weather.condition.showers',
  'shower': 'weather.condition.showers',
  'drizzle': 'weather.condition.drizzle',
  'light drizzle': 'weather.condition.drizzle',

  // Storm variations
  'thunderstorm': 'weather.condition.thunderstorm',
  'thunderstorms': 'weather.condition.thunderstorms',
  'thunder': 'weather.condition.thunderstorm',
  'storm': 'weather.condition.thunderstorm',

  // Atmospheric conditions
  'mist': 'weather.condition.mist',
  'fog': 'weather.condition.fog',
  'foggy': 'weather.condition.fog',
  'haze': 'weather.condition.haze',
  'hazy': 'weather.condition.haze',
  'windy': 'weather.condition.windy',
  'wind': 'weather.condition.windy'
};

/**
 * Normalizes an incoming weather condition string to its canonical i18n key.
 * Returns null if the condition is not recognized.
 *
 * @param {string} condition - Raw condition string from API/mock (e.g. "Light rain", "Partly Cloudy")
 * @returns {string|null} - Translation key e.g. "weather.condition.lightRain" or null
 */
export function normalizeWeatherCondition(condition) {
  if (!condition || typeof condition !== 'string') return null;
  const clean = condition.trim().toLowerCase();
  return CONDITION_MAP[clean] || null;
}

/**
 * Resolves a localized weather condition string using the provided translation function `t`.
 * Gracefully falls back to the original English string if unknown, never returning undefined.
 *
 * @param {string} condition - Raw condition string (e.g. "Light rain", "Partly Cloudy")
 * @param {Function} t - Context translation function
 * @returns {string} - Localized condition or original condition fallback
 */
export function getLocalizedWeatherCondition(condition, t) {
  if (!condition) return '';
  if (typeof t !== 'function') return String(condition);

  const key = normalizeWeatherCondition(condition);
  if (key) {
    const translated = t(key);
    // Ensure translation didn't fall back to last segment key unless that matches English
    if (translated) {
      return translated;
    }
  }

  // Graceful fallback to original value
  return String(condition).trim();
}

/**
 * Normalizes an alert object or advisory code into a canonical advisory translation key.
 *
 * @param {object|string} alert - Alert object or type string
 * @returns {string|null} - Translation key e.g. "weather.advisory.heavyRainWarning"
 */
export function normalizeAdvisoryType(alert) {
  if (!alert) return 'weather.advisory.noAdvisory';

  // 1. If alert has an explicit type/code/category
  const typeStr = typeof alert === 'object' ? (alert.type || alert.code || alert.category || '') : String(alert);
  const cleanType = String(typeStr).trim().toLowerCase().replace(/[-_]/g, ' ');

  if (cleanType.includes('heavy rain') || cleanType === 'heavy rain warning') {
    return 'weather.advisory.heavyRainWarning';
  }
  if (cleanType.includes('thunderstorm') || cleanType.includes('storm')) {
    return 'weather.advisory.thunderstormWarning';
  }
  if (cleanType.includes('rain expected') || cleanType === 'rain' || cleanType.includes('rain')) {
    return 'weather.advisory.rainExpected';
  }
  if (cleanType.includes('high temperature') || cleanType.includes('heat') || cleanType.includes('hot')) {
    return 'weather.advisory.highTemperature';
  }
  if (cleanType.includes('strong wind') || cleanType.includes('wind')) {
    return 'weather.advisory.strongWind';
  }
  if (cleanType.includes('normal') || cleanType.includes('favorable')) {
    return 'weather.advisory.normalConditions';
  }
  if (cleanType.includes('no advisory') || cleanType === 'none' || cleanType === 'clear') {
    return 'weather.advisory.noAdvisory';
  }

  // 2. Inspect message text if available
  const message = typeof alert === 'object' ? (alert.message || '') : String(alert);
  const cleanMsg = String(message).toLowerCase();

  if (cleanMsg.includes('heavy rain') || cleanMsg.includes('downpour')) {
    return 'weather.advisory.heavyRainWarning';
  }
  if (cleanMsg.includes('thunderstorm') || cleanMsg.includes('lightning') || cleanMsg.includes('thunder')) {
    return 'weather.advisory.thunderstormWarning';
  }
  if (cleanMsg.includes('rain') || cleanMsg.includes('shower') || cleanMsg.includes('precipitation')) {
    return 'weather.advisory.rainExpected';
  }
  if (cleanMsg.includes('temperature') || cleanMsg.includes('heatwave') || cleanMsg.includes('heat')) {
    return 'weather.advisory.highTemperature';
  }
  if (cleanMsg.includes('wind') || cleanMsg.includes('gale')) {
    return 'weather.advisory.strongWind';
  }

  return null;
}

/**
 * Resolves a localized weather advisory string using the provided translation function `t`.
 *
 * @param {object|string} alert - Alert object ({ severity, message, type }) or string
 * @param {Function} t - Context translation function
 * @returns {string} - Localized advisory message or fallback message
 */
export function getLocalizedWeatherAdvisory(alert, t) {
  if (!alert) {
    return typeof t === 'function' ? t('weather.advisory.noAdvisory') : 'No active weather alerts for your area at this time.';
  }

  if (typeof t !== 'function') {
    return typeof alert === 'object' ? (alert.message || '') : String(alert);
  }

  const key = normalizeAdvisoryType(alert);
  if (key) {
    const translated = t(key);
    if (translated) {
      return translated;
    }
  }

  // Fallback to alert message if available
  if (typeof alert === 'object' && alert.message) {
    return alert.message;
  }
  if (typeof alert === 'string' && alert.trim()) {
    return alert.trim();
  }

  return t('weather.advisory.normalConditions');
}

/**
 * Standard mapping from day labels to translation keys
 */
const DAY_MAP = {
  'today': 'weather.days.today',
  'tomorrow': 'weather.days.tomorrow',
  'mon': 'weather.days.mon',
  'monday': 'weather.days.mon',
  'tue': 'weather.days.tue',
  'tuesday': 'weather.days.tue',
  'wed': 'weather.days.wed',
  'wednesday': 'weather.days.wed',
  'thu': 'weather.days.thu',
  'thursday': 'weather.days.thu',
  'fri': 'weather.days.fri',
  'friday': 'weather.days.fri',
  'sat': 'weather.days.sat',
  'saturday': 'weather.days.sat',
  'sun': 'weather.days.sun',
  'sunday': 'weather.days.sun'
};

/**
 * Localizes a forecast day label ("Today", "Tomorrow", "Sat", "Sun", etc.)
 *
 * @param {string} day - Day string
 * @param {Function} t - Context translation function
 * @returns {string} - Localized day string
 */
export function getLocalizedDay(day, t) {
  if (!day) return '';
  if (typeof t !== 'function') return String(day);

  const clean = String(day).trim().toLowerCase();
  const key = DAY_MAP[clean];
  if (key) {
    const translated = t(key);
    if (translated) return translated;
  }

  // Also check legacy dashboard.forecastToday / forecastTomorrow / forecastSat / forecastSun
  if (clean === 'today') return t('dashboard.forecastToday');
  if (clean === 'tomorrow') return t('dashboard.forecastTomorrow');
  if (clean === 'sat') return t('dashboard.forecastSat');
  if (clean === 'sun') return t('dashboard.forecastSun');

  return String(day);
}
