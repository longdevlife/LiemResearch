import { ExternalLink, ChevronDown, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SearchPage() {
  return (
    <div className="w-full flex flex-col md:flex-row gap-8 items-start">
      {/* LEFT SIDEBAR: Filters (roughly 3/12 columns on large screens) */}
      <aside className="w-full md:w-64 lg:w-72 shrink-0 bg-white dark:bg-[#121212] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm sticky top-24">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-blue-800 dark:text-blue-500 tracking-tight">Filters</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Refine your results</p>
        </div>

        {/* Search Mode */}
        <div className="mb-6">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 block">
            SEARCH MODE
          </label>
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button className="flex-1 bg-blue-700 text-white rounded-md py-1.5 text-xs font-bold shadow-sm transition-all">
              Semantic
            </button>
            <button className="flex-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md py-1.5 text-xs font-medium transition-all">
              Keyword
            </button>
          </div>
        </div>

        {/* Publication Year */}
        <div className="mb-6">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-3 h-3 border border-current rounded-sm inline-block"></span> PUBLICATION YEAR
          </label>
          <div className="flex items-center gap-2">
            <input type="text" defaultValue="2020" className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1e1e1e] text-center text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <span className="text-slate-400">-</span>
            <input type="text" defaultValue="2024" className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1e1e1e] text-center text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>

        {/* Open Access Only */}
        <div className="mb-6 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer">
            <span className="w-3 h-4 border border-current rounded-sm inline-block"></span> Open Access Only
          </label>
          {/* Custom toggle switch */}
          <div className="w-9 h-5 bg-blue-700 rounded-full relative cursor-pointer">
            <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"></div>
          </div>
        </div>

        {/* Journal Type */}
        <div className="mb-6">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-3 h-3 border border-current rounded-sm inline-block"></span> JOURNAL TYPE
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="w-4 h-4 rounded bg-blue-700 text-white flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
              <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Conference Proceedings</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="w-4 h-4 rounded bg-blue-700 text-white flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
              <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Journal Article</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="w-4 h-4 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1e1e1e]"></div>
              <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Preprint</span>
            </label>
          </div>
        </div>

        {/* Source */}
        <div className="mb-6">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-3 h-3 border border-current rounded-sm inline-block"></span> SOURCE
          </label>
          <div className="relative">
            <select className="w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1e1e1e] px-3 text-sm font-medium text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option>OpenAlex</option>
              <option>Crossref</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* AI Score Threshold */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-3 h-3 border border-current rounded-full inline-block"></span> AI SCORE THRESHOLD
            </label>
            <span className="text-xs font-bold text-blue-700 dark:text-blue-500">0.80+</span>
          </div>
          <div className="relative pt-1 pb-4">
            <input type="range" min="0" max="100" defaultValue="80" className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-700" />
            <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-medium">
              <span>0.0</span>
              <span>1.0</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT: Search Results (roughly 9/12 columns on large screens) */}
      <main className="flex-1 w-full min-w-0">
        
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">1,247 papers found</h1>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs font-medium text-slate-500">Active:</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs font-medium">
                2020 - 2024
                <X className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500" />
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs font-medium">
                Semantic
                <X className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500" />
              </div>
              <Button variant="link" className="text-blue-600 dark:text-blue-400 text-xs p-0 h-auto ml-2">Clear all</Button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-slate-500">Sort by:</span>
            <div className="relative z-0">
              <select className="h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1e1e1e] pl-3 pr-8 text-xs font-medium text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                <option>Relevance (AI Score)</option>
                <option>Date (Newest)</option>
                <option>Citations</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-4">
          <SearchResultCard 
            title="Evaluating the Efficacy of Large Language Models in Automated Code Generation for CS Education"
            authors="Chen, Y., Smith, J., & Davis, R."
            journal="Journal of Computing in Higher Education (2024)"
            doi="10.1007/x12528-024-09512-x"
            abstract="This study investigates the integration of generative AI, specifically large language models (LLMs), into introductory computer science curricula. We analyzed over 5,000 student interactions with an LLM-based coding assistant to..."
            score="0.96"
            keywords={["Generative AI", "CS Education", "Automated Feedback"]}
          />
          <SearchResultCard 
            title="Prompt Engineering as a Core Competency: Integrating LLMs into Multidisciplinary Syllabi"
            authors="Williams, S., & Thompson, K."
            journal="Educational Technology Research and Development (2023)"
            doi="10.1007/s11423-023-10291-5"
            abstract="As LLMs become ubiquitous tools for knowledge generation, the ability to effectively construct prompts is emerging as a critical digital literacy skill. This paper proposes a framework for teaching prompt engineering across various..."
            score="0.92"
            keywords={["Prompt Engineering", "Digital Literacy"]}
          />
          <SearchResultCard 
            title="Hallucinations in the Classroom: Mitigating Risks of LLM Adoption in Secondary Education"
            authors="Garcia, L. M."
            journal="Computers & Education (2023)"
            doi="10.1016/j.compedu.2023.104820"
            abstract="While large language models offer unprecedented opportunities for personalized learning, their propensity to generate plausible but incorrect information (“hallucinations”) poses a significant risk in educational settings. This..."
            score="0.88"
            keywords={["AI Ethics", "Fact-Checking", "Secondary Ed"]}
          />
          <SearchResultCard 
            title="Personalized AI Tutors: A Meta-Analysis of LLM Applications in Language Learning"
            authors="Kim, Y., & Lee, H."
            journal="Language Learning & Technology (2022)"
            doi="10.1125/llt.v26i3.3081"
            abstract="A systematic review of 42 empirical studies examining the use of large language models as conversational agents for second language acquisition. We analyze the effectiveness of these tools across different proficiency levels an..."
            score="0.85"
            keywords={["Language Learning", "Conversational AI"]}
          />
          <SearchResultCard 
            title="The Impact of ChatGPT on Academic Integrity: A Faculty Perspective"
            authors="Patel, R., et al."
            journal="Assessment & Evaluation in Higher Education (2023)"
            doi="10.1080/02602938.2023.2185671"
            abstract="The sudden availability of highly capable generative text models has prompted urgent discussions regarding academic integrity. Through a survey of 500 university faculty members, this paper explores current attitudes,..."
            score="0.78"
            keywords={["Academic Integrity", "Assessment"]}
          />
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-1 mt-10 mb-8">
          <Button variant="outline" size="icon" className="h-8 w-8 text-slate-500 rounded-md border-slate-200 dark:border-slate-800" disabled>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="default" className="h-8 w-8 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-md px-0">1</Button>
          <Button variant="ghost" className="h-8 w-8 text-slate-600 dark:text-slate-400 font-medium rounded-md px-0">2</Button>
          <Button variant="ghost" className="h-8 w-8 text-slate-600 dark:text-slate-400 font-medium rounded-md px-0">3</Button>
          <span className="px-1 text-slate-400">...</span>
          <Button variant="ghost" className="h-8 w-8 text-slate-600 dark:text-slate-400 font-medium rounded-md px-0">24</Button>
          <Button variant="outline" size="icon" className="h-8 w-8 text-slate-500 rounded-md border-slate-200 dark:border-slate-800">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}

// Sub-components

function SearchResultCard({ title, authors, journal, doi, abstract, score, keywords }: { title: string, authors: string, journal: string, doi: string, abstract: string, score: string, keywords: string[] }) {
  const isHigh = parseFloat(score) >= 0.8;
  const badgeColors = isHigh 
    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
    : "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400";
  
  return (
    <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative">
      {/* Title & Score */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 leading-tight pr-16 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer">
          {title}
        </h3>
        <div className={`flex flex-col items-center justify-center border rounded-lg px-2 py-1 shrink-0 ${badgeColors}`}>
          <span className="font-extrabold text-sm flex items-center leading-none">
             <span className="w-2.5 h-2.5 bg-current opacity-20 rounded-full inline-block mr-1"></span>
             {score}
          </span>
        </div>
      </div>

      {/* Meta Info */}
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1 mb-4">
        <span className="text-slate-700 dark:text-slate-300 font-bold">{authors}</span>
        <span className="text-slate-300 dark:text-slate-600">•</span>
        <span>{journal}</span>
        <span className="text-slate-300 dark:text-slate-600">•</span>
        <a href="#" className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
          {doi} <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Abstract */}
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 mb-4">
        {abstract}
      </p>

      {/* Keywords */}
      <div className="flex flex-wrap gap-2">
        {keywords.map(kw => (
          <span key={kw} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full text-xs font-medium">
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}
