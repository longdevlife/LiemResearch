import React, { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, LineChart, Line } from "recharts";
import { Download, Sparkles, Users, BookOpen, Search, Calendar, FileText, Loader2, ChevronDown, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useTrendsOverview, useTrendCompare, useTrendRelationships, useExplainTrend } from "@/features/trends/hooks/use-trends";
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

  const [datasetMode, setDatasetMode] = useState<"corpus" | "displayed">("corpus");
  const [metricMode, setMetricMode] = useState<"papers" | "citations_total" | "citations_avg">("papers");

  // Calculated displayed topics yearly sum
  const displayedTopicsYearlyData = useMemo(() => {
    if (!data?.topics) return [];
    const yearlyMap = new Map<number, number>();
    data.topics.forEach((t) => {
      t.yearlyBreakdown.forEach((y) => {
        yearlyMap.set(y.year, (yearlyMap.get(y.year) || 0) + y.count);
      });
    });
    return Array.from(yearlyMap.entries())
      .map(([year, count]) => ({ year: String(year), value: count }))
      .sort((a, b) => Number(a.year) - Number(b.year));
  }, [data]);

  // Unified timelineChartData based on datasetMode and metricMode
  const timelineChartData = useMemo(() => {
    if (!data) return [];

    if (metricMode === "citations_total") {
      return (data.citationTrend ?? []).map((c) => ({
        year: String(c.year),
        value: c.totalCitations,
      })).sort((a, b) => Number(a.year) - Number(b.year));
    }
    if (metricMode === "citations_avg") {
      return (data.citationTrend ?? []).map((c) => ({
        year: String(c.year),
        value: c.avgCitations,
      })).sort((a, b) => Number(a.year) - Number(b.year));
    }

    // metricMode === "papers"
    if (datasetMode === "corpus") {
      return (data.yearlyTotalPapers ?? []).map((y) => ({
        year: String(y.year),
        value: y.count,
      })).sort((a, b) => Number(a.year) - Number(b.year));
    } else {
      return displayedTopicsYearlyData;
    }
  }, [data, datasetMode, metricMode, displayedTopicsYearlyData]);

  const peakYear = useMemo(() => {
    return [...timelineChartData].sort((a, b) => b.value - a.value)[0] ?? null;
  }, [timelineChartData]);

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

  // Controlled states for intelligence features
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [focusTopic, setFocusTopic] = useState<string>("");

  const activeFocusTopic = useMemo(() => {
    return focusTopic || fastestTopic?.topic || data?.topics[0]?.topic || "";
  }, [focusTopic, fastestTopic, data]);

  // Hook query 1: Topic Compare
  const compareQuery = useTrendCompare(
    { topics: selectedTopics, yearFrom, yearTo },
    selectedTopics.length >= 2
  );

  // Hook query 2: Topic Relationships
  const relationshipsQuery = useTrendRelationships(
    { topic: activeFocusTopic, yearFrom, yearTo, limit: 12 },
    !!activeFocusTopic
  );

  // Hook query 3: AI Explanation
  const explainMutation = useExplainTrend();

  // Process compare data for LineChart
  const compareChartData = useMemo(() => {
    if (!compareQuery.data?.topics) return [];
    const years = Array.from(
      { length: yearTo - yearFrom + 1 },
      (_, i) => yearFrom + i
    );
    return years.map((y) => {
      const point: any = { year: String(y) };
      compareQuery.data.topics.forEach((t) => {
        const breakdown = t.yearlyBreakdown.find((b) => b.year === y);
        point[t.topic] = breakdown ? breakdown.count : 0;
      });
      return point;
    });
  }, [compareQuery.data, yearFrom, yearTo]);

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
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-8 bg-white dark:bg-[#121212] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex-wrap w-full">

        <div className="flex-1 w-full md:w-auto min-w-[200px] relative">
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
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
          <input
            type="number"
            value={yearFrom}
            onChange={(e) => setYearFrom(parseInt(e.target.value, 10) || 2020)}
            placeholder="From"
            className="w-full md:w-20 h-10 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-center text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
          <span className="text-slate-400">-</span>
          <input
            type="number"
            value={yearTo}
            onChange={(e) => setYearTo(parseInt(e.target.value, 10) || 2026)}
            placeholder="To"
            className="w-full md:w-20 h-10 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-center text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap" title="Hide noisy topics with fewer than this many papers in the selected window.">Min Papers:</span>
          <input
            type="number"
            value={minPapers}
            min="1"
            onChange={(e) => setMinPapers(parseInt(e.target.value, 10) || 1)}
            className="w-full md:w-16 h-10 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-center text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {metricMode === "papers"
                ? datasetMode === "corpus"
                  ? "Full-corpus publications per year"
                  : "Publications per year across displayed topics"
                : metricMode === "citations_total"
                ? "Full-corpus citation volume per year"
                : "Full-corpus average citations per paper"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {metricMode === "papers"
                ? datasetMode === "corpus"
                  ? "Counts all active papers in the selected year window, not only the displayed top topics."
                  : "This chart sums yearly paper counts for the topics currently shown below, not necessarily every paper in the corpus."
                : "Citation metrics favor older papers because they have had more time to accumulate citations."}
            </p>
            {data?.yearTo && data.yearTo > data.lastCompleteYear ? (
              <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                {data.yearTo} is year-to-date, so the final point may look lower until the year completes.
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 select-none">
            {/* Metric Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-full border border-slate-200/50 dark:border-slate-800/50">
              <Button
                variant={metricMode === "papers" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMetricMode("papers")}
                className="h-7 px-3 text-[11px] font-bold rounded-full"
              >
                Papers
              </Button>
              <Button
                variant={metricMode === "citations_total" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setMetricMode("citations_total");
                  setDatasetMode("corpus");
                }}
                className="h-7 px-3 text-[11px] font-bold rounded-full"
              >
                Total Citations
              </Button>
              <Button
                variant={metricMode === "citations_avg" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setMetricMode("citations_avg");
                  setDatasetMode("corpus");
                }}
                className="h-7 px-3 text-[11px] font-bold rounded-full"
              >
                Avg Citations
              </Button>
            </div>

            {/* Dataset Mode Toggle */}
            {metricMode === "papers" && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-full border border-slate-200/50 dark:border-slate-800/50">
                <Button
                  variant={datasetMode === "corpus" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setDatasetMode("corpus")}
                  className="h-7 px-3 text-[11px] font-bold rounded-full"
                >
                  Corpus
                </Button>
                <Button
                  variant={datasetMode === "displayed" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setDatasetMode("displayed")}
                  className="h-7 px-3 text-[11px] font-bold rounded-full"
                >
                  Displayed
                </Button>
              </div>
            )}

            {peakYear && (
              <span className="text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/30 select-none">
                Peak: {peakYear.year} · {peakYear.value.toLocaleString()}{" "}
                {metricMode === "papers"
                  ? "papers"
                  : metricMode === "citations_total"
                  ? "citations"
                  : "citations/paper"}
              </span>
            )}
          </div>
        </div>
        <div className="h-[260px] md:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                dataKey="value"
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

      {/* Corpus Facets Section (V2 Premium UX) */}
      {data?.facets && (
        <div className="bg-white/50 dark:bg-[#121212]/50 border border-slate-200/85 dark:border-slate-800/85 rounded-2xl p-6 shadow-md mb-8 backdrop-blur-md mt-8">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Corpus Facets</h3>
            <p className="text-xs text-slate-500 mt-1">Facets mirror OpenAlex-style scholarly metadata: type, source, access status, provider, and citation bands.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* 1. Paper Kinds */}
            <FacetGroup
              title="Paper Types"
              buckets={data.facets.paperKinds}
              total={data.totalPapersInWindow}
            />
            {/* 2. Open Access */}
            <FacetGroup
              title="Open Access"
              buckets={data.facets.openAccessStatuses}
              total={data.totalPapersInWindow}
            />
            {/* 3. Providers */}
            <FacetGroup
              title="Providers"
              buckets={data.facets.providers}
              total={data.totalPapersInWindow}
            />
            {/* 4. Top Sources */}
            <FacetGroup
              title="Top Sources"
              buckets={data.facets.topSources}
              total={data.totalPapersInWindow}
            />
            {/* 5. Citation Bands */}
            <FacetGroup
              title="Citation Bands"
              buckets={data.facets.citationBands}
              total={data.totalPapersInWindow}
            />
          </div>
        </div>
      )}

      {/* Multi-Topic Compare Panel (V2 Premium UX) */}
      {data?.topics && data.topics.length > 0 && (
        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
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

          {/* Topics selection chips */}
          <div className="flex flex-wrap gap-2.5 mb-6 max-h-36 overflow-y-auto p-1.5 border border-slate-100 dark:border-slate-800/40 rounded-xl bg-slate-50/30 dark:bg-slate-900/10">
            {data.topics.map((t) => {
              const isSelected = selectedTopics.includes(t.topic);
              return (
                <button
                  key={t.topic}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedTopics(prev => prev.filter(x => x !== t.topic));
                    } else {
                      if (selectedTopics.length >= 5) {
                        return;
                      }
                      setSelectedTopics(prev => [...prev, t.topic]);
                    }
                  }}
                  disabled={!isSelected && selectedTopics.length >= 5}
                  className={`h-7 px-3 rounded-full text-xs font-bold transition-all duration-150 border flex items-center gap-1.5 active:scale-95 ${
                    isSelected
                      ? "bg-blue-600 border-blue-600 text-white font-extrabold shadow-sm"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  }`}
                >
                  <span>{t.topic}</span>
                  {isSelected && <span className="text-[10px]">✕</span>}
                </button>
              );
            })}
          </div>

          {/* Comparison View */}
          {selectedTopics.length < 2 ? (
            <div className="py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-slate-50/20 dark:bg-slate-900/5 select-none">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Please select at least 2 topics (and up to 5) to generate comparison analysis.
              </p>
              <p className="text-xs text-slate-455 dark:text-slate-500 mt-1">
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
            <div className="space-y-6">
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
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
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
                      {compareQuery.data?.topics.map((t, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 capitalize">
                            {t.topic}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-slate-750 dark:text-slate-350">
                            {t.totalPapers.toLocaleString()}
                          </td>
                          <td className={`px-6 py-4 text-right font-extrabold ${t.growthRatePct > 0 ? "text-emerald-600" : t.growthRatePct < 0 ? "text-red-500" : "text-slate-500"}`}>
                            {formatSigned(t.growthRatePct, 1)}%
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-slate-650 dark:text-slate-400">
                            {formatSigned(t.momentum, 2)} papers/year
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-blue-700 dark:text-blue-400">
                            {t.cagr3yPct !== null ? `${formatSigned(t.cagr3yPct, 1)}%` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Topic Relationships & AI Explainer (V2 Premium UX) */}
      {data?.topics && data.topics.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {/* Cột Trái: Topic co-occurrence graph preview (5 columns) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 mb-4 select-none">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Topic Co-occurrence</h3>

                {/* select focusTopic */}
                <div className="relative">
                  <select
                    value={activeFocusTopic}
                    onChange={(e) => setFocusTopic(e.target.value)}
                    className="h-8 pl-3 pr-8 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 appearance-none cursor-pointer"
                  >
                    {data.topics.map(t => (
                      <option key={t.topic} value={t.topic}>{t.topic}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-6">Built from topics appearing together on the same papers. This is graph-ready data; Neo4j can replace the query layer later.</p>

              {relationshipsQuery.isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                  <p className="text-xs text-slate-500 font-medium">Fetching relationships...</p>
                </div>
              ) : relationshipsQuery.isError ? (
                <p className="text-sm text-red-600 py-6 text-center">Failed to load co-occurrences.</p>
              ) : !relationshipsQuery.data?.edges || relationshipsQuery.data.edges.length === 0 ? (
                <p className="text-xs text-slate-450 dark:text-slate-500 italic py-10 text-center">No co-occurring topics found for this topic.</p>
              ) : (
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {relationshipsQuery.data.edges.slice(0, 10).map((edge, idx) => {
                    const relatedName = edge.source === activeFocusTopic ? edge.target : edge.source;
                    const maxCount = Math.max(...relationshipsQuery.data.edges.map(e => e.count));
                    const percentage = maxCount > 0 ? Math.round((edge.count / maxCount) * 100) : 0;
                    return (
                      <div key={idx} className="text-xs bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/40 rounded-xl p-3 flex flex-col justify-between hover:border-slate-200/80 dark:hover:border-slate-800/80 transition-colors">
                        <div className="flex justify-between items-center mb-1.5 font-bold">
                          <span className="text-slate-800 dark:text-slate-200 capitalize">{relatedName}</span>
                          <span className="text-blue-700 dark:text-blue-400">{edge.count} co-occurring papers</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-600 dark:bg-blue-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-150 dark:border-slate-800/40 select-none">
              <Button
                onClick={() => explainMutation.mutate({ topic: activeFocusTopic, yearFrom, yearTo, language: "en" })}
                disabled={explainMutation.isPending}
                className="w-full h-10 bg-blue-700 hover:bg-blue-800 text-white font-extrabold rounded-xl shadow-md gap-2 flex items-center justify-center active:scale-98 transition-transform"
              >
                {explainMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating explanation...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
                    Explain trend with AI
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Cột Phải: AI "Why This Trend Matters" (7 columns) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col min-h-[420px]">
            <div className="border-b border-slate-100 dark:border-slate-800/50 pb-4 mb-4 select-none">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-600" />
                AI Research Explainer
              </h3>
              <p className="text-xs text-slate-500 mt-1">Get an instant AI overview on why the selected focus topic is trending.</p>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[480px] pr-1 space-y-4">
              {explainMutation.isPending ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              ) : explainMutation.isError ? (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 rounded-xl text-xs font-semibold text-red-600 leading-relaxed select-text">
                  AI explanation failed. You can still inspect the charts and facets.
                </div>
              ) : explainMutation.data ? (
                <div className="space-y-4 text-xs leading-relaxed select-text">
                  <div className="bg-blue-50/50 dark:bg-blue-950/15 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
                    <h4 className="font-extrabold text-blue-700 dark:text-blue-400 mb-1.5 uppercase text-[10px] tracking-wider">AI Trend Summary</h4>
                    <p className="text-slate-700 dark:text-slate-300 font-medium text-xs leading-relaxed">{explainMutation.data.summary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50/40 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/40 rounded-xl p-4">
                      <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase text-[9px] tracking-wider">Why It Matters</h4>
                      <ul className="list-disc list-inside space-y-1.5 text-slate-650 dark:text-slate-400">
                        {explainMutation.data.whyItMatters.map((item, idx) => (
                          <li key={idx} className="indent-[-12px] pl-3 leading-normal">{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-50/40 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/40 rounded-xl p-4">
                      <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase text-[9px] tracking-wider">Evidence Signals</h4>
                      <ul className="list-disc list-inside space-y-1.5 text-slate-650 dark:text-slate-400">
                        {explainMutation.data.evidenceSignals.map((item, idx) => (
                          <li key={idx} className="indent-[-12px] pl-3 leading-normal">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-amber-50/30 dark:bg-amber-950/5 border border-amber-100/50 dark:border-amber-950/20 rounded-xl p-4">
                      <h4 className="font-bold text-amber-700 dark:text-amber-400 mb-2 uppercase text-[9px] tracking-wider">Cautions</h4>
                      <ul className="list-disc list-inside space-y-1.5 text-slate-650 dark:text-slate-400">
                        {explainMutation.data.cautions.map((item, idx) => (
                          <li key={idx} className="indent-[-12px] pl-3 leading-normal">{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-100/40 dark:border-emerald-950/20 rounded-xl p-4">
                      <h4 className="font-bold text-emerald-700 dark:text-emerald-450 mb-2 uppercase text-[9px] tracking-wider">Suggested Actions</h4>
                      <ul className="list-disc list-inside space-y-1.5 text-slate-650 dark:text-slate-400">
                        {explainMutation.data.suggestedActions.map((item, idx) => (
                          <li key={idx} className="indent-[-12px] pl-3 leading-normal">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-2 text-[10px] text-slate-400 dark:text-slate-500 font-semibold border-t border-slate-100 dark:border-slate-800/60 select-none">
                    AI explanation is grounded in aggregate trend metrics, not individual paper-level citations. Generated at {new Date(explainMutation.data.generatedAt).toLocaleDateString()}.
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/10 dark:bg-slate-900/5 select-none">
                  <Sparkles className="w-8 h-8 text-blue-600/30 animate-pulse mb-3" />
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">AI Explainer is idle.</p>
                  <p className="text-xs text-slate-455 dark:text-slate-500 mt-1 max-w-sm">Select a topic on the left and click "Explain trend with AI" to receive AI grounding summary and actions.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )}
  </div>
  );
}

// Facet Group Subcomponent (V2 Premium UI/UX)
function FacetGroup({ title, buckets, total }: { title: string; buckets: any[]; total: number }) {
  return (
    <div className="space-y-3.5">
      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{title}</h4>
      <div className="space-y-2.5">
        {(buckets ?? []).slice(0, 4).map((b) => {
          const percentage = total > 0 ? Math.min(100, Math.round((b.count / total) * 100)) : 0;
          return (
            <div key={b.id} className="text-xs group">
              <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span className="truncate max-w-[120px] capitalize" title={b.name}>{b.name}</span>
                <span className="text-slate-400 font-normal shrink-0">{b.count.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500 group-hover:bg-blue-700"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
        {(!buckets || buckets.length === 0) && (
          <p className="text-xs text-slate-400 italic">No data</p>
        )}
      </div>
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
