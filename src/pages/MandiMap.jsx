import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  MapPin,
  Search,
  X,
  Compass,
  Grid,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { getMandis } from '../services/api';
import { useApp } from '../context/AppContext';

// Fix default marker icon assets for Leaflet in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom high-contrast marker icon for focused/selected mandi
const selectedMarkerIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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

export const MandiMap = () => {
  const navigate = useNavigate();
  const { t, language } = useApp();
  const [searchParams] = useSearchParams();
  const selectedIdFromUrl = searchParams.get('selected');

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const [showGrid, setShowGrid] = useState(true);

  // Real backend mandi records state
  const [mandisList, setMandisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationToast, setLocationToast] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [openOnly, setOpenOnly] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [activeMandiId, setActiveMandiId] = useState(
    selectedIdFromUrl ? parseInt(selectedIdFromUrl, 10) : null
  );

  // Fetch real mandis from MySQL backend via GET /api/mandis
  const fetchMandis = useCallback(async () => {
    try {
      const res = await getMandis();
      if (res.success && Array.isArray(res.data)) {
        // Step 5E: Display ONLY mandis where BOTH latitude and longitude are valid numbers
        const validMandis = res.data
          .filter((m) => m.latitude !== null && m.longitude !== null)
          .map((m) => {
            const lat = typeof m.latitude === 'number' ? m.latitude : parseFloat(m.latitude);
            const lng = typeof m.longitude === 'number' ? m.longitude : parseFloat(m.longitude);
            const openTimeStr = m.opening_time
              ? formatTime12h(m.opening_time)
              : (m.external?.operatingHours?.openingTime || '08:00 AM');
            const closeTimeStr = m.closing_time
              ? formatTime12h(m.closing_time)
              : (m.external?.operatingHours?.closingTime || '06:00 PM');

            return {
              id: m.id,
              name: m.name,
              state: m.state,
              district: m.district,
              mandal: m.mandal || null,
              village: m.village || null,
              center_type: m.center_type || null,
              location: m.location || `${m.district}, ${m.state}`,
              latitude: lat,
              longitude: lng,
              opening_time: m.opening_time,
              closing_time: m.closing_time,
              is_active: Boolean(m.is_active),
              source: m.source,
              hasCoordinates: true,
              external: {
                name: m.name,
                state: m.state,
                district: m.district,
                location: m.location || `${m.district}, ${m.state}`,
                coordinates: { latitude: lat, longitude: lng },
                operatingHours: {
                  openingTime: openTimeStr,
                  closingTime: closeTimeStr
                },
                commodities: m.external?.commodities || ['Wheat', 'Paddy', 'Pulses']
              },
              fallbackDistance: m.fallbackDistance || '15 km'
            };
          })
          .filter((m) => !isNaN(m.latitude) && !isNaN(m.longitude));

        setMandisList(validMandis);
        setHasError(false);
      } else {
        setHasError(true);
      }
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMandis();
  }, [fetchMandis]);

  // Set up global navigation bridge for Leaflet popup HTML buttons
  useEffect(() => {
    window.__agriNavigate = (path) => {
      navigate(path);
    };
    return () => {
      delete window.__agriNavigate;
    };
  }, [navigate]);

  // Request user coordinates for live distance calculation
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
          // Keep fallback distance if location unavailable
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

  // Geolocation trigger when farmer clicks "Find Near Me"
  const handleFindNearMe = () => {
    if (!navigator.geolocation) {
      setLocationToast(t('mandi.locationUnavailable'));
      return;
    }

    setIsLocating(true);
    setLocationToast(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const userCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setUserLocation(userCoords);
        if (mapInstance.current) {
          mapInstance.current.flyTo([userCoords.latitude, userCoords.longitude], 12, { duration: 1.5 });
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        if (err.code === 1) {
          setLocationToast(t('mandi.locationPermissionDenied'));
        } else {
          setLocationToast(t('mandi.locationUnavailable'));
        }
      }
    );
  };

  const checkMandiStatus = useCallback((mandi) => {
    const opening = mandi.external?.operatingHours?.openingTime || '08:00 AM';
    const closing = mandi.external?.operatingHours?.closingTime || '06:00 PM';
    const openMin = parseTimeToMinutes(opening);
    const closeMin = parseTimeToMinutes(closing);
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const isOpen = currentMinutes >= openMin && currentMinutes <= closeMin;
    return {
      isOpen,
      label: isOpen ? t('mandi.openNow') : t('mandi.closed'),
      shortLabel: isOpen ? t('common.open') : t('common.closed'),
      isActive: mandi.is_active !== false
    };
  }, [t]);

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

  const getMandiDistance = useCallback((mandi) => {
    if (!userLocation || !mandi?.latitude || !mandi?.longitude) return mandi.fallbackDistance;
    const dist = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      mandi.latitude,
      mandi.longitude
    );
    return `${dist.toFixed(1)} km`;
  }, [userLocation]);

  // Real dataset from MySQL with verified coordinates
  const activeMandis = mandisList;

  // Unique options for dropdown filters
  const states = useMemo(() => {
    return Array.from(new Set(activeMandis.map((m) => m.state))).sort();
  }, [activeMandis]);

  const districts = useMemo(() => {
    const filtered = selectedState
      ? activeMandis.filter((m) => m.state === selectedState)
      : activeMandis;
    return Array.from(new Set(filtered.map((m) => m.district))).sort();
  }, [activeMandis, selectedState]);

  const crops = useMemo(() => {
    const allCrops = activeMandis.flatMap((m) => m.external?.commodities || []);
    return Array.from(new Set(allCrops)).sort();
  }, [activeMandis]);

  // Filter mandis based on user search and filters
  const filteredMandis = useMemo(() => {
    return activeMandis.filter((mandi) => {
      const q = searchTerm.trim().toLowerCase();
      if (q) {
        const matchesName = mandi.name.toLowerCase().includes(q);
        const matchesDistrict = mandi.district.toLowerCase().includes(q);
        const matchesState = mandi.state.toLowerCase().includes(q);
        const matchesLocation = (mandi.location || '').toLowerCase().includes(q);
        const matchesCommodity = (mandi.external?.commodities || []).some((c) =>
          c.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesDistrict && !matchesState && !matchesLocation && !matchesCommodity) {
          return false;
        }
      }

      if (selectedState && mandi.state !== selectedState) {
        return false;
      }

      if (selectedDistrict && mandi.district !== selectedDistrict) {
        return false;
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
  }, [activeMandis, searchTerm, selectedState, selectedDistrict, openOnly, selectedCrop, checkMandiStatus]);

  const hasActiveFilters = Boolean(
    searchTerm || selectedState || selectedDistrict || openOnly || selectedCrop
  );

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedState('');
    setSelectedDistrict('');
    setOpenOnly(false);
    setSelectedCrop('');
  };

  // Initialize Map (Always mounted so container is available immediately)
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      // Default center covering Indian subcontinent
      const defaultCenter = [22.5, 78.9];
      const map = L.map(mapRef.current, {
        center: defaultCenter,
        zoom: 5,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstance.current = map;

      // Invalidate size shortly after mount to ensure tiles fill container
      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
        }
      }, 150);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update map markers whenever filteredMandis or activeMandiId changes
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear previous markers
    Object.values(markersRef.current).forEach((marker) => {
      marker.remove();
    });
    markersRef.current = {};

    const markerBounds = [];

    filteredMandis.forEach((mandi) => {
      // Strictly render markers ONLY when latitude and longitude are valid numbers
      if (
        typeof mandi.latitude !== 'number' ||
        typeof mandi.longitude !== 'number' ||
        isNaN(mandi.latitude) ||
        isNaN(mandi.longitude)
      ) {
        return;
      }

      const coords = [mandi.latitude, mandi.longitude];
      markerBounds.push(coords);

      const isSelected = activeMandiId === mandi.id;
      const status = checkMandiStatus(mandi);
      const distance = getMandiDistance(mandi);
      const openHoursText = `${mandi.external.operatingHours.openingTime} - ${mandi.external.operatingHours.closingTime}`;
      const googleMapsViewUrl = `https://www.google.com/maps/search/?api=1&query=${mandi.latitude},${mandi.longitude}`;
      const googleMapsDirUrl = `https://www.google.com/maps/dir/?api=1&destination=${mandi.latitude},${mandi.longitude}`;
      const commoditiesList = Array.isArray(mandi.external?.commodities)
        ? mandi.external.commodities.slice(0, 3).join(', ')
        : '';

      // Compact popup HTML with Google Maps view location & directions links
      const popupHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.4; min-width: 240px; padding: 2px;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
            <strong style="color: #1e293b; font-size: 14px; font-weight: 800;">
              🏪 ${mandi.name}
            </strong>
          </div>
          
          <div style="margin-bottom: 6px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            ${mandi.center_type ? `
            <span style="display: inline-block; padding: 2px 7px; border-radius: 9999px; font-size: 10px; font-weight: 800; background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;">
              ${mandi.center_type}
            </span>` : ''}
            <span style="display: inline-block; padding: 2px 7px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: ${
              status.isOpen ? '#ecfdf5' : '#fff1f2'
            }; color: ${status.isOpen ? '#059669' : '#e11d48'}; border: 1px solid ${
              status.isOpen ? '#a7f3d0' : '#fecdd3'
            };">
              ${status.isOpen ? `🟢 ${t('mandi.openNow')}` : `🔴 ${t('mandi.closed')}`}
            </span>
            ${distance ? `
            <span style="font-size: 11px; color: #0284c7; font-weight: 700; background-color: #f0f9ff; padding: 2px 6px; border-radius: 6px;">
              📍 ${distance}
            </span>` : ''}
            <span style="font-size: 10px; color: #059669; font-weight: 700; background-color: #f0fdf4; padding: 2px 6px; border-radius: 6px; border: 1px solid #bbf7d0;">
              ✓ ${t('mandi.verifiedGps')}
            </span>
          </div>

          <div style="font-size: 12px; color: #475569; margin-bottom: 8px;">
            <span style="display: block; margin-bottom: 2px;">
              <b>${t('mandi.popupLocation')}</b> ${mandi.location}
            </span>
            <span style="display: block; margin-bottom: 2px;">
              <b>${t('mandi.popupDistrict')}</b> ${mandi.district}, ${mandi.state}
            </span>
            <span style="display: block; margin-bottom: 2px;">
              <b>${t('mandi.popupHours')}</b> ${openHoursText}
            </span>
            ${commoditiesList ? `
            <span style="display: block; margin-bottom: 2px;">
              <b>${t('mandi.supportedCrops')}:</b> ${commoditiesList}
            </span>` : ''}
            <span style="display: block; font-size: 11px; color: #64748b;">
              <b>${t('mandi.popupSource')}</b> ${mandi.source || 'e-NAM / Agmarknet'}
            </span>
          </div>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 8px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; gap: 6px;">
              <a
                href="${googleMapsViewUrl}"
                target="_blank"
                rel="noopener noreferrer"
                style="flex: 1; text-align: center; background-color: #f8fafc; color: #334155; border: 1px solid #cbd5e1; padding: 6px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 4px;"
              >
                📍 ${t('mandi.viewLocation')}
              </a>
              <a
                href="${googleMapsDirUrl}"
                target="_blank"
                rel="noopener noreferrer"
                style="flex: 1; text-align: center; background-color: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; padding: 6px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 4px;"
              >
                🧭 ${t('mandi.directions')}
              </a>
            </div>
            <div style="display: flex; gap: 6px;">
              <button
                onclick="window.__agriNavigate('/book-slot?mandi=${mandi.id}')"
                style="flex: 1; text-align: center; background-color: #0284c7; color: white; border: none; padding: 6px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05);"
              >
                📅 ${t('mandi.bookSlot')}
              </button>
              <button
                onclick="window.__agriNavigate('/mandi-centers/${mandi.id}')"
                style="flex: 1; text-align: center; background-color: #16a34a; color: white; border: none; padding: 6px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05);"
              >
                ${t('mandi.viewDetails')} →
              </button>
            </div>
          </div>
        </div>
      `;

      const marker = L.marker(coords, {
        icon: isSelected ? selectedMarkerIcon : new L.Icon.Default()
      })
        .addTo(mapInstance.current)
        .bindPopup(popupHtml, {
          closeButton: true,
          offset: [0, -5]
        });

      marker.on('click', () => {
        setActiveMandiId(mandi.id);
      });

      markersRef.current[mandi.id] = marker;
    });

    // If an active mandi is specified, center on it and open popup
    if (activeMandiId && markersRef.current[activeMandiId]) {
      const activeMandi = activeMandis.find((m) => m.id === activeMandiId);
      if (activeMandi && typeof activeMandi.latitude === 'number' && typeof activeMandi.longitude === 'number') {
        const coords = [activeMandi.latitude, activeMandi.longitude];
        mapInstance.current.setView(coords, 13, { animate: true });
        markersRef.current[activeMandiId].openPopup();
      }
    } else if (markerBounds.length > 0 && !activeMandiId) {
      // Fit all markers in view smoothly
      const bounds = L.latLngBounds(markerBounds);
      mapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
    }

    // Refresh size whenever markers update
    setTimeout(() => {
      if (mapInstance.current) mapInstance.current.invalidateSize();
    }, 100);
  }, [activeMandis, filteredMandis, activeMandiId, checkMandiStatus, getMandiDistance, language, t]);

  const handleFocusMandi = (mandi) => {
    setActiveMandiId(mandi.id);
    if (mapInstance.current && markersRef.current[mandi.id] && mandi.latitude && mandi.longitude) {
      const coords = [mandi.latitude, mandi.longitude];
      mapInstance.current.flyTo(coords, 13, { duration: 1 });
      markersRef.current[mandi.id].openPopup();
    }
  };

  const handleRecenterAll = () => {
    setActiveMandiId(null);
    if (mapInstance.current) {
      const validPoints = filteredMandis
        .filter((m) => typeof m.latitude === 'number' && typeof m.longitude === 'number' && !isNaN(m.latitude))
        .map((m) => [m.latitude, m.longitude]);
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        mapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
      }
    }
  };

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-300">
      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="map">🗺️</span>
            <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-slate-800 tracking-tight">
              {t('mandi.mapHeading')}
            </h1>
          </div>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {t('mandi.mapSubtitle')}
          </p>
        </div>

        {/* Link / Button to Mandi Centers Page */}
        <Button
          variant="primary"
          className="shrink-0 self-start sm:self-center font-bold text-sm shadow-xs"
          onClick={() => navigate('/mandi-centers')}
        >
          🏪 {t('mandi.viewAllCenters')}
        </Button>
      </div>

      {/* Geolocation / Alert Toast Banner */}
      {locationToast && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>{locationToast}</span>
          </div>
          <button
            onClick={() => setLocationToast(null)}
            className="p-1 text-amber-600 hover:text-amber-800 rounded cursor-pointer"
            aria-label={t('common.close')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ORGANIZED CONTROLS, MAP & QUICK JUMP */}
      <div className="flex flex-col gap-4">
        {/* SEARCH BAR */}
        <div className="order-1">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('mandi.mapSearchPlaceholder')}
              className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-2xs transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                aria-label={t('mandi.clearSearch')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* FILTERS SECTION */}
        <div className="order-3 md:order-2">
          <Card className="p-3 border-slate-200 shadow-2xs bg-white">
            <div className="flex flex-wrap items-center gap-2">
              {/* State Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                <span className="text-slate-400">📍 {t('mandi.filterState')}:</span>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedDistrict('');
                  }}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="">{t('mandi.allStatesWithCount', { count: states.length })}</option>
                  {states.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* District Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                <span className="text-slate-400">📍 {t('mandi.filterDistrict')}:</span>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="">{t('mandi.allDistrictsWithCount', { count: districts.length })}</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Crop Filter */}
              {crops.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                  <span className="text-slate-400">🌾 {t('mandi.filterCrop')}:</span>
                  <select
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="">{t('mandi.allCrops')}</option>
                    {crops.map((c) => (
                      <option key={c} value={c}>{c}</option>
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
                <span>🟢 {t('mandi.openNow')}</span>
              </button>

              {/* Reset Filter Button */}
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-colors ml-auto cursor-pointer flex items-center gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  {t('mandi.clearFilters')}
                </button>
              )}
            </div>
          </Card>
        </div>

        {/* MAP CONTAINER (Always rendered so Leaflet has its container immediately) */}
        <div className="order-2 md:order-3">
          <Card className="p-0 overflow-hidden border-slate-200 shadow-sm rounded-2xl relative bg-slate-100">
            {/* Map Top Status Bar */}
            <div className="p-3.5 bg-white border-b border-slate-100 flex items-center justify-between gap-2 z-10 relative">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary-600" />
                <span className="font-heading font-bold text-slate-800 text-xs md:text-sm">
                  {t('mandi.interactiveMapTitle')}
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  {loading ? t('common.loading') : t('mandi.verifiedCentersMapped', { count: filteredMandis.length })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                    showGrid
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                  title={t('mandi.toggleGridTitle')}
                >
                  <Grid className="h-3.5 w-3.5" />
                  <span>{t('mandi.grid', { status: showGrid ? t('mandi.gridOn') : t('mandi.gridOff') })}</span>
                </button>

                <button
                  onClick={handleRecenterAll}
                  className="text-xs font-bold text-slate-600 hover:text-primary-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title={t('mandi.recenterTitle')}
                >
                  <Compass className="h-3.5 w-3.5 text-primary-600" />
                  <span>{t('mandi.fitAllMarkers')}</span>
                </button>

                <button
                  onClick={handleFindNearMe}
                  disabled={isLocating}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  title={t('mandi.findNearMe')}
                >
                  {isLocating ? (
                    <Loader2 className="h-3.5 w-3.5 text-emerald-600 animate-spin" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  )}
                  <span>{isLocating ? t('mandi.locating') : t('mandi.findNearMe')}</span>
                </button>
              </div>
            </div>

            {/* Leaflet Map Div with Visual Section Grid Overlay */}
            <div className="w-full h-[450px] md:h-[560px] relative overflow-hidden">
              {/* Leaflet Map DOM Element */}
              <div ref={mapRef} className="absolute inset-0 w-full h-full z-0" />

              {/* Loading Overlay */}
              {loading && (
                <div className="absolute inset-0 z-[500] bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-800">{t('mandi.loadingMarkers')}</p>
                </div>
              )}

              {/* Error Overlay */}
              {hasError && !loading && (
                <div className="absolute inset-0 z-[500] bg-white/90 backdrop-blur-[2px] flex flex-col items-center justify-center space-y-2 p-4 text-center">
                  <AlertCircle className="h-8 w-8 text-rose-500" />
                  <p className="text-xs font-bold text-rose-800">{t('mandi.errorLoadingMap')}</p>
                  <Button variant="primary" size="sm" onClick={fetchMandis} className="text-xs font-bold flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" />
                    <span>{t('mandi.retryConnection')}</span>
                  </Button>
                </div>
              )}

              {/* Subtle Geographic Grid Overlay (pointer-events-none so map is fully interactive) */}
              {showGrid && (
                <div
                  className="absolute inset-0 pointer-events-none z-[400] grid grid-cols-4 grid-rows-3"
                  aria-hidden="true"
                >
                  {Array.from({ length: 12 }).map((_, idx) => {
                    const row = Math.floor(idx / 4);
                    const col = idx % 4;
                    const sectorCode = `${String.fromCharCode(65 + row)}${col + 1}`;
                    return (
                      <div
                        key={idx}
                        className={`relative border-slate-700/20 ${col < 3 ? 'border-r' : ''} ${row < 2 ? 'border-b' : ''} p-2 flex items-start justify-between`}
                      >
                        <span className="text-[10px] font-mono font-bold text-slate-700/60 bg-white/70 px-1.5 py-0.5 rounded shadow-2xs border border-slate-300/60 backdrop-blur-[1px] select-none">
                          {t('mandi.sectorLabel', { code: sectorCode })}
                        </span>
                        <span className="text-xs text-emerald-800/40 font-mono select-none leading-none font-medium">
                          +
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* QUICK MANDI JUMP CONTROLS */}
        <div className="order-4">
          <Card className="p-4 border-slate-200 shadow-2xs bg-white space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>📍 {t('mandi.quickJump')}</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                  {filteredMandis.length}
                </span>
              </span>

              {hasActiveFilters && (
                <span className="text-[11px] font-semibold text-slate-500">
                  {t('mandi.quickJumpHint')}
                </span>
              )}
            </div>

            {filteredMandis.length === 0 ? (
              <div className="text-xs text-slate-500 py-2 flex items-center justify-between">
                <span>{t('mandi.noMarkersMatch')}</span>
                <button
                  onClick={resetFilters}
                  className="text-primary-600 font-bold hover:underline cursor-pointer"
                >
                  {t('mandi.resetFiltersToShowAll')}
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-0.5">
                {filteredMandis.map((mandi) => {
                  const isSelected = activeMandiId === mandi.id;
                  const status = checkMandiStatus(mandi);
                  return (
                    <button
                      key={mandi.id}
                      onClick={() => handleFocusMandi(mandi)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <span>🏪 {mandi.name}</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        ({mandi.district}, {mandi.state})
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : status.isOpen
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {status.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
