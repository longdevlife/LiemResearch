import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Download, Sparkles, Users, BookOpen, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

const chartData = [
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

export function TrendsPage() {
  return (
    <main className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Control Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-8 bg-white dark:bg-[#121212] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex-1 w-full relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-slate-400"></div>
          <input 
            type="text" 
            defaultValue="LLM in education" 
            className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <div className="w-full md:w-auto relative shrink-0">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <select className="w-full md:w-48 h-10 pl-10 pr-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer">
            <option>2015 - 2024</option>
          </select>
        </div>

        <div className="flex w-full md:w-auto gap-3 shrink-0">
          <Button variant="outline" className="flex-1 md:flex-none h-10 px-4 text-slate-700 dark:text-slate-300 font-bold border-slate-300 dark:border-slate-700 rounded-lg gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button className="flex-1 md:flex-none h-10 px-6 bg-blue-800 hover:bg-blue-900 text-white font-bold rounded-lg gap-2">
            <Sparkles className="w-4 h-4" /> Generate AI Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard title="Total papers" value="1,247" trend="+14% vs last period" icon={<BookOpen className="w-4 h-4 text-blue-600" />} />
        <KPICard title="Active authors" value="423" trend="+8% vs last period" icon={<Users className="w-4 h-4 text-purple-600" />} />
        <KPICard title="Top journal" value="Nature Education" subtitle="184 publications" icon={<div className="w-4 h-4 bg-emerald-100 rounded text-emerald-600 flex items-center justify-center font-bold text-[10px]">N</div>} />
        <KPICard title="Avg citations" value="23.4" subtitle="Per published paper" icon={<Quote className="w-4 h-4 text-amber-500" />} />
      </div>

      {/* Main Chart */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Publications per year</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPubs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="year" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#94a3b8' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#94a3b8' }} 
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
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </main>
  );
}

function KPICard({ title, value, trend, subtitle, icon }: { title: string, value: string, trend?: string, subtitle?: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-medium text-slate-500">{title}</h4>
        {icon}
      </div>
      <div className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none mb-2">{value}</div>
      {trend && (
        <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          {trend}
        </div>
      )}
      {subtitle && (
        <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-slate-300"></div> {subtitle}
        </div>
      )}
    </div>
  );
}
