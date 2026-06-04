import { useParams } from "react-router-dom";
import { Share, Download, CheckCircle2, Info, Check, Clock, Coins, Sparkles, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportViewerPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <main className="container py-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
      
      <div className="flex flex-col lg:flex-row gap-8 relative items-start">
        
        {/* Left Column (TOC) */}
        <aside className="w-full lg:w-48 shrink-0 hidden lg:block sticky top-24">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Contents</h3>
          <nav className="space-y-3 relative border-l-2 border-slate-200 dark:border-slate-800">
            <div className="absolute top-0 -left-[2px] w-[2px] h-6 bg-blue-700 rounded-full"></div>
            <a href="#executive-summary" className="block pl-4 text-sm font-bold text-blue-700 dark:text-blue-500">Executive Summary</a>
            <a href="#publication-growth" className="block pl-4 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white">Publication Growth</a>
            <a href="#emerging-topics" className="block pl-4 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white">Emerging Topics</a>
            <a href="#key-journals" className="block pl-4 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white">Key Journals</a>
            <a href="#research-gaps" className="block pl-4 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white">Research Gaps</a>
            <a href="#methodology" className="block pl-4 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white">Methodology</a>
          </nav>
        </aside>

        {/* Center Column (Main Content) */}
        <div className="flex-1 min-w-0 max-w-3xl">
          {/* Breadcrumb */}
          <div className="flex items-center text-xs font-medium text-slate-500 mb-4">
            <span className="hover:text-slate-900 cursor-pointer">Reports</span>
            <ChevronRight className="w-3 h-3 mx-1" />
            <span className="hover:text-slate-900 cursor-pointer">Education</span>
            <ChevronRight className="w-3 h-3 mx-1" />
            <span className="text-slate-900 dark:text-white">LLM Trends 2020-2024</span>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-6">
            LLM in Education Trends 2020-2024
          </h1>

          <div className="flex items-center gap-3 mb-6">
            <Button variant="outline" className="h-9 px-4 gap-2 text-slate-700 dark:text-slate-300 font-bold border-slate-300 dark:border-slate-700 rounded-md">
              <Share className="w-4 h-4" /> Share
            </Button>
            <Button className="h-9 px-4 bg-blue-800 hover:bg-blue-900 text-white font-bold gap-2 rounded-md">
              <Download className="w-4 h-4" /> PDF
            </Button>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-slate-500 mb-10 pb-6 border-b border-slate-200 dark:border-slate-800">
            <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> AI-Verified Report
            </span>
            <span>Generated Oct 24, 2024</span>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 dark:prose-a:text-blue-400">
            <h2 id="executive-summary" className="text-xl mb-4 mt-0">Executive Summary</h2>
            <p className="text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed mb-8">
              The integration of Large Language Models (LLMs) into educational frameworks has seen an exponential rise between 2020 and 2024. Early adoption focused heavily on automated grading and basic tutoring systems <a href="#" className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded no-underline">[1]</a>. However, current literature indicates a paradigm shift towards personalized learning pathways and cognitive scaffolding tools.
            </p>

            <h2 id="publication-growth" className="text-xl mb-4">Publication Volume Growth</h2>
            <p className="text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed mb-6">
              Analysis of major academic databases reveals a &gt;400% year-over-year increase in papers discussing "GPT", "LLM", and "Education" simultaneously starting in early 2023 <a href="#" className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded no-underline">[2]</a>.
            </p>

            {/* Embedded Chart Mockup */}
            <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-lg p-5 mb-10">
              <div className="flex items-end justify-between h-32 gap-2 mb-2">
                <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t-sm h-[10%]"></div>
                <div className="w-full bg-blue-200 dark:bg-blue-900/40 rounded-t-sm h-[15%]"></div>
                <div className="w-full bg-blue-400 dark:bg-blue-800/60 rounded-t-sm h-[30%]"></div>
                <div className="w-full bg-blue-700 dark:bg-blue-600 rounded-t-sm h-[80%]"></div>
                <div className="w-full bg-blue-900 dark:bg-blue-500 rounded-t-sm h-[100%]"></div>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span className="w-full text-center">2020</span>
                <span className="w-full text-center">2021</span>
                <span className="w-full text-center">2022</span>
                <span className="w-full text-center">2023</span>
                <span className="w-full text-center">2024</span>
              </div>
            </div>

            <h2 id="research-gaps" className="text-xl mb-4">Identified Research Gaps</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-white dark:bg-[#121212] border border-cyan-300 dark:border-cyan-800 rounded-lg p-5 shadow-sm">
                <h4 className="font-bold text-slate-900 dark:text-white text-[15px] flex items-center gap-2 m-0 mb-2">
                  <Sparkles className="w-4 h-4 text-cyan-600" /> Long-term Cognitive Impact
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 m-0 leading-relaxed">
                  Limited empirical studies exist on how reliance on LLMs affects student critical thinking over multi-year periods.
                </p>
              </div>
              <div className="bg-white dark:bg-[#121212] border border-purple-300 dark:border-purple-800 rounded-lg p-5 shadow-sm">
                <h4 className="font-bold text-slate-900 dark:text-white text-[15px] flex items-center gap-2 m-0 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-600" /> Equity in Access
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 m-0 leading-relaxed">
                  Significant literature gap regarding the digital divide created by premium LLM subscription models in public schools.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Metadata) */}
        <div className="w-full lg:w-72 shrink-0 space-y-6">
          
          <div className="bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4 text-sm">
              <Info className="w-4 h-4 text-blue-600" /> Report Metadata
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Analysis Engine</span>
                <span className="font-bold text-slate-900 dark:text-white">Gemini 2.5 Pro</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Sources Analyzed</span>
                <span className="font-bold text-slate-900 dark:text-white">12,405 papers</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Processing Time</span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">45s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Token Cost</span>
                <span className="font-bold text-slate-900 dark:text-white">~$0.42</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#181818] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verification Steps
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">Cross-referenced against Scopus DB</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">Hallucination check passed (Score: 99%)</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">Citation formatting validated</span>
              </div>
              <div className="flex items-start gap-2 opacity-60">
                <Clock className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                <span className="text-slate-500 font-medium leading-relaxed">Human expert review (Pending)</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
