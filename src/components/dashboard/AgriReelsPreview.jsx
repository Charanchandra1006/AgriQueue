import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { agriReels } from '../../mock/mockData';
import { Play, Eye, Clock, ArrowRight } from 'lucide-react';

export const AgriReelsPreview = () => {
  const { t } = useApp();
  const navigate = useNavigate();

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Play className="h-5.5 w-5.5 text-primary-600 fill-primary-600" />
          <CardTitle>{t('educationalReels')}</CardTitle>
        </div>
        <button
          onClick={() => navigate('/reels')}
          className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-0.5 cursor-pointer"
        >
          <span>{t('viewReels')}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {agriReels.map((reel) => (
            <div
              key={reel.id}
              onClick={() => navigate('/reels')}
              className="group flex flex-col bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden hover:bg-white hover:border-slate-200 transition-all duration-250 cursor-pointer shadow-2xs hover:shadow-sm"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-200">
                <img
                  src={reel.thumbnail}
                  alt={reel.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/30 flex items-center justify-center transition-colors">
                  <div className="p-2.5 bg-white/90 rounded-full text-slate-800 shadow-lg scale-90 group-hover:scale-100 transition-transform duration-200">
                    <Play className="h-5.5 w-5.5 fill-slate-800 ml-0.5" />
                  </div>
                </div>

                {/* Duration Badge */}
                <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 text-[10px] font-bold text-white bg-slate-900/70 px-2 py-0.5 rounded-md backdrop-blur-xs">
                  <Clock className="h-3 w-3" />
                  {reel.duration}
                </span>
              </div>

              {/* Info Details */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <span className="inline-block text-[10px] font-extrabold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md mb-2">
                    {reel.category}
                  </span>
                  <h4 className="font-semibold text-slate-800 text-sm md:text-base leading-snug group-hover:text-primary-700 transition-colors line-clamp-2">
                    {reel.title}
                  </h4>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 mt-3 pt-2.5 border-t border-slate-100/50">
                  <Eye className="h-3.5 w-3.5" />
                  <span>{reel.views}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
