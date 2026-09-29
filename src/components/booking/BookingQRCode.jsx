import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useApp } from '../../context/AppContext';

/**
 * High-Reliability Standards-Compliant QR Code Component for AgriQueue Bookings.
 *
 * Requirements:
 * - Uses QRCodeCanvas for crisp, pixel-perfect physical device scannability.
 * - At least 280x280 px on desktop.
 * - Pure black modules (#000000) on solid white background (#FFFFFF).
 * - Full 4-module quiet-zone margin inside canvas plus generous white padding.
 * - No CSS transforms, hover scaling, opacity, or filters that degrade camera scanning.
 * - Encodes strictly: AGRIQUEUE:${bookingId}
 * - Prominently displays Token Number and fallback Booking ID.
 */
export const BookingQRCode = ({
  bookingId,
  tokenNumber,
  size = 280,
  theme = 'dark',
  className = ''
}) => {
  const { t } = useApp();
  const cleanBookingId = bookingId || 'PENDING';
  const qrPayload = `AGRIQUEUE:${cleanBookingId}`;
  const isDark = theme === 'dark';

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {/* 1. Prominently visible Token Number */}
      {tokenNumber && (
        <div
          className={`mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-heading font-black text-base sm:text-lg tracking-wider ${
            isDark
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-xs'
              : 'bg-emerald-50 border border-emerald-300 text-emerald-800 shadow-xs'
          }`}
        >
          <span>️</span>
          <span>{t('qr.tokenBadge', { number: tokenNumber })}</span>
        </div>
      )}

      {/* 2. Simple Solid White Container with Clean Quiet Zone Margin */}
      <div
        className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 inline-flex items-center justify-center shadow-md"
        style={{
          backgroundColor: '#ffffff'
        }}
      >
        <QRCodeCanvas
          value={qrPayload}
          size={size}
          level="M"
          marginSize={4}
          bgColor="#FFFFFF"
          fgColor="#000000"
          style={{
            display: 'block',
            width: `${size}px`,
            height: `${size}px`,
            imageRendering: 'pixelated'
          }}
        />
      </div>

      {/* 3. Booking ID visible below the QR as a fallback */}
      <div className="mt-3.5 space-y-1">
        <span
          className={`text-[11px] uppercase font-bold tracking-wider block ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {t('qr.bookingId')}
        </span>
        <span
          className={`font-mono font-black text-sm sm:text-base px-3.5 py-1 rounded-lg inline-block border select-all tracking-wide ${
            isDark
              ? 'text-slate-100 bg-slate-800/90 border-slate-700'
              : 'text-slate-800 bg-slate-100 border-slate-200'
          }`}
        >
          {cleanBookingId}
        </span>
      </div>

      {/* 4. Farmer-friendly instruction banner */}
      <div
        className={`mt-4 max-w-sm text-xs leading-relaxed px-4 py-2.5 rounded-xl border ${
          isDark
            ? 'bg-slate-800/80 border-slate-700/90 text-slate-300'
            : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}
      >
        <p
          className={`font-bold text-sm flex items-center justify-center gap-1.5 ${
            isDark ? 'text-white' : 'text-slate-800'
          }`}
        >
          <span></span>
          <span>{t('qr.showAtCenter')}</span>
        </p>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          {t('qr.scanInstructions')}
        </p>
      </div>
    </div>
  );
};
