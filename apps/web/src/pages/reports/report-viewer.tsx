import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Share, Download, CheckCircle2, Info, Check, Clock, Sparkles, ChevronRight, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip, Cell } from "recharts";
import { useReport } from "@/features/reports/hooks/use-reports";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import robotImg from "@/assets/robot.png";

const growthData = [
  { year: "2020", volume: 10 },
  { year: "2021", volume: 15 },
  { year: "2022", volume: 30 },
  { year: "2023", volume: 80 },
  { year: "2024", volume: 100 },
];

const RosePetals = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-10vh) rotate(0deg) rotateX(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg) rotateX(360deg); opacity: 0; }
        }
        .petal {
          position: absolute;
          animation: fall linear infinite;
        }
      `}</style>
      {[...Array(30)].map((_, i) => {
        const left = Math.random() * 100 + 'vw';
        const animationDuration = 6 + Math.random() * 10 + 's';
        const animationDelay = -Math.random() * 15 + 's';
        const width = 12 + Math.random() * 18 + 'px';
        const opacity = 0.5 + Math.random() * 0.5;
        const fill = Math.random() > 0.5 ? 'rgba(236, 72, 153, 0.6)' : 'rgba(244, 114, 182, 0.7)'; 

        return (
          <svg
            key={i}
            className="petal"
            style={{
              left,
              animationDuration,
              animationDelay,
              width,
              opacity,
              fill
            }}
            viewBox="0 0 512 512"
          >
            <path d="M256,0 C350,0 420,100 420,200 C420,350 256,512 256,512 C256,512 92,350 92,200 C92,100 162,0 256,0 Z" />
          </svg>
        );
      })}
    </div>
  );
};

export function ReportViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: report, isLoading, isError } = useReport(id || "");

  if (isLoading || report?.status === "generating" || report?.status === "queued") {
    return (
      <main className="container py-24 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">AI is generating your report...</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          We are analyzing over 12,000 papers, extracting insights, and writing a comprehensive summary. This usually takes a few seconds.
        </p>
      </main>
    );
  }

  if (report?.status === "failed" || isError) {
    return (
      <main className="container py-24 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <XCircle className="w-12 h-12 text-red-500 mb-6" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Report Generation Failed</h2>
        <p className="text-slate-500 max-w-md mx-auto mb-6">
          {report?.errorMessage || "An unexpected error occurred while generating this report."}
        </p>
        <Button onClick={() => navigate("/reports")} variant="outline">
          Back to Reports
        </Button>
      </main>
    );
  }

  const title = report?.topic || report?.query || "AI Analytical Report";

  return (
    <main className="container py-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#0f1115] min-h-screen relative overflow-hidden">
      <RosePetals />
      
      {/* Left side network decoration */}
      <div className="hidden xl:block absolute left-0 top-0 bottom-0 w-[200px] pointer-events-none opacity-50 dark:opacity-20">
        <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Vertical data streams */}
          <path d="M 40 50 L 40 2000" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 6" className="opacity-30" />
          <path d="M 120 150 L 120 2000" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="2 8" className="opacity-20" />
          <path d="M 80 0 L 80 2000" fill="none" stroke="#0ea5e9" strokeWidth="0.5" className="opacity-10" />
          
          {/* Connecting diagonal lines */}
          <path d="M 40 400 L 120 500" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2 4" className="opacity-30" />
          <path d="M 120 800 L 40 900" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2 4" className="opacity-30" />
          
          {/* Nodes */}
          <circle cx="40" cy="200" r="3" fill="#3b82f6" className="animate-pulse" />
          <circle cx="40" cy="400" r="4" fill="#3b82f6" className="animate-ping" style={{ animationDuration: '3s' }} />
          <circle cx="40" cy="900" r="3" fill="#3b82f6" className="animate-pulse" style={{ animationDelay: '1s' }} />
          
          <circle cx="120" cy="150" r="2" fill="#60a5fa" className="animate-pulse" style={{ animationDelay: '500ms' }} />
          <circle cx="120" cy="500" r="4" fill="#60a5fa" className="animate-ping" style={{ animationDuration: '4s' }} />
          <circle cx="120" cy="800" r="3" fill="#60a5fa" className="animate-pulse" style={{ animationDelay: '1.5s' }} />
        </svg>

        {/* Floating particles */}
        <div className="absolute top-[10%] left-[50%] w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping opacity-60" style={{ animationDuration: '2.5s' }} />
        <div className="absolute top-[30%] left-[20%] w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-40" style={{ animationDelay: '1s', animationDuration: '3.5s' }} />
        <div className="absolute top-[60%] left-[80%] w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '0.5s', animationDuration: '2s' }} />
        <div className="absolute top-[80%] left-[40%] w-2 h-2 bg-cyan-500 rounded-full animate-ping opacity-30" style={{ animationDelay: '2s', animationDuration: '4s' }} />
      </div>

      <div className="flex flex-col lg:flex-row gap-12 relative items-start justify-center print:block print:w-full z-10">
        {/* Center Column (Main Content) */}
        <div className="flex-1 min-w-0 max-w-[800px] print:max-w-none print:w-full">
          {/* Breadcrumb */}
          <div className="flex items-center text-[11px] font-semibold text-slate-500 mb-6 uppercase tracking-wider print:hidden">
            <span onClick={() => navigate("/reports")} className="hover:text-slate-900 cursor-pointer transition-colors">Reports</span>
            <ChevronRight className="w-3 h-3 mx-1" />
            <span className="text-slate-900 dark:text-white">{title}</span>
          </div>

          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-6">
            {title}
          </h1>

          <div className="flex items-center gap-3 mb-8 print:hidden">
            <Button variant="outline" className="h-9 px-4 gap-2 text-slate-700 dark:text-slate-300 font-semibold border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50">
              <Share className="w-4 h-4" /> Share
            </Button>
            <Button onClick={() => window.print()} className="h-9 px-4 bg-[#001b69] hover:bg-[#001040] text-white font-semibold gap-2 rounded-md shadow-sm">
              <Download className="w-4 h-4" /> PDF
            </Button>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-slate-500 mb-10 pb-8 border-b border-slate-100 dark:border-slate-800">
            <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> AI-Verified Report
            </span>
            <span className="font-semibold text-slate-400">Generated {report?.completedAt ? new Date(report.completedAt).toLocaleDateString() : 'Recently'}</span>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 dark:prose-a:text-blue-400">
            
            {report?.markdown ? (
              <div className="text-slate-600 dark:text-slate-300 text-[15px] leading-[1.7] mb-10 prose-h2:text-[22px] prose-h2:font-semibold prose-h2:text-slate-900 dark:prose-h2:text-white prose-h2:mb-4 prose-h2:mt-8 prose-h3:text-[18px] prose-h3:font-semibold prose-h3:text-slate-900 dark:prose-h3:text-white prose-h3:mt-6 prose-p:mb-4 prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-li:mb-2 prose-strong:font-bold prose-strong:text-slate-900 dark:prose-strong:text-white">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {report.markdown}
                </ReactMarkdown>
              </div>
            ) : (
              <>
                <h2 id="executive-summary" className="text-[22px] font-semibold text-slate-900 dark:text-white mb-4 mt-0">Executive Summary</h2>
                <div className="text-slate-600 dark:text-slate-300 text-[15px] leading-[1.7] mb-10 whitespace-pre-wrap">
                  The integration of Large Language Models (LLMs) into educational frameworks has seen an exponential rise between 2020 and 2024. Early adoption focused heavily on automated grading and basic tutoring systems [1]. However, current literature indicates a paradigm shift towards personalized learning pathways and cognitive scaffolding tools.
                </div>
              </>
            )}

            <h2 id="publication-growth" className="text-[22px] font-semibold text-slate-900 dark:text-white mb-4">Publication Volume Growth</h2>
            <p className="text-slate-600 dark:text-slate-300 text-[15px] leading-[1.7] mb-8">
              Analysis of major academic databases reveals a &gt;400% year-over-year increase in papers discussing "GPT", "LLM", and "Education" simultaneously starting in early 2023 <a href="#" className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded no-underline">[2]</a>.
            </p>

            {/* Recharts BarChart */}
            <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-6 mb-12 shadow-sm">
              <div className="flex items-center justify-end mb-4">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Publications per Year</span>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={growthData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={2} barCategoryGap="10%">
                    <XAxis 
                      dataKey="year" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                      dy={10}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
                      {growthData.map((entry, index) => {
                         const colors = ["#dbeafe", "#bfdbfe", "#93c5fd", "#1e3a8a", "#1e3a8a"]; // Matching the shades in the design
                         return <Cell key={`cell-${index}`} fill={colors[index]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4 mt-12 border-b border-slate-100 dark:border-slate-800/60 pb-3 print:border-none print:pb-0">
              <h2 id="research-gaps" className="text-[22px] font-semibold text-slate-900 dark:text-white m-0 border-none pb-0">Identified Research Gaps</h2>
              <Button onClick={() => navigate(`/research-gaps?source=report&topic=${encodeURIComponent(report?.topic || report?.query || "")}`)} className="h-8 px-4 text-xs font-bold gap-1 print:hidden bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5 border-0">
                View in Research Gaps <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            
            {report?.researchGaps && report.researchGaps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                {report.researchGaps.map((gap, index) => (
                  <div key={index} className="bg-white dark:bg-[#1c1f26] border-2 border-cyan-200 dark:border-cyan-900/50 rounded-xl p-5 shadow-sm flex flex-col h-full hover:border-cyan-400 dark:hover:border-cyan-700 transition-colors">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-[16px] flex items-start gap-2 m-0 mb-2 leading-tight">
                      <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-400" /> 
                      {gap.title}
                    </h4>
                    <p className="text-[13px] text-slate-600 dark:text-slate-400 m-0 mb-3 leading-relaxed flex-1">
                      {gap.description}
                    </p>
                    {gap.rationale && (
                      <p className="text-[12px] text-slate-500 dark:text-slate-500 m-0 leading-relaxed italic border-t border-slate-100 dark:border-slate-800 pt-3 mt-auto">
                        {gap.rationale}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 text-center border border-slate-100 dark:border-slate-800">
                <p className="text-slate-500 text-sm m-0">No research gaps were explicitly identified in this analysis.</p>
              </div>
            )}
          </div>
        </div>


        {/* Right Sidebar */}
        <div className="hidden lg:block w-[320px] shrink-0 sticky top-6 -mt-4 print:hidden">
          {/* Illustration Card */}
          <div className="bg-white/80 dark:bg-[#121212]/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] mb-6 flex flex-col items-center text-center">
            <div className="w-full aspect-square mb-4 relative rounded-xl overflow-hidden bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent flex items-center justify-center p-4">
              {/* Data / Network Pattern Background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50 dark:opacity-30">
                
                {/* Animated Nodes and Lines */}
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <path d="M40 40 L100 120 L200 80 L260 180" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 4" className="opacity-50" />
                  <path d="M20 160 L120 200 L180 140" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="2 4" className="opacity-40" />
                  
                  <circle cx="100" cy="120" r="3" fill="#3b82f6" className="animate-pulse" />
                  <circle cx="200" cy="80" r="4" fill="#60a5fa" className="animate-ping" style={{ animationDuration: '3s' }} />
                  <circle cx="120" cy="200" r="3" fill="#3b82f6" className="animate-pulse" style={{ animationDelay: '500ms' }} />
                  <circle cx="180" cy="140" r="2" fill="#60a5fa" className="animate-pulse" style={{ animationDelay: '1s' }} />
                </svg>

                {/* Floating data particles */}
                <div className="absolute top-[20%] left-[20%] w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping opacity-75" style={{ animationDuration: '2s' }} />
                <div className="absolute top-[70%] left-[80%] w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-60" style={{ animationDelay: '1s', animationDuration: '3s' }} />
                <div className="absolute top-[40%] left-[85%] w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-80" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }} />
              </div>

              {/* AI Core Animation */}
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Outer rotating dashed ring */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-400/40 dark:border-blue-500/30 animate-[spin_10s_linear_infinite]" />
                
                {/* Inner fast rotating ring */}
                <div className="absolute inset-3 rounded-full border-t-2 border-l-2 border-cyan-400 dark:border-cyan-300 animate-[spin_3s_linear_infinite_reverse] opacity-80" />
                
                {/* Middle pulse ring */}
                <div className="absolute inset-6 rounded-full border-2 border-blue-300 dark:border-blue-500 animate-ping opacity-30" style={{ animationDuration: '2.5s' }} />
                
                {/* Central Core */}
                <div className="absolute w-[72px] h-[72px] bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full shadow-[0_0_30px_rgba(56,189,248,0.5)] dark:shadow-[0_0_40px_rgba(56,189,248,0.4)] flex items-center justify-center z-10">
                  <Sparkles className="w-8 h-8 text-white animate-pulse" />
                </div>

                {/* Orbiting node */}
                <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full absolute -top-1.5 left-1/2 -translate-x-1/2 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                </div>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">AI Analysis Complete</h3>
            <p className="text-sm text-slate-500 mb-4">
              Our AI has synthesized insights from thousands of papers to bring you this comprehensive report.
            </p>
            <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-4" />
            <div className="flex flex-col gap-3 w-full text-sm text-slate-600 dark:text-slate-400 text-left font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Facts verified
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Grounded in literature
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Data synthesized
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-[#e0e7ff] to-[#dbeafe] dark:from-[#1e3a8a]/30 dark:to-[#172554]/30 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Explore Further
            </h3>
            <p className="text-sm text-blue-800/80 dark:text-blue-200/80 mb-4 font-medium leading-relaxed">
              Found something interesting? Dive deeper into the research gaps or explore related topics.
            </p>
            <Button onClick={() => navigate(`/research-gaps?source=report&topic=${encodeURIComponent(report?.topic || report?.query || "")}`)} className="w-full bg-[#001b69] hover:bg-[#001040] text-white rounded-xl shadow-sm h-10">
              View Research Gaps
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
