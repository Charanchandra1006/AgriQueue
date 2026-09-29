import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { weatherAlerts } from '../../mock/mockData';
import {
  getLocalizedWeatherCondition,
  getLocalizedWeatherAdvisory,
  getLocalizedDay
} from '../../utils/weatherLocalization';
import {
  CloudSun,
  CloudRain,
  CloudLightning,
  Sun,
  Wind,
  Droplets,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export const WeatherSummary = () => {
  const { t } = useApp();
  const navigate = useNavigate();

  const getWeatherIcon = (iconName, size = "h-6 w-6") => {
    switch (iconName) {
      case 'cloud-sun':
        return <CloudSun className={`${size} text-amber-500`} />;
      case 'cloud-rain':
        return <CloudRain className={`${size} text-blue-500`} />;
      case 'cloud-showers-heavy':
        return <CloudLightning className={`${size} text-slate-500`} />;
      case 'sun':
        return <Sun className={`${size} text-amber-600 animate-spin-slow`} />;
      default:
        return <CloudSun className={`${size} text-slate-500`} />;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CloudSun className="h-5.5 w-5.5 text-primary-600" />
          <CardTitle>{t('dashboard.weatherTitle')}</CardTitle>
        </div>
        <button
          onClick={() => navigate('/weather-alerts')}
          className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-0.5 cursor-pointer"
        >
          <span>{t('dashboard.moreDetails')}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Weather Highlight */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/10 to-emerald-500/5 rounded-2xl border border-amber-100/30">
          <div className="flex items-center gap-3.5">
            {getWeatherIcon('cloud-sun', 'h-12 w-12')}
            <div>
              <span className="font-heading font-extrabold text-3xl text-slate-800 leading-none">
                {weatherAlerts.currentTemp}
              </span>
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                {getLocalizedWeatherCondition(weatherAlerts.condition, t)}
              </p>
            </div>
          </div>

          <div className="flex gap-4 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1">
              <Droplets className="h-4 w-4 text-blue-400" />
              <span>{weatherAlerts.humidity} {t('dashboard.hum')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="h-4 w-4 text-slate-400" />
              <span>{weatherAlerts.windSpeed} {t('dashboard.wind')}</span>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        {weatherAlerts.alerts.length > 0 && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl border border-rose-100 bg-rose-50/50">
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-[11px] font-semibold text-rose-800 leading-normal">
              <strong>{t('dashboard.farmWarning')}</strong> {getLocalizedWeatherAdvisory(weatherAlerts.alerts[0], t)}
            </p>
          </div>
        )}

        {/* 4-Day Forecast Row */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-50">
          {weatherAlerts.forecast.map((fc, index) => (
            <div key={index} className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-100/50">
              <span className="text-[10px] font-bold text-slate-400">{getLocalizedDay(fc.day, t)}</span>
              <div className="my-1.5">{getWeatherIcon(fc.icon, 'h-5 w-5')}</div>
              <span className="text-xs font-extrabold text-slate-700">{fc.temp}</span>
              <span className="text-[9px] font-medium text-slate-500 block mt-0.5">{getLocalizedWeatherCondition(fc.label, t)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
