import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Map,
  Sparkles,
  Truck,
  Loader2
} from 'lucide-react';
import { getMandis, getMandiSlots } from '../services/api';
import { BookingQRCode } from '../components/booking/BookingQRCode';

export const BookSlot = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { bookSlot, profile, t } = useApp();

  const queryMandiId = searchParams.get('mandiId');
  const targetId = id ? parseInt(id, 10) : queryMandiId ? parseInt(queryMandiId, 10) : null;

  const [mandisList, setMandisList] = useState([]);
  const [selectedMandiId, setSelectedMandiId] = useState(targetId);

  // Fetch real mandis from MySQL backend
  useEffect(() => {
    let isMounted = true;
    getMandis().then((res) => {
      if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setMandisList(res.data);
        if (!selectedMandiId) {
          // If farmer has district, pick matching mandi if any (e.g. Karimnagar)
          const matching = profile?.district
            ? res.data.find(m => m.district?.toLowerCase() === profile.district.toLowerCase())
            : null;
          setSelectedMandiId(matching ? matching.id : res.data[0].id);
        }
      }
    });
    return () => { isMounted = false; };
  }, [profile?.district, selectedMandiId]);

  const currentMandi = mandisList.find((m) => m.id === selectedMandiId) || mandisList[0] || null;

  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTomorrowDate());
  const [selectedSlot, setSelectedSlot] = useState('09:00 AM – 10:00 AM');
  const [quantity, setQuantity] = useState(40);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Real backend slots state
  const [slotsList, setSlotsList] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Fetch slots whenever currentMandi or selectedDate changes
  useEffect(() => {
    let isMounted = true;
    if (currentMandi?.id) {
      setIsLoadingSlots(true);
      getMandiSlots(currentMandi.id, selectedDate)
        .then(res => {
          if (isMounted) {
            if (res.success && Array.isArray(res.slots) && res.slots.length > 0) {
              setSlotsList(res.slots);
              setSelectedSlot((prev) => {
                const currentValid = res.slots.find(s => s.time === prev && s.isAvailable);
                if (currentValid) return prev;
                const firstAvailable = res.slots.find(s => s.isAvailable);
                return firstAvailable ? firstAvailable.time : prev;
              });
            } else {
              setSlotsList([]);
            }
          }
        })
        .catch(err => {
          console.warn('Failed to fetch mandi slots:', err);
        })
        .finally(() => {
          if (isMounted) setIsLoadingSlots(false);
        });
    }
    return () => { isMounted = false; };
  }, [currentMandi?.id, selectedDate]);

  // Derive active crop cleanly without state cascade
  const activeCrop = selectedCrop && currentMandi?.external?.commodities?.includes(selectedCrop)
    ? selectedCrop
    : currentMandi?.external?.commodities?.[0] || 'Paddy';

  // Determine open/closed status
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

  const openMin = parseTimeToMinutes(currentMandi?.external?.operatingHours?.openingTime || '08:00 AM');
  const closeMin = parseTimeToMinutes(currentMandi?.external?.operatingHours?.closingTime || '06:00 PM');
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isOpenNow = currentMinutes >= openMin && currentMinutes <= closeMin;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!currentMandi) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const activeSlotObj = slotsList.find(s => s.time === selectedSlot);

    const result = await bookSlot({
      mandiId: currentMandi.id,
      mandiName: currentMandi.external?.name || currentMandi.name,
      crop: activeCrop,
      date: selectedDate,
      timeSlot: selectedSlot,
      startTime: activeSlotObj?.startTime,
      endTime: activeSlotObj?.endTime,
      quantity: Number(quantity)
    });

    setIsSubmitting(false);

    if (result) {
      setConfirmedBooking({
        token: result.tokenNumber,
        bookingId: result.bookingId || (result.id ? `BK-${result.id}` : null),
        mandiName: result.mandi?.name || currentMandi.external?.name || currentMandi.name,
        crop: result.cropName,
        date: result.slot?.displayDate || selectedDate,
        timeSlot: result.slot?.formattedTime || selectedSlot,
        quantity: result.estimatedQuantity || quantity,
        farmersAhead: result.queue?.farmersAhead ?? 0,
        estimatedWait: result.queue?.estimatedWait || '0 min',
        mandiId: currentMandi.id
      });
      setIsConfirmed(true);
    } else {
      setSubmitError(t('booking.failedToReserve'));
    }
  };


  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/mandi-centers')}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-primary-700 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-slate-500" />
          <span>{t('mandi.backToCenters')}</span>
        </button>

        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {t('booking.procurementReservation')}
        </span>
      </div>

      {isConfirmed && confirmedBooking ? (
        /* ================= CONFIRMATION SCREEN ================= */
        <Card className="p-6 md:p-8 bg-white border-slate-200 shadow-sm space-y-6 animate-in zoom-in-95 duration-200">
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-emerald-600 text-white rounded-xl shrink-0">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-emerald-900 text-lg md:text-xl">
                {t('booking.slotBookedSuccess')}
              </h2>
              <p className="text-xs md:text-sm text-emerald-700 font-semibold mt-0.5">
                {t('booking.slotBookedSuccessSub')}
              </p>
            </div>
          </div>

          {/* Digital Pass Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-lg border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                  {t('dashboard.digitalTokenPass')}
                </span>
                <span className="font-heading font-black text-3xl sm:text-4xl text-emerald-400 tracking-wider mt-1 block">
                  {confirmedBooking.token}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold">
                  ● {t('common.status')}: {t('booking.statusConfirmed')}
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-5 border-b border-slate-800 text-sm">
              <div className="space-y-1">
                <span className="text-slate-400 block text-xs font-bold uppercase tracking-wider">
                  {t('history.mandiCenter')}
                </span>
                <span className="font-extrabold text-white text-base block">
                   {confirmedBooking.mandiName}
                </span>
                <span className="text-xs text-slate-400 block">
                   {currentMandi.external.location}, {currentMandi.external.district}, {currentMandi.external.state}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 block text-xs font-bold uppercase tracking-wider">
                  {t('booking.reservationSchedule')}
                </span>
                <span className="font-extrabold text-white text-base block">
                   {confirmedBooking.date}
                </span>
                <span className="text-xs text-emerald-300 font-bold block">
                  {t('booking.timeSlotColon', { time: confirmedBooking.timeSlot })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">{t('common.crop')}</span>
                <span className="font-extrabold text-white text-sm mt-0.5 block"> {confirmedBooking.crop}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">{t('common.quantity')}</span>
                <span className="font-extrabold text-white text-sm mt-0.5 block">{confirmedBooking.quantity} {t('common.quintals')}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">{t('booking.countAhead', { count: '' }).trim()}</span>
                <span className="font-extrabold text-white text-sm mt-0.5 block"> {t('booking.countAhead', { count: confirmedBooking.farmersAhead })}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">{t('dashboard.estWaitLabel')}</span>
                <span className="font-extrabold text-emerald-400 text-sm mt-0.5 block">⌛ {confirmedBooking.estimatedWait}</span>
              </div>
            </div>

            {/* Real Standards-Compliant Token & QR Code */}
            <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col items-center">
              <BookingQRCode
                bookingId={confirmedBooking.bookingId}
                tokenNumber={confirmedBooking.token}
                size={280}
                theme="dark"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              className="flex-1 justify-center py-3.5 font-bold text-sm shadow-md shadow-primary-600/20"
              onClick={() => navigate('/')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {t('booking.viewDashboardLiveQueue')}
            </Button>

            <Button
              variant="primary"
              size="lg"
              className="justify-center py-3.5 font-bold text-sm shadow-md bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
              onClick={() => navigate('/book-transport')}
            >
              <Truck className="h-4 w-4 mr-1.5" />
              {t('booking.bookTransportBtn')}
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="justify-center py-3.5 font-bold text-sm border-slate-300 text-slate-700 hover:bg-slate-50"
              onClick={() => navigate(`/mandi-map?selected=${currentMandi.id}`)}
            >
              <Map className="h-4 w-4 mr-2 text-primary-600" />
              {t('mandi.viewMandiOnMap')}
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="justify-center py-3.5 font-bold text-sm border-slate-300 text-slate-700 hover:bg-slate-50"
              onClick={() => navigate('/mandi-centers')}
            >
              {t('mandi.browseOtherMandis')}
            </Button>
          </div>
        </Card>
      ) : (
        /* ================= BOOKING FORM PAGE ================= */
        <div className="space-y-6">
          {/* Header Card */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl" role="img" aria-label="ticket"></span>
              <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-slate-800 tracking-tight">
                {t('booking.slotReservationTitle')}
              </h1>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {t('booking.slotReservationSubtitle')}
            </p>
          </div>

          {/* Selected Mandi Details Banner */}
          <Card className="p-5 md:p-6 bg-gradient-to-br from-emerald-50/70 via-white to-white border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="text-3xl mt-0.5" role="img" aria-label="mandi"></span>
                <div>
                  <h2 className="font-heading font-extrabold text-lg md:text-xl text-slate-850">
                    {currentMandi.external.name}
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{currentMandi.external.location}, {currentMandi.external.district}, {currentMandi.external.state}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${
                  isOpenNow
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {isOpenNow ? t('mandi.openNow') : t('mandi.closed')}
                </span>
                <span className="text-xs font-bold text-primary-700 bg-primary-50 border border-primary-100 px-2.5 py-1 rounded-full">
                   {t('booking.slotsToday', { count: currentMandi.agriQueue.availableSlots })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>{t('mandi.operatingHoursColon', { hours: `${currentMandi.external.operatingHours.openingTime} – ${currentMandi.external.operatingHours.closingTime}` })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span>{t('booking.nextAvailable', { time: currentMandi.agriQueue.nextAvailableSlot })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">{t('booking.crowdLevel')}</span>
                <span className="font-bold text-slate-800">{currentMandi.agriQueue.crowdLevel}</span>
              </div>
            </div>

            {/* Switch Mandi Dropdown (if user wants to select another without leaving) */}
            <div className="pt-2">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {t('booking.changeProcurementCenter')}
              </span>
              <select
                value={selectedMandiId || currentMandi.id}
                onChange={(e) => setSelectedMandiId(parseInt(e.target.value, 10))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
              >
                {mandisList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.district}, {m.state})
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* Booking Form Card */}
          <Card className="p-6 border-slate-200 shadow-2xs">
            <form onSubmit={handleConfirm} className="space-y-6">
              {/* 1. Crop Selection */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('booking.chooseCropCommodity')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(currentMandi.external?.commodities || ['Paddy', 'Wheat', 'Maize', 'Cotton']).map((crop) => {
                    const isSelected = activeCrop === crop;
                    return (
                      <button
                        type="button"
                        key={crop}
                        onClick={() => setSelectedCrop(crop)}
                        className={`p-3 rounded-xl border text-left font-bold text-xs transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-primary-600 text-white border-primary-600 shadow-xs ring-2 ring-primary-500/20'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span> {crop}</span>
                        {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Date Selection */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('booking.chooseReservationDate')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedDate(getTodayDate())}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      selectedDate === getTodayDate()
                        ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {t('booking.todayWithDate', { date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) })}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(getTomorrowDate())}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      selectedDate === getTomorrowDate()
                        ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {t('booking.tomorrow')}
                  </button>
                  <input
                    type="date"
                    value={selectedDate}
                    min={getTodayDate()}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>

              {/* 3. Available Time Slots */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {t('booking.availableProcurementTimeSlot')}
                  </label>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {t('booking.movieTicketSubtitle')}
                  </span>
                </div>

                {isLoadingSlots ? (
                  <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2 bg-slate-50 rounded-xl border border-slate-200">
                    <Loader2 className="h-4 w-4 text-primary-600 animate-spin" />
                    <span>{t('booking.checkingSlots')}</span>
                  </div>
                ) : slotsList.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    {t('booking.noSlotsForDate')}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {slotsList.map((slot) => {
                      const isSelected = selectedSlot === slot.time;
                      if (!slot.isAvailable) {
                        return (
                          <div
                            key={slot.time}
                            className="p-3.5 rounded-xl border border-slate-200 bg-slate-100/70 opacity-60 cursor-not-allowed flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-slate-400" />
                              <span className="text-xs font-bold text-slate-500 line-through">
                                {slot.time}
                              </span>
                            </div>
                            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                              {t('booking.slotFull')}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <button
                          type="button"
                          key={slot.time}
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`p-3.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Clock className={`h-4 w-4 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                            <span className="text-sm font-extrabold">{slot.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                              slot.status === 'FAST_FILLING'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}>
                              {slot.statusLabel || (slot.status === 'FAST_FILLING' ? t('booking.slotFew') : t('booking.slotAvailable'))}
                            </span>
                            {isSelected && <CheckCircle2 className="h-4.5 w-4.5 text-emerald-700 shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. Quantity in Quintals */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('booking.estimatedProduceWeight')}
                </label>
                <div className="flex items-center gap-3 max-w-sm">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(5, q - 10))}
                    className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm text-slate-700 w-12 h-12 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    -10
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full text-center py-3 px-3 rounded-xl border border-slate-200 font-heading font-extrabold text-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      {t('common.quintals')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(500, q + 10))}
                    className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm text-slate-700 w-12 h-12 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    +10
                  </button>
                </div>
              </div>

              {/* Advisory info */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {t('booking.demonstrationNoticeAlt')}
                </span>
              </div>

              {/* Submit Error */}
              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                  {submitError}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full justify-center text-sm py-4 font-bold shadow-md shadow-primary-600/20 cursor-pointer"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {isSubmitting ? t('booking.reservingSlot') : t('booking.confirmReservationBtnLong')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
