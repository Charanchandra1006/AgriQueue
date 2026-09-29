import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { getBookingHistory } from '../../services/api';
import { Button } from '../ui/Button';
import {
  X,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Ticket
} from 'lucide-react';

export const BookingHistoryModal = ({ isOpen, onClose, onBookNew }) => {
  const { profile, t } = useApp();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const farmerIdentifier = profile?.farmerId || profile?.phone;

  const fetchHistory = useCallback(async () => {
    if (!farmerIdentifier) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getBookingHistory(farmerIdentifier);
      if (res.success && Array.isArray(res.data)) {
        setBookings(res.data);
      } else {
        setError(t('history.errorLoading'));
      }
    } catch {
      setError(t('history.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  }, [farmerIdentifier, t]);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  if (!isOpen) return null;

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3" />
          {t('booking.statusConfirmed')}
        </span>
      );
    }
    if (s === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <CheckCircle2 className="h-3 w-3" />
          {t('booking.statusCompleted')}
        </span>
      );
    }
    if (s === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
          <XCircle className="h-3 w-3" />
          {t('booking.statusCancelled')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
        <AlertCircle className="h-3 w-3" />
        {status || t('booking.statusFailed')}
      </span>
    );
  };

  const getLocalizedStatusText = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'confirmed') return t('booking.statusConfirmed');
    if (s === 'completed') return t('booking.statusCompleted');
    if (s === 'cancelled') return t('booking.statusCancelled');
    return status || t('booking.statusFailed');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl" role="img" aria-label="history"></span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-extrabold text-lg text-slate-800 tracking-tight">
                  {t('history.title')}
                </h2>
                {!isLoading && bookings.length > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                    {bookings.length === 1
                      ? t('history.bookingCountSingular')
                      : t('history.bookingCountPlural', { count: bookings.length })}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {t('history.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoading && (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-700">{t('history.loadingBookings')}</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
              <AlertCircle className="w-7 h-7 text-rose-600 mx-auto" />
              <p className="text-sm font-bold text-rose-800">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchHistory}
                className="mt-2 text-xs font-bold"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> {t('common.retry')}
              </Button>
            </div>
          )}

          {!isLoading && !error && bookings.length === 0 && (
            <div className="py-16 text-center space-y-3 max-w-sm mx-auto">
              <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-2xl">
                
              </div>
              <h3 className="font-heading font-bold text-slate-800 text-base">
                {t('history.noBookingsFound')}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('history.noBookingsSub')}
              </p>
              {onBookNew && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onBookNew();
                  }}
                  className="mt-2 font-bold text-xs"
                >
                  {t('history.bookFirstSlot')}
                </Button>
              )}
            </div>
          )}

          {!isLoading && !error && bookings.length > 0 && (
            <div className="space-y-3.5">
              {bookings.map((booking) => (
                <div
                  key={booking.id || booking.bookingId}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-primary-400 bg-white shadow-2xs hover:shadow-sm transition-all space-y-3"
                >
                  {/* Top Bar: Center Name & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
                        <span className="font-mono font-bold text-slate-700">
                          {booking.bookingId}
                        </span>
                        {booking.bookedAtFormatted && (
                          <span>• {t('history.bookedOn', { date: booking.bookedAtFormatted })}</span>
                        )}
                      </div>
                      <h4 className="font-heading font-black text-base text-slate-900 flex items-center gap-2">
                        <span></span>
                        <span>{booking.mandiName}</span>
                      </h4>
                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{booking.location}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {getStatusBadge(booking.bookingStatus)}
                    </div>
                  </div>

                  {/* Grid of Key Info with Farmer-Friendly Icons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        {t('common.crop')}
                      </span>
                      <span className="font-bold text-slate-800 block mt-0.5 truncate">
                         {booking.cropName}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        {t('common.quantity')}
                      </span>
                      <span className="font-bold text-slate-800 block mt-0.5">
                         {booking.estimatedQuantity} {t('common.quintals')}
                      </span>
                    </div>

                    <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                        {t('booking.slotDate')}
                      </span>
                      <span className="font-bold text-emerald-900 block mt-0.5">
                         {booking.displayDate}
                      </span>
                    </div>

                    <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                        {t('booking.slotTime')}
                      </span>
                      <span className="font-bold text-emerald-900 block mt-0.5 truncate">
                         {booking.formattedSlotTime}
                      </span>
                    </div>
                  </div>

                  {/* Token Pass Row */}
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Ticket className="h-4 w-4 text-primary-600" />
                      <span className="font-bold text-slate-500 text-[11px]">{t('history.tokenLabel')}</span>
                      <span className="font-black text-sm text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-200">
                        {booking.tokenNumber}
                      </span>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-400">
                      {t('history.statusLabel')}{' '}
                      <span className="text-slate-700 font-bold">
                        {getLocalizedStatusText(booking.bookingStatus)}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHistory}
            disabled={isLoading}
            className="text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh')}</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
            className="text-xs font-bold cursor-pointer"
          >
            {t('common.close')}
          </Button>
        </div>
      </div>
    </div>
  );
};
