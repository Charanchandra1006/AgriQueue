import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createFarmer, getFarmer, updateFarmer, getActiveBooking, createBooking, cancelBooking, getActiveTransportBooking } from '../services/api';
import { translate, getLocaleCode } from '../i18n';

const AppContext = createContext();

const defaultNotifications = [
  {
    id: 1,
    titleKey: "alerts.slotBookingConfirmedTitle",
    messageKey: "alerts.slotBookingConfirmedMsg",
    title: "Slot Booking Confirmed",
    message: "Your paddy procurement slot has been scheduled. Check your dashboard for the active token pass.",
    type: "success",
    time: "2 hours ago",
    read: false
  },
  {
    id: 2,
    titleKey: "alerts.weatherAlertTitle",
    messageKey: "alerts.weatherAlertMsg",
    title: "Weather Warning: Rain Alert",
    message: "Light to moderate rain is expected in Patiala district in the next 24 hours. Cover your harvested produce.",
    type: "warning",
    time: "5 hours ago",
    read: false
  },
  {
    id: 3,
    titleKey: "alerts.schemeAlertTitle",
    messageKey: "alerts.schemeAlertMsg",
    title: "New Government Scheme Alert",
    message: "PM-Kisan 19th Installment released. Click to check your disbursement status.",
    type: "info",
    time: "1 day ago",
    read: true
  }
];

const EMPTY_PROFILE = {
  name: '',
  phone: '',
  farmerId: '',
  state: '',
  district: '',
  village: '',
  preferredLanguage: 'en',
  activeToken: null,
  farmersAhead: 0,
  estimatedWait: null,
  mandiName: null,
  crop: null,
  slotStatus: null,
  slotTime: null
};

export const AppProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('agri_language') || 'en';
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('agri_auth') === 'true';
  });

  const [isProfileCompleted, setIsProfileCompleted] = useState(() => {
    return localStorage.getItem('agri_profile_completed') === 'true';
  });

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('agri_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clean out any legacy mock token fallback
        if (parsed.activeToken === 'AQ-2026-8849') {
          parsed.activeToken = null;
          parsed.farmersAhead = 0;
          parsed.estimatedWait = null;
          parsed.mandiName = null;
          parsed.crop = null;
          parsed.slotStatus = null;
          parsed.slotTime = null;
        }
        // Sanitize legacy stock photos from saved profile
        if (parsed.avatarUrl && parsed.avatarUrl.includes('unsplash.com')) {
          delete parsed.avatarUrl;
        }
        if (parsed.farmerId === 'undefined') {
          parsed.farmerId = '';
        }
        return { ...EMPTY_PROFILE, ...parsed };
      } catch (e) {
        console.error("Failed to parse agri_profile:", e);
      }
    }
    return EMPTY_PROFILE;
  });

  // Active booking from real backend
  const [activeBooking, setActiveBooking] = useState(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(false);

  // Active transport booking state from real backend
  const [activeTransport, setActiveTransport] = useState(null);
  const [isLoadingTransport, setIsLoadingTransport] = useState(false);

  const [notifications, setNotifications] = useState(defaultNotifications);

  /**
   * Refreshes active booking from MySQL backend
   */
  const refreshActiveBooking = useCallback(async (farmerIdentifier) => {
    const idToUse = farmerIdentifier || profile?.farmerId || profile?.phone;
    if (!idToUse) return;

    setIsLoadingBooking(true);
    try {
      const res = await getActiveBooking(idToUse);
      if (res.success && res.data) {
        setActiveBooking(res.data);
        setProfile(prev => {
          const updated = {
            ...prev,
            activeToken: res.data.tokenNumber,
            activeBookingId: res.data.bookingId,
            farmersAhead: res.data.queue.farmersAhead,
            estimatedWait: res.data.queue.estimatedWait,
            mandiName: res.data.mandi.name,
            crop: res.data.cropName,
            quantity: res.data.estimatedQuantity,
            slotStatus: "Confirmed",
            slotTime: `${res.data.slot.displayDate}, ${res.data.slot.formattedTime}`
          };
          localStorage.setItem('agri_profile', JSON.stringify(updated));
          return updated;
        });
      } else {
        setActiveBooking(null);
        setProfile(prev => {
          const updated = {
            ...prev,
            activeToken: null,
            activeBookingId: null,
            farmersAhead: 0,
            estimatedWait: null,
            mandiName: null,
            crop: null,
            quantity: null,
            slotStatus: null,
            slotTime: null
          };
          localStorage.setItem('agri_profile', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.warn("Could not load active booking from backend:", err);
    } finally {
      setIsLoadingBooking(false);
    }
  }, [profile?.farmerId, profile?.phone]);

  /**
   * Refreshes active transport booking from MySQL backend
   */
  const refreshActiveTransport = useCallback(async (farmerIdentifier) => {
    const idToUse = farmerIdentifier || profile?.farmerId || profile?.phone;
    if (!idToUse) return;

    setIsLoadingTransport(true);
    try {
      const res = await getActiveTransportBooking(idToUse);
      if (res.success && res.data) {
        setActiveTransport(res.data);
      } else {
        setActiveTransport(null);
      }
    } catch (err) {
      console.warn("Could not load active transport from backend:", err);
      setActiveTransport(null);
    } finally {
      setIsLoadingTransport(false);
    }
  }, [profile?.farmerId, profile?.phone]);

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    localStorage.setItem('agri_language', lang);
  }, []);

  // Load active booking and transport on startup if logged in, and sync profile if needed
  useEffect(() => {
    if (isAuthenticated) {
      const idToUse = profile?.farmerId || profile?.phone;
      if (idToUse) {
        // If farmerId is missing, empty, or dummy, sync with backend
        if (!profile?.farmerId || profile.farmerId === 'HR-KAR-2026-0849') {
          getFarmer(profile?.phone || idToUse).then(res => {
            if (res.success && res.data) {
              setProfile(prev => {
                const updated = {
                  ...EMPTY_PROFILE,
                  ...(prev || {}),
                  name: res.data.name || prev?.name,
                  phone: res.data.phone || prev?.phone,
                  farmerId: res.data.farmer_id || prev?.farmerId,
                  state: res.data.state || prev?.state,
                  district: res.data.district || prev?.district,
                  village: res.data.village || prev?.village,
                  preferredLanguage: res.data.preferred_language || prev?.preferredLanguage || language
                };
                localStorage.setItem('agri_profile', JSON.stringify(updated));
                return updated;
              });
              if (res.data.preferred_language) {
                setLanguage(res.data.preferred_language);
              }
            }
          }).catch(err => {
            console.warn("Startup farmer profile sync failed:", err);
          });
        }
        refreshActiveBooking(idToUse);
        refreshActiveTransport(idToUse);
      }
    }
  }, [isAuthenticated, refreshActiveBooking, refreshActiveTransport, profile?.farmerId, profile?.phone, setLanguage, language]);

  /**
   * Completes farmer onboarding registration, saving to MySQL
   */
  const completeRegistration = async (farmerData) => {
    const finalData = {
      name: farmerData.name,
      phone: farmerData.phone,
      state: farmerData.state,
      district: farmerData.district,
      village: farmerData.village,
      preferred_language: language
    };

    let createdId = null;

    try {
      const res = await createFarmer(finalData);
      if (res.success && res.data) {
        createdId = res.data.farmer_id;
      } else if (res.existingFarmer?.farmer_id) {
        createdId = res.existingFarmer.farmer_id;
      }
    } catch (err) {
      console.error("Failed to register farmer in backend:", err);
    }

    const newProfile = {
      name: farmerData.name,
      phone: farmerData.phone,
      farmerId: createdId || (farmerData.state ? `${farmerData.state.substring(0, 2).toUpperCase()}-${farmerData.phone.slice(-4)}` : `AQ-${farmerData.phone.slice(-4)}`),
      state: farmerData.state,
      district: farmerData.district,
      village: farmerData.village,
      preferredLanguage: language,
      activeToken: null,
      farmersAhead: 0,
      estimatedWait: null,
      mandiName: null,
      crop: null,
      slotStatus: null,
      slotTime: null
    };

    setProfile(newProfile);
    setIsProfileCompleted(true);
    setIsAuthenticated(true);

    localStorage.setItem('agri_profile', JSON.stringify(newProfile));
    localStorage.setItem('agri_profile_completed', 'true');
    localStorage.setItem('agri_auth', 'true');

    await refreshActiveBooking(newProfile.farmerId);
  };

  /**
   * Directly sets up an authenticated session from an existing farmer record
   */
  const loginSession = async (farmerRecordOrPhone, optionalPhone) => {
    setIsAuthenticated(true);
    setIsProfileCompleted(true);
    localStorage.setItem('agri_auth', 'true');
    localStorage.setItem('agri_profile_completed', 'true');

    let farmerRecord = null;
    let phone = null;

    if (farmerRecordOrPhone && typeof farmerRecordOrPhone === 'object') {
      farmerRecord = farmerRecordOrPhone;
      phone = optionalPhone || farmerRecord.phone;
    } else if (typeof farmerRecordOrPhone === 'string') {
      phone = farmerRecordOrPhone;
    } else if (optionalPhone) {
      phone = optionalPhone;
    }

    // If farmerRecord doesn't have farmer_id / farmerId, fetch it from backend using phone
    if ((!farmerRecord?.farmer_id && !farmerRecord?.farmerId) && phone) {
      try {
        const res = await getFarmer(phone);
        if (res.success && res.data) {
          farmerRecord = res.data;
        }
      } catch (err) {
        console.warn('Failed to load farmer record on loginSession:', err);
      }
    }

    if (farmerRecord) {
      const resolvedFarmerId = farmerRecord.farmer_id || farmerRecord.farmerId;
      const cleanProfile = {
        name: farmerRecord.name || 'Farmer',
        phone: farmerRecord.phone || phone || '',
        farmerId: resolvedFarmerId || (phone ? `AQ-${phone.slice(-4)}` : ''),
        state: farmerRecord.state || '',
        district: farmerRecord.district || '',
        village: farmerRecord.village || '',
        preferredLanguage: farmerRecord.preferred_language || farmerRecord.preferredLanguage || language,
        activeToken: null,
        farmersAhead: 0,
        estimatedWait: null,
        mandiName: null,
        crop: null,
        slotStatus: null,
        slotTime: null
      };

      setProfile(cleanProfile);
      localStorage.setItem('agri_profile', JSON.stringify(cleanProfile));

      if (cleanProfile.preferredLanguage) {
        setLanguage(cleanProfile.preferredLanguage);
      }

      if (cleanProfile.farmerId) {
        await refreshActiveBooking(cleanProfile.farmerId);
        await refreshActiveTransport(cleanProfile.farmerId);
      }
      return cleanProfile;
    }

    // Fallback if record not yet available in MySQL
    const fallbackProfile = {
      name: profile?.name || 'Farmer',
      phone: phone || profile?.phone || '',
      farmerId: profile?.farmerId || (phone ? `AQ-${phone.slice(-4)}` : ''),
      state: profile?.state || '',
      district: profile?.district || '',
      village: profile?.village || '',
      preferredLanguage: language,
      activeToken: null,
      farmersAhead: 0,
      estimatedWait: null,
      mandiName: null,
      crop: null,
      slotStatus: null,
      slotTime: null
    };

    setProfile(fallbackProfile);
    localStorage.setItem('agri_profile', JSON.stringify(fallbackProfile));
    if (fallbackProfile.farmerId) {
      await refreshActiveBooking(fallbackProfile.farmerId);
      await refreshActiveTransport(fallbackProfile.farmerId);
    }
    return fallbackProfile;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('agri_auth');
    localStorage.removeItem('agri_profile');
    setActiveBooking(null);
    setActiveTransport(null);
    setProfile(EMPTY_PROFILE);
  };

  const t = useCallback((key, params) => {
    return translate(language, key, params);
  }, [language]);

  const updateProfile = (updates) => {
    setProfile(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('agri_profile', JSON.stringify(updated));
      return updated;
    });
    if (updates.preferred_language && updates.preferred_language !== language) {
      setLanguage(updates.preferred_language);
    }
    if (updates.preferredLanguage && updates.preferredLanguage !== language) {
      setLanguage(updates.preferredLanguage);
    }
    // Synchronize to MySQL if farmerId exists
    const idToUpdate = profile?.farmerId || updates.farmerId;
    if (idToUpdate) {
      updateFarmer(idToUpdate, {
        name: updates.name,
        state: updates.state,
        district: updates.district,
        village: updates.village,
        preferred_language: updates.preferred_language || updates.preferredLanguage
      }).catch(err => {
        console.warn('Backend farmer update sync failed:', err);
      });
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  /**
   * Books a real slot in MySQL via POST /api/bookings and updates active state
   */
  const bookSlot = async ({ mandiId, mandiName: _mandiName, crop, date, timeSlot, quantity }) => {
    try {
      const res = await createBooking({
        farmerId: profile?.farmerId || profile?.phone,
        mandiId,
        cropName: crop,
        slotDate: date,
        timeSlot,
        quantity: quantity || 40
      });

      if (res.success && res.data) {
        setActiveBooking(res.data);
        const updated = {
          ...profile,
          activeToken: res.data.tokenNumber,
          activeBookingId: res.data.bookingId,
          farmersAhead: res.data.queue.farmersAhead,
          estimatedWait: res.data.queue.estimatedWait,
          mandiName: res.data.mandi.name,
          crop: res.data.cropName,
          quantity: res.data.estimatedQuantity,
          slotStatus: "Confirmed",
          slotTime: `${res.data.slot.displayDate}, ${res.data.slot.formattedTime}`
        };
        setProfile(updated);
        localStorage.setItem('agri_profile', JSON.stringify(updated));
        return res.data;
      }
    } catch (err) {
      console.error('Failed to create booking in backend:', err);
    }

    return null;
  };

  /**
   * Cancels the active booking in MySQL and resets active state
   */
  const cancelSlot = async () => {
    if (activeBooking?.id || activeBooking?.bookingId) {
      try {
        await cancelBooking(activeBooking.id || activeBooking.bookingId);
      } catch (err) {
        console.warn('Failed to cancel on backend:', err);
      }
    }

    setActiveBooking(null);
    const updated = {
      ...profile,
      activeToken: null,
      activeBookingId: null,
      farmersAhead: 0,
      estimatedWait: null,
      mandiName: null,
      crop: null,
      quantity: null,
      slotStatus: null,
      slotTime: null
    };
    setProfile(updated);
    localStorage.setItem('agri_profile', JSON.stringify(updated));
    return updated;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider value={{
      language,
      setLanguage,
      isAuthenticated,
      isProfileCompleted,
      completeRegistration,
      loginSession,
      logout,
      profile,
      setProfile,
      updateProfile,
      activeBooking,
      isLoadingBooking,
      refreshActiveBooking,
      activeTransport,
      setActiveTransport,
      isLoadingTransport,
      refreshActiveTransport,
      bookSlot,
      cancelSlot,
      notifications,
      setNotifications,
      t,
      getLocale: () => getLocaleCode(language),
      locale: getLocaleCode(language),
      unreadCount,
      markAllNotificationsAsRead,
      clearNotification
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
