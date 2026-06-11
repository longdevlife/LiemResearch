import React, { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ArrowLeft, Sparkles, TrendingUp, BookOpen, Users, Hash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTopicTrend } from "@/features/trends/hooks/use-trends";

export function TopicDetailPage() {
  const { topic } = useParams<{ topic: string }>();
  const navigate = useNavigate();
  const decodedTopic = decodeURIComponent(topic || "");
  
  const { data, isLoading, isError } = useTopicTrend(decodedTopic);

  const chartData = useMemo(() => {
    if (!data?.yearlyBreakdown) return [];
    return data.yearlyBreakdown.map(y => ({
      year: String(y.year),
      publications: y.count
    }));
  }, [data]);

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-medium">Analyzing deep dive data for "{decodedTopic}"...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center">
        <p className="text-red-500 font-medium mb-4">Failed to load topic data.</p>
        <Button onClick={() => navigate("/trends")} variant="outline">Back to Trends</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <button 
            onClick={() => navigate("/trends")}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Trends
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white capitalize">{decodedTopic}</h1>
            {data.growthRatePct > 100 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600">Hot Topic</span>
            )}
          </div>
          <p className="text-slate-500 mt-2">Detailed performance and metrics for this research area.</p>
        </div>
        
        <Button 
          className="bg-[#001b69] hover:bg-[#001040] text-white shadow-sm gap-2"
          onClick={() => navigate('/reports')}
        >
          <Sparkles className="w-4 h-4" /> Generate Report
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Papers</h4>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{data.totalPapers.toLocaleString()}</div>
        </div>
        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Growth Rate</h4>
          <div className="text-2xl font-bold text-emerald-600">+{data.growthRatePct}%</div>
          <div className="text-xs text-slate-500 mt-1">Year over year</div>
        </div>
        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">CAGR (3Y)</h4>
          <div className="text-2xl font-bold text-blue-600">{data.cagr3yPct !== null ? `+${data.cagr3yPct.toFixed(1)}%` : "N/A"}</div>
          <div className="text-xs text-slate-500 mt-1">Compound annual growth</div>
        </div>
        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Momentum</h4>
          <div className="text-2xl font-bold text-purple-600">{data.momentum > 0 ? `+${data.momentum.toFixed(1)}` : data.momentum.toFixed(1)}</div>
          <div className="text-xs text-slate-500 mt-1">Velocity score</div>
        </div>
      </div>

      {/* Main Area Chart */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Publication Volume</h3>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTopic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="year" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
              />
              <Area 
                type="monotone" 
                dataKey="publications" 
                stroke="#2563eb" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorTopic)" 
                activeDot={{ r: 6, fill: "#2563eb", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3 Columns: Authors, Journals, Keywords */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Top Journals */}
        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-0 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Top Journals</h3>
          </div>
          <div className="flex-1 overflow-auto">
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.topJournals?.map((item) => (
                <li key={item.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 flex items-start justify-between gap-4">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 line-clamp-2">{item.name}</span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded shrink-0">{item.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Top Authors */}
        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-0 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Top Authors</h3>
          </div>
          <div className="flex-1 overflow-auto">
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.topAuthors?.map((item) => (
                <li key={item.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 flex items-start justify-between gap-4">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 line-clamp-2">{item.name}</span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded shrink-0">{item.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Top Keywords */}
        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-0 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-2">
            <Hash className="w-5 h-5 text-amber-500" />
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Co-occurring Keywords</h3>
          </div>
          <div className="flex-1 overflow-auto">
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.topKeywords?.map((item) => (
                <li key={item.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 flex items-start justify-between gap-4">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 capitalize line-clamp-2">{item.name}</span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded shrink-0">{item.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
}
