import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';
import { getMarketPrices, getMarketPriceTrends, syncMarketPrices } from '../services/api';
import { PriceTrendChart } from '../components/market/PriceTrendChart';
import {
  Search,
  RefreshCw,
  X,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Info,
  AlertCircle
} from 'lucide-react';

/**
 * Returns a contextual agricultural crop emoji
 */
const getCropEmoji = (cropName) => {
  const name = String(cropName || '').toLowerCase();
  if (name.includes('wheat')) return '🌾';
  if (name.includes('paddy') || name.includes('rice')) return '🌾';
  if (name.includes('cotton')) return '⚪';
  if (name.includes('mustard')) return '🌼';
  if (name.includes('barley')) return '🌾';
  if (name.includes('gram') || name.includes('chana')) return '🧆';
  if (name.includes('maize') || name.includes('makka') || name.includes('corn')) return '🌽';
  if (name.includes('soybean') || name.includes('soya')) return '🌱';
  if (name.includes('potato')) return '🥔';
  if (name.includes('onion')) return '🧅';
  if (name.includes('tomato')) return '🍅';
  if (name.includes('carrot')) return '🥕';
  if (name.includes('brinjal')) return '🍆';
  if (name.includes('apple')) return '🍎';
  if (name.includes('pineapple')) return '🍍';
  if (name.includes('guava')) return '🍈';
  if (name.includes('pomegranate')) return '🍎';
  if (name.includes('watermelon') || name.includes('water melon')) return '🍉';
  if (name.includes('lemon')) return '🍋';
  if (name.includes('chilli')) return '🌶️';
  if (name.includes('turmeric')) return '🧂';
  return '🌾';
};

/**
 * Formats a date string (YYYY-MM-DD) into readable Indian date (e.g. 15 Sep 2026)
 */
const formatReportedDate = (dateStr, fallback = 'Recently') => {
  if (!dateStr) return fallback;
  try {
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch {
    // Fallback
  }
  return dateStr;
};

export const MarketPrices = () => {
  const navigate = useNavigate();
  const { profile, t } = useApp();

  const farmerState = profile?.state || '';
  const farmerDistrict = profile?.district || '';

  // Filter States
  const [isFarmerDistrictMode, setIsFarmerDistrictMode] = useState(() => Boolean(farmerDistrict));
  const [selectedState, setSelectedState] = useState(() => farmerState);
  const [selectedDistrict, setSelectedDistrict] = useState(() => farmerDistrict);
  const [selectedMandi, setSelectedMandi] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRowId, setExpandedRowId] = useState(null);

  // Data states (Real government data only)
  const [prices, setPrices] = useState([]);
  const [allFetchedPrices, setAllFetchedPrices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [sourceInfo, setSourceInfo] = useState({
    source: 'Government of India / AGMARKNET / data.gov.in',
    date: null
  });

  // Trend Modal State
  const [trendModalItem, setTrendModalItem] = useState(null);
  const [trendPeriod, setTrendPeriod] = useState('7d');
  const [trendData, setTrendData] = useState(null);
  const [isLoadingTrend, setIsLoadingTrend] = useState(false);

  /**
   * Fetches official government mandi prices from the AgriQueue MySQL backend
   */
  const fetchPrices = useCallback(async (stateFilter, districtFilter, showRefreshSpin = false) => {
    if (showRefreshSpin) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch targeted records based on current scope (up to 500 records)
      const res = await getMarketPrices({
        state: stateFilter || undefined,
        district: districtFilter || undefined,
        limit: 500
      });

      if (res.success && Array.isArray(res.data)) {
        setPrices(res.data);
        if (res.data.length > 0 && res.data[0].arrival_date) {
          setSourceInfo({
            source: res.source || 'Government of India / AGMARKNET / data.gov.in',
            date: res.data[0].arrival_date
          });
        }
      } else {
        setPrices([]);
        if (res.error) setError(res.message || t('market.unableToLoadRecords', 'Unable to load government price records.'));
      }

      // 2. Also fetch full dataset in background to populate state/district dropdown options (up to 1000)
      if (!allFetchedPrices.length) {
        const fullRes = await getMarketPrices({ limit: 1000 });
        if (fullRes.success && Array.isArray(fullRes.data)) {
          setAllFetchedPrices(fullRes.data);
        }
      }
    } catch (err) {
      setError(err.message || t('market.networkError', 'Network error while retrieving market prices.'));
      setPrices([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [allFetchedPrices.length, t]);

  /**
   * Triggers official data sync from data.gov.in via backend API and reloads prices
   */
  const handleSyncRates = async () => {
    setIsRefreshing(true);
    try {
      await syncMarketPrices({
        state: selectedState || farmerState || undefined,
        district: selectedDistrict || farmerDistrict || undefined,
        limit: 500
      });
    } catch (err) {
      console.warn('Sync notice:', err.message);
    } finally {
      await fetchPrices(selectedState, selectedDistrict, true);
      setIsRefreshing(false);
    }
  };


  // Initial load: Farmer district first
  useEffect(() => {
    if (isFarmerDistrictMode && farmerDistrict) {
      fetchPrices(farmerState, farmerDistrict);
    } else {
      fetchPrices(selectedState, selectedDistrict);
    }
  }, [isFarmerDistrictMode, farmerState, farmerDistrict, selectedState, selectedDistrict, fetchPrices]);

  // Switch to Farmer's District
  const handleUseFarmerDistrict = () => {
    if (!farmerDistrict) return;
    setIsFarmerDistrictMode(true);
    setSelectedState(farmerState);
    setSelectedDistrict(farmerDistrict);
    setSelectedMandi('');
    setSelectedCommodity('');
    setSearchQuery('');
  };

  // Show all mandis / wider search
  const handleShowAllMandis = () => {
    setIsFarmerDistrictMode(false);
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedMandi('');
  };

  // Distinct options derived from all government records in DB
  const availableStates = useMemo(() => {
    const list = Array.from(new Set(allFetchedPrices.map(p => p.state).filter(Boolean)));
    return list.sort();
  }, [allFetchedPrices]);

  const availableDistricts = useMemo(() => {
    const subset = selectedState
      ? allFetchedPrices.filter(p => p.state === selectedState)
      : allFetchedPrices;
    return Array.from(new Set(subset.map(p => p.district).filter(Boolean))).sort();
  }, [allFetchedPrices, selectedState]);

  const availableMandis = useMemo(() => {
    return Array.from(new Set(prices.map(p => p.market_name).filter(Boolean))).sort();
  }, [prices]);

  const availableCommodities = useMemo(() => {
    return Array.from(new Set(prices.map(p => p.commodity).filter(Boolean))).sort();
  }, [prices]);

  // Client-side filtering across the returned government records
  const filteredPrices = useMemo(() => {
    return prices.filter(item => {
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matchCrop = String(item.commodity || '').toLowerCase().includes(q);
        const matchMandi = String(item.market_name || '').toLowerCase().includes(q);
        const matchDist = String(item.district || '').toLowerCase().includes(q);
        if (!matchCrop && !matchMandi && !matchDist) return false;
      }

      if (selectedMandi && item.market_name !== selectedMandi) return false;
      if (selectedCommodity && item.commodity !== selectedCommodity) return false;

      return true;
    });
  }, [prices, searchQuery, selectedMandi, selectedCommodity]);

  // Identify the record with the higher reported rate among visibly displayed items
  const higherPriceItem = useMemo(() => {
    if (!filteredPrices || filteredPrices.length === 0) return null;
    return [...filteredPrices].sort((a, b) => {
      const valA = parseFloat(a.max_price) || parseFloat(a.modal_price) || 0;
      const valB = parseFloat(b.max_price) || parseFloat(b.modal_price) || 0;
      return valB - valA;
    })[0];
  }, [filteredPrices]);

  const toggleDetails = (id) => {
    setExpandedRowId(prev => (prev === id ? null : id));
  };

  /**
   * Navigates to Mandi Centers with search query
   */
  const handleCheckMandi = (item) => {
    const mandiName = item.market_name || '';
    navigate(`/mandi-centers?search=${encodeURIComponent(mandiName)}`);
  };

  /**
   * Opens the trend modal for a specific crop and mandi
   */
  const handleOpenTrendModal = (item) => {
    setTrendModalItem(item);
    setTrendPeriod('today');
  };

  // Fetch trend data whenever modal item or period changes
  useEffect(() => {
    if (!trendModalItem) return;

    let isMounted = true;
    setIsLoadingTrend(true);

    getMarketPriceTrends({
      commodity: trendModalItem.commodity,
      state: trendModalItem.state,
      district: trendModalItem.district,
      market: trendModalItem.market_name,
      period: trendPeriod
    }).then(res => {
      if (isMounted) {
        setTrendData(res);
        setIsLoadingTrend(false);
      }
    }).catch(() => {
      if (isMounted) {
        setTrendData(null);
        setIsLoadingTrend(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [trendModalItem, trendPeriod]);

  const hasActiveFilters = Boolean(searchQuery || selectedMandi || selectedCommodity || selectedState || selectedDistrict);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedMandi('');
    setSelectedCommodity('');
    if (!isFarmerDistrictMode) {
      setSelectedState('');
      setSelectedDistrict('');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl md:text-3xl" role="img" aria-label="wheat">🌾</span>
            <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-slate-800 tracking-tight">
              {t('market.pageHeading', 'Market Prices')}
            </h1>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-full">
              {t('market.officialAgmarknet', 'Official AGMARKNET')}
            </span>
            {sourceInfo.date && (
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                📅 {formatReportedDate(sourceInfo.date, t('market.recently', 'Recently'))}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {t('market.pageSubtitle', 'Government of India daily mandi price arrivals (data.gov.in). Compare approximate local rates before selling.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={handleSyncRates}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 bg-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
            title={t('market.reloadRecordsTooltip', 'Reload latest records from database')}
          >
            <RefreshCw className={`h-3.5 w-3.5 text-primary-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? t('market.syncingRates', 'Syncing...') : t('market.syncRates', 'Sync Rates')}</span>
          </button>

          <Button
            variant="primary"
            className="text-xs font-bold shadow-xs cursor-pointer"
            onClick={() => navigate('/mandi-centers')}
          >
            {t('market.viewMandiCentersBtn', '🏪 View Mandi Centers')}
          </Button>
        </div>
      </div>

      {/* 2. FARMER DISTRICT FIRST BANNER */}
      {farmerDistrict && (
        <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
          isFarmerDistrictMode
            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-white border border-emerald-200/80 flex items-center justify-center text-sm shadow-2xs shrink-0">
              📍
            </span>
            <div>
              <div className="text-xs font-extrabold flex items-center gap-1.5">
                {isFarmerDistrictMode ? (
                  <span>{t('market.showingPricesForDistrict', 'Showing prices for your district:')} <span className="underline decoration-emerald-500 underline-offset-2">{farmerDistrict}, {farmerState}</span></span>
                ) : (
                  <span>{t('market.viewingBroaderSearch', 'Viewing broader mandi search')}</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {isFarmerDistrictMode
                  ? t('market.showingHomeAreaDefault')
                  : t('market.registeredHomeDistrict', { district: farmerDistrict, state: farmerState })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {isFarmerDistrictMode ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowAllMandis}
                className="text-xs font-bold bg-white cursor-pointer"
              >
                {t('market.viewAllOtherDistrictsBtn')}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleUseFarmerDistrict}
                className="text-xs font-bold cursor-pointer"
              >
                {t('market.returnToMyDistrictBtn', { district: farmerDistrict })}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 3. FARMER DECISION FLOW */}
      <Card className="p-4 bg-gradient-to-r from-emerald-50/70 via-white to-primary-50/50 border-emerald-100 shadow-2xs rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
          <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
            <span>🚜</span>
            <span>{t('market.howToSellTitle', 'How to Sell Your Crop on AgriQueue')}</span>
          </span>
          <span className="text-[11px] font-semibold text-slate-400">
            {t('market.follow6Steps', 'Follow these 6 steps')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs text-center">
            <span className="text-xl block">🌾</span>
            <span className="text-xs font-bold text-slate-800 mt-1 block">{t('market.step1ChooseCrop', 'Choose Crop')}</span>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs text-center">
            <span className="text-xl block">💰</span>
            <span className="text-xs font-bold text-slate-800 mt-1 block">{t('market.step2ComparePrice', 'Compare Price')}</span>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs text-center">
            <span className="text-xl block">🏪</span>
            <span className="text-xs font-bold text-slate-800 mt-1 block">{t('market.step3CheckMandi', 'Check Mandi')}</span>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs text-center">
            <span className="text-xl block">⏳</span>
            <span className="text-xs font-bold text-slate-800 mt-1 block">{t('market.step4CheckQueue', 'Check Queue')}</span>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs text-center">
            <span className="text-xl block">🎫</span>
            <span className="text-xs font-bold text-slate-800 mt-1 block">{t('market.step5BookSlot', 'Book Slot')}</span>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs text-center">
            <span className="text-xl block">🚜</span>
            <span className="text-xs font-bold text-slate-800 mt-1 block">{t('market.step6ArrangeTransport', 'Arrange Transport')}</span>
          </div>
        </div>
      </Card>

      {/* 4. HIGHER REPORTED PRICE BANNER (Non-misleading, visible records comparison) */}
      {higherPriceItem && (
        <Card className="p-4 md:p-5 bg-gradient-to-br from-amber-50/70 via-white to-emerald-50/50 border-amber-200/90 shadow-2xs rounded-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start md:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                ⭐
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                    {t('market.higherReportedPrice', 'Higher Reported Price')}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200/70">
                    {t('market.visibleMandisBadge', 'Visible Mandis')}
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline gap-2 mt-1">
                  <h3 className="font-heading font-black text-slate-900 text-lg md:text-xl">
                    {higherPriceItem.commodity}
                  </h3>
                  {higherPriceItem.variety && higherPriceItem.variety !== 'Other' && (
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {higherPriceItem.variety}
                    </span>
                  )}
                  <span className="text-xs font-bold text-slate-400">{t('market.at', 'at')}</span>
                  <span className="text-sm font-extrabold text-slate-800 flex items-center gap-1">
                    🏪 {higherPriceItem.market_name}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({higherPriceItem.district}, {higherPriceItem.state})
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {t('market.reportedOnIndicative', { date: formatReportedDate(higherPriceItem.arrival_date, t('market.recently')) })}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
              <div className="text-left md:text-right">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                  {t('market.approxMarketRange')}
                </span>
                <span className="font-heading font-black text-xl md:text-2xl text-slate-900 block leading-tight">
                  {higherPriceItem.min_price && higherPriceItem.max_price && higherPriceItem.min_price !== higherPriceItem.max_price
                    ? `₹${higherPriceItem.min_price.toLocaleString('en-IN')} – ₹${higherPriceItem.max_price.toLocaleString('en-IN')}`
                    : `₹${(higherPriceItem.modal_price || higherPriceItem.min_price).toLocaleString('en-IN')}`
                  }
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  {t('market.perQuintal100kg')}
                </span>
              </div>

              <button
                onClick={() => handleOpenTrendModal(higherPriceItem)}
                className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:text-primary-700 shadow-2xs transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold shrink-0"
                title={t('market.viewTrendTooltip')}
              >
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="hidden sm:inline">{t('market.trendBtn')}</span>
              </button>

              <Button
                variant="primary"
                className="text-xs font-bold shadow-xs py-2.5 px-3.5 flex items-center gap-1.5 cursor-pointer shrink-0"
                onClick={() => handleCheckMandi(higherPriceItem)}
              >
                <span>{t('market.checkMandiBtn')}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 5. SEARCH & FILTER CONTROLS */}
      <Card className="p-3.5 md:p-4 border-slate-200 shadow-2xs space-y-3 bg-white rounded-2xl">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('market.searchCropsPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              aria-label={t('market.clearSearchAria')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {/* State Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700">
            <span className="text-slate-400">{t('market.stateLabel')}</span>
            <select
              value={selectedState}
              onChange={(e) => {
                const newState = e.target.value;
                setSelectedState(newState);
                setSelectedDistrict('');
                setSelectedMandi('');
                setIsFarmerDistrictMode(false);
              }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="">{t('market.allStatesWithCount', { count: availableStates.length })}</option>
              {availableStates.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* District Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700">
            <span className="text-slate-400">{t('market.districtLabel')}</span>
            <select
              value={selectedDistrict}
              onChange={(e) => {
                const newDist = e.target.value;
                setSelectedDistrict(newDist);
                setSelectedMandi('');
                setIsFarmerDistrictMode(false);
              }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="">{t('market.allDistrictsWithCount', { count: availableDistricts.length })}</option>
              {availableDistricts.map(dist => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>

          {/* Mandi Filter */}
          {availableMandis.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700">
              <span className="text-slate-400">{t('market.mandiFilterLabel')}</span>
              <select
                value={selectedMandi}
                onChange={(e) => setSelectedMandi(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[160px] truncate"
              >
                <option value="">{t('market.allMandisWithCount', { count: availableMandis.length })}</option>
                {availableMandis.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {/* Commodity Filter */}
          {availableCommodities.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700">
              <span className="text-slate-400">{t('market.cropFilterLabel')}</span>
              <select
                value={selectedCommodity}
                onChange={(e) => setSelectedCommodity(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="">{t('market.allCropsWithCount', { count: availableCommodities.length })}</option>
                {availableCommodities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-colors ml-auto cursor-pointer flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" />
              {t('market.resetFilters')}
            </button>
          )}
        </div>
      </Card>

      {/* Result Status Indicator */}
      <div className="flex items-center justify-between px-1 text-xs">
        <span className="font-bold text-slate-500">
          {t('market.showingCountRecords', { count: filteredPrices.length })}
        </span>
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
          <Info className="h-3 w-3" />
          <span>{t('market.approxRangeNote')}</span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-xs">{t('market.unableToLoadUpdates', 'Unable to load price updates')}</p>
            <p className="text-xs text-amber-700">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPrices(selectedState, selectedDistrict)}
              className="mt-2 text-xs font-bold bg-white"
            >
              {t('market.retryBtn', 'Retry')}
            </Button>
          </div>
        </div>
      )}

      {/* 6. PRICE TABLE / LIST */}
      <Card className="p-0 overflow-hidden border-slate-200 shadow-2xs bg-white rounded-2xl">
        {/* Table Header (Desktop) */}
        <div className="hidden md:grid md:grid-cols-12 items-center bg-slate-50/90 border-b border-slate-200 py-3.5 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-4 font-extrabold text-slate-600">{t('market.cropAndVarietyHeader', 'Crop & Variety')}</div>
          <div className="col-span-3 font-extrabold text-slate-600">{t('market.mandiAndDistrictHeader', 'Mandi & District')}</div>
          <div className="col-span-3 font-extrabold text-slate-700">{t('market.approxMarketRangeHeader', 'Approx. Market Range')}</div>
          <div className="col-span-2 text-right font-extrabold text-slate-600">{t('market.actionsHeader', 'Actions')}</div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="h-6 w-6 text-primary-600 animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-700">{t('market.loadingMandiPrices', 'Loading official mandi prices...')}</p>
            <p className="text-xs text-slate-400">{t('market.fetchingGovtRecords', 'Fetching records from Government of India (data.gov.in / AGMARKNET)')}</p>
          </div>
        ) : filteredPrices.length === 0 ? (
          /* 7. NO DATA STATE */
          <div className="p-12 text-center text-slate-500">
            <div className="max-w-md mx-auto space-y-3">
              <span className="text-4xl block">🌾</span>
              <h3 className="font-bold text-slate-800 text-sm md:text-base">
                {t('market.noGovtPriceReported', 'No government price reported for this crop in the selected area')}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('market.noGovtPriceReportedSub', 'The Government of India (AGMARKNET / data.gov.in) has not recorded arrival prices for this selection on the latest reporting date.')}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {isFarmerDistrictMode && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleShowAllMandis}
                    className="text-xs font-bold"
                  >
                    {t('market.viewAllAvailableMandisBtn', '🌐 View All Available Mandis')}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="text-xs font-bold"
                >
                  {t('market.clearFiltersBtn', 'Clear Filters')}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Price Rows */
          <div className="divide-y divide-slate-100">
            {filteredPrices.map((item) => {
              const emoji = getCropEmoji(item.commodity);
              const isExpanded = expandedRowId === item.id;
              const hasRange = item.min_price && item.max_price && item.min_price !== item.max_price;

              return (
                <div
                  key={item.id}
                  className="p-4 md:py-4 md:px-6 hover:bg-slate-50/80 transition-colors group"
                >
                  {/* Row Content: Desktop Grid / Mobile Stacked */}
                  <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-3 md:gap-4">
                    {/* 1. Crop Column */}
                    <div className="md:col-span-4 flex items-center gap-3">
                      <span className="text-2xl shrink-0" role="img" aria-label={item.commodity}>
                        {emoji}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-extrabold text-slate-900 text-base md:text-lg group-hover:text-primary-700 transition-colors block leading-tight">
                            {item.commodity}
                          </span>
                          {item.variety && item.variety !== 'Other' && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {item.variety}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => toggleDetails(item.id)}
                          className="text-[11px] font-semibold text-slate-400 hover:text-primary-600 flex items-center gap-0.5 mt-0.5 cursor-pointer"
                        >
                          <span>{isExpanded ? t('market.hideDetails', 'Hide details') : t('market.viewBreakdown', 'View breakdown')}</span>
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>

                    {/* 2. Mandi Column */}
                    <div className="md:col-span-3">
                      <span className="text-xs font-bold text-slate-800 bg-slate-100/90 border border-slate-200/80 px-2.5 py-1 rounded-lg inline-block">
                        🏪 {item.market_name}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 block mt-0.5">
                        {item.district}, {item.state}
                      </span>
                    </div>

                    {/* 3. Approx. Market Range Column */}
                    <div className="md:col-span-3 flex items-baseline md:block justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider md:hidden">
                        {t('market.approxRangeColon', 'Approx. Range:')}
                      </span>
                      <div>
                        <span className="font-heading font-black text-slate-900 text-lg md:text-xl block leading-tight">
                          {hasRange
                            ? `₹${item.min_price.toLocaleString('en-IN')} – ₹${item.max_price.toLocaleString('en-IN')}`
                            : `${t('market.approxPrice', 'Approx.')} ₹${(item.modal_price || item.min_price).toLocaleString('en-IN')}`
                          }
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 block">
                          {t('market.perQuintal100kg', 'per quintal (100 kg)')}
                        </span>
                      </div>
                    </div>

                    {/* 4. Action Column */}
                    <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <button
                        onClick={() => handleOpenTrendModal(item)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-emerald-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        title={t('market.viewTrendTooltip', 'View trend graph')}
                      >
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">{t('market.trendBtn', 'Trend')}</span>
                      </button>

                      <Button
                        variant="primary"
                        className="text-xs font-bold shadow-xs py-2 px-3 flex items-center justify-center gap-1 cursor-pointer"
                        onClick={() => handleCheckMandi(item)}
                      >
                        <span>{t('market.checkMandiBtn', 'Check Mandi')}</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Collapsible Details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100/90 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3 rounded-xl">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          {t('market.reportedModalRate', 'Reported Modal Rate')}
                        </span>
                        <span className="font-extrabold text-xs text-slate-800 mt-0.5 block">
                          ₹{item.modal_price ? item.modal_price.toLocaleString('en-IN') : '—'} {t('market.perQtl', '/ qtl')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          {t('market.minReportedRate', 'Min Reported Rate')}
                        </span>
                        <span className="font-extrabold text-xs text-slate-700 mt-0.5 block">
                          ₹{item.min_price ? item.min_price.toLocaleString('en-IN') : '—'} {t('market.perQtl', '/ qtl')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          {t('market.maxReportedRate', 'Max Reported Rate')}
                        </span>
                        <span className="font-extrabold text-xs text-slate-700 mt-0.5 block">
                          ₹{item.max_price ? item.max_price.toLocaleString('en-IN') : '—'} {t('market.perQtl', '/ qtl')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          {t('market.arrivalReportDate', 'Arrival / Report Date')}
                        </span>
                        <span className="font-extrabold text-xs text-slate-700 mt-0.5 block">
                          {formatReportedDate(item.arrival_date, t('market.recently', 'Recently'))}
                        </span>
                      </div>
                      <div className="col-span-2 sm:col-span-4 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{t('market.sourceColon', 'Source:')} {item.source || 'Government of India / AGMARKNET / data.gov.in'}</span>
                        <span>{t('market.godlNotice', 'Official GODL-India Open Data')}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 8. TREND GRAPH MODAL */}
      {trendModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl bg-white border-slate-200 shadow-2xl rounded-3xl p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-2xl p-2 bg-emerald-50 rounded-2xl border border-emerald-100 shrink-0">
                  {getCropEmoji(trendModalItem.commodity)}
                </span>
                <div className="min-w-0">
                  <h3 className="font-heading font-black text-slate-900 text-lg truncate">
                    {t('market.priceTrendsTitle', { commodity: trendModalItem.commodity })}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate">
                    {trendModalItem.market_name} ({trendModalItem.district}, {trendModalItem.state})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setTrendModalItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer shrink-0"
                aria-label={t('market.closeTrendModal', 'Close trend modal')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Period Selector Tabs: Today | 7 Days | 30 Days | 1 Year */}
            <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl">
              {[
                { id: 'today', label: t('market.tabToday', 'Today') },
                { id: '7d', label: t('market.tab7d', '7 Days') },
                { id: '30d', label: t('market.tab30d', '30 Days') },
                { id: '1y', label: t('market.tab1y', '1 Year') },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setTrendPeriod(tab.id)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    trendPeriod === tab.id
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            {(() => {
              const currentMin = trendData?.summary?.overallMinPrice ?? trendModalItem?.min_price;
              const currentMax = trendData?.summary?.overallMaxPrice ?? trendModalItem?.max_price;
              const currentModal = trendData?.summary?.averageModalPrice ?? trendModalItem?.modal_price;
              const latestDate = trendData?.points?.[trendData.points.length - 1]?.date || trendModalItem?.arrival_date;

              return (
                <div className="space-y-4">
                  {/* Farmer-Friendly Interpretation (Requirement 6) */}
                  <div className="p-3.5 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-2xs">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                        <span>📌</span>
                        <span>
                          {t('market.currentReportedRange', 'Current reported range:')}{' '}
                          <span className="text-emerald-800 font-black text-sm">
                            {currentMin && currentMax
                              ? `₹${currentMin.toLocaleString('en-IN')} – ₹${currentMax.toLocaleString('en-IN')} ${t('market.perQuintalUnit', '/ quintal')}`
                              : currentModal
                              ? `₹${currentModal.toLocaleString('en-IN')} ${t('market.perQuintalUnit', '/ quintal')}`
                              : t('market.ratesPendingReport', 'Rates pending report')}
                          </span>
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800/80 mt-0.5">
                        {t('market.wholesaleRateDisclaimer', 'Wholesale rate reported via official government channels. Actual farmer selling price may vary based on crop moisture and grade. Not a guaranteed selling price.')}
                      </p>
                    </div>
                  </div>

                  {/* Summary Cards (Requirement 5) */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/70 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        {trendPeriod === '1y' || trendPeriod === '30d' ? t('market.avgModalRate', 'Avg Modal Rate') : t('market.modalRateLabel', 'Modal / Rate')}
                      </span>
                      <span className="font-heading font-black text-slate-900 text-sm sm:text-base block mt-0.5">
                        {currentModal ? `₹${currentModal.toLocaleString('en-IN')}` : '—'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{t('market.perQuintal', 'per quintal')}</span>
                    </div>

                    <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/70 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        {t('market.reportedRangeCard', 'Reported Range')}
                      </span>
                      <span className="font-heading font-bold text-slate-800 text-xs sm:text-sm block mt-1">
                        {currentMin && currentMax
                          ? `₹${currentMin.toLocaleString('en-IN')} – ₹${currentMax.toLocaleString('en-IN')}`
                          : '—'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{t('market.minMaxSpread', 'min – max spread')}</span>
                    </div>

                    <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/70 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        {t('market.reportedDateCard', 'Reported Date')}
                      </span>
                      <span className="font-heading font-bold text-slate-800 text-xs sm:text-sm block mt-1">
                        {latestDate ? formatReportedDate(latestDate, t('market.recently', 'Recently')) : '—'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{t('market.officialUpdate', 'official update')}</span>
                    </div>
                  </div>

                  {/* Visual Chart - Hero Element (Requirements 1, 3, 4, 8, 9, 10) */}
                  <div className="bg-slate-50/60 p-2 sm:p-4 rounded-2xl border border-slate-200/80">
                    <PriceTrendChart
                      period={trendPeriod}
                      trendData={trendData}
                      isLoading={isLoadingTrend}
                    />
                  </div>

                  {/* Government Disclaimer (Requirement 11) */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
                    <span className="shrink-0 text-slate-400 mt-0.5">ℹ️</span>
                    <span>
                      {t('market.govtDisclaimer', 'Prices are reported wholesale market rates from Government of India AGMARKNET/data.gov.in. Actual farmer selling price may vary.')}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="pt-1 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTrendModalItem(null)}
                className="text-xs font-bold px-4 py-2 cursor-pointer"
              >
                {t('market.closeBtn', 'Close')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
