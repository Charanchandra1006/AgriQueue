import React from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../ui/Card';
import { Users, Award, ShieldCheck } from 'lucide-react';

export const ImpactStats = () => {
  const { t } = useApp();

  const stats = [
    {
      id: 1,
      label: t('dashboard.registeredFarmers'),
      value: "142,500+",
      desc: t('dashboard.activeUsersNationwide'),
      icon: Users
    },
    {
      id: 2,
      label: t('dashboard.avgWaitReduced'),
      value: "68%",
      desc: t('dashboard.from6hTo18h'),
      icon: Award
    },
    {
      id: 3,
      label: t('dashboard.transactionsFacilitated'),
      value: "₹428 Crore",
      desc: t('dashboard.directBankProcurement'),
      icon: ShieldCheck
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <Card key={stat.id} className="text-center group border-slate-100 hover:border-emerald-150">
            <div className="mx-auto p-3 w-12 h-12 bg-primary-50 rounded-xl text-primary-600 flex items-center justify-center mb-3.5 group-hover:bg-primary-600 group-hover:text-white transition-all duration-200">
              <IconComponent className="h-6 w-6" />
            </div>
            
            <h4 className="font-heading font-extrabold text-2xl md:text-3xl text-slate-800 tracking-tight mb-1">
              {stat.value}
            </h4>
            
            <p className="text-xs font-bold text-slate-700 tracking-tight">
              {stat.label}
            </p>
            
            <p className="text-[11px] text-slate-400 font-semibold mt-1">
              {stat.desc}
            </p>
          </Card>
        );
      })}
    </div>
  );
};
