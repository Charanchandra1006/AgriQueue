import { en } from './locales/en';
import { hi } from './locales/hi';
import { pa } from './locales/pa';
import { te } from './locales/te';

export const translations = {
  en,
  hi,
  pa,
  te
};

/**
 * Backward compatibility aliases for legacy flat keys used in earlier versions
 */
const legacyKeyAliases = {
  dashboard: 'common.dashboard',
  mandiMap: 'common.mandiMap',
  mandiCenters: 'common.mandiCenters',
  marketPrices: 'common.marketPrices',
  schemes: 'common.schemes',
  buySeeds: 'common.buySeeds',
  aiCropDoctor: 'common.aiCropDoctor',
  weatherAlerts: 'common.weatherAlerts',
  bookTransport: 'common.bookTransport',
  agriReels: 'common.agriReels',
  help: 'common.help',
  logout: 'common.logout',
  welcome: 'nav.welcome',
  skipQueue: 'dashboard.skipQueue',
  supportingText: 'dashboard.supportingText',
  bookSlot: 'dashboard.bookSlot',
  exploreMandis: 'dashboard.exploreMandis',
  liveQueueStatus: 'dashboard.liveQueueStatus',
  tokenNumber: 'dashboard.tokenNumber',
  farmersAhead: 'dashboard.farmersAhead',
  estimatedWait: 'dashboard.estWait',
  procurementCenter: 'dashboard.procurementCenter',
  slotStatus: 'common.status',
  confirmed: 'booking.statusConfirmed',
  active: 'dashboard.slotConfirmed',
  quickActions: 'dashboard.todayMarketPrices', // or quickActions
  nearbyMandis: 'dashboard.nearbyMandis',
  weatherForecast: 'dashboard.weatherForecast',
  impactImpact: 'dashboard.impactTitle',
  registeredFarmers: 'dashboard.registeredFarmers',
  waitingReduced: 'dashboard.waitingReduced',
  transactionsCompleted: 'dashboard.transactionsCompleted',
  educationalReels: 'dashboard.educationalReels',
  viewReels: 'dashboard.viewReels',
  notifications: 'nav.notifications',
  markAllRead: 'nav.markAllRead',
  noNotifications: 'nav.noNotifications',
  profile: 'nav.myProfile',
  changeLanguage: 'nav.changeLanguage',
  searchStatePlaceholder: 'onboarding.searchStatePlaceholder',
  searchDistrictPlaceholder: 'onboarding.searchDistrictPlaceholder',
  selectStateFirst: 'onboarding.selectStateFirst',
  noStateFound: 'onboarding.noStateFound',
  noDistrictFound: 'onboarding.noDistrictFound'
};

/**
 * Safely traverses a dictionary object using a dot-delimited key path.
 */
function getValueByPath(obj, path) {
  if (!obj || !path) return undefined;
  // 1. Check direct key match (e.g. flat key)
  if (Object.prototype.hasOwnProperty.call(obj, path)) {
    return obj[path];
  }
  // 2. Check dot notation traversal
  const segments = path.split('.');
  let current = obj;
  for (let i = 0; i < segments.length; i++) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[segments[i]];
  }
  return current;
}

/**
 * Resolves a translation key for the specified language with fallback to English.
 * Supports string interpolation for {param} tokens.
 *
 * @param {string} lang - Language code ('en', 'hi', 'pa', 'te')
 * @param {string} key - Hierarchical or flat translation key
 * @param {object} [params] - Optional key-value parameters for interpolation
 * @returns {string} - Resolved localized string
 */
export function translate(lang, key, params = null) {
  if (!key) return '';

  const activeLang = translations[lang] ? lang : 'en';
  const dict = translations[activeLang] || translations.en;
  const canonicalKey = legacyKeyAliases[key] || key;

  // 1. Try resolving in selected language dictionary
  let value = getValueByPath(dict, canonicalKey);

  // Fallback for legacy key if aliased didn't resolve directly
  if (value === undefined && canonicalKey !== key) {
    value = getValueByPath(dict, key);
  }

  // 2. Fall back to English if not found in target language
  if ((value === undefined || value === null) && activeLang !== 'en') {
    value = getValueByPath(translations.en, canonicalKey);
    if (value === undefined && canonicalKey !== key) {
      value = getValueByPath(translations.en, key);
    }
  }

  // 3. Fallback reporting and graceful output
  if (value === undefined || value === null) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[i18n] Missing translation for key: "${key}" (lang: ${lang})`);
    }
    // Return the last key segment formatted cleanly rather than undefined or raw key
    const parts = key.split('.');
    value = parts[parts.length - 1];
  }

  // 4. Interpolate {param} tokens if parameters provided
  if (typeof value === 'string' && params && typeof params === 'object') {
    return Object.keys(params).reduce((str, paramKey) => {
      const reg = new RegExp(`\\{${paramKey}\\}`, 'g');
      return str.replace(reg, String(params[paramKey] ?? ''));
    }, value);
  }

  return String(value ?? '');
}

/**
 * Returns the standard BCP-47 locale tag corresponding to an AgriQueue language code
 */
export function getLocaleCode(lang) {
  switch (lang) {
    case 'hi':
      return 'hi-IN';
    case 'pa':
      return 'pa-IN';
    case 'te':
      return 'te-IN';
    case 'en':
    default:
      return 'en-IN';
  }
}
