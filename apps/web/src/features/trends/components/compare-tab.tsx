import React from "react";
import { Users, Loader2 } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import type { TrendCompareResponse, TopicComparisonItem, TrendsOverview } from "@trend/shared-types";
import type { UseQueryResult } from "@tanstack/react-query";
import { getTopicMetric, formatMetricValue, formatSigned } from "../../../pages/trends.insights";
import type { TrendSortKey } from "../../../pages/trends.insights";

export type CompareChartDatum = { year: string } & Record<string, string | number>;

interface CompareTabProps {
  data: TrendsOverview;
  selectedTopics: string[];
  setSelectedTopics: React.Dispatch<React.SetStateAction<string[]>>;
  compareQuery: Pick<UseQueryResult<TrendCompareResponse, Error>, "data" | "isLoading" | "isError">;
  compareChartData: CompareChartDatum[];
  yearFrom: number;
  yearTo: number;
  sortBy: TrendSortKey;
}

export function CompareTab({
  data,
  selectedTopics,
  setSelectedTopics,
  compareQuery,
  compareChartData,
  yearFrom,
  yearTo,
  sortBy,
}: CompareTabProps) {
  return (
    <div className="space-y-6">
      {/* Selected Topics Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Multi-Topic Comparison</h3>
          <p className="text-xs text-slate-500 mt-1">Select 2 to 5 topics from the current list to analyze their timeline side-by-side.</p>
        </div>
        {selectedTopics.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedTopics([])}
            className="h-8 rounded-full text-xs font-bold shrink-0 self-start md:self-center"
          >
            Clear Selections
          </Button>
        )}
      </div>

      {/* Mini-Chips Selector */}
      {data.topics && data.topics.length > 0 && (
        <div className="flex flex-wrap gap-2.5 p-3.5 border border-slate-200 dark:border-slate-800/85 rounded-2xl bg-slate-50/30 dark:bg-slate-900/5 select-none">
          {data.topics.map((t) => {
            const isSelected = selectedTopics.includes(t.topic);
            const metricDisplay = formatMetricValue(getTopicMetric(t, sortBy), sortBy);
            return (
              <button
                key={t.topic}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setSelectedTopics(prev => prev.filter(x => x !== t.topic));
                  } else {
                    if (selectedTopics.length >= 5) return;
                    setSelectedTopics(prev => [...prev, t.topic]);
                  }
                }}
                disabled={!isSelected && selectedTopics.length >= 5}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-155 border flex flex-col items-start text-left active:scale-95 ${
                  isSelected
                    ? "bg-blue-600 border-blue-600 text-white font-extrabold shadow-md hover:bg-blue-700"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                <span className="capitalize font-bold">{t.topic}</span>
                {t.taxonomy && (
                  <span className={`text-[9px] uppercase tracking-wider font-semibold mt-0.5 ${isSelected ? "text-blue-200" : "text-slate-400"}`}>
                    {t.taxonomy.domainName}
                  </span>
                )}
                <span className={`text-[9px] font-bold mt-1 ${isSelected ? "text-white" : "text-blue-600 dark:text-blue-400"}`}>
                  {sortBy === "growth" ? "Growth" : sortBy === "total" ? "Papers" : "Momentum"}: {metricDisplay}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Recommended Comparisons cards */}
      {selectedTopics.length < 2 && data.recommendedComparisons && data.recommendedComparisons.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Recommended Comparisons</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.recommendedComparisons.slice(0, 4).map((rec, idx) => (
              <div key={idx} className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                    {rec.sharedTaxonomy ? `${rec.sharedTaxonomy.fieldName || rec.sharedTaxonomy.domainName || "Related topics"}` : "Scholarly overlap"}
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                    {rec.topics.map(t => (
                      <span key={t} className="text-xs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-850 dark:text-slate-200 px-2 py-0.5 rounded capitalize">{t}</span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold mb-4">{rec.reason}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-fit text-xs font-bold gap-1 rounded-lg border-blue-200 hover:bg-blue-50 dark:border-blue-900/30 dark:hover:bg-blue-950/20 text-blue-700 dark:text-blue-400"
                  onClick={() => {
                    setSelectedTopics(rec.topics);
                    document.getElementById("trends-panel-compare")?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Users className="w-3.5 h-3.5" /> Use comparison
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison View */}
      {selectedTopics.length < 2 ? (
        <div className="py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-slate-50/20 dark:bg-slate-900/5 select-none">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Please select at least 2 topics (and up to 5) to generate comparison analysis.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Currently selected: {selectedTopics.length} / 5
          </p>
        </div>
      ) : compareQuery.isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <p className="text-xs text-slate-500 font-medium">Fetching comparison stats...</p>
        </div>
      ) : compareQuery.isError ? (
        <p className="text-sm text-red-600 py-6 text-center">Failed to load comparison data. Please try again.</p>
      ) : (
        <div className="space-y-6 bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          {/* Compare Multi-Line Chart */}
          <div className="h-[260px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={compareChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="year"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 550 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 550 }}
                  tickFormatter={(value) => value === 0 ? '' : value}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle" 
                  wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} 
                /> 
                {selectedTopics.map((topic, index) => {
                  const colors = ["#1d4ed8", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"];
                  return (
                    <Line
                      key={topic}
                      type="monotone"
                      dataKey={topic}
                      stroke={colors[index % colors.length]}
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Compare Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-[#121212] mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-900/20">
                  <tr>
                    <th className="px-6 py-3 font-medium">Topic Name</th>
                    <th className="px-6 py-3 font-medium text-right">Total Papers</th>
                    <th className="px-6 py-3 font-medium text-right">Growth YoY</th>
                    <th className="px-6 py-3 font-medium text-right">Momentum</th>
                    <th className="px-6 py-3 font-medium text-right">CAGR 3Y</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {compareQuery.data?.topics.map((t: TopicComparisonItem, i: number) => {
                    const colors = ["#1d4ed8", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"];
                    const colorClass = colors[i % colors.length];
                    return (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 capitalize flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colorClass }} />
                          {t.topic}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-700 dark:text-slate-300">
                          {t.totalPapers.toLocaleString()}
                        </td>
                        <td className={`px-6 py-4 text-right font-extrabold ${t.growthRatePct > 0 ? "text-emerald-600" : t.growthRatePct < 0 ? "text-red-500" : "text-slate-500"}`}>
                          {formatSigned(t.growthRatePct, 1)}%
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-600 dark:text-slate-400">
                          {formatSigned(t.momentum, 2)} papers/year
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-blue-700 dark:text-blue-400">
                          {t.cagr3yPct !== null ? `${formatSigned(t.cagr3yPct, 1)}%` : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
