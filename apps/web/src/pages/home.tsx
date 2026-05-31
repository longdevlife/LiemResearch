import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Sparkles, History, Search, ExternalLink, TrendingUp, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth";
import { usePapers } from "@/features/papers";
import { Link, useNavigate } from "react-router-dom";

const mockVelocityData = [
  { name: "2020", value: 40 },
  { name: "2021", value: 45 },
  { name: "2022", value: 55 },
  { name: "2023", value: 85 },
  { name: "2024", value: 80 },
];

export function HomePage() {
  const { data } = useCurrentUser();
  const userName = data?.user?.fullName || data?.user?.email || "Researcher";
  const { data: papersData, isLoading } = usePapers({ page: 1, pageSize: 2 });
  const recentPapers = papersData?.items || [];

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Welcome back, {userName}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Here is an overview of your research ecosystem today.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Main Content */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="PAPERS INDEXED" value="12,450" trend="+12%" />
            <KpiCard label="TOPICS FOLLOWED" value="18" trend="-- 0" isNeutral />
            <KpiCard label="REPORTS GEN." value="42" trend="+5" />
            <KpiCard label="SAVED PAPERS" value="156" trend="+24" />
          </div>

          {/* Trending Topics */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Trending Topics in Your Feed</h2>
              <Button variant="link" className="text-blue-600 dark:text-blue-400 text-sm p-0 h-auto">View All</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <TrendingChip label="LLM in Education" trend="up" color="blue" />
              <TrendingChip label="RAG Architectures" trend="up" color="emerald" />
              <TrendingChip label="Quantum Machine Learning" trend="neutral" color="purple" />
              <TrendingChip label="Neuromorphic Computing" trend="down" color="slate" />
            </div>
          </div>

          {/* Recent Papers */}
          <div>
            <div className="flex items-center justify-between mb-4 border-b pb-2 border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Papers</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-col gap-4">
              {isLoading ? (
                <p className="text-sm text-slate-500">Loading recent papers...</p>
              ) : recentPapers.length > 0 ? (
                recentPapers.map((paper) => (
                  <PaperCard 
                    key={paper.id}
                    id={paper.id}
                    journal={paper.journal || "Unknown Journal"}
                    date={new Date(paper.publicationDate).toLocaleDateString()}
                    title={paper.title}
                    abstract={paper.abstract || "No abstract available"}
                    authors={paper.authors?.map((a) => a.displayName).join(", ") || "Unknown Authors"}
                    score={paper.dataQualityScore?.toFixed(2) || "N/A"}
                  />
                ))
              ) : (
                <p className="text-sm text-slate-500">No papers found.</p>
              )}
            </div>
            
            <Button variant="outline" className="w-full mt-4 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50" asChild>
              <Link to="/search">Load more papers</Link>
            </Button>
          </div>

        </div>

        {/* RIGHT COLUMN: Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Generate AI Report CTA */}
          <div className="rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="bg-white/20 w-10 h-10 rounded-lg flex items-center justify-center mb-4 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Generate AI Report</h3>
            <p className="text-blue-100 text-sm mb-6">
              Synthesize current literature trends instantly.
            </p>
            <Button className="w-full bg-white/10 hover:bg-white/20 text-white border-none shadow-none font-semibold backdrop-blur-sm transition-all">
              Start Generation
            </Button>
          </div>

          {/* Saved Searches */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121212] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-4 w-4 text-slate-500" />
              <h3 className="font-bold text-slate-900 dark:text-white">Saved Searches</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm">
                <Search className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">"Transformers in healthcare" AND YEAR &gt; 2022</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Search className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">author:"Yoshua Bengio" AI alignment</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Search className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">Graph Neural Networks efficiency</span>
              </li>
            </ul>
            <Button variant="link" className="text-blue-600 dark:text-blue-400 text-xs p-0 h-auto mt-4">
              Manage all searches
            </Button>
          </div>

          {/* Publication Velocity */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121212] p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-6">
              PUBLICATION VELOCITY
            </h3>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockVelocityData} barSize={24}>
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="value" fill="#93c5fd" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Sub-components

function KpiCard({ label, value, trend, isNeutral = false }: { label: string, value: string, trend: string, isNeutral?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121212] p-4 shadow-sm flex flex-col justify-between">
      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-2 uppercase">
        {label}
      </div>
      <div className="flex items-end justify-between mt-auto">
        <div className="text-2xl font-bold text-slate-900 dark:text-white">
          {value}
        </div>
        <div className={`text-xs font-medium flex items-center gap-1 ${isNeutral ? 'text-slate-400' : 'text-emerald-500'}`}>
          {!isNeutral && <TrendingUp className="h-3 w-3" />}
          {trend}
        </div>
      </div>
    </div>
  );
}

function TrendingChip({ label, trend, color }: { label: string, trend: 'up'|'down'|'neutral', color: string }) {
  const getLineColor = () => {
    switch(color) {
      case 'blue': return 'text-blue-500 border-blue-500';
      case 'emerald': return 'text-emerald-500 border-emerald-500';
      case 'purple': return 'text-purple-500 border-purple-500';
      default: return 'text-slate-400 border-slate-400';
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121212] shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      {label}
      <div className={`w-6 h-3 border-b-2 ${getLineColor()} opacity-60 rounded-bl-full`}></div>
    </div>
  );
}

function PaperCard({ id, journal, date, title, abstract, authors, score }: { id: string, journal: string, date: string, title: string, abstract: string, authors: string, score: string }) {
  const navigate = useNavigate();

  return (
    <div 
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121212] p-5 shadow-sm hover:shadow-md transition-shadow relative group cursor-pointer"
      onClick={() => navigate(`/papers/${id}`)}
    >
      <div className="flex items-center gap-2 text-xs mb-3">
        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-medium">{journal}</span>
        <span className="text-slate-400">•</span>
        <span className="text-slate-500">{date}</span>
      </div>
      
      <div className="pr-16">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {abstract}
        </p>
        <div className="text-xs font-mono text-slate-500">
          {authors}
        </div>
      </div>

      <div className="absolute top-5 right-5 flex flex-col items-end gap-2">
        <div className="flex flex-col items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg p-2 min-w-[3rem]">
          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm leading-none">{score}</span>
          <span className="text-[8px] font-bold text-emerald-500/70 uppercase mt-1">AI Score</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
