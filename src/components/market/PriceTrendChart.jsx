import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { useApp } from '../../context/AppContext';

/**
 * Formats date into readable Indian short format (e.g. 15 Sep)
 */
const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
  } catch {
    // fallback
  }
  return dateStr;
};

/**
 * Formats YYYY-MM into readable month format (e.g. Sep 2026)
 */
const formatMonthLabel = (monthStr) => {
  if (!monthStr) return '';
  try {
    const parts = String(monthStr).split('-');
    if (parts.length === 2) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
      return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    }
  } catch {
    // fallback
  }
  return monthStr;
};

/**
 * Custom Farmer-Friendly Tooltip for Charts
 */
const CustomTooltip = ({ active, payload, label, period }) => {
  const { t } = useApp();
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload || {};
  const isToday = period === 'today';
  const isYear = period === '1y';

  return (
    <div className="bg-white/95 backdrop-blur-xs p-3 rounded-xl shadow-lg border border-slate-200 text-xs space-y-1.5 min-w-[190px] z-50">
      <div className="font-extrabold text-slate-800 border-b border-slate-100 pb-1 flex items-center justify-between">
        <span>
          {isToday
            ? data.displayName || label
            : isYear
            ? `${t('market.monthColon', 'Month:')} ${formatMonthLabel(data.label || label)}`
            : `${t('market.dateColon', 'Date:')} ${formatShortDate(data.date || label)}`}
        </span>
        {data.variety && (
          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">
            {data.variety}
          </span>
        )}
      </div>

      {isToday && data.price !== undefined && (
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3 font-bold text-slate-800">
            <span>{t('market.rateColon', 'Rate:')}</span>
            <span className="text-emerald-700 font-extrabold text-sm">
              ₹{data.price.toLocaleString('en-IN')} {t('market.perQtl', '/ qtl')}
            </span>
          </div>
          {data.category && (
            <div className="text-[10px] text-slate-500 italic">
              {data.category}
            </div>
          )}
        </div>
      )}

      {!isToday && data.modalPrice !== undefined && (
        <div className="flex items-center justify-between gap-3 text-emerald-700 font-bold">
          <span>{t('market.reportedRateColon', 'Reported Rate:')}</span>
          <span>₹{data.modalPrice.toLocaleString('en-IN')} {t('market.perQtl', '/ qtl')}</span>
        </div>
      )}

      {!isToday && data.minPrice !== undefined && data.maxPrice !== undefined && (
        <div className="flex items-center justify-between gap-3 text-slate-600 font-medium text-[11px]">
          <span>{t('market.approxRangeColon', 'Approx Range:')}</span>
          <span>₹{data.minPrice.toLocaleString('en-IN')} – ₹{data.maxPrice.toLocaleString('en-IN')}</span>
        </div>
      )}

      {data.recordCount && (
        <div className="text-[10px] text-slate-400 pt-0.5">
          {t('market.aggregatedFromArrivals', 'Aggregated from {count} reported arrivals', { count: data.recordCount })}
        </div>
      )}
    </div>
  );
};

export const PriceTrendChart = ({ period, trendData, isLoading }) => {
  const { t } = useApp();

  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center space-y-2 text-slate-500">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-600">{t('market.chartRetrievingRecords', 'Retrieving official government trend records...')}</p>
      </div>
    );
  }

  const points = trendData?.points || [];

  if (!points.length) {
    return (
      <div className="h-60 flex flex-col items-center justify-center p-6 text-center text-slate-500 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
        <span className="text-3xl block mb-2">📊</span>
        <h4 className="font-bold text-slate-800 text-sm">{t('market.notEnoughHistory', 'Not enough historical data yet')}</h4>
        <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
          {t('market.historyBuildNotice', 'Government price history will build automatically as new daily AGMARKNET records are synchronized.')}
        </p>
      </div>
    );
  }

  const isToday = period === 'today';
  const isYear = period === '1y';

  // Check if historical data has only one day or single date point
  const uniqueDates = Array.from(new Set(points.map(p => p.date || p.label).filter(Boolean)));
  const isSingleHistoricalDay = !isToday && uniqueDates.length <= 1;

  // Prepare chart data
  let chartData = [];
  let minDomain = 0;
  let maxDomain = 5000;

  if (isToday) {
    // If single record for selected mandi/crop (the standard case):
    // Compare available reported values: Min Rate, Modal Rate, Max Rate
    if (points.length === 1) {
      const p = points[0];
      const bars = [];
      if (p.minPrice != null && p.minPrice > 0) {
        bars.push({
          name: t('market.minRate', 'Min Rate'),
          displayName: t('market.minReportedRateName', 'Minimum Reported Rate'),
          price: p.minPrice,
          color: '#64748b',
          category: t('market.lowestRateToday', 'Lowest wholesale rate recorded today')
        });
      }
      if (p.modalPrice != null && p.modalPrice > 0) {
        bars.push({
          name: t('market.modalRate', 'Modal Rate'),
          displayName: t('market.reportedModalRateName', 'Reported Modal Rate'),
          price: p.modalPrice,
          color: '#10b981',
          category: t('market.mostCommonRateToday', 'Most common wholesale rate recorded today')
        });
      }
      if (p.maxPrice != null && p.maxPrice > 0) {
        bars.push({
          name: t('market.maxRate', 'Max Rate'),
          displayName: t('market.maxReportedRateName', 'Maximum Reported Rate'),
          price: p.maxPrice,
          color: '#f59e0b',
          category: t('market.highestRateToday', 'Highest wholesale rate recorded today')
        });
      }
      chartData = bars;
    } else {
      // Multiple records for today (e.g. multiple varieties)
      chartData = points.map((p, idx) => ({
        name: p.variety || t('market.arrivalIndex', 'Arrival {index}', { index: idx + 1 }),
        displayName: `${p.commodity || 'Crop'} (${p.variety || t('market.standardVariety', 'Standard')})`,
        modalPrice: p.modalPrice,
        minPrice: p.minPrice,
        maxPrice: p.maxPrice
      }));
    }

    // Compute domain for Today
    const todayValues = chartData.flatMap(d => [d.price, d.modalPrice, d.minPrice, d.maxPrice].filter(Boolean));
    if (todayValues.length > 0) {
      const minVal = Math.min(...todayValues);
      const maxVal = Math.max(...todayValues);
      minDomain = Math.max(0, Math.floor((minVal * 0.85) / 100) * 100);
      maxDomain = Math.ceil((maxVal * 1.1) / 100) * 100;
    }
  } else if (isYear) {
    // 1 Year: Monthly aggregated real data
    chartData = points.map(pt => ({
      name: formatMonthLabel(pt.label),
      label: pt.label,
      modalPrice: pt.modalPrice,
      minPrice: pt.minPrice,
      maxPrice: pt.maxPrice,
      recordCount: pt.recordCount
    }));

    const vals = points.flatMap(p => [p.minPrice, p.maxPrice, p.modalPrice].filter(Boolean));
    if (vals.length > 0) {
      minDomain = Math.max(0, Math.floor((Math.min(...vals) * 0.9) / 100) * 100);
      maxDomain = Math.ceil((Math.max(...vals) * 1.1) / 100) * 100;
    }
  } else {
    // 7 Days & 30 Days: Every real reported day returned by API
    chartData = points.map(pt => ({
      name: formatShortDate(pt.date),
      date: pt.date,
      modalPrice: pt.modalPrice,
      minPrice: pt.minPrice,
      maxPrice: pt.maxPrice,
      variety: pt.variety
    }));

    const vals = points.flatMap(p => [p.minPrice, p.maxPrice, p.modalPrice].filter(Boolean));
    if (vals.length > 0) {
      minDomain = Math.max(0, Math.floor((Math.min(...vals) * 0.9) / 100) * 100);
      maxDomain = Math.ceil((Math.max(...vals) * 1.1) / 100) * 100;
    }
  }

  const isTodaySingleComparison = isToday && points.length === 1;

  return (
    <div className="space-y-3">
      {/* 4. Single-day historical data notice if <= 1 day in 7d/30d/1y */}
      {isSingleHistoricalDay && (
        <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs">
          <span className="text-base shrink-0 select-none">📊</span>
          <div className="space-y-0.5">
            <strong className="block font-bold text-amber-950">{t('market.notEnoughHistory', 'Not enough historical data yet')}</strong>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              {t('market.historyBuildNotice', 'Government price history will build automatically as new daily AGMARKNET records are synchronized.')}
            </p>
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {isToday ? (
            /* Bar Chart for Today comparing available reported price values */
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 15, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                domain={[minDomain, maxDomain]}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => `₹${val}`}
                width={60}
                tickLine={false}
                axisLine={false}
                label={{
                  value: t('market.pricePerQtlYAxis', '₹ / quintal'),
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#94a3b8',
                  fontSize: 10,
                  offset: 10
                }}
              />
              <Tooltip content={<CustomTooltip period="today" />} />
              {isTodaySingleComparison ? (
                /* Single record: Min, Modal, Max comparison */
                <Bar
                  dataKey="price"
                  name={t('market.pricePerQtlBarName', 'Price (₹/qtl)')}
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#10b981'} />
                  ))}
                </Bar>
              ) : (
                /* Multi record: Grouped bars */
                <>
                  <Legend
                    verticalAlign="top"
                    height={32}
                    formatter={(value) => (
                      <span className="text-xs font-semibold text-slate-700">
                        {value === 'modalPrice' ? t('market.reportedPriceLegend', 'Reported price') : value === 'maxPrice' ? t('market.approxRangeMaxLegend', 'Approximate range (Max)') : t('market.approxRangeMinLegend', 'Approximate range (Min)')}
                      </span>
                    )}
                  />
                  <Bar dataKey="modalPrice" name="modalPrice" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="minPrice" name="minPrice" fill="#64748b" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="maxPrice" name="maxPrice" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={32} />
                </>
              )}
            </BarChart>
          ) : (
            /* Line Chart for 7 Days, 30 Days, and 1 Year */
            <LineChart
              data={chartData}
              margin={{ top: 15, right: 15, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                domain={[minDomain, maxDomain]}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => `₹${val}`}
                width={60}
                tickLine={false}
                axisLine={false}
                label={{
                  value: t('market.pricePerQtlYAxis', '₹ / quintal'),
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#94a3b8',
                  fontSize: 10,
                  offset: 10
                }}
              />
              <Tooltip content={<CustomTooltip period={period} />} />
              <Legend
                verticalAlign="top"
                height={32}
                formatter={(value) => (
                  <span className="text-xs font-semibold text-slate-700">
                    {value === 'modalPrice' ? t('market.reportedPriceLegend', 'Reported price') : t('market.approxRangeLegend', 'Approximate range')}
                  </span>
                )}
              />
              {/* Reported Modal Price Line (Hero Line) */}
              <Line
                type="monotone"
                dataKey="modalPrice"
                name="modalPrice"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 7, strokeWidth: 2 }}
                connectNulls={false}
              />
              {/* Approximate Range Boundary Lines */}
              <Line
                type="monotone"
                dataKey="maxPrice"
                name="maxPrice"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#f59e0b' }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="minPrice"
                name="minPrice"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#94a3b8' }}
                connectNulls={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Simple Legend / Guide for Today Comparison Bar Chart */}
      {isToday && isTodaySingleComparison && (
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-500 inline-block" />
            <span className="font-semibold text-slate-600">{t('market.minRate', 'Min Rate')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
            <span className="font-extrabold text-emerald-800">{t('market.reportedPriceModalLegend', 'Reported price (Modal)')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span className="font-semibold text-slate-600">{t('market.maxRate', 'Max Rate')}</span>
          </div>
        </div>
      )}
    </div>
  );
};
