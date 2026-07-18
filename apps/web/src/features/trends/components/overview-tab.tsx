import React from "react";
import { FileText, BookOpen, Sparkles, Calendar } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import type { TrendsOverview } from "@trend/shared-types";
import { KPICard, InsightCard } from "./trends-shared.components";
import { formatSigned } from "../../../pages/trends.insights";
import type { RisingKeywordLike, TrendSortKey, TrendTopicLike } from "../../../pages/trends.insights";

interface OverviewTabProps {
  data: TrendsOverview;
  metricMode: "papers" | "citations_total" | "citations_avg";
  setMetricMode: (mode: "papers" | "citations_total" | "citations_avg") => void;
  datasetMode: "corpus" | "displayed";
  setDatasetMode: (mode: "corpus" | "displayed") => void;
  peakYear: { year: string; value: number } | null;
  timelineChartData: Array<{ year: string; value: number }>;
  fastestTopic: TrendTopicLike | null;
  highestGrowthTopic: TrendTopicLike | null;
  establishedTopic: TrendTopicLike | null;
  fastestKeyword: RisingKeywordLike | null;
  navigate: (path: string) => void;
  getTopicTrendTarget: (topic: string) => string;
  getRisingKeywordTarget: (keyword: string) => string;
}

export function OverviewTab({
  data,
  metricMode,
  setMetricMode,
  datasetMode,
  setDatasetMode,
  peakYear,
  timelineChartData,
  fastestTopic,
  highestGrowthTopic,
  establishedTopic,
  fastestKeyword,
  navigate,
  getTopicTrendTarget,
  getRisingKeywordTarget,
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Insight Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <InsightCard
          label="Fastest moving topic"
          value={fastestTopic?.topic ?? "No topic"}
          taxonomyPath={fastestTopic?.taxonomy ? `${fastestTopic.taxonomy.domainName} / ${fastestTopic.taxonomy.fieldName}` : undefined}
          detail={fastestTopic ? `${formatSigned(fastestTopic.momentum, 2)} papers/year` : "No data"}
          actionLabel="Open trend"
          onAction={() => fastestTopic && navigate(getTopicTrendTarget(fastestTopic.topic))}
        />
        <InsightCard
          label="Highest YoY growth"
          value={highestGrowthTopic?.topic ?? "No topic"}
          taxonomyPath={highestGrowthTopic?.taxonomy ? `${highestGrowthTopic.taxonomy.domainName} / ${highestGrowthTopic.taxonomy.fieldName}` : undefined}
          detail={highestGrowthTopic ? `${formatSigned(highestGrowthTopic.growthRatePct, 1)}% growth` : "No data"}
          actionLabel="Explore papers"
          onAction={() => highestGrowthTopic && navigate(`/search?q=${encodeURIComponent(highestGrowthTopic.topic)}`)}
        />
        <InsightCard
          label="Most established"
          value={establishedTopic?.topic ?? "No topic"}
          taxonomyPath={establishedTopic?.taxonomy ? `${establishedTopic.taxonomy.domainName} / ${establishedTopic.taxonomy.fieldName}` : undefined}
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Papers"
          value={data.totalPapersInWindow?.toLocaleString() || "0"}
          trend={`From ${data.yearFrom || 2015} to ${data.yearTo || 2024}`}
          icon={<FileText className="w-5 h-5 text-blue-600" />}
        />
        <KPICard
          title="Total Topics"
          value={data.topics?.length?.toString() || "0"}
          trend="Tracked in window"
          icon={<BookOpen className="w-5 h-5 text-purple-600" />}
        />
        <KPICard
          title="Rising Keywords"
          value={data.risingKeywords?.length?.toString() || "0"}
          subtitle="Emerging trends"
          icon={<Sparkles className="w-5 h-5 text-emerald-600" />}
        />
        <KPICard
          title="Metric Window"
          value={`${data.yearFrom ?? "-"}-${data.lastCompleteYear ?? "-"}`}
          subtitle={data.yearTo && data.yearTo > data.lastCompleteYear ? `${data.yearTo} shown as YTD` : "Complete years only"}
          icon={<Calendar className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Metrics Explanation Strip */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 rounded-xl px-4 py-3 text-xs text-slate-500 dark:text-slate-400 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-sm select-none">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          <span>
            <strong>Momentum</strong> = trend slope in papers/year. <strong>Growth</strong> = year-over-year change using the last complete year. Current-year data is YTD and excluded from growth math.
          </span>
        </div>
        <div className="text-slate-400 dark:text-slate-500 font-semibold md:text-right shrink-0">
          Metrics computed through {data.lastCompleteYear ?? "-"}. {data.yearTo && data.yearTo > (data.lastCompleteYear ?? 0) ? `${data.yearTo} is YTD.` : ""}
        </div>
      </div>

      {/* Main Area Chart */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
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
            {data.yearTo && data.yearTo > data.lastCompleteYear ? (
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
    </div>
  );
}
