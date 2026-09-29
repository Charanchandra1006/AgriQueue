import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { weatherAlerts } from '../mock/mockData';
import {
  CloudSun,
  CloudRain,
  CloudLightning,
  Sun,
  Droplets,
  Wind,
  AlertTriangle,
  Compass,
  ThermometerSun,
  Info
} from 'lucide-react';

export const WeatherAlerts = () => {
  const getWeatherIcon = (iconName, size = "h-8 w-8") => {
    switch (iconName) {
      case 'cloud-sun':
        return <CloudSun className={`${size} text-amber-500`} />;
      case 'cloud-rain':
        return <CloudRain className={`${size} text-blue-500`} />;
      case 'cloud-showers-heavy':
        return <CloudLightning className={`${size} text-slate-500`} />;
      case 'sun':
        return <Sun className={`${size} text-amber-600`} />;
      default:
        return <CloudSun className={`${size} text-slate-500`} />;
    }
  };

  const advisoryList = [
    {
      crop: "Paddy (Rice)",
      task: "Harvesting & Drying",
      advice: "Postpone harvesting for 2 days. If already harvested, keep the crop covered with tarpaulin sheets in a raised place to avoid submergence in runoff water."
    },
    {
      crop: "Cotton",
      task: "Pest Management",
      advice: "Do not apply pesticide spray or chemical fertilizers today, as rainfall will wash it off. Resume applications after rainfall stops."
    },
    {
      crop: "Vegetables",
      task: "Drainage Control",
      advice: "Clean excess water outlet drains in tomato, chilli, and cucurbit fields to avoid waterlogging and root rot."
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-slate-800 tracking-tight">
          Weather Forecast & Advisories
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Detailed farm advisories mapped to local meteorological forecasts.
        </p>
      </div>

      {/* Main Alert Warning Banner */}
      {weatherAlerts.alerts.length > 0 && (
        <div className="flex items-start gap-4 p-5 rounded-2xl border border-rose-200 bg-rose-50/50 shadow-2xs">
          <AlertTriangle className="h-7 w-7 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-heading font-extrabold text-rose-950 text-base md:text-lg">
              Active Storm Warning
            </h3>
            <p className="text-sm font-semibold text-rose-900 mt-1 leading-relaxed">
              {weatherAlerts.alerts[0].message} High-speed winds up to 25 km/h expected.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Detailed Current Stats */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-100 bg-gradient-to-br from-white to-amber-50/10">
            <CardHeader>
              <CardTitle>Current Conditions</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  {getWeatherIcon('cloud-sun', 'h-12 w-12')}
                  <div>
                    <span className="font-heading font-extrabold text-3xl text-slate-800 leading-none">
                      {weatherAlerts.currentTemp}
                    </span>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">{weatherAlerts.condition}</p>
                  </div>
                </div>
                <Badge variant="warning">Alert Level: Yellow</Badge>
              </div>

              {/* Weather Metres Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white border border-slate-100 rounded-xl text-center">
                  <Droplets className="h-5 w-5 text-blue-500 mx-auto mb-1.5" />
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Humidity</span>
                  <span className="font-heading font-extrabold text-slate-800 text-sm mt-0.5">{weatherAlerts.humidity}</span>
                </div>

                <div className="p-3 bg-white border border-slate-100 rounded-xl text-center">
                  <Wind className="h-5 w-5 text-slate-500 mx-auto mb-1.5" />
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wind Speed</span>
                  <span className="font-heading font-extrabold text-slate-800 text-sm mt-0.5">{weatherAlerts.windSpeed}</span>
                </div>

                <div className="p-3 bg-white border border-slate-100 rounded-xl text-center">
                  <ThermometerSun className="h-5 w-5 text-amber-500 mx-auto mb-1.5" />
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">UV Index</span>
                  <span className="font-heading font-extrabold text-slate-800 text-sm mt-0.5">5 (Moderate)</span>
                </div>

                <div className="p-3 bg-white border border-slate-100 rounded-xl text-center">
                  <Compass className="h-5 w-5 text-emerald-500 mx-auto mb-1.5" />
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Soil Moisture</span>
                  <span className="font-heading font-extrabold text-slate-800 text-sm mt-0.5">24% (Optimal)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Weekly Forecast & Advisories */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly Forecast Card */}
          <Card className="border-slate-100">
            <CardHeader>
              <CardTitle>4-Day Outlook</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {weatherAlerts.forecast.map((fc, index) => (
                  <div key={index} className="flex sm:flex-col items-center justify-between sm:justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left sm:text-center gap-3">
                    <div>
                      <span className="block text-xs font-bold text-slate-400 sm:text-center">{fc.day}</span>
                      <span className="text-[10px] font-bold text-slate-500 sm:hidden block mt-0.5">{fc.label}</span>
                    </div>
                    <div>{getWeatherIcon(fc.icon, 'h-8 w-8')}</div>
                    <div>
                      <span className="font-heading font-extrabold text-slate-800 text-base block sm:text-center leading-none">
                        {fc.temp}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline-block mt-1">{fc.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Expert Farmer Advisories */}
          <Card className="border-slate-100">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary-600" />
                <CardTitle>Krishi Vigyan Kendra Crop Advisories</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {advisoryList.map((adv, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between gap-2.5">
                    <span className="text-xs font-extrabold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-md">
                      {adv.crop}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Action: {adv.task}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-medium text-slate-600 leading-relaxed">
                    {adv.advice}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
