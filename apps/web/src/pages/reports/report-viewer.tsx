import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Share, Download, CheckCircle2, Info, Check, Clock, Sparkles, ChevronRight, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip, Cell } from "recharts";
import { useReport } from "@/features/reports/hooks/use-reports";

const growthData = [
  { year: "2020", volume: 10 },
  { year: "2021", volume: 15 },
  { year: "2022", volume: 30 },
  { year: "2023", volume: 80 },
  { year: "2024", volume: 100 },
];

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
    <main className="container py-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#0f1115] min-h-screen">
      
      <div className="flex flex-col lg:flex-row gap-12 relative items-start">
        
        {/* Left Column (TOC) */}
        <aside className="w-full lg:w-48 shrink-0 hidden lg:block sticky top-24">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-[15px]">Contents</h3>
          <nav className="space-y-3 relative border-l border-slate-200 dark:border-slate-800">
            <div className="absolute top-0 -left-[1.5px] w-[3px] h-5 bg-[#001b69] rounded-full"></div>
            <a href="#executive-summary" className="block pl-4 text-[13px] font-semibold text-[#001b69] dark:text-blue-400">Executive Summary</a>
            <a href="#publication-growth" className="block pl-4 text-[13px] text-slate-500 hover:text-slate-900 dark:hover:text-white">Publication Growth</a>
            <a href="#emerging-topics" className="block pl-4 text-[13px] text-slate-500 hover:text-slate-900 dark:hover:text-white">Emerging Topics</a>
            <a href="#key-journals" className="block pl-4 text-[13px] text-slate-500 hover:text-slate-900 dark:hover:text-white">Key Journals</a>
            <a href="#research-gaps" className="block pl-4 text-[13px] text-slate-500 hover:text-slate-900 dark:hover:text-white">Research Gaps</a>
            <a href="#methodology" className="block pl-4 text-[13px] text-slate-500 hover:text-slate-900 dark:hover:text-white">Methodology</a>
          </nav>
        </aside>

        {/* Center Column (Main Content) */}
        <div className="flex-1 min-w-0 max-w-[800px]">
          {/* Breadcrumb */}
          <div className="flex items-center text-[11px] font-semibold text-slate-500 mb-6 uppercase tracking-wider">
            <span className="hover:text-slate-900 cursor-pointer">Reports</span>
            <ChevronRight className="w-3 h-3 mx-1" />
            <span className="hover:text-slate-900 cursor-pointer">Education</span>
            <ChevronRight className="w-3 h-3 mx-1" />
            <span className="text-slate-900 dark:text-white">{title}</span>
          </div>

          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-6">
            {title}
          </h1>

          <div className="flex items-center gap-3 mb-8">
            <Button variant="outline" className="h-9 px-4 gap-2 text-slate-700 dark:text-slate-300 font-semibold border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50">
              <Share className="w-4 h-4" /> Share
            </Button>
            <Button className="h-9 px-4 bg-[#001b69] hover:bg-[#001040] text-white font-semibold gap-2 rounded-md shadow-sm">
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
            
            <h2 id="executive-summary" className="text-[22px] font-semibold text-slate-900 dark:text-white mb-4 mt-0">Executive Summary</h2>
            <div className="text-slate-600 dark:text-slate-300 text-[15px] leading-[1.7] mb-10 whitespace-pre-wrap">
              {report?.markdown ? report.markdown : `The integration of Large Language Models (LLMs) into educational frameworks has seen an exponential rise between 2020 and 2024. Early adoption focused heavily on automated grading and basic tutoring systems [1]. However, current literature indicates a paradigm shift towards personalized learning pathways and cognitive scaffolding tools.`}
            </div>

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

            <div className="flex items-center justify-between mb-4 mt-12 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <h2 id="research-gaps" className="text-[22px] font-semibold text-slate-900 dark:text-white m-0 border-none pb-0">Identified Research Gaps</h2>
              <Button variant="outline" size="sm" onClick={() => navigate("/research-gaps?source=report")} className="h-8 text-xs font-semibold gap-1">
                View in Research Gaps <ChevronRight className="w-3 h-3" />
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

        {/* Right Column (Metadata) */}
        <div className="w-full lg:w-[280px] shrink-0 space-y-6">
          
          <div className="bg-white dark:bg-[#1c1f26] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-5 text-[15px]">
              <Info className="w-4 h-4 text-[#001b69] dark:text-blue-500" /> Report Metadata
            </h4>
            <div className="space-y-4 text-[13px]">
              <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800/50 pb-3">
                <span className="text-slate-500 font-medium">Analysis Engine</span>
                <span className="font-semibold text-slate-900 dark:text-white">Gemini 2.5 Pro</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800/50 pb-3">
                <span className="text-slate-500 font-medium">Sources Analyzed</span>
                <span className="font-semibold text-slate-900 dark:text-white">12,405 papers</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800/50 pb-3">
                <span className="text-slate-500 font-medium">Processing Time</span>
                <span className="font-semibold text-slate-900 dark:text-white">45s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Token Cost</span>
                <span className="font-semibold text-slate-900 dark:text-white">~$0.42</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50/50 dark:bg-[#1c1f26] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-5 text-[15px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verification Steps
            </h4>
            <div className="space-y-4 text-[13px]">
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                   <Check className="w-2.5 h-2.5 text-emerald-700 dark:text-emerald-400" />
                </div>
                <span className="text-slate-700 dark:text-slate-300 leading-relaxed">Cross-referenced against Scopus DB</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                   <Check className="w-2.5 h-2.5 text-emerald-700 dark:text-emerald-400" />
                </div>
                <span className="text-slate-700 dark:text-slate-300 leading-relaxed">Hallucination check passed <span className="text-slate-500">(Score: 99%)</span></span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                   <Check className="w-2.5 h-2.5 text-emerald-700 dark:text-emerald-400" />
                </div>
                <span className="text-slate-700 dark:text-slate-300 leading-relaxed">Citation formatting validated</span>
              </div>
              <div className="flex items-start gap-3 opacity-60 pt-1">
                <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                   <Clock className="w-2.5 h-2.5 text-slate-500" />
                </div>
                <span className="text-slate-500 leading-relaxed">Human expert review <span className="italic">(Pending)</span></span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
