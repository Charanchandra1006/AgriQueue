import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Calendar, Search, ArrowRight } from 'lucide-react';

export const DashboardHero = () => {
  const { t } = useApp();
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-primary-800 text-white p-6 md:p-8 lg:p-10 shadow-lg shadow-primary-900/10">
      {/* Decorative farm pattern elements */}
      <div className="absolute right-0 bottom-0 opacity-15 w-80 h-80 pointer-events-none translate-x-20 translate-y-20 bg-radial from-emerald-100 to-transparent rounded-full" />
      <div className="absolute left-1/3 top-10 opacity-5 w-40 h-40 pointer-events-none bg-white rounded-full blur-xl" />

      <div className="relative z-10 max-w-2xl">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-700/60 border border-primary-500/20 text-primary-200 mb-4 md:mb-5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {t('dashboard.sihBadge')}
        </span>
        
        <h1 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl leading-tight text-white mb-3 tracking-tight">
          {t('skipQueue')}
        </h1>
        
        <p className="text-sm md:text-base text-primary-100/90 leading-relaxed mb-6 md:mb-8 font-medium">
          {t('supportingText')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="secondary"
            size="md"
            icon={Calendar}
            onClick={() => navigate('/book-slot')}
            className="w-full sm:w-auto shadow-md"
          >
            {t('bookSlot')}
          </Button>
          <Button
            variant="outline"
            size="md"
            icon={Search}
            onClick={() => navigate('/mandi-map')}
            className="w-full sm:w-auto text-white border-white/20 bg-white/10 hover:bg-white/20 hover:border-white/30"
          >
            {t('exploreMandis')}
          </Button>
        </div>
      </div>
    </div>
  );
};
