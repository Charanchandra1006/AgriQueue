import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Ticket, Users, Clock, MapPin, CheckCircle } from 'lucide-react';

export const QueueCard = () => {
  const navigate = useNavigate();
  const { profile, t, activeBooking } = useApp();

  return (
    <Card className="h-full border-primary-100 bg-gradient-to-br from-white to-primary-50/10">
      <CardHeader className="mb-4">
        <div className="flex items-center gap-2">
          <Ticket className="h-5.5 w-5.5 text-primary-600" />
          <CardTitle>{t('liveQueueStatus')}</CardTitle>
        </div>
        <Badge variant="success" className="animate-pulse">
          {t('dashboard.liveUpdates')}
        </Badge>
      </CardHeader>

      <CardContent>
        {profile.activeToken ? (
          <div className="space-y-5">
            {/* Token Badge Display */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-xs">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full translate-x-4 -translate-y-4" />
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-0.5">
                {t('tokenNumber')}
              </span>
              <span className="font-heading font-extrabold text-2xl tracking-widest text-emerald-400">
                {profile.activeToken}
              </span>
              
              {/* Digital Pass Indicator */}
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-300 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                <span> {t('dashboard.verifiedDigitalPass')}</span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-lg text-amber-600 border border-amber-100">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('farmersAhead')}</p>
                  <p className="text-base font-extrabold text-slate-800">{profile.farmersAhead}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('estimatedWait')}</p>
                  <p className="text-base font-extrabold text-slate-800">{profile.estimatedWait}</p>
                </div>
              </div>
            </div>

            {/* Procurement Details */}
            <div className="space-y-3 pt-2 border-t border-slate-50">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4.5 w-4.5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('procurementCenter')}</p>
                  <p className="text-xs font-semibold text-slate-700">{profile.mandiName}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="h-4.5 w-4.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('slotStatus')}</p>
                    <p className="text-xs font-semibold text-slate-700">{profile.slotTime}</p>
                  </div>
                </div>
                <Badge variant="primary" className="py-1 px-3">
                  {profile.slotStatus}
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <Ticket className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium text-sm mb-4">{t('dashboard.noSlotToday')}</p>
            <button
              onClick={() => navigate('/book-slot')}
              className="text-xs font-bold text-primary-600 hover:text-primary-700 underline cursor-pointer"
            >
              {t('dashboard.bookSlotNow')}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
