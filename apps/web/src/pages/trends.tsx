import React, { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Download, Sparkles, Users, BookOpen, Search, Calendar, FileText, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTrendsOverview } from "@/features/trends/hooks/use-trends";
import { getRisingKeywordTarget, getTopicTrendTarget } from "./trends.navigation";
import {
  formatMetricValue,
  formatSigned,
  getFastestKeyword,
  getFastestTopic,
  getHighestGrowthTopic,
  getMostEstablishedTopic,
  getTopicMetric,
  isSmallBaseKeyword,
  TrendSortKey,
} from "./trends.insights";

function CustomBarTooltip({ active, payload, sortBy }: { active?: boolean, payload?: any[], sortBy: TrendSortKey }) {
  if (active && payload && payload.length) {
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
          <p>Growth: <span className="text-slate-900 dark:text-white font-bold">{formatMetricValue(data.growthRatePct, "growth")}</span></p>
          <p>Momentum: <span className="text-slate-900 dark:text-white font-bold">{formatMetricValue(data.momentum, "momentum")}</span></p>
        </div>
      </div>
    );
  }
  return null;
}

export function TrendsPage() {
  const navigate = useNavigate();

  // T1: Controlled states for API filters
  const [yearFrom, setYearFrom] = useState<number>(2020);
  const [yearTo, setYearTo] = useState<number>(2026);
  const [sortBy, setSortBy] = useState<"momentum" | "growth" | "total">("momentum");
  const [minPapers, setMinPapers] = useState<number>(2);

  const { data, isLoading, isError } = useTrendsOverview({
    yearFrom,
    yearTo,
    sortBy,
    minPapers,
  });

  const areaChartData = useMemo(() => {
    if (!data?.topics) return [];
    const yearlyMap = new Map<number, number>();
    data.topics.forEach((t) => {
      t.yearlyBreakdown.forEach((y) => {
        yearlyMap.set(y.year, (yearlyMap.get(y.year) || 0) + y.count);
      });
    });
    return Array.from(yearlyMap.entries())
      .map(([year, publications]) => ({ year: String(year), publications }))
      .sort((a, b) => Number(a.year) - Number(b.year));
  }, [data]);

  const peakYear = useMemo(() => {
    return [...areaChartData].sort((a, b) => b.publications - a.publications)[0] ?? null;
  }, [areaChartData]);

  const barChartData = useMemo(() => {
    if (!data?.topics) return [];
    return data.topics
      .map((t) => ({
        topic: t.topic,
        value: getTopicMetric(t, sortBy),
        totalPapers: t.totalPapers,
        growthRatePct: t.growthRatePct,
        momentum: t.momentum,
        metricLabel: sortBy === "growth" ? "Growth" : sortBy === "total" ? "Total papers" : "Momentum",
        metricDisplay: formatMetricValue(getTopicMetric(t, sortBy), sortBy),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [data, sortBy]);

  const keywordsData = useMemo(() => {
    if (!data?.risingKeywords) return [];
    return data.risingKeywords.map((k) => ({
      keyword: k.keyword,
      growthRatePct: k.growthRatePct,
      growth: `+${k.growthRatePct}%`,
      totalPapers: k.totalPapers,
      yearlyBreakdown: k.yearlyBreakdown,
      status: k.growthRatePct > 100 ? "Hot" : "Rising",
    }));
  }, [data]);

  const fastestTopic = useMemo(() => getFastestTopic((data?.topics ?? []) as any), [data?.topics]);
  const highestGrowthTopic = useMemo(() => getHighestGrowthTopic((data?.topics ?? []) as any), [data?.topics]);
  const establishedTopic = useMemo(() => getMostEstablishedTopic((data?.topics ?? []) as any), [data?.topics]);
  const fastestKeyword = useMemo(() => getFastestKeyword((data?.risingKeywords ?? []) as any), [data?.risingKeywords]);

  if (isLoading) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500">Loading trends data...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Insight Summary Cards (V2 Premium UI/UX) */}
      {data?.topics && data.topics.length > 0 && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <InsightCard
            label="Fastest moving topic"
            value={fastestTopic?.topic ?? "No topic"}
            detail={fastestTopic ? `${formatSigned(fastestTopic.momentum, 2)} papers/year` : "No data"}
            actionLabel="Open trend"
            onAction={() => fastestTopic && navigate(getTopicTrendTarget(fastestTopic.topic))}
          />
          <InsightCard
            label="Highest YoY growth"
            value={highestGrowthTopic?.topic ?? "No topic"}
            detail={highestGrowthTopic ? `${formatSigned(highestGrowthTopic.growthRatePct, 1)}% growth` : "No data"}
            actionLabel="Explore papers"
            onAction={() => highestGrowthTopic && navigate(`/search?q=${encodeURIComponent(highestGrowthTopic.topic)}`)}
          />
          <InsightCard
            label="Most established"
            value={establishedTopic?.topic ?? "No topic"}
            detail={establishedTopic ? `${establishedTopic.totalPapers.toLocaleString()} papers` : "No data"}
            actionLabel="Generate report"
            onAction={() => establishedTopic && navigate(`/reports?create=true&topic=${encodeURIComponent(establishedTopic.topic)}`)}
          />
          <InsightCard
            label="Emerging keyword"
            value={fastestKeyword?.keyword ?? "No keyword"}
            detail={fastestKeyword ? `${formatSigned(fastestKeyword.growthRatePct, 1)}% growth · ${fastestKeyword.totalPapers} papers` : "No data"}
            actionLabel="Search keyword"
            onAction={() => fastestKeyword && navigate(getRisingKeywordTarget(fastestKeyword.keyword))}
          />
        </section>
      )}

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-8 bg-white dark:bg-[#121212] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex-wrap">

        <div className="flex-1 min-w-[200px] relative">
          <button
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 z-10"
            onClick={(e) => {
              const input = e.currentTarget.nextElementSibling as HTMLInputElement;
              const val = input.value.trim();
              if (val) navigate(`/trends/${encodeURIComponent(val)}`);
            }}
          >
            <Search className="w-4 h-4" />
          </button>
          <input
            type="text"
            placeholder="Search for a topic trend..."
            className="w-full h-10 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 transition-shadow"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const val = e.currentTarget.value.trim();
                if (val) navigate(`/trends/${encodeURIComponent(val)}`);
              }
            }}
          />
        </div>

        {/* Year Range */}
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="number"
            value={yearFrom}
            onChange={(e) => setYearFrom(parseInt(e.target.value, 10) || 2020)}
            placeholder="From"
            className="w-20 h-10 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-center text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
          <span className="text-slate-400">-</span>
          <input
            type="number"
            value={yearTo}
            onChange={(e) => setYearTo(parseInt(e.target.value, 10) || 2026)}
            placeholder="To"
            className="w-20 h-10 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-center text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        {/* Sort By */}
        <div className="relative shrink-0 w-full md:w-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full md:w-auto h-10 pl-3 pr-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 appearance-none cursor-pointer"
          >
            <option value="momentum">Sort by Momentum</option>
            <option value="growth">Sort by Growth</option>
            <option value="total">Sort by Total Papers</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>

        {/* Min Papers */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 font-medium" title="Hide noisy topics with fewer than this many papers in the selected window.">Min Papers:</span>
          <input
            type="number"
            value={minPapers}
            min="1"
            onChange={(e) => setMinPapers(parseInt(e.target.value, 10) || 1)}
            className="w-16 h-10 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-center text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
            title="Hide noisy topics with fewer than this many papers in the selected window."
          />
        </div>

        <div className="flex w-full md:w-auto gap-3 shrink-0 ml-auto justify-end">
          <Button
            className="flex-1 md:flex-none h-10 px-6 bg-[#001b69] hover:bg-[#001040] text-white font-bold rounded-lg gap-2 shadow-md transition-colors"
            onClick={() => navigate('/reports?create=true')}
          >
            <Sparkles className="w-4 h-4" fill="currentColor" /> Generate AI Report
          </Button>
        </div>
      </div>

      {/* OpenAlex Facet Hint Note (V2 Premium UI/UX) */}
      {data?.topics && data.topics.length > 0 && (
        <div className="mb-8 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/10 border-l-2 border-slate-300 dark:border-slate-700 rounded-r-xl text-xs text-slate-500 dark:text-slate-400 select-none">
          <p className="leading-relaxed">
            <strong>Data Basis Hint:</strong> Trends are derived from active papers grouped by topic and keyword. OpenAlex-style fields such as publication year, topic, source/type, citations, and open access can become additional facets when backend support is added.
          </p>
        </div>
      )}

    {isError ? (
      <div className="w-full min-h-[350px] flex flex-col items-center justify-center text-center bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
        <p className="text-lg font-bold text-slate-900 dark:text-white">Failed to load trends data.</p>
        <p className="text-sm text-slate-500 mt-2">Please check your network connection or adjust your filters and try again.</p>
      </div>
    ) : !data?.topics?.length ? (
      <div className="w-full min-h-[350px] flex flex-col items-center justify-center text-center bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
        <p className="text-lg font-bold text-slate-900 dark:text-white">No trends found.</p>
        <p className="text-sm text-slate-500 mt-2">Try lowering "Min Papers" or expanding the year range to see more topics.</p>
      </div>
    ) : (
      <>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KPICard
          title="Total Papers"
          value={data?.totalPapersInWindow?.toLocaleString() || "0"}
          trend={`From ${data?.yearFrom || 2015} to ${data?.yearTo || 2024}`}
          icon={<FileText className="w-5 h-5 text-blue-600" />}
        />
        <KPICard
          title="Total Topics"
          value={data?.topics?.length?.toString() || "0"}
          trend="Tracked in window"
          icon={<BookOpen className="w-5 h-5 text-purple-600" />}
        />
        <KPICard
          title="Rising Keywords"
          value={data?.risingKeywords?.length?.toString() || "0"}
          subtitle="Emerging trends"
          icon={<Sparkles className="w-5 h-5 text-emerald-600" />}
        />
        <KPICard
          title="Metric Window"
          value={`${data?.yearFrom ?? "-"}-${data?.lastCompleteYear ?? "-"}`}
          subtitle={data?.yearTo && data.yearTo > data.lastCompleteYear ? `${data.yearTo} shown as YTD` : "Complete years only"}
          icon={<Calendar className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Metrics Explanation Strip */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 rounded-xl px-4 py-3 mb-8 text-xs text-slate-500 dark:text-slate-400 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-sm select-none">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          <span>
            <strong>Momentum</strong> = trend slope in papers/year. <strong>Growth</strong> = year-over-year change using the last complete year. Current-year data is shown as YTD and excluded from growth math.
          </span>
        </div>
        <div className="text-slate-400 dark:text-slate-500 font-semibold md:text-right shrink-0">
          Metrics computed through {data?.lastCompleteYear ?? "-"}. {data?.yearTo && data.yearTo > (data.lastCompleteYear ?? 0) ? `${data.yearTo} is YTD.` : ""}
        </div>
      </div>

      {/* Main Area Chart */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Publications per year across displayed topics</h3>
            <p className="text-xs text-slate-500 mt-1">This chart sums yearly paper counts for the topics currently shown below, not necessarily every paper in the corpus.</p>
            {data?.yearTo && data.yearTo > data.lastCompleteYear ? (
              <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                {data.yearTo} is year-to-date, so the final point may look lower until the year completes.
              </p>
            ) : null}
          </div>
          {peakYear && (
            <span className="text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/30 shrink-0 h-fit self-start sm:self-center select-none">
              Peak: {peakYear.year} · {peakYear.publications.toLocaleString()} papers
            </span>
          )}
        </div>
        <div className="h-[260px] md:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPubs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis
                dataKey="year"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                dy={10}
                minTickGap={30}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                tickFormatter={(value) => value === 0 ? '' : value}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
              />
              <Area
                type="monotone"
                dataKey="publications"
                stroke="#1e3a8a"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPubs)"
                activeDot={{ r: 6, fill: "#1e3a8a", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row: Bar Chart & Keywords Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left: Bar Chart Top Topics (7 columns) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col">
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
                  tick={{ fontSize: 13, fill: '#475569', fontWeight: 500, fontFamily: 'inherit' }}
                  width={220}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  content={<CustomBarTooltip sortBy={sortBy} />}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {barChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? '#1e3a8a' : '#60a5fa'}
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => navigate(getRisingKeywordTarget(row.keyword))}
                          className="hover:text-blue-600 transition-colors text-left"
                          title={`Search papers about ${row.keyword}`}
                        >
                          {row.keyword}
                        </button>
                        {isSmallBaseKeyword(row) && (
                          <span className="rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 px-2 py-0.5 text-[9px] font-extrabold shrink-0 border border-amber-200/50 dark:border-amber-900/30" title="High YoY growth computed from a very small number of papers (fewer than 10 papers total)">
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
                              <AreaChart data={row.yearlyBreakdown.map((y) => ({ year: String(y.year), count: y.count }))}>
                                <Area type="monotone" dataKey="count" stroke="#10b981" fill="#ecfdf5" strokeWidth={1.5} fillOpacity={0.5} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        row.status === 'Hot' ? 'bg-red-100 text-red-600' :
                        row.status === 'Rising' ? 'bg-amber-100 text-amber-600' :
                        'bg-slate-100 text-slate-600'
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
    </>
  )}
  </div>
  );
}

function KPICard({ title, value, trend, subtitle, icon }: { title: string, value: string, trend?: string, subtitle?: string, icon: React.ReactNode }) {
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

function InsightCard({
  label,
  value,
  detail,
  actionLabel,
  onAction,
}: {
  label: string;
  value: string;
  detail: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="relative overflow-hidden bg-white/70 dark:bg-[#121212]/70 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300 group flex flex-col justify-between h-36">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-500" />
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">{label}</p>
        <p className="mt-2.5 text-base font-extrabold text-slate-800 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={value}>{value}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{detail}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="mt-3 text-xs font-extrabold text-blue-700 dark:text-blue-400 hover:text-blue-800 hover:underline flex items-center gap-1 w-fit transition-colors"
      >
        <span>{actionLabel}</span>
        <span className="group-hover:translate-x-0.5 transition-transform">➔</span>
      </button>
    </div>
  );
}
