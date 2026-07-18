import React from "react";
import { BookOpen, X, FileText, Calendar } from "lucide-react";
import type { TrendFacetBucket, TrendingTopic } from "@trend/shared-types";
import { formatMetricValue, type TrendSortKey } from "../../../pages/trends.insights";

// Types
export type TooltipPayload<TPayload> = Array<{ payload: TPayload }>;

export type TrendBarDatum = Pick<TrendingTopic, "topic" | "taxonomy" | "totalPapers" | "growthRatePct" | "momentum"> & {
  metricLabel: string;
  metricDisplay: string;
};

export type TrendBarChartDatum = TrendBarDatum & {
  value: number;
};

export type RisingKeywordRow = {
  keyword: string;
  growthRatePct: number;
  growth: string;
  totalPapers: number;
  yearlyBreakdown: TrendingTopic["yearlyBreakdown"];
  status: "Hot" | "Rising";
};

// 1. CustomBarTooltip Component
export function CustomBarTooltip({ active, payload, sortBy }: { active?: boolean, payload?: TooltipPayload<TrendBarDatum>, sortBy: TrendSortKey }) {
  if (active && payload && payload.length && payload[0]) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-lg text-xs select-none">
        <p className="font-extrabold text-slate-900 dark:text-white mb-2">{data.topic}</p>
        <div className="space-y-1.5 text-slate-600 dark:text-slate-400 font-medium">
          <p className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/20 px-2 py-1 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            {data.metricLabel}: {data.metricDisplay}
          </p>
          <p>Total papers: <span className="text-slate-900 dark:text-white font-bold">{data.totalPapers.toLocaleString()}</span></p>
          <p>Growth: <span className="text-slate-900 dark:text-white font-bold">{formatMetricValue(data.growthRatePct, sortBy)}</span></p>
          <p>Momentum: <span className="text-slate-900 dark:text-white font-bold">{formatMetricValue(data.momentum, sortBy)}</span></p>
        </div>
      </div>
    );
  }
  return null;
}

// 2. FacetGroup Component
export function FacetGroup({
  title,
  buckets,
  total,
  activeValues = [],
  onBucketClick,
}: {
  title: string;
  buckets: TrendFacetBucket[];
  total: number;
  activeValues?: string[];
  onBucketClick?: (value: string, openalexId?: string) => void;
}) {
  return (
    <div className="space-y-3.5">
      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{title}</h4>
      <div className="space-y-2.5">
        {(buckets ?? []).slice(0, 4).map((b) => {
          const isSelected = activeValues.includes(b.id || b.name) || (b.openalexId && activeValues.includes(b.openalexId));
          const percentage = total > 0 ? Math.min(100, Math.round((b.count / total) * 100)) : 0;
          return (
            <div
              key={b.id || b.name}
              onClick={() => onBucketClick?.(b.id || b.name, b.openalexId)}
              className={`text-xs group cursor-pointer p-1.5 rounded-lg border transition-all duration-150 ${
                isSelected
                  ? "bg-blue-50/70 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/30"
                  : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-900/30"
              }`}
            >
              <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span className="truncate max-w-[125px] capitalize font-bold" title={b.name}>{b.name}</span>
                <span className="text-slate-500 dark:text-slate-400 font-normal shrink-0">{b.count.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isSelected ? "bg-blue-600 dark:bg-blue-400" : "bg-blue-600/60 dark:bg-blue-500/50 group-hover:bg-blue-600"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
        {(!buckets || buckets.length === 0) && (
          <p className="text-xs text-slate-400 italic pl-1.5">No data</p>
        )}
      </div>
    </div>
  );
}

// 3. KPICard Component
export function KPICard({ title, value, trend, subtitle, icon }: { title: string, value: string, trend?: string, subtitle?: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-2 uppercase">{title}</h4>
          <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{value}</div>
        </div>
        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg shrink-0">
          {icon}
        </div>
      </div>

      <div>
        {trend && (
          <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            {trend}
          </div>
        )}
        {subtitle && (
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-2">
            <div className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
               <BookOpen className="w-2 h-2 text-slate-400" />
            </div>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

// 4. InsightCard Component
export function InsightCard({
  label,
  value,
  taxonomyPath,
  detail,
  actionLabel,
  onAction,
}: {
  label: string;
  value: string;
  taxonomyPath?: string;
  detail: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="relative overflow-hidden bg-white/70 dark:bg-[#121212]/70 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300 group flex flex-col justify-between h-36">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-500" />
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">{label}</p>
        <p className="mt-2 text-base font-extrabold text-slate-800 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={value}>{value}</p>
        {taxonomyPath && (
          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold truncate capitalize" title={taxonomyPath}>{taxonomyPath}</p>
        )}
        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{detail}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="mt-2 text-xs font-extrabold text-blue-700 dark:text-blue-400 hover:text-blue-850 hover:underline flex items-center gap-1 w-fit transition-colors"
      >
        <span>{actionLabel}</span>
        <span className="group-hover:translate-x-0.5 transition-transform">➔</span>
      </button>
    </div>
  );
}

// 5. Filter Chip Component
export function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-full px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm select-none">
      <span className="capitalize">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 ml-0.5 font-bold"
      >
        ✕
      </button>
    </span>
  );
}
