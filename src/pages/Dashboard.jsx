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
  History,
  Building2,
  Wheat,
  Clock,
  CalendarDays,
  Users,
  Timer,
  TrendingUp,
  TrendingDown,
  Minus,
  CloudSun,
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  BookOpen,
  CheckCircle2
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
    { cropKey: 'dashboard.cropPaddy',  fallbackCrop: 'Paddy',  TrendIcon: TrendingUp,   price: '₹2,425',  trend: 'up'   },
    { cropKey: 'dashboard.cropMaize',  fallbackCrop: 'Maize',  TrendIcon: Minus,        price: '₹2,180',  trend: 'flat' },
    { cropKey: 'dashboard.cropWheat',  fallbackCrop: 'Wheat',  TrendIcon: TrendingUp,   price: '₹2,450',  trend: 'up'   },
    { cropKey: 'dashboard.cropChilli', fallbackCrop: 'Chilli', TrendIcon: TrendingDown, price: '₹14,500', trend: 'down' },
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
    <div className="space-y-5 pb-10 page-enter max-w-6xl mx-auto">
      {/* ================= 1. WELCOME / FARMER HEADER ================= */}
      <div style={{ background: '#fffef8', border: '1.5px solid #e6dfc5', borderRadius: '16px', padding: '1.1rem 1.25rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', boxShadow: '0 2px 12px rgba(40,54,24,0.06)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem', color: '#283618', margin: 0, letterSpacing: '-0.02em' }}>
            {t('dashboard.namaste', { name: profile?.name || t('dashboard.defaultFarmer') })}
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#8a7d60', fontWeight: 500, marginTop: '2px' }}>
            {t('dashboard.heroSubtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {profile?.district && profile?.state && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700, color: '#606C38', background: 'rgba(96,108,56,0.08)', padding: '4px 12px', borderRadius: '999px', border: '1px solid rgba(96,108,56,0.18)', fontSize: '0.72rem' }}>
              <MapPin style={{ width: '12px', height: '12px' }} />
              {profile.district}, {profile.state}
            </span>
          )}
          {profile?.farmerId && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700, color: '#BC6C25', background: 'rgba(188,108,37,0.08)', padding: '4px 12px', borderRadius: '999px', border: '1px solid rgba(188,108,37,0.2)', fontSize: '0.72rem' }}>
              {t('dashboard.kisanIdLabel')}: {profile.farmerId}
            </span>
          )}
        </div>
      </div>

      {/* ================= 2. TOP PRIORITY — MY PROCUREMENT TOKEN ================= */}
      <div>
        {isLoadingBooking ? (
          <Card style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="flex flex-col items-center justify-center space-y-2">
              <Loader2 style={{ width: '24px', height: '24px', color: '#606C38', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#283618' }}>{t('dashboard.checkingBooking')}</p>
            </div>
          </Card>
        ) : activeBooking ? (
          /* ACTIVE BOOKING CARD */
          <Card style={{ padding: '1.25rem', border: '2px solid #606C38', background: 'linear-gradient(135deg, rgba(96,108,56,0.04) 0%, #fffef8 100%)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.875rem', borderBottom: '1.5px solid #e6dfc5', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ticket style={{ width: '18px', height: '18px', color: '#606C38' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#283618' }}>
                  {t('dashboard.myProcurementToken')}
                </span>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '999px', background: '#606C38', color: 'white', fontSize: '0.68rem', fontWeight: 700 }}>
                <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                {t('dashboard.slotConfirmed')}
              </span>
            </div>

            {/* Token number + buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#a09472', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>
                  {t('dashboard.tokenNumber')}
                </span>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '2.25rem', color: '#606C38', letterSpacing: '0.06em', display: 'block', lineHeight: 1.1 }}>
                  {activeBooking.tokenNumber || t('dashboard.tokenAvailable')}
                </span>
                <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#8a7d60', marginTop: '2px' }}>{t('dashboard.tokenRegistered')}</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <Button variant="primary" onClick={() => setIsTokenPassOpen(true)} style={{ fontSize: '0.78rem', padding: '8px 14px', minHeight: '36px' }}>
                  <Ticket style={{ width: '14px', height: '14px', marginRight: '6px' }} />
                  {t('dashboard.viewTokenPass')}
                </Button>
                <Button variant="outline" onClick={() => setIsHistoryOpen(true)} style={{ fontSize: '0.78rem', padding: '8px 14px', minHeight: '36px' }}>
                  <History style={{ width: '14px', height: '14px', marginRight: '6px' }} />
                  {t('dashboard.bookingHistory')}
                </Button>
                <Button variant="outline" onClick={() => navigate('/book-transport')} style={{ fontSize: '0.78rem', padding: '8px 14px', minHeight: '36px' }}>
                  <Truck style={{ width: '14px', height: '14px', marginRight: '6px' }} />
                  {t('dashboard.bookTransport')}
                </Button>
              </div>
            </div>

            {/* Booking Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.625rem' }}>
              <div style={{ padding: '0.625rem 0.75rem', background: '#fffef8', borderRadius: '10px', border: '1px solid #e6dfc5' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#a09472', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building2 style={{ width: '10px', height: '10px' }} /> {t('dashboard.procurementCenter')}
                </span>
                <span style={{ fontWeight: 700, color: '#283618', fontSize: '0.82rem', display: 'block', marginTop: '3px' }}>
                  {activeBooking.mandi?.name || t('dashboard.mandiCenterFallback')}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#8a7d60', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <MapPin style={{ width: '10px', height: '10px' }} />
                  {activeBooking.mandi?.location || `${activeBooking.mandi?.district}, ${activeBooking.mandi?.state}`}
                </span>
              </div>

              <div style={{ padding: '0.625rem 0.75rem', background: '#fffef8', borderRadius: '10px', border: '1px solid #e6dfc5' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#a09472', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Wheat style={{ width: '10px', height: '10px' }} /> {t('dashboard.cropAndQuantity')}
                </span>
                <span style={{ fontWeight: 700, color: '#283618', fontSize: '0.82rem', display: 'block', marginTop: '3px' }}>
                  {activeBooking.cropName || t('dashboard.defaultCrop')}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#8a7d60' }}>
                  {t('dashboard.weight')} {activeBooking.estimatedQuantity || 40} {t('common.quintals')}
                </span>
              </div>

              <div style={{ padding: '0.625rem 0.75rem', background: '#fffef8', borderRadius: '10px', border: '1px solid #e6dfc5' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#a09472', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CalendarDays style={{ width: '10px', height: '10px' }} /> {t('dashboard.schedule')}
                </span>
                <span style={{ fontWeight: 700, color: '#283618', fontSize: '0.82rem', display: 'block', marginTop: '3px' }}>
                  {activeBooking.slot?.formattedTime || t('dashboard.defaultTimeSlot')}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#606C38', fontWeight: 600 }}>
                  {activeBooking.slot?.displayDate || t('dashboard.today')}
                </span>
              </div>

              <div style={{ padding: '0.625rem 0.75rem', background: 'rgba(96,108,56,0.06)', borderRadius: '10px', border: '1px solid rgba(96,108,56,0.2)' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#606C38', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users style={{ width: '10px', height: '10px' }} /> {t('dashboard.queuePosition')}
                </span>
                <span style={{ fontWeight: 700, color: '#283618', fontSize: '0.82rem', display: 'block', marginTop: '3px' }}>
                  {t('dashboard.farmersAhead', { count: activeBooking.queue?.farmersAhead ?? 0 })}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#606C38', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Timer style={{ width: '10px', height: '10px' }} />
                  {activeBooking.queue?.estimatedWait || t('dashboard.estWait', { time: '0 min' })}
                </span>
              </div>
            </div>
          </Card>
        ) : (
          /* NO ACTIVE BOOKING CARD */
          <Card style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                <div style={{ padding: '10px', background: 'rgba(96,108,56,0.08)', borderRadius: '12px', flexShrink: 0 }}>
                  <Ticket style={{ width: '22px', height: '22px', color: '#606C38' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8a7d60' }}>
                      {t('dashboard.myProcurementToken')}
                    </span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, background: '#f0ead4', color: '#8a7d60', padding: '2px 8px', borderRadius: '999px' }}>
                      {t('dashboard.noActiveStatus')}
                    </span>
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', color: '#283618', margin: 0 }}>
                    {t('dashboard.noActiveToken')}
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: '#8a7d60', fontWeight: 500, marginTop: '2px' }}>
                    {t('dashboard.noActiveTokenSub')}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <Button variant="outline" onClick={() => setIsHistoryOpen(true)} style={{ fontSize: '0.82rem', minHeight: '42px' }}>
                  <History style={{ width: '15px', height: '15px', marginRight: '6px' }} />
                  {t('dashboard.bookingHistory')}
                </Button>
                <Button variant="primary" onClick={() => navigate('/mandi-centers')} style={{ fontSize: '0.82rem', minHeight: '42px' }}>
                  <Building2 style={{ width: '15px', height: '15px', marginRight: '6px' }} />
                  {t('dashboard.findMandi')}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* ================= 3. TWO-COLUMN CORE: MARKET PRICES & RECOMMENDED MANDI ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Market Prices */}
        <Card style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1.5px solid #e6dfc5', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp style={{ width: '17px', height: '17px', color: '#BC6C25' }} />
                <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: '#283618', margin: 0 }}>
                  {t('dashboard.todayMarketPrices')}
                </h2>
              </div>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a09472' }}>
                {t('dashboard.perQuintal')}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {todayMarketPrices.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: idx < todayMarketPrices.length - 1 ? '1px solid #f0e8d0' : 'none' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#283618' }}>{t(item.cropKey) || item.fallbackCrop}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.95rem', color: '#1c1f16' }}>{item.price}</span>
                    <item.TrendIcon style={{ width: '14px', height: '14px', color: item.trend === 'up' ? '#606C38' : item.trend === 'down' ? '#c0392b' : '#a09472', flexShrink: 0 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ paddingTop: '0.875rem', marginTop: '0.75rem', borderTop: '1.5px solid #e6dfc5' }}>
            <Button variant="outline" onClick={() => navigate('/market-prices')} style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', minHeight: '38px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {t('dashboard.viewAllPrices')}
              <ArrowRight style={{ width: '14px', height: '14px' }} />
            </Button>
          </div>
        </Card>

        {/* Right: Recommended Mandi */}
        <Card style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1.5px solid #e6dfc5', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 style={{ width: '17px', height: '17px', color: '#606C38' }} />
                <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: '#283618', margin: 0 }}>
                  {t('dashboard.recommendedMandi')}
                </h2>
              </div>
              <span style={{
                padding: '3px 10px', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700,
                background: mandiOpen ? 'rgba(96,108,56,0.1)' : 'rgba(192,57,43,0.08)',
                color: mandiOpen ? '#606C38' : '#c0392b',
                border: `1px solid ${mandiOpen ? 'rgba(96,108,56,0.22)' : 'rgba(192,57,43,0.2)'}`,
              }}>
                {mandiOpen ? t('common.open') : t('common.closed')}
              </span>
            </div>

            {loadingMandi ? (
              <div style={{ padding: '2rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#a09472', fontSize: '0.82rem' }}>
                <Loader2 style={{ width: '16px', height: '16px', color: '#606C38', animation: 'spin 1s linear infinite' }} />
                {t('common.loading')}
              </div>
            ) : recommendedMandi ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', color: '#283618', margin: 0, wordBreak: 'break-word' }}>
                    {recommendedMandi.name}
                  </h3>
                  <p style={{ fontSize: '0.78rem', fontWeight: 500, color: '#8a7d60', marginTop: '3px', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                    <MapPin style={{ width: '12px', height: '12px', flexShrink: 0, marginTop: '2px' }} />
                    {recommendedMandi.location || `${recommendedMandi.district}, ${recommendedMandi.state}`}
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ padding: '0.5rem 0.75rem', background: '#fffef8', borderRadius: '10px', border: '1px solid #e6dfc5' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#a09472', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users style={{ width: '10px', height: '10px' }} /> {t('dashboard.liveQueue')}
                    </span>
                    <span style={{ fontWeight: 700, color: '#283618', fontSize: '0.82rem', display: 'block', marginTop: '2px' }}>
                      {t('dashboard.farmersAhead', { count: recommendedMandi.agriQueue?.queueLength || 5 })}
                    </span>
                  </div>
                  <div style={{ padding: '0.5rem 0.75rem', background: '#fffef8', borderRadius: '10px', border: '1px solid #e6dfc5' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#a09472', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Timer style={{ width: '10px', height: '10px' }} /> {t('dashboard.estWaitLabel')}
                    </span>
                    <span style={{ fontWeight: 700, color: '#606C38', fontSize: '0.82rem', display: 'block', marginTop: '2px' }}>
                      ~{recommendedMandi.agriQueue?.estimatedWaitMinutes || 30} {t('common.minutesShort')}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#a09472', fontSize: '0.82rem' }}>
                {t('mandi.errorLoading')}
              </div>
            )}
          </div>

          <div style={{ paddingTop: '0.875rem', marginTop: '0.75rem', borderTop: '1.5px solid #e6dfc5' }}>
            <Button variant="outline" disabled={!recommendedMandi} onClick={() => { if (recommendedMandi) navigate(`/mandi-centers?selected=${recommendedMandi.id}`, { state: { selectedMandiId: recommendedMandi.id } }); }} style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', minHeight: '38px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {t('mandi.viewDetails')}
              <ArrowRight style={{ width: '14px', height: '14px' }} />
            </Button>
          </div>
        </Card>
      </div>

      {/* ================= 4. WEATHER CARD ================= */}
      <Card style={{ padding: '1.1rem', background: 'linear-gradient(135deg, rgba(188,108,37,0.05) 0%, #fffef8 100%)', border: '1.5px solid rgba(188,108,37,0.2)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '8px', background: 'rgba(188,108,37,0.1)', borderRadius: '10px', flexShrink: 0 }}>
              <CloudSun style={{ width: '20px', height: '20px', color: '#BC6C25' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7c5020' }}>
                  {t('dashboard.weatherTitle')}
                </span>
                <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '0.6rem', fontWeight: 700, background: 'rgba(188,108,37,0.12)', color: '#BC6C25', border: '1px solid rgba(188,108,37,0.2)' }}>
                  {t('dashboard.liveUpdates')}
                </span>
              </div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#283618', margin: '2px 0 0' }}>
                {weatherAlerts.currentTemp || '31°C'} · {getLocalizedWeatherCondition(weatherAlerts.condition, t)}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/weather-alerts')} style={{ fontSize: '0.75rem', minHeight: '36px', display: 'flex', alignItems: 'center', gap: '5px', border: '1.5px solid rgba(188,108,37,0.3)', color: '#7c5020', flexShrink: 0 }}>
            {t('dashboard.viewWeather')}
            <ArrowRight style={{ width: '13px', height: '13px' }} />
          </Button>
        </div>

        {/* Weather metrics row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '0.875rem', fontSize: '0.78rem', fontWeight: 600, color: '#5c6245' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Thermometer style={{ width: '13px', height: '13px', color: '#BC6C25' }} />
            {t('dashboard.temperature')}: {weatherAlerts.currentTemp || '31°C'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Droplets style={{ width: '13px', height: '13px', color: '#4a90a4' }} />
            {t('dashboard.humidity')}: {weatherAlerts.humidity || '74%'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CloudRain style={{ width: '13px', height: '13px', color: '#6a8ec9' }} />
            {t('dashboard.rainChance')}: 20%
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Wind style={{ width: '13px', height: '13px', color: '#8a9e78' }} />
            {t('dashboard.wind')}: {weatherAlerts.windSpeed || '12 km/h'}
          </span>
        </div>

        {/* Advisory */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '0.625rem 0.875rem', background: 'rgba(188,108,37,0.08)', border: '1px solid rgba(188,108,37,0.18)', borderRadius: '10px', fontSize: '0.78rem', color: '#7c5020', marginBottom: '0.875rem' }}>
          <AlertTriangle style={{ width: '14px', height: '14px', color: '#BC6C25', flexShrink: 0, marginTop: '1px' }} />
          <span><strong>{t('dashboard.farmWarning')}</strong> {getLocalizedWeatherAdvisory(weatherAlerts.alerts?.[0], t)}</span>
        </div>

        {/* 4-Day Forecast */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', borderTop: '1px solid rgba(188,108,37,0.15)', paddingTop: '0.75rem' }}>
          {weatherAlerts.forecast.map((fc, index) => (
            <div key={index} style={{ padding: '0.5rem', background: 'rgba(255,254,248,0.7)', borderRadius: '10px', border: '1px solid rgba(188,108,37,0.12)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#8a7d60', display: 'block' }}>{getLocalizedDay(fc.day, t)}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#283618', display: 'block' }}>{fc.temp}</span>
              <span style={{ fontSize: '0.62rem', color: '#a09472', display: 'block' }}>{getLocalizedWeatherCondition(fc.label, t)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ================= 5. QUICK ACTIONS ================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
        {[
          { label: t('dashboard.bookingHistory'), sub: t('dashboard.pastSlotsTokens'), Icon: History, onClick: () => setIsHistoryOpen(true), color: '#606C38', bg: 'rgba(96,108,56,0.08)' },
          { label: t('common.schemes'), sub: t('dashboard.schemesSub'), Icon: FileText, onClick: () => navigate('/schemes'), color: '#BC6C25', bg: 'rgba(188,108,37,0.08)' },
          { label: t('common.bookTransport'), sub: t('dashboard.transportSub'), Icon: Truck, onClick: () => navigate('/book-transport'), color: '#4a6fa5', bg: 'rgba(74,111,165,0.08)' },
          { label: t('common.help'), sub: t('dashboard.helpSub'), Icon: HelpCircle, onClick: () => navigate('/help'), color: '#7c5020', bg: 'rgba(124,80,32,0.08)' },
        ].map(({ label, sub, Icon, onClick, color, bg }) => (
          <button
            key={label}
            onClick={onClick}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.875rem',
              padding: '0.875rem 1rem',
              background: '#fffef8',
              border: '1.5px solid #e6dfc5',
              borderRadius: '12px',
              cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 6px rgba(40,54,24,0.05)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 4px 14px rgba(40,54,24,0.09)`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e6dfc5'; e.currentTarget.style.boxShadow = '0 1px 6px rgba(40,54,24,0.05)'; }}
          >
            <div style={{ padding: '8px', background: bg, borderRadius: '10px', flexShrink: 0, transition: 'transform 0.15s' }}>
              <Icon style={{ width: '18px', height: '18px', color }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: '#283618', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
              <span style={{ fontSize: '0.72rem', color: '#a09472', fontWeight: 500, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</span>
            </div>
          </button>
        ))}
      </div>

      {/* ================= DIGITAL TOKEN PASS MODAL ================= */}
      {isTokenPassOpen && activeBooking && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(28,31,22,0.65)', backdropFilter: 'blur(4px)' }}>
          <div
            style={{ width: '100%', maxWidth: '480px', background: '#fffef8', borderRadius: '20px', boxShadow: '0 24px 80px rgba(28,31,22,0.25)', border: '1.5px solid #e0d8be', overflow: 'hidden', animation: 'fadeUp 0.25s ease forwards' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', borderBottom: '1.5px solid #e6dfc5', background: 'rgba(254,250,224,0.6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ticket style={{ width: '18px', height: '18px', color: '#606C38' }} />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: '#283618', margin: 0 }}>
                  {t('dashboard.digitalTokenPass')}
                </h3>
              </div>
              <button onClick={() => setIsTokenPassOpen(false)} style={{ padding: '6px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#a09472' }}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {/* Pass Card — dark bg */}
            <div style={{ padding: '1.25rem' }}>
              <div style={{ background: '#283618', borderRadius: '14px', padding: '1.25rem', color: 'white', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: '0.875rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(254,250,224,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>
                      {t('dashboard.agriQueueTokenNum')}
                    </span>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '2.5rem', color: '#DDA15E', letterSpacing: '0.06em', display: 'block', lineHeight: 1.1, marginTop: '2px' }}>
                      {activeBooking.tokenNumber}
                    </span>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '999px', background: 'rgba(96,108,56,0.3)', color: '#a8d88a', border: '1px solid rgba(96,108,56,0.4)', fontSize: '0.68rem', fontWeight: 700 }}>
                    <CheckCircle2 style={{ width: '11px', height: '11px' }} />
                    {t('dashboard.slotConfirmed')}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', padding: '0.875rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div>
                    <span style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(254,250,224,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Building2 style={{ width: '9px', height: '9px' }} /> {t('dashboard.center')}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'white', display: 'block', marginTop: '3px' }}>
                      {activeBooking.mandi?.name || t('dashboard.mandiCenterFallback')}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(254,250,224,0.5)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin style={{ width: '10px', height: '10px' }} />
                      {activeBooking.mandi?.district}, {activeBooking.mandi?.state}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(254,250,224,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CalendarDays style={{ width: '9px', height: '9px' }} /> {t('dashboard.schedule')}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'white', display: 'block', marginTop: '3px' }}>
                      {activeBooking.slot?.displayDate}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#DDA15E', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock style={{ width: '10px', height: '10px' }} />
                      {activeBooking.slot?.formattedTime || t('dashboard.defaultTimeSlot')}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.625rem', paddingTop: '0.875rem' }}>
                  <div>
                    <span style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(254,250,224,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block' }}>{t('dashboard.crop')}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'white', display: 'block', marginTop: '2px' }}>{activeBooking.cropName || t('dashboard.defaultCrop')}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(254,250,224,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block' }}>{t('dashboard.ahead')}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'white', display: 'block', marginTop: '2px' }}>{activeBooking.queue?.farmersAhead ?? 0}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(254,250,224,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block' }}>{t('dashboard.estWaitLabel')}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#DDA15E', display: 'block', marginTop: '2px' }}>{activeBooking.queue?.estimatedWait}</span>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <BookingQRCode
                    bookingId={activeBooking.bookingId || activeBooking.id}
                    tokenNumber={activeBooking.tokenNumber}
                    size={260}
                    theme="dark"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="primary" onClick={() => { setIsTokenPassOpen(false); navigate('/book-transport'); }} style={{ flex: 1, justifyContent: 'center', minHeight: '44px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Truck style={{ width: '15px', height: '15px' }} />
                  {t('dashboard.bookTransportForSlot')}
                </Button>
                <Button variant="outline" disabled={isCancelling} onClick={handleCancelBooking} style={{ justifyContent: 'center', minHeight: '44px', fontSize: '0.82rem', color: '#c0392b', borderColor: 'rgba(192,57,43,0.3)' }}>
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

      {/* Floating Voice Agent */}
      <FarmerVoiceAgent onOpenTokenPass={() => setIsTokenPassOpen(true)} />
    </div>
  );
};

export default Dashboard;
