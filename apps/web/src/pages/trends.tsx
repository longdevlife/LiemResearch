import React from "react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Download, Sparkles, Users, BookOpen, Search, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const areaChartData = [
  { year: "2015", publications: 100 },
  { year: "2016", publications: 120 },
  { year: "2017", publications: 150 },
  { year: "2018", publications: 200 },
  { year: "2019", publications: 320 },
  { year: "2020", publications: 450 },
  { year: "2021", publications: 700 },
  { year: "2022", publications: 1100 },
  { year: "2023", publications: 1800 },
  { year: "2024", publications: 2200 },
];

const barChartData = [
  { topic: "Generative AI", count: 1240 },
  { topic: "Prompt Engineering", count: 850 },
  { topic: "AI Alignment", count: 620 },
  { topic: "RAG Systems", count: 480 },
  { topic: "LLM Evaluation", count: 390 },
];

const keywordsData = [
  { keyword: "chain of thought", growth: "+145%", status: "Hot" },
  { keyword: "fine-tuning", growth: "+88%", status: "Rising" },
  { keyword: "hallucination", growth: "+76%", status: "Rising" },
  { keyword: "agentic workflow", growth: "+210%", status: "Hot" },
  { keyword: "context window", growth: "+54%", status: "Stable" },
];

export function TrendsPage() {
  const navigate = useNavigate();

  return (
    <div className="w-full">
      
      {/* Control Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-8 bg-white dark:bg-[#121212] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        
        <div className="flex-1 w-full relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input 
            type="text" 
            defaultValue="LLM in education" 
            className="w-full h-10 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 transition-shadow"
          />
        </div>
        
        <div className="w-full md:w-auto relative shrink-0">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
             <Calendar className="w-4 h-4" />
          </div>
          <select className="w-full md:w-48 h-10 pl-10 pr-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 appearance-none cursor-pointer">
            <option>2015 - 2024</option>
          </select>
        </div>

        <div className="flex w-full md:w-auto gap-3 shrink-0">
          <Button variant="outline" className="flex-1 md:flex-none h-10 px-4 text-slate-700 dark:text-slate-300 font-medium border-slate-300 dark:border-slate-700 rounded-lg gap-2 hover:bg-slate-50 dark:hover:bg-slate-800">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button 
            className="flex-1 md:flex-none h-10 px-6 bg-[#001b69] hover:bg-[#001040] text-white font-medium rounded-lg gap-2 shadow-md transition-colors"
            onClick={() => navigate('/reports/generating')}
          >
            <Sparkles className="w-4 h-4" fill="currentColor" /> Generate AI Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard 
          title="Total papers" 
          value="1,247" 
          trend="+14% vs last period" 
          icon={<FileText className="w-5 h-5 text-blue-600" />} 
        />
        <KPICard 
          title="Active authors" 
          value="423" 
          trend="+8% vs last period" 
          icon={<Users className="w-5 h-5 text-purple-600" />} 
        />
        <KPICard 
          title="Top journal" 
          value="Nature Education" 
          subtitle="184 publications" 
          icon={<BookOpen className="w-5 h-5 text-emerald-600" />} 
        />
        <KPICard 
          title="Avg citations" 
          value="23.4" 
          subtitle="Per published paper" 
          icon={<span className="text-amber-500 font-bold text-lg font-serif italic">99</span>} 
        />
      </div>

      {/* Main Area Chart */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm mb-8">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Publications per year</h3>
        <div className="h-[350px] w-full">
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
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Top Topics</h3>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="topic" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 13, fill: '#475569', fontWeight: 500 }} 
                  width={140}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#1e3a8a' : '#60a5fa'} />
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
            <p className="text-xs text-slate-500 mt-1">Trending topics based on recent velocity</p>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-900/20">
                <tr>
                  <th className="px-6 py-3 font-medium">Keyword</th>
                  <th className="px-6 py-3 font-medium text-right">Growth</th>
                  <th className="px-6 py-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {keywordsData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200 capitalize">
                      {row.keyword}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">
                      {row.growth}
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
