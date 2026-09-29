import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Ticket,
  MapPin,
  ArrowRight,
  AlertTriangle,
  FileText,
  Truck,
  HelpCircle,
  X,
  Loader2,
  History
} from 'lucide-react';
import { getMandis } from '../services/api';
import { BookingHistoryModal } from '../components/mandi/BookingHistoryModal';
import { BookingQRCode } from '../components/booking/BookingQRCode';
import { weatherAlerts } from '../mock/mockData';
import {
  getLocalizedWeatherCondition,
  getLocalizedWeatherAdvisory,
  getLocalizedDay
} from '../utils/weatherLocalization';
import { FarmerVoiceAgent } from '../components/voice/FarmerVoiceAgent';

/**
 * Converts 24-hour SQL time string (HH:MM:SS) to 12-hour AM/PM format
 */
const formatTime12h = (timeStr) => {
  if (!timeStr) return '08:00 AM';
  const parts = String(timeStr).split(':');
  let hour = parseInt(parts[0], 10);
  const minute = parts[1] || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${String(hour).padStart(2, '0')}:${minute} ${ampm}`;
};

/**
 * Determines if a mandi is currently open based on operating hours
 */
const isMandiOpen = (openingTime, closingTime) => {
  const parseToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const clean = timeStr.trim();
    const match = clean.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!match) return 0;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  const openMin = parseToMinutes(formatTime12h(openingTime || '08:00:00'));
  const closeMin = parseToMinutes(formatTime12h(closingTime || '18:00:00'));
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  return currentMin >= openMin && currentMin <= closeMin;
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, activeBooking, isLoadingBooking, cancelSlot, t } = useApp();

  const [mandisList, setMandisList] = useState([]);
  const [loadingMandi, setLoadingMandi] = useState(true);
  const [isTokenPassOpen, setIsTokenPassOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  // Automatically open token pass modal if navigated with ?openPass=true
  useEffect(() => {
    if (searchParams.get('openPass') === 'true') {
      setIsTokenPassOpen(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('openPass');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch real mandis from MySQL backend via GET /api/mandis
  useEffect(() => {
    let isMounted = true;
    const fetchMandiData = async () => {
      try {
        const res = await getMandis();
        if (isMounted && res.success && Array.isArray(res.data)) {
          setMandisList(res.data);
        }
      } catch (err) {
        console.warn('Could not load mandis for dashboard:', err);
      } finally {
        if (isMounted) setLoadingMandi(false);
      }
    };
    fetchMandiData();
    return () => { isMounted = false; };
  }, []);

  // Pick recommended mandi from real database:
  // Preference: Mandi matching farmer's district/state, or first active mandi in DB
  const recommendedMandi = useMemo(() => {
    if (!mandisList.length) return null;
    if (profile?.district) {
      const matchDistrict = mandisList.find(
        (m) => m.district?.toLowerCase() === profile.district.toLowerCase()
      );
      if (matchDistrict) return matchDistrict;
    }
    if (profile?.state) {
      const matchState = mandisList.find(
        (m) => m.state?.toLowerCase() === profile.state.toLowerCase()
      );
      if (matchState) return matchState;
    }
    return mandisList[0] || null;
  }, [mandisList, profile]);

  const mandiOpen = recommendedMandi
    ? isMandiOpen(recommendedMandi.opening_time, recommendedMandi.closing_time)
    : true;

  // Real or canonical market prices for the compact table
  const todayMarketPrices = [
    { cropKey: 'dashboard.cropPaddy', fallbackCrop: 'Paddy', emoji: '🌾', price: '₹2,425', trend: 'up', icon: '📈' },
    { cropKey: 'dashboard.cropMaize', fallbackCrop: 'Maize', emoji: '🌽', price: '₹2,180', trend: 'flat', icon: '➡️' },
    { cropKey: 'dashboard.cropWheat', fallbackCrop: 'Wheat', emoji: '🌾', price: '₹2,450', trend: 'up', icon: '📈' },
    { cropKey: 'dashboard.cropChilli', fallbackCrop: 'Chilli', emoji: '🌶️', price: '₹14,500', trend: 'down', icon: '📉' }
  ];

  const handleCancelBooking = async () => {
    if (window.confirm(t('dashboard.confirmCancelBooking'))) {
      setIsCancelling(true);
      await cancelSlot();
      setIsCancelling(false);
      setIsTokenPassOpen(false);
    }
  };

  return (
    <div className="space-y-5 pb-10 animate-in fade-in duration-300 max-w-6xl mx-auto">
      {/* ================= 1. WELCOME / FARMER HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label="waving hand">👋</span>
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
              {t('dashboard.namaste', { name: profile?.name || t('dashboard.defaultFarmer') })}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            {t('dashboard.heroSubtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {profile?.district && profile?.state && (
            <span className="inline-flex items-center gap-1 font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/80">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>{profile.district}, {profile.state}</span>
            </span>
          )}
          {profile?.farmerId && (
            <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <span>{t('dashboard.kisanIdLabel')}</span>
              <span className="font-mono">{profile.farmerId}</span>
            </span>
          )}
        </div>
      </div>

      {/* ================= 2. TOP PRIORITY — MY PROCUREMENT TOKEN ================= */}
      <div>
        {isLoadingBooking ? (
          <Card className="p-8 text-center bg-white border-slate-200 rounded-2xl shadow-xs">
            <div className="flex flex-col items-center justify-center space-y-2">
              <Loader2 className="h-6 w-6 text-primary-600 animate-spin" />
              <p className="text-sm font-bold text-slate-700">{t('dashboard.checkingBooking')}</p>
            </div>
          </Card>
        ) : activeBooking ? (
          /* ACTIVE BOOKING CARD (Using Real Data from MySQL) */
          <Card className="p-5 sm:p-6 bg-gradient-to-br from-emerald-50/70 via-white to-white border-2 border-emerald-500 shadow-md rounded-2xl space-y-5">
            {/* Header: Title and Status Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3.5">
              <div className="flex items-center gap-2">
                <span className="text-xl" role="img" aria-label="ticket">🎟️</span>
                <span className="text-xs font-black uppercase tracking-widest text-emerald-900">
                  {t('dashboard.myProcurementToken')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                  <span>●</span>
                  <span>{t('dashboard.slotConfirmed')}</span>
                </span>
              </div>
            </div>

            {/* Token Hero Display */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                  {t('dashboard.tokenNumber')}
                </span>
                <span className="font-heading font-black text-3xl sm:text-4xl text-emerald-600 tracking-wider block">
                  {activeBooking.tokenNumber || t('dashboard.tokenAvailable')}
                </span>
                <p className="text-xs font-semibold text-slate-500">
                  {t('dashboard.tokenRegistered')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
                <Button
                  variant="primary"
                  className="text-xs sm:text-sm font-bold shadow-xs py-2.5 px-4 cursor-pointer"
                  onClick={() => setIsTokenPassOpen(true)}
                >
                  <Ticket className="h-4 w-4 mr-1.5" />
                  {t('dashboard.viewTokenPass')}
                </Button>
                <Button
                  variant="outline"
                  className="text-xs sm:text-sm font-bold border-slate-300 text-slate-700 hover:bg-slate-50 py-2.5 px-4 cursor-pointer"
                  onClick={() => setIsHistoryOpen(true)}
                >
                  <History className="h-4 w-4 mr-1.5 text-primary-600" />
                  📜 {t('dashboard.bookingHistory')}
                </Button>
                <Button
                  variant="outline"
                  className="text-xs sm:text-sm font-bold border-slate-300 text-slate-700 hover:bg-slate-50 py-2.5 px-4 cursor-pointer"
                  onClick={() => navigate('/book-transport')}
                >
                  <Truck className="h-4 w-4 mr-1.5 text-primary-600" />
                  🚜 {t('dashboard.bookTransport')}
                </Button>
              </div>
            </div>

            {/* Booking Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
              {/* Procurement Center */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t('dashboard.procurementCenter')}
                </span>
                <span className="font-extrabold text-slate-800 text-sm block truncate">
                  🏪 {activeBooking.mandi?.name || t('dashboard.mandiCenterFallback')}
                </span>
                <span className="text-xs text-slate-500 block truncate">
                  📍 {activeBooking.mandi?.location || `${activeBooking.mandi?.district}, ${activeBooking.mandi?.state}`}
                </span>
              </div>

              {/* Crop & Quantity */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t('dashboard.cropAndQuantity')}
                </span>
                <span className="font-extrabold text-slate-800 text-sm block">
                  🌾 {activeBooking.cropName || t('dashboard.defaultCrop')}
                </span>
                <span className="text-xs text-slate-500 block">
                  {t('dashboard.weight')} {activeBooking.estimatedQuantity || 40} {t('common.quintals')}
                </span>
              </div>

              {/* Time Slot Schedule */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t('dashboard.schedule')}
                </span>
                <span className="font-extrabold text-slate-800 text-sm block">
                  🕐 {activeBooking.slot?.formattedTime || t('dashboard.defaultTimeSlot')}
                </span>
                <span className="text-xs text-emerald-700 font-bold block">
                  📅 {activeBooking.slot?.displayDate || t('dashboard.today')}
                </span>
              </div>

              {/* Queue Position & Waiting Time */}
              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 shadow-2xs space-y-0.5">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  {t('dashboard.queuePosition')}
                </span>
                <span className="font-extrabold text-emerald-950 text-sm block">
                  👨🌾 {t('dashboard.farmersAhead', { count: activeBooking.queue?.farmersAhead ?? 0 })}
                </span>
                <span className="text-xs font-bold text-emerald-700 block">
                  ⏱️ {activeBooking.queue?.estimatedWait || t('dashboard.estWait', { time: '0 min' })}
                </span>
              </div>
            </div>
          </Card>
        ) : (
          /* NO ACTIVE BOOKING CARD */
          <Card className="p-6 bg-gradient-to-br from-slate-50 via-white to-slate-50 border border-slate-200 rounded-2xl shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-slate-100 rounded-2xl text-slate-500 text-2xl shrink-0">
                  🎟️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      {t('dashboard.myProcurementToken')}
                    </span>
                    <span className="text-[10px] font-bold bg-slate-200/70 text-slate-600 px-2 py-0.5 rounded-full">
                      {t('dashboard.noActiveStatus')}
                    </span>
                  </div>
                  <h2 className="font-heading font-extrabold text-slate-800 text-lg sm:text-xl mt-0.5">
                    {t('dashboard.noActiveToken')}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                    {t('dashboard.noActiveTokenSub')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-xs sm:text-sm font-bold border-slate-300 text-slate-700 hover:bg-slate-50 py-3 px-4 cursor-pointer"
                  onClick={() => setIsHistoryOpen(true)}
                >
                  <History className="h-4 w-4 mr-1.5 text-primary-600" />
                  📜 {t('dashboard.bookingHistory')}
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  className="text-xs sm:text-sm font-bold shadow-xs py-3 px-5 cursor-pointer"
                  onClick={() => navigate('/mandi-centers')}
                >
                  🏪 {t('dashboard.findMandi')}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* ================= 3. TWO-COLUMN CORE: MARKET PRICES & RECOMMENDED MANDI ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Column: Compact Market Prices */}
        <Card className="p-5 border-slate-200 shadow-2xs rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg" role="img" aria-label="money">💰</span>
                <h2 className="font-heading font-extrabold text-sm sm:text-base text-slate-800 tracking-tight">
                  {t('dashboard.todayMarketPrices')}
                </h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t('dashboard.perQuintal')}
              </span>
            </div>

            {/* Price list rows */}
            <div className="divide-y divide-slate-100">
              {todayMarketPrices.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <span className="text-base">{item.emoji}</span>
                    <span>{t(item.cropKey) || item.fallbackCrop}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-heading font-black text-slate-900 text-sm sm:text-base">
                      {item.price}
                    </span>
                    <span className="text-sm select-none" title={t(`dashboard.trend_${item.trend}`)}>
                      {item.icon}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100">
            <Button
              variant="outline"
              className="w-full justify-center text-xs font-bold py-2.5 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
              onClick={() => navigate('/market-prices')}
            >
              <span>{t('dashboard.viewAllPrices')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>

        {/* Right Column: Recommended Mandi */}
        <Card className="p-5 border-slate-200 shadow-2xs rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg" role="img" aria-label="mandi">🏪</span>
                <h2 className="font-heading font-extrabold text-sm sm:text-base text-slate-800 tracking-tight">
                  {t('dashboard.recommendedMandi')}
                </h2>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                mandiOpen
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {mandiOpen ? `🟢 ${t('common.open')}` : `🔴 ${t('common.closed')}`}
              </span>
            </div>

            {loadingMandi ? (
              <div className="py-8 text-center text-xs text-slate-400 font-semibold flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                <span>{t('common.loading')}</span>
              </div>
            ) : recommendedMandi ? (
              <div className="space-y-3">
                <div className="min-w-0 flex-1">
                  <h3
                    className="font-heading font-black text-slate-900 text-base sm:text-lg break-words"
                    style={{ overflowWrap: 'anywhere' }}
                  >
                    {recommendedMandi.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 flex items-start gap-1 mt-0.5 min-w-0">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="break-words leading-relaxed" style={{ overflowWrap: 'anywhere' }}>
                      {recommendedMandi.location || `${recommendedMandi.district}, ${recommendedMandi.state}`}
                    </span>
                  </p>
                </div>

                {/* Mandi Metrics */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t('dashboard.liveQueue')}
                    </span>
                    <span className="font-extrabold text-slate-800 mt-0.5 block">
                      👨🌾 {t('dashboard.farmersAhead', { count: recommendedMandi.agriQueue?.queueLength || 5 })}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t('dashboard.estWaitLabel')}
                    </span>
                    <span className="font-extrabold text-emerald-700 mt-0.5 block">
                      ⏱️ ~{recommendedMandi.agriQueue?.estimatedWaitMinutes || 30} {t('common.minutesShort')}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                {t('mandi.errorLoading')}
              </div>
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100">
            <Button
              variant="outline"
              disabled={!recommendedMandi}
              className="w-full justify-center text-xs font-bold py-2.5 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
              onClick={() => {
                if (recommendedMandi) {
                  navigate(`/mandi-centers?selected=${recommendedMandi.id}`, {
                    state: { selectedMandiId: recommendedMandi.id }
                  });
                }
              }}
            >
              <span>{t('mandi.viewDetails')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      </div>

      {/* ================= 4. COMPACT WEATHER ALERT ================= */}
      <Card className="p-4 bg-gradient-to-r from-amber-50/60 via-amber-50/30 to-white border border-amber-200/90 rounded-2xl shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <span className="text-2xl shrink-0" role="img" aria-label="weather">🌦️</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-950">
                  {t('dashboard.weatherTitle')}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/60 text-amber-900">
                  {t('dashboard.liveUpdates')}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                {weatherAlerts.currentTemp || '31°C'} • {getLocalizedWeatherCondition(weatherAlerts.condition, t)}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {t('dashboard.forecastSub')}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="self-start sm:self-center border-amber-300 bg-white/80 hover:bg-white text-slate-800 text-xs font-bold py-2 px-3.5 shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            onClick={() => navigate('/weather-alerts')}
          >
            <span>{t('dashboard.viewWeather')}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Live Weather Metrics */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 px-1 pt-0.5">
          <span className="inline-flex items-center gap-1">
            <span>🌡️</span>
            <span>{t('dashboard.temperature')}: {weatherAlerts.currentTemp || '31°C'}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span>💧</span>
            <span>{t('dashboard.humidity')}: {weatherAlerts.humidity || '74%'}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span>🌧️</span>
            <span>{t('dashboard.rainChance')}: 20%</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span>💨</span>
            <span>{t('dashboard.wind')}: {weatherAlerts.windSpeed || '12 km/h'}</span>
          </span>
        </div>

        {/* Advisory / Farm Warning */}
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-100/70 border border-amber-200/80 text-amber-900 text-xs">
          <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <span className="leading-snug">
            <strong>{t('dashboard.farmWarning')}</strong> {getLocalizedWeatherAdvisory(weatherAlerts.alerts?.[0], t)}
          </span>
        </div>

        {/* 4-Day Forecast Miniature Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-amber-200/60 text-center">
          {weatherAlerts.forecast.map((fc, index) => (
            <div key={index} className="p-2 bg-white/70 rounded-xl border border-amber-200/50">
              <span className="text-[10px] font-bold text-slate-500 block">{getLocalizedDay(fc.day, t)}</span>
              <span className="text-xs font-black text-slate-800 block">{fc.temp}</span>
              <span className="text-[10px] font-medium text-slate-600 block">{getLocalizedWeatherCondition(fc.label, t)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ================= 5. SMALL QUICK ACTIONS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Booking History */}
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-all shadow-2xs flex items-center gap-3 cursor-pointer group"
        >
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg group-hover:scale-105 transition-transform">
            <History className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-heading font-bold text-sm text-slate-800 block truncate group-hover:text-primary-700">
              📜 {t('dashboard.bookingHistory')}
            </span>
            <span className="text-[11px] text-slate-400 font-medium block truncate">
              {t('dashboard.pastSlotsTokens')}
            </span>
          </div>
        </button>

        {/* Government Schemes */}
        <button
          onClick={() => navigate('/schemes')}
          className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-all shadow-2xs flex items-center gap-3 cursor-pointer group"
        >
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg group-hover:scale-105 transition-transform">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-heading font-bold text-sm text-slate-800 block truncate group-hover:text-primary-700">
              📋 {t('common.schemes')}
            </span>
            <span className="text-[11px] text-slate-400 font-medium block truncate">
              {t('dashboard.schemesSub')}
            </span>
          </div>
        </button>

        {/* Book Transport */}
        <button
          onClick={() => navigate('/book-transport')}
          className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-all shadow-2xs flex items-center gap-3 cursor-pointer group"
        >
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg group-hover:scale-105 transition-transform">
            <Truck className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-heading font-bold text-sm text-slate-800 block truncate group-hover:text-primary-700">
              🚜 {t('common.bookTransport')}
            </span>
            <span className="text-[11px] text-slate-400 font-medium block truncate">
              {t('dashboard.transportSub')}
            </span>
          </div>
        </button>

        {/* Help & Support */}
        <button
          onClick={() => navigate('/help')}
          className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-all shadow-2xs flex items-center gap-3 cursor-pointer group"
        >
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg group-hover:scale-105 transition-transform">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-heading font-bold text-sm text-slate-800 block truncate group-hover:text-primary-700">
              🆘 {t('common.help')}
            </span>
            <span className="text-[11px] text-slate-400 font-medium block truncate">
              {t('dashboard.helpSub')}
            </span>
          </div>
        </button>
      </div>

      {/* ================= DIGITAL TOKEN PASS MODAL ================= */}
      {isTokenPassOpen && activeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-0 relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-xl" role="img" aria-label="ticket">🎟️</span>
                <h3 className="font-heading font-bold text-base text-slate-800">
                  {t('dashboard.digitalTokenPass')}
                </h3>
              </div>
              <button
                onClick={() => setIsTokenPassOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl cursor-pointer"
                aria-label={t('common.close')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body: Pass Card */}
            <div className="p-6 space-y-4">
              <div className="bg-slate-900 text-white rounded-2xl p-5 relative overflow-hidden shadow-md">
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      {t('dashboard.agriQueueTokenNum')}
                    </span>
                    <span className="font-heading font-black text-3xl sm:text-4xl text-emerald-400 tracking-wider mt-0.5 block">
                      {activeBooking.tokenNumber}
                    </span>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold">
                    ● {t('dashboard.slotConfirmed')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3.5 py-3.5 border-b border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">{t('dashboard.center')}</span>
                    <span className="font-bold text-white text-sm mt-0.5 block truncate">
                      🏪 {activeBooking.mandi?.name || t('dashboard.mandiCenterFallback')}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      📍 {activeBooking.mandi?.district}, {activeBooking.mandi?.state}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">{t('dashboard.schedule')}</span>
                    <span className="font-bold text-white text-sm mt-0.5 block">
                      📅 {activeBooking.slot?.displayDate}
                    </span>
                    <span className="text-[11px] text-emerald-300 font-semibold block">
                      🕐 {activeBooking.slot?.formattedTime || t('dashboard.defaultTimeSlot')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">{t('dashboard.crop')}</span>
                    <span className="font-bold text-white text-sm mt-0.5 block">🌾 {activeBooking.cropName || t('dashboard.defaultCrop')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">{t('dashboard.ahead')}</span>
                    <span className="font-bold text-white text-sm mt-0.5 block">
                      👥 {activeBooking.queue?.farmersAhead ?? 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">{t('dashboard.estWaitLabel')}</span>
                    <span className="font-bold text-emerald-400 text-sm mt-0.5 block">
                      ⏱️ {activeBooking.queue?.estimatedWait}
                    </span>
                  </div>
                </div>

                {/* Real Standards-Compliant Token & QR Code */}
                <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col items-center">
                  <BookingQRCode
                    bookingId={activeBooking.bookingId || activeBooking.id}
                    tokenNumber={activeBooking.tokenNumber}
                    size={280}
                    theme="dark"
                  />
                </div>
              </div>

              {/* Actions inside modal */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <Button
                  variant="primary"
                  className="w-full sm:flex-1 justify-center py-3 font-bold text-xs shadow-xs cursor-pointer"
                  onClick={() => {
                    setIsTokenPassOpen(false);
                    navigate('/book-transport');
                  }}
                >
                  <Truck className="h-4 w-4 mr-1.5" />
                  {t('dashboard.bookTransportForSlot')}
                </Button>
                <Button
                  variant="outline"
                  disabled={isCancelling}
                  className="w-full sm:w-auto justify-center py-3 font-bold text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 cursor-pointer"
                  onClick={handleCancelBooking}
                >
                  {isCancelling ? t('dashboard.cancelling') : t('dashboard.cancelBooking')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Booking History Modal */}
      <BookingHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onBookNew={() => navigate('/mandi-centers')}
      />

      {/* Floating Farmer 📞 Voice Agent */}
      <FarmerVoiceAgent onOpenTokenPass={() => setIsTokenPassOpen(true)} />
    </div>
  );
};

export default Dashboard;
