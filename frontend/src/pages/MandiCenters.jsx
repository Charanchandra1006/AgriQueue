import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  MapPin,
  Search,
  X,
  Clock,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Loader2,
  History,
  Compass,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { SlotBookingModal } from '../components/mandi/SlotBookingModal';
import { BookingHistoryModal } from '../components/mandi/BookingHistoryModal';
import { getMandis } from '../services/api';
import { useApp } from '../context/AppContext';
import {
  KARIMNAGAR_ADMIN_HIERARCHY,
  getVillagesForMandal,
  getAllKarimnagarVillages,
  findMandalsForVillage,
  resolveLocationQuery
} from '../data/karimnagarHierarchy';

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
 * Standard Haversine distance formula between two coordinate pairs in km
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Resolves Google Maps navigation links (View Location & Directions) for a mandi/center.
 * Strictly checks for verified coordinates or verified facility addresses,
 * without falling back to misleading village or district centroids.
 */
const getMandiNavigation = (mandi) => {
  if (!mandi) {
    return {
      type: 'UNAVAILABLE',
      hasLocation: false,
      hasDirections: false,
      message: ' Exact location not available yet'
    };
  }

  const lat = typeof mandi.latitude === 'number' ? mandi.latitude : parseFloat(mandi.latitude);
  const lng = typeof mandi.longitude === 'number' ? mandi.longitude : parseFloat(mandi.longitude);
  const hasValidCoords =
    !isNaN(lat) &&
    !isNaN(lng) &&
    mandi.latitude !== null &&
    mandi.longitude !== null;

  if (hasValidCoords) {
    return {
      type: 'COORDINATES',
      hasLocation: true,
      hasDirections: true,
      viewLocationUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    };
  }

  // Determine if a verified physical facility address exists
  const loc = (mandi.location || '').trim();
  const districtStr = (mandi.district || '').trim();
  const stateStr = (mandi.state || '').trim();

  // Filter out generic district/state fallbacks and bare village names
  const isGenericFallback =
    !loc ||
    loc.toLowerCase() === `${districtStr.toLowerCase()}, ${stateStr.toLowerCase()}` ||
    loc.toLowerCase().endsWith(' village');

  // If specific verified physical location exists (e.g., "AMC Complex, Huzurabad", "Station Road, Jammikunta - 505122")
  if (!isGenericFallback && loc.length > 3) {
    const fullAddress = `${mandi.name}, ${loc}, ${districtStr}, ${stateStr}`;
    const encoded = encodeURIComponent(fullAddress);
    return {
      type: 'VERIFIED_ADDRESS',
      hasLocation: true,
      hasDirections: true,
      viewLocationUrl: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
      directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encoded}`
    };
  }

  // Fallback for official APMC / Market Committees with specific mandal information
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
      type: 'VERIFIED_ADDRESS',
      hasLocation: true,
      hasDirections: true,
      viewLocationUrl: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
      directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encoded}`
    };
  }

  // Neither verified coordinates nor a specific facility address is available
  return {
    type: 'UNAVAILABLE',
    hasLocation: false,
    hasDirections: false,
    message: ' Exact location not available yet'
  };
};

export const MandiCenters = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { profile, t } = useApp();

  const farmerDistrict = profile?.district || 'Karimnagar';
  const farmerState = profile?.state || 'Telangana';

  // View mode: 'near' (default when district available) or 'all'
  const [viewMode, setViewMode] = useState(() => (farmerDistrict ? 'near' : 'all'));

  // Read selected mandi ID from URL query param or router state
  const selectedParam = searchParams.get('selected');
  const targetMandiId = selectedParam
    ? parseInt(selectedParam, 10)
    : location.state?.selectedMandiId
    ? parseInt(location.state.selectedMandiId, 10)
    : null;

  const selectedCardRef = useRef(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMandal, setSelectedMandal] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [disambiguationOptions, setDisambiguationOptions] = useState(null);
  const [openOnly, setOpenOnly] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('');

  // Geolocation & Nearest Mandi state
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // 'idle' | 'detecting' | 'granted' | 'denied' | 'village_fallback'
  const [locationError, setLocationError] = useState(null);

  // Village fallback selection state
  const [isVillageModalOpen, setIsVillageModalOpen] = useState(false);
  const [fallbackLocation, setFallbackLocation] = useState({
    state: profile?.state || 'Telangana',
    district: profile?.district || 'Karimnagar',
    mandal: profile?.mandal || 'V. Saidapur',
    village: profile?.village || 'Saidapur'
  });

  // Modal states
  const [bookingMandi, setBookingMandi] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Mandi records state from MySQL
  const [mandisList, setMandisList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real mandis from MySQL backend via GET /api/mandis
  const fetchMandis = useCallback(async () => {
    try {
      const res = await getMandis();
      if (res.success && Array.isArray(res.data)) {
        setMandisList(res.data);
        setError(null);
      } else {
        setError(t('mandi.unableToLoadCentersSub'));
      }
    } catch {
      setError(t('mandi.unableToLoadCentersSub'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchMandis();
  }, [fetchMandis]);

  // Request browser geolocation when farmer clicks "Find Mandis Near Me"
  const handleFindNearMe = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      setLocationError(t('mandi.locNotSupported'));
      setIsVillageModalOpen(true);
      return;
    }

    setLocationStatus('detecting');
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationStatus('granted');
        setViewMode('near');
      },
      (err) => {
        console.warn('Geolocation denied or error:', err);
        setLocationStatus('denied');
        setLocationError(t('mandi.locPermissionDeniedFallback'));
        // Automatically offer village selector fallback
        setIsVillageModalOpen(true);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Determine active reference coordinates for distance calculation
  // Uses browser geolocation if granted, or verified coordinates of the selected village/mandi if available
  const activeReferenceCoords = useMemo(() => {
    if (userLocation) {
      return userLocation;
    }

    // Fallback: If farmer has selected a village, check if any verified center in that village has known coordinates
    if (fallbackLocation.village && mandisList.length > 0) {
      const verifiedVillageMandi = mandisList.find(
        (m) =>
          m.village &&
          m.village.toLowerCase() === fallbackLocation.village.toLowerCase() &&
          m.latitude !== null &&
          m.longitude !== null
      );
      if (verifiedVillageMandi) {
        return {
          latitude: Number(verifiedVillageMandi.latitude),
          longitude: Number(verifiedVillageMandi.longitude),
          sourceName: verifiedVillageMandi.name
        };
      }
    }

    return null;
  }, [userLocation, fallbackLocation.village, mandisList]);

  // Farmer-friendly distance calculation (returns null if uncalculable without fabricating)
  const getMandiDistanceKm = useCallback(
    (mandi) => {
      if (!activeReferenceCoords || mandi.latitude === null || mandi.longitude === null) {
        return null;
      }
      const lat = typeof mandi.latitude === 'number' ? mandi.latitude : parseFloat(mandi.latitude);
      const lon = typeof mandi.longitude === 'number' ? mandi.longitude : parseFloat(mandi.longitude);
      if (isNaN(lat) || isNaN(lon)) return null;

      return calculateDistance(activeReferenceCoords.latitude, activeReferenceCoords.longitude, lat, lon);
    },
    [activeReferenceCoords]
  );

  const formatDistance = (km) => {
    if (km === null || isNaN(km)) return null;
    if (km < 1) {
      return t('mandi.metersAway', { dist: Math.round(km * 1000) });
    }
    return t('mandi.kmAway', { dist: km.toFixed(1) });
  };

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

  const checkMandiStatus = (mandi) => {
    const openingTime = mandi.opening_time
      ? formatTime12h(mandi.opening_time)
      : mandi.external?.operatingHours?.openingTime || '08:00 AM';
    const closingTime = mandi.closing_time
      ? formatTime12h(mandi.closing_time)
      : mandi.external?.operatingHours?.closingTime || '06:00 PM';

    const openMin = parseTimeToMinutes(openingTime);
    const closeMin = parseTimeToMinutes(closingTime);

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const isOpen = currentMinutes >= openMin && currentMinutes <= closeMin;
    return {
      isOpen,
      hours: `${openingTime} – ${closingTime}`
    };
  };

  // Active dataset: strictly real MySQL records
  const activeMandis = mandisList;

  // Selected mandi if routed with target ID
  const selectedMandi = useMemo(() => {
    if (!targetMandiId || !activeMandis.length) return null;
    return activeMandis.find((m) => m.id === targetMandiId) || null;
  }, [activeMandis, targetMandiId]);

  // Smoothly scroll to the highlighted selected mandi
  useEffect(() => {
    if (targetMandiId && !isLoading && selectedCardRef.current) {
      setTimeout(() => {
        selectedCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 250);
    }
  }, [targetMandiId, isLoading]);

  // Derive unique states, districts, mandals, and commodities
  const states = useMemo(() => {
    return Array.from(new Set(activeMandis.map((m) => m.state).filter(Boolean))).sort();
  }, [activeMandis]);

  const districts = useMemo(() => {
    const filtered = selectedState
      ? activeMandis.filter((m) => m.state === selectedState)
      : activeMandis;
    return Array.from(new Set(filtered.map((m) => m.district).filter(Boolean))).sort();
  }, [activeMandis, selectedState]);

  const mandals = useMemo(() => {
    if (!selectedDistrict || selectedDistrict.toLowerCase() === 'karimnagar') {
      return KARIMNAGAR_ADMIN_HIERARCHY.map((m) => m.mandal).sort();
    }
    const filtered = activeMandis.filter(
      (m) =>
        (!selectedDistrict || m.district === selectedDistrict) &&
        (!selectedState || m.state === selectedState)
    );
    return Array.from(new Set(filtered.map((m) => m.mandal).filter(Boolean))).sort();
  }, [activeMandis, selectedState, selectedDistrict]);

  const availableVillages = useMemo(() => {
    if (!selectedDistrict || selectedDistrict.toLowerCase() === 'karimnagar') {
      if (selectedMandal) {
        const official = getVillagesForMandal(selectedMandal);
        const mandiVillages = activeMandis
          .filter((m) => (m.mandal || '').toLowerCase() === selectedMandal.toLowerCase())
          .map((m) => m.village)
          .filter(Boolean);
        return Array.from(new Set([...official, ...mandiVillages])).sort();
      }
      return getAllKarimnagarVillages();
    }
    const filtered = activeMandis.filter(
      (m) =>
        (!selectedDistrict || m.district === selectedDistrict) &&
        (!selectedMandal || m.mandal === selectedMandal)
    );
    return Array.from(new Set(filtered.map((m) => m.village).filter(Boolean))).sort();
  }, [activeMandis, selectedDistrict, selectedMandal]);

  const crops = useMemo(() => {
    const allCrops = activeMandis.flatMap((m) => m.external?.commodities || []);
    return Array.from(new Set(allCrops)).sort();
  }, [activeMandis]);

  const handleVillageChange = (village) => {
    setSelectedVillage(village);
    if (!village) return;

    if (!selectedDistrict || selectedDistrict.toLowerCase() === 'karimnagar') {
      const mandalMatches = findMandalsForVillage(village);
      if (mandalMatches.length === 1) {
        setSelectedState('Telangana');
        setSelectedDistrict('Karimnagar');
        setSelectedMandal(mandalMatches[0].mandal);
        setDisambiguationOptions(null);
      } else if (mandalMatches.length > 1) {
        setDisambiguationOptions(mandalMatches);
      }
    }
  };

  const handleSearchChange = (val) => {
    setSearchTerm(val);

    if (!val || val.trim().length < 2) {
      setDisambiguationOptions(null);
      return;
    }

    const res = resolveLocationQuery(val, activeMandis);

    if (res.type === 'VILLAGE_UNIQUE') {
      setSelectedState(res.data.state);
      setSelectedDistrict(res.data.district);
      setSelectedMandal(res.data.mandal);
      setSelectedVillage(res.data.village);
      setDisambiguationOptions(null);
    } else if (res.type === 'VILLAGE_AMBIGUOUS') {
      setDisambiguationOptions(res.options);
    } else if (res.type === 'MANDAL_UNIQUE') {
      setSelectedState(res.data.state);
      setSelectedDistrict(res.data.district);
      setSelectedMandal(res.data.mandal);
      setSelectedVillage('');
      setDisambiguationOptions(null);
    } else if (res.type === 'MANDI_UNIQUE') {
      setSelectedState(res.data.state);
      setSelectedDistrict(res.data.district);
      if (res.data.mandal) setSelectedMandal(res.data.mandal);
      if (res.data.village) setSelectedVillage(res.data.village);
      setDisambiguationOptions(null);
    } else if (res.type === 'DISTRICT_UNIQUE') {
      setSelectedState(res.data.state);
      setSelectedDistrict(res.data.district);
      setSelectedMandal('');
      setSelectedVillage('');
      setDisambiguationOptions(null);
    } else if (res.type === 'STATE_UNIQUE') {
      setSelectedState(res.data.state);
      setSelectedDistrict('');
      setSelectedMandal('');
      setSelectedVillage('');
      setDisambiguationOptions(null);
    } else {
      setDisambiguationOptions(null);
    }
  };

  // Filter mandis based on search & filters & district-first near view
  const filteredMandis = useMemo(() => {
    let sourceList = activeMandis;

    // In 'near' mode with farmer district:
    if (viewMode === 'near' && farmerDistrict && !selectedDistrict && !selectedState) {
      const districtMatches = sourceList.filter(
        (m) => m.district?.toLowerCase() === farmerDistrict.toLowerCase()
      );
      if (districtMatches.length > 0) {
        sourceList = districtMatches;
      } else if (farmerState) {
        const stateMatches = sourceList.filter(
          (m) => m.state?.toLowerCase() === farmerState.toLowerCase()
        );
        if (stateMatches.length > 0) {
          sourceList = stateMatches;
        }
      }
    }

    return sourceList.filter((mandi) => {
      const q = searchTerm.trim().toLowerCase();
      if (q) {
        const matchesName = (mandi.name || '').toLowerCase().includes(q);
        const matchesDistrict = (mandi.district || '').toLowerCase().includes(q);
        const matchesMandal = (mandi.mandal || '').toLowerCase().includes(q);
        const matchesVillage = (mandi.village || '').toLowerCase().includes(q);
        const matchesLocation = (mandi.location || '').toLowerCase().includes(q);
        const matchesCommodity = (mandi.external?.commodities || []).some((c) =>
          c.toLowerCase().includes(q)
        );
        const matchesSelectedMandal = selectedMandal && (mandi.mandal || '').toLowerCase() === selectedMandal.toLowerCase();

        if (
          !matchesName &&
          !matchesDistrict &&
          !matchesMandal &&
          !matchesVillage &&
          !matchesLocation &&
          !matchesCommodity &&
          !matchesSelectedMandal
        ) {
          return false;
        }
      }

      if (selectedState && mandi.state !== selectedState) {
        return false;
      }

      if (selectedDistrict && mandi.district !== selectedDistrict) {
        return false;
      }

      if (selectedMandal && mandi.mandal !== selectedMandal) {
        return false;
      }

      if (selectedVillage) {
        const v = selectedVillage.toLowerCase();
        const matchesVillage = (mandi.village || '').toLowerCase() === v;
        const matchesLocation = (mandi.location || '').toLowerCase().includes(v);
        const matchesName = (mandi.name || '').toLowerCase().includes(v);
        const hasCenterInVillage = activeMandis.some(
          (m) => (m.village || '').toLowerCase() === v || (m.location || '').toLowerCase().includes(v)
        );
        if (hasCenterInVillage && !matchesVillage && !matchesLocation && !matchesName) {
          return false;
        }
      }

      if (openOnly) {
        const status = checkMandiStatus(mandi);
        if (!status.isOpen) return false;
      }

      if (selectedCrop) {
        if (!mandi.external?.commodities?.includes(selectedCrop)) {
          return false;
        }
      }

      return true;
    });
  }, [
    activeMandis,
    viewMode,
    farmerDistrict,
    farmerState,
    searchTerm,
    selectedState,
    selectedDistrict,
    selectedMandal,
    selectedVillage,
    openOnly,
    selectedCrop
  ]);

  // District-first and Distance-sorted mandis
  // Nearest centers appear first whenever distance can be calculated
  const displayMandis = useMemo(() => {
    const list = [...filteredMandis];

    // Priority 1: Target mandi selected from external navigation (e.g. price table)
    if (targetMandiId) {
      const match = list.find((m) => m.id === targetMandiId);
      if (!match) {
        const fromAll = activeMandis.find((m) => m.id === targetMandiId);
        return fromAll ? [fromAll, ...list] : list;
      }
      return [match, ...list.filter((m) => m.id !== targetMandiId)];
    }

    // Sort order:
    // 1. Registered District first (Karimnagar first for Karimnagar farmers)
    // 2. Nearest distance first when distance can be calculated
    // 3. Same mandal / village fallback
    // 4. Center type hierarchy (APMC > Principal Yard > Sub-Yard > Procurement Center > Paddy Procurement Center)
    list.sort((a, b) => {
      // Check district match
      const aInDistrict =
        farmerDistrict && a.district?.toLowerCase() === farmerDistrict.toLowerCase() ? 1 : 0;
      const bInDistrict =
        farmerDistrict && b.district?.toLowerCase() === farmerDistrict.toLowerCase() ? 1 : 0;

      if (aInDistrict !== bInDistrict) {
        return bInDistrict - aInDistrict;
      }

      // Check calculable distance
      const distA = getMandiDistanceKm(a);
      const distB = getMandiDistanceKm(b);

      if (distA !== null && distB !== null) {
        return distA - distB;
      }
      if (distA !== null && distB === null) {
        return -1;
      }
      if (distA === null && distB !== null) {
        return 1;
      }

      // If distance cannot be calculated, check mandal / village match with farmer
      const targetMandal = fallbackLocation.mandal || profile?.mandal || '';
      const targetVillage = fallbackLocation.village || profile?.village || '';

      const aMandalMatch =
        targetMandal && a.mandal?.toLowerCase() === targetMandal.toLowerCase() ? 1 : 0;
      const bMandalMatch =
        targetMandal && b.mandal?.toLowerCase() === targetMandal.toLowerCase() ? 1 : 0;

      if (aMandalMatch !== bMandalMatch) {
        return bMandalMatch - aMandalMatch;
      }

      const aVillageMatch =
        targetVillage && a.village?.toLowerCase() === targetVillage.toLowerCase() ? 1 : 0;
      const bVillageMatch =
        targetVillage && b.village?.toLowerCase() === targetVillage.toLowerCase() ? 1 : 0;

      if (aVillageMatch !== bVillageMatch) {
        return bVillageMatch - aVillageMatch;
      }

      // Secondary sort: center type weight
      const getTypeWeight = (m) => {
        const t = (m.center_type || '').toLowerCase();
        if (t.includes('market committee') || t.includes('apmc')) return 5;
        if (t.includes('principal market')) return 4;
        if (t.includes('sub-yard')) return 3;
        if (t.includes('procurement center')) return 2;
        return 1;
      };

      const typeDiff = getTypeWeight(b) - getTypeWeight(a);
      if (typeDiff !== 0) return typeDiff;

      return (a.name || '').localeCompare(b.name || '');
    });

    return list;
  }, [
    filteredMandis,
    activeMandis,
    targetMandiId,
    farmerDistrict,
    getMandiDistanceKm,
    fallbackLocation.mandal,
    fallbackLocation.village,
    profile?.mandal,
    profile?.village
  ]);

  const hasActiveFilters = Boolean(
    searchTerm || selectedState || selectedDistrict || selectedMandal || selectedVillage || openOnly || selectedCrop
  );

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedMandal('');
    setSelectedVillage('');
    setOpenOnly(false);
    setSelectedCrop('');
    setDisambiguationOptions(null);
  };

  const handleClearSelected = () => {
    navigate('/mandi-centers', { replace: true });
  };

  // Village Selector Modal Helper options: uses canonical official villages
  const villageOptions = useMemo(() => {
    if (!fallbackLocation.mandal) return [];
    return getVillagesForMandal(fallbackLocation.mandal);
  }, [fallbackLocation.mandal]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ================= PAGE HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="mandi">
              
            </span>
            <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-slate-800 tracking-tight">
              {t('mandi.centersHeading')}
            </h1>
          </div>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {t('mandi.centersSubheading')}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          <Button
            variant="outline"
            className="font-bold text-xs border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer flex items-center gap-1.5"
            onClick={() => setIsHistoryModalOpen(true)}
          >
            <History className="h-4 w-4 text-primary-600" />
            <span>{t('mandi.bookingHistoryBtn')}</span>
          </Button>

          <Button
            variant="primary"
            className="font-bold text-xs shadow-xs cursor-pointer"
            onClick={() => navigate('/mandi-map')}
          >
            {t('mandi.viewMapBtn')}
          </Button>
        </div>
      </div>

      {/* ================= SELECTED MANDI BANNER (FROM MARKET PRICES) ================= */}
      {selectedMandi && (
        <div
          ref={selectedCardRef}
          className="p-4 bg-gradient-to-r from-emerald-50 via-white to-primary-50/40 border-2 border-emerald-400 shadow-sm rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in"
        >
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <span className="text-2xl p-2.5 bg-emerald-100 rounded-xl shrink-0"></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {t('mandi.selectedFromPrices')}
                </span>
                {selectedMandi.center_type && (
                  <span className="text-xs font-bold text-slate-500">
                    {selectedMandi.center_type}
                  </span>
                )}
              </div>
              <h2
                className="font-heading font-extrabold text-base md:text-lg text-slate-900 mt-0.5 break-words"
                style={{ overflowWrap: 'anywhere' }}
              >
                {selectedMandi.name}
              </h2>
              <p className="text-xs font-semibold text-slate-600 flex items-start gap-1 mt-0.5 min-w-0">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="break-words leading-relaxed" style={{ overflowWrap: 'anywhere' }}>
                  {selectedMandi.village ? `${selectedMandi.village}, ` : ''}
                  {selectedMandi.mandal ? `${selectedMandi.mandal} ${t('common.mandal')} • ` : ''}
                  {selectedMandi.district}, {selectedMandi.state}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {(() => {
              const selectedNav = getMandiNavigation(selectedMandi);
              if (!selectedNav.hasLocation) return null;
              return (
                <>
                  <a
                    href={selectedNav.viewLocationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-colors no-underline cursor-pointer"
                    title={t('mandi.openInGoogleMapsTitle')}
                  >
                    <span>{t('mandi.viewLocationBtn')}</span>
                  </a>
                  <a
                    href={selectedNav.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl border border-primary-200 bg-primary-50 text-primary-800 hover:bg-primary-100 shadow-2xs transition-colors no-underline cursor-pointer"
                    title={t('mandi.getDirectionsTitle')}
                  >
                    <span>{t('mandi.directionsBtn')}</span>
                  </a>
                </>
              );
            })()}
            <Button
              variant="primary"
              className="text-xs font-bold shadow-xs cursor-pointer py-2 px-3.5"
              onClick={() => {
                setBookingMandi(selectedMandi);
                setIsBookingModalOpen(true);
              }}
            >
              {t('mandi.bookSlotBtn')}
            </Button>
            <Button
              variant="outline"
              className="text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer py-2 px-3.5"
              onClick={() => navigate(`/mandi-centers/${selectedMandi.id}`)}
            >
              {t('mandi.viewDetailsBtn')} →
            </Button>
            <button
              onClick={handleClearSelected}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 p-2 cursor-pointer rounded-lg hover:bg-slate-100"
              title={t('mandi.clearSelectionTooltip')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* =================  MANDIS NEAR YOU / PROMINENT HERO SECTION ================= */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-white to-primary-50/40 border-2 border-emerald-400 shadow-sm rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 animate-in fade-in">
        <div className="flex items-start sm:items-center gap-3.5">
          <span
            className="text-3xl p-3 bg-emerald-100 rounded-2xl shrink-0 shadow-2xs"
            role="img"
            aria-label="pin"
          >
            
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading font-black text-lg sm:text-xl text-slate-900">
                {t('mandi.mandisNearYou')}
              </h2>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {t('mandi.basedOnLocation')}
              </span>
            </div>

            {/* Location context status */}
            <div className="text-xs sm:text-sm mt-1 space-y-0.5">
              <p className="font-bold text-emerald-900 flex items-center gap-1.5 flex-wrap">
                <span>
                  {farmerDistrict} {t('common.district')}, {farmerState}
                </span>
                {fallbackLocation.mandal && (
                  <span className="text-emerald-700 font-semibold">
                    • {fallbackLocation.mandal} {t('common.mandal')}
                    {fallbackLocation.village ? ` (${fallbackLocation.village})` : ''}
                  </span>
                )}
              </p>

              {userLocation ? (
                <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 inline" />
                  <span>{t('mandi.locActiveNearFirst')}</span>
                </p>
              ) : locationStatus === 'denied' ? (
                <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 inline" />
                  <span>{t('mandi.locDeniedPriority')}</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 font-medium">
                  {t('mandi.locPromptPrompt')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Prominent Find Mandis Near Me Button */}
          <Button
            variant="primary"
            className="text-xs sm:text-sm font-extrabold shadow-md shadow-primary-700/20 py-2.5 px-4 flex items-center gap-2 cursor-pointer"
            onClick={handleFindNearMe}
            disabled={locationStatus === 'detecting'}
          >
            {locationStatus === 'detecting' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t('mandi.findingNearest')}</span>
              </>
            ) : (
              <>
                <Compass className="h-4 w-4" />
                <span>{t('mandi.findMandisNearMeBtn')}</span>
              </>
            )}
          </Button>

          {/* Select Village Fallback Button */}
          <Button
            variant="outline"
            className="text-xs sm:text-sm font-bold border-slate-300 text-slate-700 hover:bg-slate-50 py-2.5 px-3.5 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            onClick={() => setIsVillageModalOpen(true)}
          >
            <MapPin className="h-3.5 w-3.5 text-primary-600" />
            <span>{t('mandi.selectYourVillageBtn')}</span>
          </Button>

          {/* Toggle All / Near View */}
          {viewMode === 'near' ? (
            <Button
              variant="outline"
              className="text-xs font-bold border-slate-300 text-slate-600 hover:bg-slate-50 py-2.5 px-3 flex items-center gap-1"
              onClick={() => setViewMode('all')}
            >
              <span>{t('mandi.viewAllWithCount', { count: activeMandis.length })}</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              className="text-xs font-bold border-slate-300 text-slate-600 hover:bg-slate-50 py-2.5 px-3 flex items-center gap-1"
              onClick={() => {
                setViewMode('near');
                resetFilters();
              }}
            >
              <span>{t('mandi.nearMeOnly')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* ================= SEARCH & SIMPLE FARMER-FRIENDLY FILTERS ================= */}
      <Card className="p-4 md:p-5 border-slate-200 shadow-2xs space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t('mandi.searchDetailedPlaceholder')}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setDisambiguationOptions(null);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              aria-label={t('mandi.clearSearch')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Mandal Disambiguation Option Picker */}
        {disambiguationOptions && disambiguationOptions.length > 0 && (
          <div className="p-3.5 bg-amber-50/95 border-2 border-amber-300 rounded-2xl space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <span>{t('mandi.multipleMandalsFound', { village: disambiguationOptions[0].village })}</span>
              </p>
              <button
                onClick={() => setDisambiguationOptions(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                aria-label={t('common.close')}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {disambiguationOptions.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedState(opt.state || 'Telangana');
                    setSelectedDistrict(opt.district || 'Karimnagar');
                    setSelectedMandal(opt.mandal);
                    setSelectedVillage(opt.village);
                    setDisambiguationOptions(null);
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 hover:border-amber-400 rounded-xl text-xs font-extrabold text-amber-900 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
                >
                  <span></span>
                  <span>{opt.village} — {opt.mandal} {t('common.mandal')}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter Controls Row: State -> District -> Mandal -> Village -> Crop */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {/* State Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700">
            <span className="text-slate-400">{t('common.state')}:</span>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict('');
                setSelectedMandal('');
                setSelectedVillage('');
                setDisambiguationOptions(null);
              }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="">{t('mandi.allStatesWithCount', { count: states.length })}</option>
              {states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700">
            <span className="text-slate-400">{t('common.district')}:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setSelectedMandal('');
                setSelectedVillage('');
                setDisambiguationOptions(null);
              }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="">{t('mandi.allDistrictsWithCount', { count: districts.length })}</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Mandal Filter */}
          {mandals.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700">
              <span className="text-slate-400">{t('common.mandal')}:</span>
              <select
                value={selectedMandal}
                onChange={(e) => {
                  setSelectedMandal(e.target.value);
                  setSelectedVillage('');
                  setDisambiguationOptions(null);
                }}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="">{t('mandi.allMandalsWithCount', { count: mandals.length })}</option>
                {mandals.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Village Filter */}
          {availableVillages.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700">
              <span className="text-slate-400">{t('common.village')}:</span>
              <select
                value={selectedVillage}
                onChange={(e) => handleVillageChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[150px]"
              >
                <option value="">{t('mandi.allVillagesWithCount', { count: availableVillages.length })}</option>
                {availableVillages.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Crop Filter */}
          {crops.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700">
              <span className="text-slate-400"> {t('common.crop')}:</span>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="">{t('mandi.allCrops')}</option>
                {crops.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Open Now Toggle */}
          <button
            onClick={() => setOpenOnly(!openOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
              openOnly
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>{openOnly ? t('mandi.openNowFilter') : t('mandi.openNow')}</span>
          </button>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-colors ml-auto cursor-pointer flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" />
              {t('mandi.resetFilters')}
            </button>
          )}
        </div>
      </Card>

      {/* Result Count Indicator */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-500">
          {t('mandi.showingCountOfTotal', { shown: displayMandis.length, total: activeMandis.length })}
        </span>
        {hasActiveFilters && (
          <span className="text-xs text-primary-600 font-semibold">{t('mandi.filteredResultsActive')}</span>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-12 text-center bg-white border-slate-200 shadow-xs rounded-2xl">
          <div className="flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            <p className="text-base font-extrabold text-slate-800">
              {t('mandi.loadingProcurementCenters')}
            </p>
            <p className="text-xs text-slate-500">
              {t('mandi.retrievingCenters')}
            </p>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="p-8 text-center bg-rose-50/50 border-rose-200 rounded-2xl">
          <div className="max-w-md mx-auto space-y-3">
            <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
            <h3 className="font-heading font-bold text-rose-900 text-base">
              {t('mandi.unableToLoadCenters')}
            </h3>
            <p className="text-xs text-rose-600">{error}</p>
            <Button
              variant="primary"
              onClick={fetchMandis}
              className="mt-2 text-xs font-bold flex items-center gap-1.5 mx-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{t('mandi.retryConnection')}</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && displayMandis.length === 0 && (
        <Card className="p-8 text-center bg-white border-slate-200 rounded-2xl">
          <div className="max-w-md mx-auto space-y-3">
            <span className="text-3xl"></span>
            <h3 className="font-heading font-bold text-slate-800 text-lg">
              {t('mandi.noMatchingCentersFound')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('mandi.noMatchingCentersSub')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="mt-2 text-xs font-bold"
            >
              {t('mandi.clearAllFilters')}
            </Button>
          </div>
        </Card>
      )}

      {/* ================= MANDI CENTER RESPONSIVE GRID ================= */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayMandis.map((mandi) => {
            const status = checkMandiStatus(mandi);
            const distanceKm = getMandiDistanceKm(mandi);
            const distanceText = formatDistance(distanceKm);
            const isTarget = targetMandiId === mandi.id;

            return (
              <Card
                key={mandi.id}
                className={`p-5 transition-all duration-200 flex flex-col justify-between group rounded-2xl h-full overflow-hidden ${
                  isTarget
                    ? 'border-2 border-emerald-500 bg-emerald-50/20 ring-4 ring-emerald-500/15 shadow-md'
                    : 'border-slate-200 hover:border-primary-400 hover:shadow-md bg-white'
                }`}
              >
                {/* Top Card Section: Badges, Title, Location */}
                <div className="space-y-3 min-w-0 flex-1">
                  {/* Badges Row */}
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    {mandi.center_type && (
                      <span className="inline-block bg-primary-50 text-primary-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-primary-200 break-words">
                        {mandi.center_type}
                      </span>
                    )}

                    {distanceText ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs shrink-0">
                         {distanceText}
                      </span>
                    ) : farmerDistrict &&
                      mandi.district?.toLowerCase() === farmerDistrict.toLowerCase() ? (
                      <span className="inline-block bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        {t('mandi.localMandiBadge', { district: mandi.district })}
                      </span>
                    ) : null}

                    {isTarget && (
                      <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                        {t('mandi.selectedBadge')}
                      </span>
                    )}
                  </div>

                  {/* Mandi Name */}
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="text-2xl shrink-0 mt-0.5" role="img" aria-label="mandi">
                      
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2
                        className="font-heading font-black text-base text-slate-900 group-hover:text-primary-700 transition-colors leading-snug break-words hyphens-auto"
                        style={{ overflowWrap: 'anywhere', wordBreak: 'normal' }}
                      >
                        {mandi.name}
                      </h2>

                      {/* Mandal & Village Location */}
                      <p className="text-xs font-semibold text-slate-500 mt-1 flex items-start gap-1 min-w-0">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span
                          className="break-words leading-relaxed"
                          style={{ overflowWrap: 'anywhere' }}
                        >
                          {mandi.village ? `${mandi.village}, ` : ''}
                          {mandi.mandal ? `${mandi.mandal} ${t('common.mandal')} • ` : ''}
                          {mandi.district}, {mandi.state}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Status & Operating Hours */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold pt-0.5 min-w-0">
                    <span
                      className={`px-2.5 py-0.5 rounded-full border text-[11px] font-extrabold flex items-center gap-1 shrink-0 ${
                        status.isOpen
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {status.isOpen ? t('mandi.openNowFilter') : t('mandi.closedBadge')}
                    </span>
                    <span className="text-slate-500 text-[11px] flex items-center gap-1 font-semibold break-words">
                      <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>{status.hours}</span>
                    </span>
                  </div>

                  {/* Slot Availability & Service Info */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs min-w-0 gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-bold text-slate-700 truncate">{t('mandi.slotsAvailableLabel')}</span>
                    </div>
                    <span className="font-semibold text-[11px] text-emerald-700 shrink-0">
                      {t('mandi.digitalBookingOpen')}
                    </span>
                  </div>

                  {/* Supported Crops */}
                  {mandi.external?.commodities && mandi.external.commodities.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5 min-w-0">
                      {mandi.external.commodities.slice(0, 3).map((comm, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200/70 px-2 py-0.5 rounded-md break-words"
                        >
                           {comm}
                        </span>
                      ))}
                      {mandi.external.commodities.length > 3 && (
                        <span className="text-[10px] font-bold text-slate-400 self-center px-1 shrink-0">
                          {t('mandi.moreCrops', { count: mandi.external.commodities.length - 3 })}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* ================= GOOGLE MAPS NAVIGATION: VIEW LOCATION & DIRECTIONS ================= */}
                <div className="pt-3.5 mt-auto border-t border-slate-100 min-w-0">
                  {(() => {
                    const navInfo = getMandiNavigation(mandi);
                    if (navInfo.hasLocation) {
                      return (
                        <div className="grid grid-cols-2 gap-2 min-w-0">
                          <a
                            href={navInfo.viewLocationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold py-2 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 transition-all text-center no-underline cursor-pointer min-w-0 shadow-2xs"
                            title={t('mandi.openInGoogleMapsTitle')}
                          >
                            <span className="shrink-0 text-xs"></span>
                            <span className="truncate">{t('mandi.viewLocationBtn')}</span>
                          </a>
                          <a
                            href={navInfo.directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold py-2 px-2.5 rounded-xl border border-primary-200 bg-primary-50 text-primary-800 hover:bg-primary-100 hover:border-primary-300 transition-all text-center no-underline cursor-pointer min-w-0 shadow-2xs"
                            title={t('mandi.getDirectionsTitle')}
                          >
                            <span className="shrink-0 text-xs"></span>
                            <span className="truncate">{t('mandi.directionsBtn')}</span>
                          </a>
                        </div>
                      );
                    }
                    return (
                      <div className="py-2 px-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                        <span className="text-[11px] font-semibold text-slate-400 inline-flex items-center justify-center gap-1.5">
                          <span></span> {t('mandi.exactLocationNotAvailable')}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Bottom Action Buttons: Book Slot & View Details */}
                <div className="pt-2.5 flex items-center gap-2 min-w-0">
                  <Button
                    variant="primary"
                    className="flex-1 justify-center text-xs py-2.5 px-2 font-bold shadow-xs flex items-center gap-1 cursor-pointer min-w-0"
                    onClick={() => {
                      setBookingMandi(mandi);
                      setIsBookingModalOpen(true);
                    }}
                  >
                    <span>{t('mandi.bookSlotBtn')}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 justify-center text-xs py-2.5 px-2 font-bold border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer min-w-0"
                    onClick={() => navigate(`/mandi-centers/${mandi.id}`)}
                  >
                    <span>{t('mandi.viewDetailsBtn')}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* =================  "SELECT YOUR VILLAGE" MODAL (PERMISSION DENIED FALLBACK) ================= */}
      {isVillageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-0 relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <span className="text-xl"></span>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    {t('mandi.villageModalTitle')}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {t('mandi.villageModalSubtitle')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsVillageModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl cursor-pointer"
                aria-label={t('common.close')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body Form */}
            <div className="p-6 space-y-4">
              {locationError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>{locationError}</span>
                </div>
              )}

              {/* State */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">{t('common.state')}</label>
                <input
                  type="text"
                  disabled
                  value={fallbackLocation.state}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-not-allowed"
                />
              </div>

              {/* District */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">{t('common.district')}</label>
                <input
                  type="text"
                  disabled
                  value={fallbackLocation.district}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-not-allowed"
                />
              </div>

              {/* Mandal Dropdown (16 official mandals) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {t('mandi.selectMandalLabel')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={fallbackLocation.mandal}
                    onChange={(e) => {
                      const newMandal = e.target.value;
                      const villages = getVillagesForMandal(newMandal);
                      const defaultVillage = villages[0] || '';
                      setFallbackLocation((prev) => ({
                        ...prev,
                        mandal: newMandal,
                        village: defaultVillage
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 cursor-pointer"
                  >
                    <option value="">{t('mandi.chooseMandal')}</option>
                    {KARIMNAGAR_ADMIN_HIERARCHY.map((m) => (
                      <option key={m.mandal} value={m.mandal}>
                        {t('mandi.mandalOptionText', { mandal: m.mandal, count: m.villages.length })}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Village Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {t('mandi.selectVillageLabel')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={fallbackLocation.village}
                    onChange={(e) =>
                      setFallbackLocation((prev) => ({ ...prev, village: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 cursor-pointer"
                  >
                    <option value="">{t('mandi.chooseVillage')}</option>
                    {villageOptions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold"
                onClick={() => setIsVillageModalOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="text-xs font-bold"
                onClick={() => {
                  setIsVillageModalOpen(false);
                  setViewMode('near');
                  setSelectedState('Telangana');
                  setSelectedDistrict('Karimnagar');
                  if (fallbackLocation.mandal) {
                    setSelectedMandal(fallbackLocation.mandal);
                  }
                  if (fallbackLocation.village) {
                    setSelectedVillage(fallbackLocation.village);
                  }
                  setDisambiguationOptions(null);
                }}
              >
                {t('mandi.applyLocation')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Slot Booking Modal */}
      <SlotBookingModal
        mandi={bookingMandi}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />

      {/* Dedicated Booking History Modal */}
      <BookingHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onBookNew={() => {
          setIsHistoryModalOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};

export default MandiCenters;
