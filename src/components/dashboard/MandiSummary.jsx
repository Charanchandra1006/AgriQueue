import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { nearbyMandis } from '../../mock/mockData';
import { MapPin, Navigation, ArrowRight } from 'lucide-react';

export const MandiSummary = () => {
  const { t } = useApp();
  const navigate = useNavigate();

  const formatWaitingTime = (farmersAhead, averageServiceTime) => {
    const totalMin = farmersAhead * averageServiceTime;
    const hrs = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins > 0 ? mins + 'm' : ''}`;
    }
    return `${mins}m`;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MapPin className="h-5.5 w-5.5 text-primary-600" />
          <CardTitle>{t('dashboard.nearbyMandis')}</CardTitle>
        </div>
        <button
          onClick={() => navigate('/mandi-map')}
          className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-0.5 cursor-pointer"
        >
          <span>{t('dashboard.mapView')}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </CardHeader>

      <CardContent className="space-y-4">
        {nearbyMandis.map((mandi) => (
          <div
            key={mandi.id}
            className="group relative p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h4 className="font-semibold text-slate-800 text-sm md:text-base leading-tight group-hover:text-primary-700 transition-colors">
                  {mandi.external.name}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-0.5">
                    <Navigation className="h-3 w-3 text-slate-400 rotate-45" />
                    {mandi.fallbackDistance}
                  </span>
                  <span>•</span>
                  <span>{t('dashboard.estWait', { time: formatWaitingTime(mandi.agriQueue.farmersAhead, mandi.agriQueue.averageServiceTime) })}</span>
                </div>
              </div>
              <Badge variant={mandi.agriQueue.crowdLevel === 'High' ? 'danger' : mandi.agriQueue.crowdLevel === 'Medium' ? 'warning' : 'success'}>
                {mandi.agriQueue.crowdLevel}
              </Badge>
            </div>

            {/* Handle crops */}
            <div className="flex flex-wrap gap-1 mt-2.5">
              {mandi.external.commodities.map((crop, index) => (
                <span
                  key={index}
                  className="text-[10px] font-bold text-slate-500 bg-white border border-slate-150 px-2 py-0.5 rounded-md"
                >
                  {crop}
                </span>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
