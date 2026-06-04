import { Settings, FileText, TrendingUp, Sparkles, RefreshCw, X, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationsPage() {
  return (
    <main className="container py-8 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
      
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col justify-between h-[calc(100vh-8rem)] sticky top-24">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6 px-4">
              Notifications
            </h1>
            
            <nav className="space-y-1">
              <a href="#" className="flex items-center justify-between px-4 py-2.5 bg-blue-800 text-white rounded-lg font-bold text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center shrink-0">
                    <div className="w-2.5 h-1.5 border-b-2 border-l-2 border-white -rotate-45 -mt-1"></div>
                  </div>
                  All
                </div>
                <div className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">3</div>
              </a>
              
              <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium text-sm transition-colors">
                <FileText className="w-4 h-4 shrink-0" /> Paper Alerts
              </a>
              
              <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium text-sm transition-colors">
                <TrendingUp className="w-4 h-4 shrink-0" /> Trend Updates
              </a>
              
              <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium text-sm transition-colors">
                <Sparkles className="w-4 h-4 shrink-0" /> AI Reports
              </a>
              
              <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium text-sm transition-colors">
                <div className="w-4 h-4 border-2 border-current rounded shrink-0"></div> System
              </a>
            </nav>
          </div>
          
          <div className="mt-8">
            <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium text-sm transition-colors">
              <Settings className="w-4 h-4 shrink-0" /> Notification Settings
            </a>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Activity</h2>
            <button className="text-xs font-bold text-blue-700 dark:text-blue-500 hover:underline">Mark all as read</button>
          </div>

          <div className="space-y-4">
            
            {/* Unread Card: Paper Match */}
            <div className="bg-[#f0f4ff] dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-xl p-5 relative group">
              <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-blue-900/40 text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-100 dark:border-blue-800">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-[15px] text-slate-900 dark:text-white font-medium mb-2 leading-snug pr-8">
                    New paper match: 'Evaluation of LLMs in Medical Pedagogy' aligns <span className="font-bold">94%</span> with your 'LLM in Education' topic.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-500 mb-4">
                    <span>2 hours ago</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>Nature Education</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="text-emerald-600 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Score: 0.94</span>
                  </div>
                  <div className="flex gap-3">
                    <Button className="h-8 px-4 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-md">
                      View Detail
                    </Button>
                    <Button variant="outline" className="h-8 px-4 bg-white dark:bg-transparent text-slate-700 dark:text-slate-300 font-bold text-xs border-slate-300 dark:border-slate-700 rounded-md">
                      Bookmark
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Read Card: Trend Update */}
            <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-[15px] text-slate-700 dark:text-slate-300 mb-2 leading-snug">
                    Topic Trend: Theme 'RAG Architectures' has seen a <span className="text-emerald-600 font-bold flex items-center gap-0.5 inline-flex"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg> 180%</span> increase in publications this month.
                  </p>
                  <div className="text-[11px] font-medium text-slate-400 mb-4">
                    5 hours ago
                  </div>
                  <Button variant="outline" className="h-8 px-4 text-slate-700 dark:text-slate-300 font-bold text-xs border-slate-300 dark:border-slate-700 rounded-md gap-1.5">
                    View Dashboard
                  </Button>
                </div>
              </div>
            </div>

            {/* Read Card: AI Report */}
            <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 text-purple-600 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-[15px] text-slate-700 dark:text-slate-300 font-medium mb-2 leading-snug">
                    Your AI Analysis Report for "Generative AI in Healthcare" is ready.
                  </p>
                  <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400 mb-4">
                    <span>Yesterday</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>45s processing time</span>
                  </div>
                  <Button className="h-8 px-4 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-md gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Open Report
                  </Button>
                </div>
              </div>
            </div>

            {/* Read Card: System Sync */}
            <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-[15px] text-slate-700 dark:text-slate-300 mb-1 leading-snug">
                    Sync completed: 1,248 new papers ingested from OpenAlex.
                  </p>
                  <div className="text-[11px] font-medium text-slate-400">
                    2 days ago
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-8 text-center">
            <Button variant="outline" className="h-9 px-6 text-slate-600 dark:text-slate-400 font-bold text-xs border-slate-300 dark:border-slate-700 rounded-full">
              Load more
            </Button>
          </div>

        </div>
      </div>
      
    </main>
  );
}
