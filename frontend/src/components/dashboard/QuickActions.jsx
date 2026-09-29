import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Calendar, HeartPulse, Truck, MapPin, ArrowUpRight } from 'lucide-react';

export const QuickActions = () => {
  const { t } = useApp();
  const navigate = useNavigate();

  const actions = [
    {
      id: 1,
      title: t('dashboard.bookSlot'),
      desc: t('booking.bookSlotSubtitle'),
      path: "/book-slot",
      icon: Calendar,
      color: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50",
      iconColor: "bg-emerald-600 text-white"
    },
    {
      id: 2,
      title: t('common.aiCropDoctor'),
      desc: t('help.subtitle'),
      path: "/crop-doctor",
      icon: HeartPulse,
      color: "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100/50",
      iconColor: "bg-rose-600 text-white"
    },
    {
      id: 3,
      title: t('common.bookTransport'),
      desc: t('transport.pageSubtitle'),
      path: "/book-transport",
      icon: Truck,
      color: "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100/50",
      iconColor: "bg-blue-600 text-white"
    },
    {
      id: 4,
      title: t('dashboard.exploreMandis'),
      desc: t('mandi.mapSubtitle'),
      path: "/mandi-map",
      icon: MapPin,
      color: "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/50",
      iconColor: "bg-amber-600 text-white"
    }
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t('common.actions')}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => navigate(action.path)}
              className={`group flex items-start gap-4 p-4.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${action.color}`}
            >
              {/* Icon Container */}
              <div className={`p-3 rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-110 ${action.iconColor}`}>
                <action.icon className="h-6 w-6" />
              </div>
              
              <div className="flex-1 min-w-0 pr-2">
                <span className="flex items-center gap-1 font-heading font-bold text-slate-800 text-sm md:text-base group-hover:text-slate-900">
                  {action.title}
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                  {action.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
