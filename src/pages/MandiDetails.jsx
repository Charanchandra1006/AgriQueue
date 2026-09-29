import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Navigation,
  Calendar,
  TrendingUp,
  Package,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { getMandiById } from '../services/api';
import { SlotBookingModal } from '../components/mandi/SlotBookingModal';

/**
 * Standard benchmark procurement rates (MSP) for common Indian crops
 */
const BENCHMARK_MSP_RATES = {
  'Wheat': { variety: 'FAQ (Fair Average Quality)', price: '₹2,275 / qtl' },
  'Paddy': { variety: 'Grade A', price: '₹2,203 / qtl' },
  'Paddy (Basmati)': { variety: 'Traditional / Pusa 1121', price: '₹3,450 / qtl' },
  'Cotton': { variety: 'Medium / Long Staple', price: '₹7,020 / qtl' },
  'Mustard': { variety: 'Black / Yellow Seed', price: '₹5,650 / qtl' },
  'Soyabean': { variety: 'Yellow Seed', price: '₹4,600 / qtl' },
  'Gram': { variety: 'Desi / Chana', price: '₹5,440 / qtl' },
  'Maize': { variety: 'Hybrid Yellow', price: '₹2,090 / qtl' },
  'Bajra': { variety: 'Hybrid Pearl Millet', price: '₹2,500 / qtl' },
  'Sugarcane': { variety: 'General Mill Delivery', price: '₹315 / qtl' },
  'Potato': { variety: 'Jyoti / Pukhraj', price: '₹1,250 / qtl' },
  'Onion': { variety: 'Nashik / Local Red', price: '₹1,850 / qtl' },
  'Chilli': { variety: 'Guntur / Teja Dry Red', price: '₹14,500 / qtl' },
  'Turmeric': { variety: 'Finger Unpolished', price: '₹7,800 / qtl' }
};

export const MandiDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useApp();
  const [userLocation, setUserLocation] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const [mandi, setMandi] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real mandi record by ID from GET /api/mandis/:id
  useEffect(() => {
    let isMounted = true;
    const fetchMandi = async () => {
      try {
        const res = await getMandiById(id);
        if (isMounted) {
          if (res.success && res.data) {
            setMandi(res.data);
            setError(null);
          } else {
            setError(res.message || t('mandi.mandiNotFound'));
          }
        }
      } catch {
        if (isMounted) {
          setError(t('mandi.mandiNotFoundSub'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchMandi();
    return () => { isMounted = false; };
  }, [id, t]);

  // Request user coordinates for distance calculation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        () => {
          // Keep default if location unavailable
        }
      );
    }
  }, []);

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const cleanStr = timeStr.trim();
    const match = cleanStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const checkMandiStatus = (m) => {
    if (!m) return { isOpen: false, message: t('mandi.closed') };
    const openingTime = m.external?.operatingHours?.openingTime || '08:00 AM';
    const closingTime = m.external?.operatingHours?.closingTime || '06:00 PM';
    const openMin = parseTimeToMinutes(openingTime);
    const closeMin = parseTimeToMinutes(closingTime);
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const isOpen = currentMinutes >= openMin && currentMinutes <= closeMin;
    return {
      isOpen,
      message: isOpen ? t('mandi.openNow') : t('mandi.closedOpensAt', { time: openingTime }),
      hours: `${openingTime} – ${closingTime}`
    };
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getMandiDistance = (m) => {
    if (!userLocation || m?.latitude === null || m?.longitude === null) return null;
    const lat = typeof m.latitude === 'number' ? m.latitude : parseFloat(m.latitude);
    const lon = typeof m.longitude === 'number' ? m.longitude : parseFloat(m.longitude);
    if (isNaN(lat) || isNaN(lon)) return null;

    const dist = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      lat,
      lon
    );
    if (dist < 1) {
      return t('mandi.metersAway', { dist: Math.round(dist * 1000) });
    }
    return t('mandi.kmAway', { dist: dist.toFixed(1) });
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <button
          onClick={() => navigate('/mandi-centers')}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-primary-700 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('mandi.backToCenters')}</span>
        </button>

        <Card className="p-12 text-center bg-white border-slate-200 shadow-xs rounded-2xl">
          <div className="flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            <p className="text-base font-extrabold text-slate-800">{t('mandi.loadingMandiDetails')}</p>
            <p className="text-xs text-slate-500">{t('mandi.loadingProcurementInfo')}</p>
          </div>
        </Card>
      </div>
    );
  }

  // Error State
  if (error || !mandi) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <button
          onClick={() => navigate('/mandi-centers')}
          className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('mandi.backToCenters')}</span>
        </button>

        <Card className="p-8 text-center bg-white rounded-2xl border-slate-200">
          <div className="max-w-md mx-auto space-y-4">
            <span className="text-4xl">🔍</span>
            <h2 className="text-xl font-heading font-bold text-slate-800">
              {error || t('mandi.mandiNotFound')}
            </h2>
            <p className="text-sm text-slate-500">
              {t('mandi.mandiNotFoundSub')}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={fetchMandi}
                className="text-xs font-bold flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>{t('common.retry')}</span>
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate('/mandi-centers')}
                className="text-xs font-bold"
              >
                {t('mandi.browseAllCenters')}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const status = checkMandiStatus(mandi);
  const distance = getMandiDistance(mandi);
  const lat = typeof mandi.latitude === 'number' ? mandi.latitude : parseFloat(mandi.latitude);
  const lng = typeof mandi.longitude === 'number' ? mandi.longitude : parseFloat(mandi.longitude);
  const hasCoords = !isNaN(lat) && !isNaN(lng) && mandi.latitude !== null && mandi.longitude !== null;
  const commodities = mandi.external?.commodities || ['Wheat', 'Paddy', 'Pulses'];

  // Resolve verified Google Maps navigation
  const getNavInfo = () => {
    if (hasCoords) {
      return {
        hasLocation: true,
        viewLocationUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      };
    }
    const loc = (mandi.location || '').trim();
    const districtStr = (mandi.district || '').trim();
    const stateStr = (mandi.state || '').trim();
    const isGenericFallback =
      !loc ||
      loc.toLowerCase() === `${districtStr.toLowerCase()}, ${stateStr.toLowerCase()}` ||
      loc.toLowerCase().endsWith(' village');

    if (!isGenericFallback && loc.length > 3) {
      const fullAddress = `${mandi.name}, ${loc}, ${districtStr}, ${stateStr}`;
      const encoded = encodeURIComponent(fullAddress);
      return {
        hasLocation: true,
        viewLocationUrl: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
        directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encoded}`
      };
    }

    if (
      mandi.center_type &&
      (mandi.center_type.includes('APMC') ||
        mandi.center_type.includes('Market Committee') ||
        mandi.center_type.includes('Principal Market Yard')) &&
      mandi.mandal
    ) {
      const fullAddress = `${mandi.name}, ${mandi.mandal}, ${districtStr}, ${stateStr}`;
      const encoded = encodeURIComponent(fullAddress);
      return {
        hasLocation: true,
        viewLocationUrl: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
        directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encoded}`
      };
    }

    return {
      hasLocation: false,
      message: t('mandi.exactLocationNotAvailable')
    };
  };

  const navInfo = getNavInfo();

  // Map commodities to MSP prices
  const priceList = commodities.map((comm) => {
    const info = BENCHMARK_MSP_RATES[comm] || { variety: 'Standard Grade', price: 'Govt. MSP Benchmark' };
    return {
      commodity: comm,
      variety: info.variety,
      price: info.price
    };
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/mandi-centers')}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-primary-700 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors w-fit cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 text-slate-500" />
          <span>{t('mandi.backToCenters')}</span>
        </button>

        <div className="flex items-center gap-2.5 flex-wrap">
          {hasCoords && (
            <button
              onClick={() => navigate(`/mandi-map?selected=${mandi.id}`)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              <span>{t('mandi.mapTitle')}</span>
            </button>
          )}

          {navInfo.hasLocation ? (
            <>
              <a
                href={navInfo.viewLocationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl transition-all shadow-2xs no-underline cursor-pointer"
                title={t('mandi.openInGoogleMapsTitle')}
              >
                <span>{t('mandi.viewLocationBtn')}</span>
              </a>
              <a
                href={navInfo.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-800 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-3 py-2 rounded-xl transition-all shadow-2xs no-underline cursor-pointer"
                title={t('mandi.getDirectionsTitle')}
              >
                <span>{t('mandi.directionsBtn')}</span>
              </a>
            </>
          ) : (
            <span className="text-xs font-semibold text-slate-400 bg-slate-50 border border-dashed border-slate-200 px-3 py-2 rounded-xl">
              {t('mandi.exactLocationNotAvailable')}
            </span>
          )}
        </div>
      </div>

      {/* Main Mandi Header Banner Card */}
      <Card className="p-6 md:p-8 bg-gradient-to-br from-white via-white to-emerald-50/30 border-slate-200 shadow-sm relative overflow-hidden rounded-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-3xl shrink-0" role="img" aria-label="mandi">🏪</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                status.isOpen
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {status.isOpen ? t('mandi.openNow') : t('mandi.closed')}
              </span>
              {mandi.center_type ? (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
                  {mandi.center_type}
                </span>
              ) : (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
                  {t('mandi.verifiedProcurementCenter')}
                </span>
              )}
              {distance && (
                <span className="text-xs font-bold text-primary-700 bg-primary-50 border border-primary-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Navigation className="h-3 w-3 rotate-45 text-primary-600" />
                  {distance}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1
                className="text-2xl md:text-3xl font-heading font-extrabold text-slate-800 tracking-tight break-words leading-tight"
                style={{ overflowWrap: 'anywhere' }}
              >
                {mandi.name}
              </h1>
              <p className="text-sm font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                <span>{mandi.location || `${mandi.district}, ${mandi.state}`}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 pt-1">
              <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                <Clock className="h-4 w-4 text-slate-500" />
                {t('mandi.operatingHoursColon', { hours: status.hours })}
              </span>
              <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                <RotateCcw className="h-3.5 w-3.5" />
                {t('mandi.sourceColon', { source: mandi.source || t('mandi.officialRecord') })}
              </span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 lg:min-w-[220px]">
            <Button
              variant="primary"
              size="lg"
              icon={Calendar}
              className="w-full justify-center text-sm py-3 font-bold shadow-md shadow-primary-600/20 cursor-pointer"
              onClick={() => setIsBookingModalOpen(true)}
            >
              {t('mandi.bookSlotNow')}
            </Button>
            {hasCoords && (
              <Button
                variant="outline"
                size="lg"
                icon={MapPin}
                className="w-full justify-center text-sm py-3 font-bold border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                onClick={() => navigate(`/mandi-map?selected=${mandi.id}`)}
              >
                {t('mandi.viewOnMap')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Grid of Key Info Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Mandi Booking System & Commodities */}
        <div className="lg:col-span-2 space-y-6">
          {/* AgriQueue Digital Slot Availability */}
          <Card className="p-6 border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-slate-800 text-base md:text-lg">
                    {t('mandi.digitalSlotBookingTitle')}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {t('mandi.digitalSlotBookingSubtitle')}
                  </p>
                </div>
              </div>
              <Badge variant="success">{t('mandi.onlineRegistrationOpen')}</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                <span className="block text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  {t('mandi.bookingStatus')}
                </span>
                <span className="text-xl font-heading font-black text-emerald-700 mt-1 block">
                  {t('mandi.slotsOpen')}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
                  {t('mandi.advanceBookingsAccepted')}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('mandi.queueProtocol')}
                </span>
                <span className="text-base font-heading font-bold text-slate-800 mt-1 block">
                  {t('mandi.digitalGatePass')}
                </span>
                <span className="text-[11px] text-slate-500 font-semibold mt-0.5 block">
                  {t('mandi.qrTokenAtGate')}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('mandi.liveQueue')}
                </span>
                <span className="text-base font-heading font-bold text-slate-800 mt-1 block">
                  {t('mandi.standardFlow')}
                </span>
                <span className="text-[11px] text-slate-500 font-semibold mt-0.5 block">
                  {t('mandi.gateRegistrationActive')}
                </span>
              </div>
            </div>

            {/* Quick booking CTA footer */}
            <div className="mt-5 p-4 bg-slate-50/70 border border-slate-100 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-600">
                  {t('mandi.bookAdvanceKisanId')}
                </span>
              </div>
              <Button
                size="sm"
                variant="primary"
                className="shrink-0 text-xs font-bold cursor-pointer"
                onClick={() => setIsBookingModalOpen(true)}
              >
                {t('mandi.bookThisMandi')}
              </Button>
            </div>
          </Card>

          {/* Commodities & Market Prices */}
          <Card className="p-6 border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-slate-800 text-base md:text-lg">
                    {t('mandi.benchmarkMspTitle')}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {t('mandi.benchmarkMspSubtitle', { state: mandi.state })}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {t('mandi.itemsListed', { count: priceList.length })}
              </span>
            </div>

            {/* Handled Commodities Badges */}
            <div className="mb-5">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                {t('mandi.handledCommodities')}
              </span>
              <div className="flex flex-wrap gap-2">
                {commodities.map((comm, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1 rounded-lg transition-colors"
                  >
                    🌾 {comm}
                  </span>
                ))}
              </div>
            </div>

            {/* Price Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-2xs">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">{t('common.commodity')}</th>
                    <th className="py-3 px-4">{t('common.variety')}</th>
                    <th className="py-3 px-4 text-right">{t('mandi.benchmarkPrice')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-semibold">
                  {priceList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-800 font-bold">
                        {item.commodity}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {item.variety}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-700 font-extrabold text-sm">
                        {item.price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Location, Access & Advisory */}
        <div className="space-y-6">
          {/* Market Status Card */}
          <Card className="p-5 border-slate-200 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                <Package className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-bold text-slate-800 text-sm md:text-base">
                {t('mandi.procurementOperations')}
              </h3>
            </div>
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-center">
              <span className="block text-2xl font-black text-blue-900 font-heading">
                {mandi.is_active ? t('mandi.activeMarketYard') : t('mandi.seasonalCenter')}
              </span>
              <span className="text-xs font-semibold text-blue-700 mt-1 block">
                {t('mandi.regulatedApmcEnam')}
              </span>
            </div>
          </Card>

          {/* Location & Navigation Card */}
          <Card className="p-5 border-slate-200 space-y-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-bold text-slate-800 text-sm md:text-base">
                {t('mandi.locationAndAccess')}
              </h3>
            </div>

            <div className="space-y-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-400">{t('common.state')}</span>
                <span className="font-bold text-slate-800">{mandi.state}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-400">{t('common.district')}</span>
                <span className="font-bold text-slate-800">{mandi.district}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-400">{t('common.location')}</span>
                <span className="font-bold text-slate-800 text-right">{mandi.location || `${mandi.district}, ${mandi.state}`}</span>
              </div>
              {mandi.mandal && (
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400">{t('common.mandal')}</span>
                  <span className="font-bold text-slate-800">{mandi.mandal}</span>
                </div>
              )}
              {mandi.village && (
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400">{t('common.village')}</span>
                  <span className="font-bold text-slate-800">{mandi.village}</span>
                </div>
              )}
              {mandi.center_type && (
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400">{t('mandi.centerType')}</span>
                  <span className="font-bold text-slate-800">{mandi.center_type}</span>
                </div>
              )}
              {distance && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">{t('common.distance')}</span>
                  <span className="font-extrabold text-emerald-700">🚗 {distance}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              {hasCoords && (
                <>
                  <Button
                    variant="primary"
                    icon={MapPin}
                    className="w-full justify-center text-xs py-2.5 font-bold cursor-pointer"
                    onClick={() => navigate(`/mandi-map?selected=${mandi.id}`)}
                  >
                    {t('mandi.viewMandiOnMap')}
                  </Button>
                  <Button
                    variant="outline"
                    icon={Navigation}
                    className="w-full justify-center text-xs py-2.5 font-bold border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                    onClick={() => {
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${mandi.latitude},${mandi.longitude}`, '_blank');
                    }}
                  >
                    {t('mandi.openInGoogleMaps')}
                  </Button>
                </>
              )}
            </div>
          </Card>

          {/* Operating Advisory Note */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{t('mandi.farmerAdvisoryTitle')}</span>
            </div>
            <p className="text-amber-900/90 leading-relaxed font-medium">
              {t('mandi.farmerAdvisoryText')}
            </p>
          </div>
        </div>
      </div>

      {/* Dedicated Mandi Slot Booking Modal */}
      <SlotBookingModal
        mandi={mandi}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
    </div>
  );
};
