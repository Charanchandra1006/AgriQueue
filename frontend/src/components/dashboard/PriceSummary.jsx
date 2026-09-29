import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { cropPrices } from '../../mock/mockData';
import { TrendingUp, TrendingDown, IndianRupee, ArrowRight } from 'lucide-react';

export const PriceSummary = () => {
  const { t } = useApp();
  const navigate = useNavigate();

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5.5 w-5.5 text-primary-600" />
          <CardTitle>{t('common.marketPrices')}</CardTitle>
        </div>
        <button
          onClick={() => navigate('/market-prices')}
          className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-0.5 cursor-pointer"
        >
          <span>{t('dashboard.allCrops')}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </CardHeader>

      <CardContent className="divide-y divide-slate-100">
        {cropPrices.map((item) => (
          <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-800 text-sm md:text-base leading-tight">
                {item.crop}
              </p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {item.mandi}
              </p>
            </div>
            
            <div className="text-right">
              <p className="font-heading font-extrabold text-slate-800 text-base md:text-lg flex items-center justify-end gap-0.5">
                <span>{item.price}</span>
                <span className="text-[10px] text-slate-400 font-semibold lowercase">/{item.unit}</span>
              </p>
              
              <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                item.isUp ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {item.isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {item.change}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
