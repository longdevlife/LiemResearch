import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Sparkles, CheckCircle2, XCircle, Filter, Search, Zap, Loader2, Undo2, ListFilter } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useGaps,
  useAnalyzeGap,
  useGapAnalysisStatus,
  usePatchGapStatus,
} from "@/features/gaps";
import type { GapSource } from "@trend/shared-types";

function ConfidenceBar({ value, isEvidence }: { value: number; isEvidence?: boolean }) {
  const pct = Math.round(value * 100);
  let colorClass = "bg-rose-500";
  if (value >= 0.7) colorClass = "bg-emerald-500";
  else if (value >= 0.4) colorClass = "bg-amber-500";
  
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
      <div className="w-28 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
        <div className={`h-full ${colorClass} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className={value >= 0.7 ? "text-emerald-600 dark:text-emerald-400 font-bold" : ""}>
        {pct}% {isEvidence ? "Evidence Confidence" : "Confidence"}
      </span>
    </div>
  );
}

function AnalysisPoller({ analysisId, onDone }: { analysisId: string; onDone: () => void }) {
  const { data } = useGapAnalysisStatus(analysisId);

  useEffect(() => {
    if (data?.status === "ready") {
      onDone();
    }
  }, [data?.status, onDone]);

  if (data?.status === "failed") {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-sm flex items-center gap-2 max-w-2xl">
         <XCircle className="w-4 h-4" />
         {data.errorMessage ?? "Analysis failed."}
      </div>
    );
  }
  if (data?.status === "ready") return null;
  return (
    <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 p-4 rounded-lg flex items-center gap-3 max-w-2xl shadow-sm">
      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
        {data?.status === "analyzing" ? "Analyzing documents with Gemini AI…" : "Analysis job queued…"}
      </p>
    </div>
  );
}

export function ResearchGapsPage() {
  const [searchParams] = useSearchParams();
  const [topic, setTopic] = useState("");
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"active" | "resolved" | "dismissed">("active");
  const [searchTopic, setSearchTopic] = useState(searchParams.get("topic") || "");
  const [minConfidence, setMinConfidence] = useState(0);
  const [debouncedConfidence, setDebouncedConfidence] = useState(0);

  // Debounce slider value so we don't spam the API while dragging
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedConfidence(minConfidence), 300);
    return () => clearTimeout(timer);
  }, [minConfidence]);

  const {
    data: gapsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGaps({
    status: filterStatus,
    pageSize: 20,
    minConfidence: debouncedConfidence,
    topic: searchTopic || undefined,
  });
  const { mutate: analyze, isPending } = useAnalyzeGap();
  const { mutate: patchStatus } = usePatchGapStatus();

  const handleDone = useCallback(() => {
    setActiveAnalysisId(null);
    void refetch();
  }, [refetch]);

  const handleAnalyze = () => {
    if (!topic.trim()) return;
    analyze(
      { topic: topic.trim() },
      {
        onSuccess: ({ analysisId }) => {
          setActiveAnalysisId(analysisId);
        },
      },
    );
  };

  return (
    <main className="container py-8 space-y-6">
      <PageHeader
        title="Research Gaps"
        description="AI-suggested research opportunities grounded in retrieved papers."
      />

      {activeAnalysisId && (
        <AnalysisPoller
          analysisId={activeAnalysisId}
          onDone={handleDone}
        />
      )}

      {/* Filters */}
      <div className="flex gap-6 flex-wrap items-center bg-white dark:bg-[#1c1f26] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 w-1 h-full bg-cyan-500" />

        <div className="flex items-center gap-3">
          <ListFilter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status:</span>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg">
            <Button
              size="sm"
              variant={filterStatus === "active" ? "default" : "ghost"}
              className={`h-7 px-3 text-xs ${filterStatus === "active" ? "shadow-sm" : ""}`}
              onClick={() => setFilterStatus("active")}
            >
              Active
            </Button>
            <Button
              size="sm"
              variant={filterStatus === "resolved" ? "default" : "ghost"}
              className={`h-7 px-3 text-xs ${filterStatus === "resolved" ? "shadow-sm" : ""}`}
              onClick={() => setFilterStatus("resolved")}
            >
              Resolved
            </Button>
            <Button
              size="sm"
              variant={filterStatus === "dismissed" ? "default" : "ghost"}
              className={`h-7 px-3 text-xs ${filterStatus === "dismissed" ? "shadow-sm" : ""}`}
              onClick={() => setFilterStatus("dismissed")}
            >
              Dismissed
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <Search className="w-4 h-4 text-slate-400" />
           <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Topic:</span>
           <Input 
             placeholder="Filter gaps by topic..." 
             className="h-8 w-64 text-sm bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus-visible:ring-cyan-500"
             value={searchTopic}
             onChange={(e) => setSearchTopic(e.target.value)}
           />
        </div>
        
        <div className="flex items-center gap-3 xl:ml-auto">
           <Zap className="w-4 h-4 text-amber-500" />
           <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-36">Min Confidence: {Math.round(minConfidence * 100)}%</span>
           <input 
             type="range" 
             min="0" 
             max="1" 
             step="0.1" 
             value={minConfidence}
             onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
             className="w-32 accent-cyan-500 cursor-pointer"
           />
        </div>
      </div>

      {/* Gap cards */}
      {isLoading && <div className="flex items-center gap-2 text-cyan-600 font-medium"><Loader2 className="w-5 h-5 animate-spin" /> Loading gaps...</div>}
      
      {isError && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 p-6 rounded-xl flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 dark:text-red-400 font-bold mb-1">Failed to fetch research gaps</h3>
            <p className="text-red-600 dark:text-red-500 text-sm">
              Không tải được danh sách research gaps. Vui lòng thử lại sau.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !isError && gapsData?.data?.length === 0 && (
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 rounded-xl text-center">
          <Sparkles className="w-8 h-8 text-cyan-500 mx-auto mb-3 opacity-50" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">No research gaps found matching your filters.</p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Try lowering the Min Confidence slider or changing the topic.</p>
        </div>
      )}
      
      {!isError && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {gapsData?.data?.map((gap) => (
          <div key={gap.id} className="bg-white dark:bg-[#1c1f26] border-2 border-cyan-100 dark:border-cyan-900/40 hover:border-cyan-400 dark:hover:border-cyan-600 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50 dark:bg-cyan-900/10 rounded-bl-full -mr-10 -mt-10 opacity-50 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/20 transition-colors pointer-events-none" />
            
            <div className="flex items-start justify-between gap-4 mb-4 relative">
              <h3 className="font-bold text-[17px] text-slate-900 dark:text-white leading-snug flex items-start gap-2">
                <Sparkles className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                {gap.title}
              </h3>
              <Badge variant="outline" className="shrink-0 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800 font-semibold px-2.5 py-0.5 shadow-sm">
                {gap.source === "report" ? "Report" : "Standalone"}
              </Badge>
            </div>
            
            <p className="text-[14.5px] text-slate-700 dark:text-slate-300 leading-relaxed mb-5 flex-1 relative">
              {gap.description}
            </p>
            
            {gap.rationale && (
              <div className="bg-slate-50 dark:bg-[#15171c] border border-slate-100 dark:border-slate-800 p-4 rounded-xl mb-4 relative shadow-inner">
                <p className="text-[13.5px] text-slate-600 dark:text-slate-400 italic leading-relaxed">
                  <span className="font-bold text-slate-700 dark:text-slate-300 not-italic block mb-1.5 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-500" /> Rationale:</span>
                  {gap.rationale}
                </p>
              </div>
            )}

            {/* Evidence Block (Bằng chứng thực tế từ v2) */}
            {gap.evidenceConfidence !== undefined && gap.evidenceConfidence !== null && gap.probe && gap.parentTrend && (
              <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-xl mb-4 relative shadow-inner">
                <div className="text-[13px] text-emerald-800 dark:text-emerald-400 leading-relaxed">
                  <span className="font-bold text-emerald-950 dark:text-emerald-300 block mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Bằng chứng thực tế (Evidence):
                  </span>
                  Chỉ có <strong className="text-emerald-950 dark:text-emerald-200">{gap.intersectionCount ?? 0}</strong> bài báo ở giao điểm <code className="bg-emerald-100/50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded text-xs font-semibold">"{gap.probe.topicA}"</code> × <code className="bg-emerald-100/50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded text-xs font-semibold">"{gap.probe.topicB}"</code> — trong khi <code className="bg-emerald-100/50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded text-xs font-semibold">"{gap.parentTrend.topic}"</code> có <strong className="text-emerald-950 dark:text-emerald-200">{gap.parentTrend.topic === gap.probe.topicA ? gap.parentCounts?.a : gap.parentCounts?.b}</strong> bài, đang tăng trưởng <strong className="text-emerald-950 dark:text-emerald-200">{gap.parentTrend.growthRatePct >= 0 ? "+" : ""}{Math.round(gap.parentTrend.growthRatePct)}%/năm</strong>.
                </div>
              </div>
            )}
            
            {gap.supportingPaperIds && gap.supportingPaperIds.length > 0 && (
               <div className="flex flex-wrap gap-2 mb-4 relative">
                 {gap.supportingPaperIds.map((id) => (
                   <Link key={id} to={`/papers/${id}`}>
                     <Badge variant="secondary" className="text-[11px] font-medium cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5">
                       Paper #{id.slice(-6)}
                     </Badge>
                   </Link>
                 ))}
               </div>
            )}
            
            <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800 mt-auto relative">
              <ConfidenceBar 
                value={gap.evidenceConfidence !== undefined && gap.evidenceConfidence !== null ? gap.evidenceConfidence : gap.confidence} 
                isEvidence={gap.evidenceConfidence !== undefined && gap.evidenceConfidence !== null}
              />
              <div className="flex gap-2">
                {filterStatus === "active" ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 transition-colors"
                      onClick={() => patchStatus({ id: gap.id, status: "resolved" })}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Resolved
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-3 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-900/20 transition-colors"
                      onClick={() => patchStatus({ id: gap.id, status: "dismissed" })}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1.5" /> Dismiss
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs font-semibold text-blue-600 hover:bg-blue-50 border-blue-200 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:border-blue-900 transition-colors"
                    onClick={() => patchStatus({ id: gap.id, status: "active" })}
                  >
                    <Undo2 className="w-3.5 h-3.5 mr-1.5" /> Restore to Active
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {gapsData?.meta && (
        <p className="text-xs text-muted-foreground">
          {gapsData.meta.total} gap{gapsData.meta.total !== 1 ? "s" : ""} found
        </p>
      )}
    </main>
  );
}
