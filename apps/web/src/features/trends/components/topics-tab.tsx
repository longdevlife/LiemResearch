import React from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts";
import type { TrendsOverview, YearlyCount } from "@trend/shared-types";
import { CustomBarTooltip, type RisingKeywordRow, type TrendBarChartDatum } from "./trends-shared.components";
import { isSmallBaseKeyword } from "../../../pages/trends.insights";
import type { TrendSortKey } from "../../../pages/trends.insights";

interface TopicsTabProps {
  data: TrendsOverview;
  barChartData: TrendBarChartDatum[];
  keywordsData: RisingKeywordRow[];
  sortBy: TrendSortKey;
  navigate: (path: string) => void;
  getTopicTrendTarget: (topic: string) => string;
  getRisingKeywordTarget: (keyword: string) => string;
}

export function TopicsTab({
  data,
  barChartData,
  keywordsData,
  sortBy,
  navigate,
  getTopicTrendTarget,
  getRisingKeywordTarget,
}: TopicsTabProps) {
  return (
    <div className="space-y-6">
      {/* Sort Context Strip */}
      <div className="bg-blue-50/40 dark:bg-blue-950/5 border border-blue-100/50 dark:border-blue-900/30 rounded-xl px-4 py-3 text-xs text-blue-700 dark:text-blue-400 font-bold select-none">
        Showing top topics and rising keywords by {sortBy === "growth" ? "Growth" : sortBy === "total" ? "Total papers" : "Momentum"} inside the current dataset scope.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Bar Chart Top Topics (7 columns) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col min-h-[380px]">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
            {sortBy === "growth" ? "Top Topics by Growth" : sortBy === "total" ? "Top Topics by Total Papers" : "Top Topics by Momentum"}
          </h3>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="topic"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#475569', fontWeight: 550 }}
                  width={180}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  content={<CustomBarTooltip sortBy={sortBy} />}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {barChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? '#1d4ed8' : '#60a5fa'}
                      onClick={() => navigate(getTopicTrendTarget(entry.topic))}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Rising Keywords Table (5 columns) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-0 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800/50">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Rising Keywords</h3>
            <p className="text-xs text-slate-500 mt-1">Fast-growing keywords. Click one to find matching papers.</p>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-900/20">
                <tr>
                  <th className="px-6 py-3 font-medium">Keyword</th>
                  <th className="px-6 py-3 font-medium text-right">Papers</th>
                  <th className="px-6 py-3 font-medium text-right">Growth</th>
                  <th className="px-6 py-3 font-medium text-center">Trend</th>
                  <th className="px-6 py-3 font-medium text-center">Status</th>
                  <th className="px-6 py-3 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {keywordsData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200 capitalize">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => navigate(getRisingKeywordTarget(row.keyword))}
                          className="hover:text-blue-600 transition-colors text-left"
                          title={`Search papers about ${row.keyword}`}
                        >
                          {row.keyword}
                        </button>
                        {isSmallBaseKeyword(row) && (
                          <span className="w-fit rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 px-1.5 py-0.5 text-[8px] font-extrabold border border-amber-200/50 dark:border-amber-900/30" title="High YoY growth computed from a very small number of papers (fewer than 10 papers total)">
                            small base
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700 dark:text-slate-300">
                      {row.totalPapers}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">
                      {row.growth}
                    </td>
                    <td className="px-6 py-2">
                      {row.yearlyBreakdown && row.yearlyBreakdown.length > 0 && (
                        <div className="flex justify-center items-center">
                          <div className="h-6 w-16 opacity-85 hover:opacity-100 transition-opacity">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={row.yearlyBreakdown.map((y: YearlyCount) => ({ year: String(y.year), count: y.count }))}>
                                <Area type="monotone" dataKey="count" stroke="#10b981" fill="#ecfdf5" strokeWidth={1.5} fillOpacity={0.5} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        row.status === 'Hot' ? 'bg-red-100 text-red-700' :
                        row.status === 'Rising' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-750 dark:text-slate-400'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => navigate(getRisingKeywordTarget(row.keyword))}
                          className="text-xs font-extrabold text-blue-700 dark:text-blue-400 hover:underline"
                        >
                          Papers
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/reports?create=true&topic=${encodeURIComponent(row.keyword)}&query=${encodeURIComponent(`Analyze research trends and gaps for ${row.keyword}`)}`)}
                          className="text-xs font-extrabold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                        >
                          Report
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
