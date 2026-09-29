import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  User,
  Phone,
  Edit3,
  X,
  Loader2,
  Check,
  Info
} from 'lucide-react';
import {
  createTransportBooking,
  assignTransportDemoDriver,
  stepTransportStatus,
  cancelTransportBooking
} from '../services/api';
import {
  KARIMNAGAR_ADMIN_HIERARCHY,
  getVillagesForMandal
} from '../data/karimnagarHierarchy';

// Exactly 3 allowed vehicles (id preserved for API/database contracts)
const VEHICLE_OPTIONS = [
  {
    id: 'Tractor Trolley',
    key: 'tractorTrolley',
    emoji: '🚜'
  },
  {
    id: 'Small Commercial Truck (Chota Hathi)',
    key: 'chotaHathi',
    emoji: '🚚'
  },
  {
    id: 'Heavy Duty 6-Wheeler Truck',
    key: 'heavyTruck',
    emoji: '🚛'
  }
];

// 5-Stage Farmer Progress Lifecycle
const PROGRESS_STEPS = [
  { key: 'REQUESTED', icon: '📝' },
  { key: 'DRIVER_ASSIGNED', icon: '👨🌾' },
  { key: 'DRIVER_ARRIVING', icon: '🚚' },
  { key: 'CROP_PICKED_UP', icon: '🌾' },
  { key: 'COMPLETED', icon: '✅' }
];

export const BookTransport = () => {
  const navigate = useNavigate();
  const {
    profile,
    activeBooking,
    isLoadingBooking,
    activeTransport,
    setActiveTransport,
    refreshActiveTransport,
    t
  } = useApp();

  // Localized vehicle helper functions
  const getVehicleName = useCallback((id) => {
    if (id === 'Tractor Trolley') return t('transport.vehicles.tractorTrolley.name');
    if (id === 'Small Commercial Truck (Chota Hathi)') return t('transport.vehicles.chotaHathi.name');
    if (id === 'Heavy Duty 6-Wheeler Truck') return t('transport.vehicles.heavyTruck.name');
    return id;
  }, [t]);

  const getVehicleCapacity = useCallback((key) => {
    return t(`transport.vehicles.${key}.capacity`);
  }, [t]);

  const getVehicleSuitable = useCallback((key) => {
    return t(`transport.vehicles.${key}.suitableFor`);
  }, [t]);

  const getVehicleFeatures = useCallback((key) => {
    return [
      t(`transport.vehicles.${key}.features.0`),
      t(`transport.vehicles.${key}.features.1`),
      t(`transport.vehicles.${key}.features.2`)
    ];
  }, [t]);

  const getStatusLabel = useCallback((statusKey) => {
    return t(`transport.status.${statusKey}.label`) || statusKey;
  }, [t]);

  const getStatusDesc = useCallback((statusKey) => {
    return t(`transport.status.${statusKey}.desc`) || '';
  }, [t]);

  // Booking Form State
  const [vehicleType, setVehicleType] = useState('Tractor Trolley');
  const [cropName, setCropName] = useState(activeBooking?.cropName || 'Paddy');
  const [quantity, setQuantity] = useState(activeBooking?.estimatedQuantity ? String(activeBooking.estimatedQuantity) : '25');
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);

  // Pickup Location State (Prefilled from farmer profile)
  const [pickupLocation, setPickupLocation] = useState({
    village: profile?.village || 'Thimmapur',
    mandal: profile?.district === 'Karimnagar' ? 'Thimmapur' : '',
    district: profile?.district || 'Karimnagar',
    state: profile?.state || 'Telangana'
  });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Scheduling State (Prefilled from mandi booking)
  const [pickupDate, setPickupDate] = useState(() => {
    if (activeBooking?.slot?.date) {
      return String(activeBooking.slot.date).split('T')[0];
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  const [pickupTime, setPickupTime] = useState(() => {
    return activeBooking?.slot?.formattedTime || 'Morning (08:00 AM – 10:00 AM)';
  });

  // Submission & Action Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Location Selector Form inside Modal
  const [tempState, setTempState] = useState('');
  const [tempDistrict, setTempDistrict] = useState('');
  const [tempMandal, setTempMandal] = useState('');
  const [tempVillage, setTempVillage] = useState('');

  // Sync state with activeBooking if it arrives asynchronously
  useEffect(() => {
    if (activeBooking) {
      if (activeBooking.cropName) {
        setCropName(activeBooking.cropName);
      }
      if (activeBooking.estimatedQuantity) {
        setQuantity(String(activeBooking.estimatedQuantity));
      }
      if (activeBooking.slot?.date) {
        setPickupDate(String(activeBooking.slot.date).split('T')[0]);
      }
      if (activeBooking.slot?.formattedTime) {
        setPickupTime(activeBooking.slot.formattedTime);
      }
    }
  }, [activeBooking]);

  // Sync location with profile if profile arrives asynchronously
  useEffect(() => {
    if (profile?.village || profile?.district) {
      setPickupLocation({
        village: profile.village || 'Thimmapur',
        mandal: profile.district === 'Karimnagar' ? 'Thimmapur' : '',
        district: profile.district || 'Karimnagar',
        state: profile.state || 'Telangana'
      });
    }
  }, [profile]);

  // Open Location Modal with current values
  const handleOpenLocationModal = () => {
    setTempState(pickupLocation.state || profile?.state || 'Telangana');
    setTempDistrict(pickupLocation.district || profile?.district || 'Karimnagar');
    setTempMandal(pickupLocation.mandal || '');
    setTempVillage(pickupLocation.village || profile?.village || '');
    setIsLocationModalOpen(true);
  };

  // Save new pickup location
  const handleSaveLocation = (e) => {
    e.preventDefault();
    if (!tempVillage.trim()) return;
    setPickupLocation({
      village: tempVillage.trim(),
      mandal: tempMandal.trim(),
      district: tempDistrict || 'Karimnagar',
      state: tempState || 'Telangana'
    });
    setIsLocationModalOpen(false);
  };

  // Form Submission Handler: Initial status MUST be REQUESTED
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!activeBooking) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const numQty = parseFloat(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      setSubmitError(t('transport.errors.invalidQuantity'));
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        farmerId: profile?.farmerId || profile?.phone,
        mandiBookingId: activeBooking.id || activeBooking.bookingId,
        vehicleType,
        cropName: cropName.trim() || activeBooking.cropName || 'Paddy',
        estimatedQuantity: numQty,
        pickupVillage: pickupLocation.village,
        pickupMandal: pickupLocation.mandal,
        pickupDistrict: pickupLocation.district,
        pickupState: pickupLocation.state,
        pickupDate,
        pickupTime,
        notes: `Haulage for Mandi Token ${activeBooking.tokenNumber || 'Active'}`
      };

      const res = await createTransportBooking(payload);

      if (res.success && res.data) {
        setActiveTransport(res.data);
      } else {
        setSubmitError(res.message || t('transport.errors.submitFailed'));
      }
    } catch (err) {
      setSubmitError(err?.message || t('transport.errors.networkError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo Simulation Action: System assigns demo driver
  const handleAssignDemoDriver = async () => {
    if (!activeTransport) return;
    setIsActionLoading(true);
    try {
      const res = await assignTransportDemoDriver(activeTransport.id || activeTransport.transportBookingId);
      if (res.success && res.data) {
        setActiveTransport(res.data);
      }
    } catch (err) {
      console.warn('Failed to assign demo driver:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Demo Simulation Action: Step progress forward
  const handleStepStatus = async (targetStatus) => {
    if (!activeTransport) return;
    setIsActionLoading(true);
    try {
      const res = await stepTransportStatus(activeTransport.id || activeTransport.transportBookingId, targetStatus);
      if (res.success && res.data) {
        setActiveTransport(res.data);
      }
    } catch (err) {
      console.warn('Failed to step status:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Cancel booking
  const handleCancelBooking = async () => {
    if (!activeTransport) return;
    if (!window.confirm(t('transport.errors.cancelConfirm'))) return;
    setIsActionLoading(true);
    try {
      await cancelTransportBooking(activeTransport.id || activeTransport.transportBookingId);
      await refreshActiveTransport();
    } catch (err) {
      console.warn('Failed to cancel transport:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Compute active step index for progress tracker
  const currentStatus = activeTransport?.transportStatus || 'REQUESTED';
  const currentStepIndex = useMemo(() => {
    const idx = PROGRESS_STEPS.findIndex(s => s.key === currentStatus);
    return idx >= 0 ? idx : 0;
  }, [currentStatus]);

  // If loading booking from backend
  if (isLoadingBooking) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3 animate-in fade-in">
        <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
        <p className="text-sm font-bold text-slate-700">{t('transport.checkingBooking')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-14 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="tractor">🚜</span>
            <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-slate-900 tracking-tight">
              {t('transport.pageTitle')}
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            {t('transport.pageSubtitle')}
          </p>
        </div>

        {activeBooking && (
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{t('transport.mandiTokenBadge')}</span>
              <span className="font-mono font-black">{activeBooking.tokenNumber}</span>
            </span>
          </div>
        )}
      </div>

      {/* ================= CASE 1: NO CONFIRMED MANDI BOOKING ================= */}
      {!activeBooking ? (
        <Card className="p-8 sm:p-12 text-center bg-gradient-to-br from-amber-50/40 via-white to-slate-50 border border-amber-200 rounded-3xl shadow-xs max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-200">
          <div className="h-16 w-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-2xs">
            ⚠️
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-widest block">
              {t('transport.prerequisite.badge')}
            </span>
            <h2 className="font-heading font-black text-slate-900 text-xl sm:text-2xl">
              {t('transport.prerequisite.title')}
            </h2>
            <p className="text-sm text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
              {t('transport.prerequisite.desc')}
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 text-left space-y-2 max-w-md mx-auto text-xs text-slate-600">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <span>🌾</span>
              <span>{t('transport.prerequisite.whyTitle')}</span>
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-500 font-medium">
              <li>{t('transport.prerequisite.point1')}</li>
              <li>{t('transport.prerequisite.point2')}</li>
              <li>{t('transport.prerequisite.point3')}</li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto px-6 py-3 font-bold text-sm shadow-md"
              onClick={() => navigate('/mandi-centers')}
            >
              <span>🏪 {t('transport.prerequisite.bookSlotBtn')}</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-6 py-3 font-bold text-sm border-slate-300"
              onClick={() => navigate('/')}
            >
              {t('transport.prerequisite.returnDashboardBtn')}
            </Button>
          </div>
        </Card>
      ) : activeTransport && activeTransport.transportStatus !== 'CANCELLED' ? (
        /* ================= CASE 2: ACTIVE TRANSPORT BOOKING DISPLAY ================= */
        <div className="space-y-6 animate-in zoom-in-95 duration-200">
          {/* Confirmation Banner */}
          <div className="p-5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-3xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl text-white backdrop-blur-xs shrink-0">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-200">
                    {t('transport.active.serviceTitle')}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white text-emerald-800 shadow-2xs">
                    {getStatusLabel(activeTransport.transportStatus)}
                  </span>
                </div>
                <h2 className="font-heading font-black text-xl sm:text-2xl mt-0.5">
                  🚜 {t('transport.active.bookedTitle')}
                </h2>
                <p className="text-xs text-emerald-100 font-medium mt-0.5">
                  {t('transport.active.referenceId', { id: activeTransport.transportBookingId })}
                </p>
              </div>
            </div>

            {/* Simulated Demo Driver Badge */}
            <div className="text-right self-start sm:self-center">
              <span className="px-3 py-1 bg-white/15 border border-white/20 rounded-full text-[11px] font-semibold text-emerald-100 block">
                🧪 {t('transport.active.demoPool')}
              </span>
            </div>
          </div>

          {/* 5-Step Progress Tracker */}
          <Card className="p-5 sm:p-6 border-slate-200 shadow-xs rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6">
              <div>
                <h3 className="font-heading font-bold text-sm text-slate-800 uppercase tracking-wider">
                  {t('transport.active.lifecycleTitle')}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {t('transport.active.lifecycleDesc')}
                </p>
              </div>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {t('transport.active.stepCounter', { current: currentStepIndex + 1, total: PROGRESS_STEPS.length })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative">
              {PROGRESS_STEPS.map((step, idx) => {
                const isPassed = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div
                    key={step.key}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-2xs'
                        : isPassed
                        ? 'bg-slate-50 border-emerald-200 text-slate-700'
                        : 'bg-white border-slate-150 opacity-60 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{step.icon}</span>
                      {isPassed ? (
                        <span className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      ) : isCurrent ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                      ) : null}
                    </div>
                    <p className={`font-heading font-bold text-xs mt-2 ${
                      isCurrent ? 'text-emerald-950' : isPassed ? 'text-slate-800' : 'text-slate-500'
                    }`}>
                      {getStatusLabel(step.key)}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight mt-1">
                      {getStatusDesc(step.key)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Demonstration State Controls */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 p-3.5 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-amber-100 text-amber-800 rounded-md font-bold text-[10px]">{t('transport.active.demoMode')}</span>
                <span className="text-slate-600 font-semibold">
                  {t('transport.active.demoPrompt')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {currentStatus === 'REQUESTED' && (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={isActionLoading}
                    className="text-xs font-bold py-1.5 px-3 shadow-2xs"
                    onClick={handleAssignDemoDriver}
                  >
                    {isActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : '👨🌾'}
                    {t('transport.active.simulateDriverBtn')}
                  </Button>
                )}

                {currentStatus !== 'REQUESTED' && currentStatus !== 'COMPLETED' && (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={isActionLoading}
                    className="text-xs font-bold py-1.5 px-3 shadow-2xs"
                    onClick={() => handleStepStatus()}
                  >
                    {isActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : '⏭️'}
                    {t('transport.active.nextStatusBtn')}
                  </Button>
                )}

                {currentStatus !== 'COMPLETED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isActionLoading}
                    className="text-xs font-bold py-1.5 px-3 border-rose-200 text-rose-700 hover:bg-rose-50"
                    onClick={handleCancelBooking}
                  >
                    {t('transport.active.cancelBookingBtn')}
                  </Button>
                )}

                {currentStatus === 'COMPLETED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-bold py-1.5 px-3 border-slate-300 text-slate-700"
                    onClick={() => setActiveTransport(null)}
                  >
                    {t('transport.active.bookAnotherBtn')}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Detailed Booking Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Vehicle & Produce Details */}
            <Card className="p-5 border-slate-200 shadow-2xs rounded-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <span className="text-xl">🌾</span>
                <h4 className="font-heading font-bold text-sm text-slate-800 uppercase tracking-wider">
                  {t('transport.active.vehicleCropTitle')}
                </h4>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">{t('transport.active.vehicleSelected')}</span>
                  <span className="font-heading font-black text-slate-900 text-sm mt-0.5 block">
                    {getVehicleName(activeTransport.vehicleType)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">{t('transport.active.cropLabel')}</span>
                    <span className="font-extrabold text-slate-800 text-xs mt-0.5 block">
                      🌾 {activeTransport.cropName}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">{t('transport.active.quantityLabel')}</span>
                    <span className="font-extrabold text-emerald-700 text-xs mt-0.5 block">
                      ⚖️ {activeTransport.estimatedQuantity} {t('transport.form.quintalsUnit')}
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">{t('transport.active.pickupScheduleLabel')}</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                    📅 {activeTransport.pickupDate}
                  </span>
                  <span className="text-slate-500 font-medium text-xs block">
                    🕐 {activeTransport.pickupTime}
                  </span>
                </div>
              </div>
            </Card>

            {/* Destination Mandi Details */}
            <Card className="p-5 border-slate-200 shadow-2xs rounded-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <span className="text-xl">🏪</span>
                <h4 className="font-heading font-bold text-sm text-slate-800 uppercase tracking-wider">
                  {t('transport.active.destMandiTitle')}
                </h4>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">{t('transport.active.mandiCenterLabel')}</span>
                  <span className="font-heading font-black text-slate-900 text-sm mt-0.5 block">
                    {activeBooking.mandi?.name || t('transport.active.mandiCenterLabel')}
                  </span>
                  <span className="text-slate-500 font-medium text-xs mt-0.5 block flex items-start gap-1">
                    <MapPin className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                    <span>{activeBooking.mandi?.location || `${activeBooking.mandi?.district}, ${activeBooking.mandi?.state}`}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                    <span className="text-emerald-800 font-bold uppercase text-[9px] block">{t('transport.active.mandiTokenLabel')}</span>
                    <span className="font-mono font-black text-emerald-950 text-xs mt-0.5 block">
                      {activeBooking.tokenNumber}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-slate-500 font-bold uppercase text-[9px] block">{t('transport.active.bookingIdLabel')}</span>
                    <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block">
                      {activeBooking.bookingId}
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">{t('transport.active.registeredSlotLabel')}</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                    🕐 {activeBooking.slot?.formattedTime || 'Standard Slot'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Pickup & Driver Assignment */}
            <Card className="p-5 border-slate-200 shadow-2xs rounded-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <span className="text-xl">📍</span>
                <h4 className="font-heading font-bold text-sm text-slate-800 uppercase tracking-wider">
                  {t('transport.active.pickupDriverTitle')}
                </h4>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">{t('transport.active.farmerPickupLocLabel')}</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                    {activeTransport.pickupLocation?.fullAddress}
                  </span>
                </div>

                {/* Assigned Driver Box */}
                <div className="p-3 rounded-xl border bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                      {t('transport.active.assignedDriverLabel')}
                    </span>
                    {activeTransport.driver ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        {t('transport.active.confirmedBadge')}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                        {t('transport.active.awaitingDriverBadge')}
                      </span>
                    )}
                  </div>

                  {activeTransport.driver ? (
                    <div className="space-y-1">
                      <p className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-primary-600" />
                        <span>{activeTransport.driver.name}</span>
                      </p>
                      <p className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{activeTransport.driver.phone}</span>
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 font-bold mt-1">
                        {t('transport.active.plateLabel', { plate: activeTransport.driver.vehicleNumber })}
                      </p>
                      <span className="inline-block text-[9px] font-semibold text-slate-400 mt-1 italic">
                        {t('transport.active.demoDriverNotice')}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 font-medium leading-relaxed py-1">
                      {t('transport.active.awaitingDriverNotice')}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* ================= CASE 3: TRANSPORT BOOKING FORM ================= */
        <form onSubmit={handleSubmitBooking} className="space-y-6">
          {submitError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs font-bold animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* STEP 1: DESTINATION MANDI SUMMARY (AUTOMATICALLY POPULATED) */}
          <Card className="p-5 sm:p-6 bg-gradient-to-br from-emerald-50/50 via-white to-white border-2 border-emerald-500/80 rounded-2xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-600 text-white rounded-xl text-lg shrink-0">🏪</span>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 block">
                    {t('transport.form.destMandiHeader')}
                  </span>
                  <h2 className="font-heading font-extrabold text-slate-900 text-base sm:text-lg">
                    {activeBooking.mandi?.name || t('transport.active.mandiCenterLabel')}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <Badge variant="success" className="px-3 py-1 font-bold text-xs">
                  ✓ {t('transport.form.slotConfirmedBadge')}
                </Badge>
              </div>
            </div>

            {/* Read-only Mandi & Token Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                <span className="text-slate-400 font-bold uppercase text-[9px] block">{t('transport.form.mandiLocationLabel')}</span>
                <span className="font-bold text-slate-800 text-xs mt-0.5 block truncate">
                  📍 {activeBooking.mandi?.location || `${activeBooking.mandi?.district}, ${activeBooking.mandi?.state}`}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                <span className="text-slate-400 font-bold uppercase text-[9px] block">{t('transport.form.mandiBookingIdLabel')}</span>
                <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block">
                  {activeBooking.bookingId}
                </span>
              </div>

              <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <span className="text-emerald-800 font-bold uppercase text-[9px] block">{t('transport.form.mandiTokenLabel')}</span>
                <span className="font-mono font-black text-emerald-950 text-xs mt-0.5 block">
                  {activeBooking.tokenNumber}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                <span className="text-slate-400 font-bold uppercase text-[9px] block">{t('transport.form.slotTimeLabel')}</span>
                <span className="font-bold text-slate-800 text-xs mt-0.5 block truncate">
                  🕐 {activeBooking.slot?.formattedTime || 'Scheduled Slot'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-semibold italic flex items-center gap-1">
              <Info className="h-3 w-3 text-emerald-600 shrink-0" />
              <span>{t('transport.form.autoRoutingNotice')}</span>
            </p>
          </Card>

          {/* STEP 2: CROP & ESTIMATED LOAD QUANTITY */}
          <Card className="p-5 sm:p-6 border-slate-200 shadow-2xs rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌾</span>
                <h3 className="font-heading font-bold text-sm text-slate-800 uppercase tracking-wider">
                  {t('transport.form.cropLoadTitle')}
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">{t('transport.form.prefilledFromMandi')}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Crop display */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t('transport.form.cropHarvestLabel')}
                </label>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌾</span>
                    <span className="font-bold text-slate-800 text-sm">{cropName}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                    {t('transport.form.mandiRegisteredBadge')}
                  </span>
                </div>
              </div>

              {/* Estimated load in Quintals */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {t('transport.form.estimatedLoadLabel')}
                  </label>
                  {!isEditingQuantity ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingQuantity(true)}
                      className="text-[11px] font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>{t('transport.form.adjustBtn')}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingQuantity(false)}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="h-3 w-3" />
                      <span>{t('transport.form.doneBtn')}</span>
                    </button>
                  )}
                </div>

                {isEditingQuantity ? (
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="500"
                      step="0.5"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                      className="w-full p-3 rounded-xl border border-primary-500 bg-white text-sm font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                    <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">
                      {t('transport.form.quintalsUnit')}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {quantity} {t('transport.form.quintalsUnit')}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {t('transport.form.approxTonnes', { tonnes: (parseFloat(quantity) * 0.1 || 0).toFixed(1) })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* STEP 3: PICKUP LOCATION (PREFILLED FROM FARMER PROFILE) */}
          <Card className="p-5 sm:p-6 border-slate-200 shadow-2xs rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📍</span>
                <h3 className="font-heading font-bold text-sm text-slate-800 uppercase tracking-wider">
                  {t('transport.form.pickupLocationTitle')}
                </h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs font-bold border-slate-300 text-primary-700 hover:bg-slate-50 py-1.5 px-3 flex items-center gap-1 cursor-pointer"
                onClick={handleOpenLocationModal}
              >
                <MapPin className="h-3.5 w-3.5 text-primary-600" />
                <span>📍 {t('transport.form.changePickupBtn')}</span>
              </Button>
            </div>

            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t('transport.form.registeredPointLabel')}
                </span>
                <p className="font-heading font-extrabold text-slate-900 text-sm sm:text-base">
                  {pickupLocation.village}
                  {pickupLocation.mandal ? `, ${pickupLocation.mandal} Mandal` : ''}
                  {`, ${pickupLocation.district}, ${pickupLocation.state}`}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {t('transport.form.villageHaulageDesc')}
                </p>
              </div>

              <div className="shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                  <span>✓</span>
                  <span>{t('transport.form.officialHierarchyBadge')}</span>
                </span>
              </div>
            </div>
          </Card>

          {/* STEP 4: SELECT VEHICLE TYPE (EXACTLY 3 OPTIONS) */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t('transport.form.selectVehicleTitle')}
              </label>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {t('transport.form.selectVehicleDesc')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {VEHICLE_OPTIONS.map((veh) => {
                const isSelected = vehicleType === veh.id;
                return (
                  <div
                    key={veh.id}
                    onClick={() => setVehicleType(veh.id)}
                    className={`p-4.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'border-primary-600 bg-white shadow-md ring-2 ring-primary-500/10'
                        : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl">{veh.emoji}</span>
                        {isSelected ? (
                          <span className="h-6 w-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                            ✓
                          </span>
                        ) : (
                          <span className="h-6 w-6 rounded-full border border-slate-300 bg-white"></span>
                        )}
                      </div>

                      <h4 className={`font-heading font-black text-sm sm:text-base mt-2.5 ${
                        isSelected ? 'text-primary-900' : 'text-slate-800'
                      }`}>
                        {getVehicleName(veh.id)}
                      </h4>

                      <div className="mt-2 inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold">
                        {t('transport.form.capacityLabel', { capacity: getVehicleCapacity(veh.key) })}
                      </div>

                      <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                        {getVehicleSuitable(veh.key)}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      {getVehicleFeatures(veh.key).map((feat, fIdx) => (
                        <div key={fIdx} className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                          <span className="text-primary-600 font-bold">✓</span>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 5: PICKUP DATE & TIME (CONNECTED TO MANDI SLOT) */}
          <Card className="p-5 sm:p-6 border-slate-200 shadow-2xs rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🕐</span>
                <h3 className="font-heading font-bold text-sm text-slate-800 uppercase tracking-wider">
                  {t('transport.form.pickupScheduleTitle')}
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {t('transport.form.coordinatedNotice')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t('transport.form.pickupDateLabel')}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t('transport.form.pickupTimeLabel')}
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 focus:outline-none focus:border-primary-500"
                  >
                    <option value={activeBooking.slot?.formattedTime || '09:00 AM – 10:00 AM'}>
                      {activeBooking.slot?.formattedTime ? t('transport.form.alignedWithSlot', { time: activeBooking.slot.formattedTime }) : t('transport.form.morningDefault')}
                    </option>
                    <option value="Early Morning (06:00 AM – 08:00 AM)">{t('transport.form.timeSlots.earlyMorning')}</option>
                    <option value="Morning (08:00 AM – 11:00 AM)">{t('transport.form.timeSlots.morning')}</option>
                    <option value="Midday (11:00 AM – 02:00 PM)">{t('transport.form.timeSlots.midday')}</option>
                    <option value="Afternoon (02:00 PM – 05:00 PM)">{t('transport.form.timeSlots.afternoon')}</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* STEP 6: DRIVER DISPATCH INFORMATION NOTE */}
          <div className="p-4 bg-slate-100/70 rounded-2xl border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
            <span className="text-xl shrink-0">🟢</span>
            <div className="space-y-0.5">
              <p className="font-bold text-slate-800">
                {t('transport.form.autoDriverTitle')}
              </p>
              <p className="font-medium text-slate-500 leading-relaxed">
                {t('transport.form.autoDriverDesc', { district: pickupLocation.district })}
              </p>
              <p className="text-[10px] text-slate-400 italic pt-0.5">
                {t('transport.form.autoDriverNote')}
              </p>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              className="w-full py-4 font-heading font-black text-base shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t('transport.form.submittingBtn')}</span>
                </>
              ) : (
                <>
                  <span>🚜 {t('transport.form.submitBtn')}</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* ================= CHANGE PICKUP LOCATION MODAL ================= */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-xl">📍</span>
                <CardTitle className="text-base font-heading font-bold text-slate-900">
                  {t('transport.modal.title')}
                </CardTitle>
              </div>
              <button
                onClick={() => setIsLocationModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <p className="text-xs text-slate-500 font-medium">
                {t('transport.modal.desc')}
              </p>

              <form onSubmit={handleSaveLocation} className="space-y-4">
                {/* State & District (Read-only or dynamic) */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {t('transport.modal.stateLabel')}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={tempState}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {t('transport.modal.districtLabel')}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={tempDistrict}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-bold"
                    />
                  </div>
                </div>

                {/* If district is Karimnagar, show 16 official Mandals & Villages */}
                {tempDistrict === 'Karimnagar' ? (
                  <>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {t('transport.modal.mandalLabel', { district: 'Karimnagar' })}
                      </label>
                      <select
                        value={tempMandal}
                        onChange={(e) => {
                          setTempMandal(e.target.value);
                          const villages = getVillagesForMandal(e.target.value);
                          setTempVillage(villages[0] || '');
                        }}
                        required
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:border-primary-500 focus:outline-none"
                      >
                        <option value="">{t('transport.modal.selectMandalPrompt')}</option>
                        {KARIMNAGAR_ADMIN_HIERARCHY.map(m => (
                          <option key={m.mandal} value={m.mandal}>
                            {m.mandal} Mandal
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {t('transport.modal.villageLabel')}
                      </label>
                      {tempMandal ? (
                        <select
                          value={tempVillage}
                          onChange={(e) => setTempVillage(e.target.value)}
                          required
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:border-primary-500 focus:outline-none"
                        >
                          <option value="">{t('transport.modal.selectVillagePrompt')}</option>
                          {getVillagesForMandal(tempMandal).map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-xs text-slate-400 italic py-2">
                          {t('transport.modal.selectMandalFirst')}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {t('transport.modal.customVillageLabel')}
                    </label>
                    <input
                      type="text"
                      value={tempVillage}
                      onChange={(e) => setTempVillage(e.target.value)}
                      placeholder={t('transport.modal.villagePlaceholder')}
                      required
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => setIsLocationModalOpen(false)}
                  >
                    {t('transport.modal.cancelBtn')}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1 text-xs font-bold"
                  >
                    {t('transport.modal.useLocationBtn')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

