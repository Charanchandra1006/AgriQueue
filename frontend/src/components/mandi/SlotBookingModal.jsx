import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import {
  X,
  MapPin,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  TrendingUp,
  Map,
  Truck,
  Loader2
} from 'lucide-react';
import { getMandiSlots } from '../../services/api';
import { BookingQRCode } from '../booking/BookingQRCode';

export const SlotBookingModal = ({ mandi, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { bookSlot, t } = useApp();

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
  const [quantity, setQuantity] = useState(40); // quintals
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Real backend slots state from MySQL
  const [slotsList, setSlotsList] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Derive active crop cleanly without state cascade
  const activeCrop = selectedCrop && mandi?.external?.commodities?.includes(selectedCrop)
    ? selectedCrop
    : mandi?.external?.commodities?.[0] || '';

  // Fetch real procurement slots from MySQL backend whenever modal opens or date changes
  useEffect(() => {
    let isMounted = true;
    if (isOpen && mandi?.id) {
      setIsLoadingSlots(true);
      getMandiSlots(mandi.id, selectedDate)
        .then((res) => {
          if (isMounted) {
            if (res.success && Array.isArray(res.slots) && res.slots.length > 0) {
              setSlotsList(res.slots);
              // If current slot isn't available, auto-select first available slot
              setSelectedSlot((prev) => {
                const currentValid = res.slots.find((s) => s.time === prev && s.isAvailable);
                if (currentValid) return prev;
                const firstAvailable = res.slots.find((s) => s.isAvailable);
                return firstAvailable ? firstAvailable.time : prev;
              });
            } else {
              setSlotsList([]);
            }
          }
        })
        .catch((err) => {
          console.warn('Failed to fetch mandi slots:', err);
        })
        .finally(() => {
          if (isMounted) setIsLoadingSlots(false);
        });
    }
    return () => { isMounted = false; };
  }, [isOpen, mandi?.id, selectedDate]);

  if (!isOpen || !mandi) return null;

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

  const openMin = parseTimeToMinutes(mandi.external?.operatingHours?.openingTime || '08:00 AM');
  const closeMin = parseTimeToMinutes(mandi.external?.operatingHours?.closingTime || '06:00 PM');
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isOpenNow = currentMinutes >= openMin && currentMinutes <= closeMin;

  const handleConfirm = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const activeSlotObj = slotsList.find(s => s.time === selectedSlot);

    const result = await bookSlot({
      mandiId: mandi.id,
      mandiName: mandi.external?.name || mandi.name,
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
        bookingId: result.bookingId || (result.id ? `BK-${result.id}` : 'BK-CONFIRMED'),
        mandiName: result.mandi?.name || mandi.external?.name || mandi.name,
        crop: result.cropName,
        date: result.slot?.displayDate || selectedDate,
        timeSlot: result.slot?.formattedTime || selectedSlot,
        quantity: result.estimatedQuantity || quantity,
        farmersAhead: result.queue?.farmersAhead ?? 0,
        estimatedWait: result.queue?.estimatedWait || '0 min',
        mandiId: mandi.id
      });
      setIsConfirmed(true);
    } else {
      setSubmitError(t('booking.failedToReserve'));
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label="ticket"></span>
            <h2 className="font-heading font-extrabold text-lg text-slate-800 tracking-tight">
              {isConfirmed ? t('booking.modalTitleConfirmed') : t('booking.modalTitleBook')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {isConfirmed && confirmedBooking ? (
            /* ================= CONFIRMATION SCREEN ================= */
            <div className="space-y-5 animate-in zoom-in-95 duration-200">
              {/* Success Banner */}
              <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl flex items-center gap-3.5 shadow-xs">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0 shadow-xs">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-emerald-950 text-lg flex items-center gap-2">
                    <span>{t('booking.confirmedSuccessBanner')}</span>
                  </h3>
                  <p className="text-xs text-emerald-800 font-semibold mt-0.5">
                    {t('booking.confirmedSuccessMsg')}
                  </p>
                </div>
              </div>

              {/* Digital Pass Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 relative overflow-hidden shadow-lg border border-slate-800">
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      {t('booking.tokenNumber')}
                    </span>
                    <span className="font-heading font-black text-2xl sm:text-3xl text-emerald-400 tracking-wider mt-1 block">
                      {confirmedBooking.token}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold inline-block">
                      ● {t('booking.statusConfirmed')}
                    </span>
                    {confirmedBooking.bookingId && (
                      <span className="block font-mono text-[11px] text-slate-400 mt-1.5 font-bold">
                        {t('qr.bookingId')}: {confirmedBooking.bookingId}
                      </span>
                    )}
                  </div>
                </div>

                {/* Booking Key Metrics */}
                <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                      {t('history.mandiCenter')}
                    </span>
                    <span className="font-bold text-white text-sm mt-0.5 block">
                      {confirmedBooking.mandiName}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      {mandi.external.district}, {mandi.external.state}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                      {t('booking.scheduledDateTime')}
                    </span>
                    <span className="font-bold text-white text-sm mt-0.5 block">
                      {confirmedBooking.date}
                    </span>
                    <span className="text-[11px] text-emerald-300 font-semibold mt-0.5 block">
                      {confirmedBooking.timeSlot}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">{t('common.crop')}</span>
                    <span className="font-bold text-white mt-0.5 block">{confirmedBooking.crop}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">{t('booking.countAhead', { count: '' }).trim()}</span>
                    <span className="font-bold text-white mt-0.5 block">{t('booking.countAhead', { count: confirmedBooking.farmersAhead })}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">{t('dashboard.estWaitLabel')}</span>
                    <span className="font-bold text-emerald-400 mt-0.5 block">{confirmedBooking.estimatedWait}</span>
                  </div>
                </div>

                {/* Real Standards-Compliant Token & QR Code */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col items-center">
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
                  className="flex-1 justify-center py-3 font-bold text-sm shadow-xs"
                  onClick={() => {
                    onClose();
                    navigate('/');
                  }}
                >
                  <TrendingUp className="h-4 w-4 mr-1.5" />
                  {t('booking.viewOnDashboard')}
                </Button>

                <Button
                  variant="primary"
                  className="justify-center py-3 font-bold text-sm shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                  onClick={() => {
                    onClose();
                    navigate('/book-transport');
                  }}
                >
                  <Truck className="h-4 w-4 mr-1.5" />
                  {t('booking.bookTransportBtn')}
                </Button>

                <Button
                  variant="outline"
                  className="justify-center py-3 font-bold text-sm border-slate-300 text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    onClose();
                    navigate(`/mandi-map?selected=${mandi.id}`);
                  }}
                >
                  <Map className="h-4 w-4 mr-1.5 text-primary-600" />
                  {t('mandi.viewOnMap')}
                </Button>

                <Button
                  variant="outline"
                  className="justify-center py-3 font-bold text-sm border-slate-300 text-slate-700 hover:bg-slate-50"
                  onClick={onClose}
                >
                  {t('booking.doneBtn')}
                </Button>
              </div>
            </div>
          ) : (
            /* ================= BOOKING FORM ================= */
            <form onSubmit={handleConfirm} className="space-y-5">
              {/* Selected Mandi Details Banner (Carried over automatically) */}
              <div className="p-4 bg-gradient-to-r from-emerald-50/70 via-slate-50 to-slate-50 rounded-2xl border border-emerald-100/80 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="text-2xl mt-0.5" role="img" aria-label="mandi"></span>
                    <div>
                      <h3 className="font-heading font-extrabold text-base text-slate-800">
                        {mandi.external.name}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{mandi.external.location}, {mandi.external.district}, {mandi.external.state}</span>
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${
                    isOpenNow
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {isOpenNow ? t('mandi.openNow') : t('mandi.closed')}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 pt-1 border-t border-slate-200/50">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {t('mandi.operatingHoursColon', { hours: `${mandi.external.operatingHours.openingTime} – ${mandi.external.operatingHours.closingTime}` })}
                  </span>
                  <span className="text-emerald-700 font-bold">
                     {mandi.agriQueue.availableSlots > 0 ? t('booking.slotsAvailableToday', { count: mandi.agriQueue.availableSlots }) : t('booking.nextSlots', { time: mandi.agriQueue.nextAvailableSlot })}
                  </span>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {t('booking.cropsHandled')}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {mandi.external.commodities.map((crop, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md"
                      >
                         {crop}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Crop Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('booking.selectCropCategory')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {mandi.external.commodities.map((crop) => {
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

              {/* Date Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('booking.selectPreferredDate')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDate(getTodayDate())}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      selectedDate === getTodayDate()
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {t('booking.today')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(getTomorrowDate())}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      selectedDate === getTomorrowDate()
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {t('booking.tomorrow')}
                  </button>
                  <div className="relative">
                    <input
                      type="date"
                      value={selectedDate}
                      min={getTodayDate()}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Time Slots (Available vs Full/Unavailable) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {t('booking.availableTimeSlotLabel')}
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
                  <div className="space-y-2">
                    {slotsList.map((slot) => {
                      const isSelected = selectedSlot === slot.time;
                      if (!slot.isAvailable) {
                        return (
                          <div
                            key={slot.time}
                            className="p-3 rounded-xl border border-slate-200 bg-slate-100/70 opacity-65 cursor-not-allowed flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-slate-400" />
                              <span className="text-xs font-bold text-slate-500 line-through">
                                {slot.time}
                              </span>
                            </div>
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
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
                          className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
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

              {/* Quantity in Quintals */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('booking.estimatedHarvestQuantity')}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(5, q - 10))}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm text-slate-700 w-11 h-11 flex items-center justify-center cursor-pointer transition-colors"
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
                      className="w-full text-center py-2.5 px-3 rounded-xl border border-slate-200 font-heading font-extrabold text-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      {t('common.quintals')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(500, q + 10))}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm text-slate-700 w-11 h-11 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    +10
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {t('booking.averageTrolleyNotice')}
                </p>
              </div>

              {/* Prototype Advisory Notice */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed">
                  {t('booking.demonstrationNotice')}
                </span>
              </div>

              {/* Submit Error */}
              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                  {submitError}
                </div>
              )}

              {/* Confirm Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full justify-center text-sm py-3.5 font-bold shadow-md shadow-primary-600/20 cursor-pointer"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {isSubmitting ? t('booking.reservingSlot') : t('booking.confirmReservationBtn')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
