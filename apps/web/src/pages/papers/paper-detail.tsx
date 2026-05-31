import { useParams } from "react-router-dom";
import { ExternalLink, Bookmark, Quote, Link2, ChevronRight, UserPlus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePaper } from "@/features/papers";

export function PaperDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: paper, isLoading } = usePaper(id);

  if (isLoading) {
    return <div className="container py-8 text-center text-slate-500 mt-20">Loading paper details...</div>;
  }

  if (!paper) {
    return <div className="container py-8 text-center text-slate-500 mt-20">Paper not found.</div>;
  }

  return (
    <main className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center text-xs font-medium text-slate-500 mb-6">
        <span className="hover:text-slate-900 cursor-pointer">Publication Trend</span>
        <ChevronRight className="w-3 h-3 mx-1" />
        <span className="text-slate-900 dark:text-white">Paper Detail</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Column */}
        <div className="flex-1 min-w-0">
          
          {/* Hero Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
              {paper.title}
            </h1>
            
            {/* Metadata Strip */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium mb-6">
              {paper.openAccessUrl && (
                <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Open Access
                </span>
              )}
              {paper.journalName && (
                <>
                  <span className="text-slate-700 dark:text-slate-300">{paper.journalName}</span>
                  <span className="text-slate-400">•</span>
                </>
              )}
              <span className="text-slate-500">Published {paper.publicationYear}</span>
              {paper.externalIds?.doi && (
                <>
                  <span className="text-slate-400">•</span>
                  <a href={`https://doi.org/${paper.externalIds.doi}`} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1">
                    DOI {paper.externalIds.doi} <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}
            </div>

            {/* Authors List */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              {paper.authors.slice(0, 5).map((author, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 border-2 border-white dark:border-slate-900 shadow-sm flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-400">
                    {author.displayName.charAt(0)}
                  </div>
                  <span className="text-sm font-semibold text-blue-800 dark:text-blue-400 cursor-pointer hover:underline">
                    {author.displayName}
                  </span>
                </div>
              ))}
              {paper.authors.length > 5 && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 shadow-sm flex items-center justify-center text-xs font-bold text-slate-500">
                    +{paper.authors.length - 5}
                  </div>
                  <span className="text-sm text-slate-500">et al.</span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 gap-4">
              <div className="flex items-center gap-3">
                {paper.openAccessUrl && (
                  <Button className="bg-blue-800 hover:bg-blue-900 text-white font-bold h-10 px-5 gap-2 rounded-lg" onClick={() => window.open(paper.openAccessUrl, '_blank')}>
                    <FileText className="w-4 h-4" /> Read PDF
                  </Button>
                )}
                <Button variant="outline" className="h-10 px-4 gap-2 text-slate-700 dark:text-slate-300 font-bold border-slate-300 dark:border-slate-700 rounded-lg">
                  <Bookmark className="w-4 h-4" /> Save
                </Button>
                <Button variant="outline" className="h-10 px-4 gap-2 text-slate-700 dark:text-slate-300 font-bold border-slate-300 dark:border-slate-700 rounded-lg">
                  <Quote className="w-4 h-4" /> Cite
                </Button>
              </div>
              <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                <Link2 className="w-4 h-4" /> {paper.citationCount.toLocaleString()} Citations
              </div>
            </div>
          </div>

          {/* AI Analysis Summary */}
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm mb-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 flex items-center justify-center">
                  <SparklesIcon />
                </div>
                AI Analysis Summary
              </h2>
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <div className="w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">!</div>
                Confidence: High
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {/* Metric 1 */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Relevance</span>
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none">0.95</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-600 dark:bg-cyan-500 rounded-full" style={{ width: '95%' }}></div>
                </div>
              </div>
              {/* Metric 2 */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Semantic Fit</span>
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none">0.88</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-600 dark:bg-cyan-500 rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>
              {/* Metric 3 */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Methodology</span>
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none">0.93</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-600 dark:bg-cyan-500 rounded-full" style={{ width: '93%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Abstract */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Abstract</h3>
            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed text-justify">
              <p>
                {paper.abstractText || "No abstract available for this paper."}
              </p>
            </div>
          </div>

        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-[320px] shrink-0">
          {/* Lead Author Card */}
          {paper.authors[0] && (
            <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm sticky top-24">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">Lead Author</div>
              
              <div className="flex gap-4 mb-6">
                <div className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-lg font-bold text-blue-700 dark:text-blue-400">
                  {paper.authors[0].displayName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{paper.authors[0].displayName}</h4>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-xs text-slate-500 font-medium mb-1">Citations (Paper)</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">{paper.citationCount}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium mb-1">Data Quality</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    {paper.dataQualityScore ? paper.dataQualityScore.toFixed(2) : "N/A"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}
