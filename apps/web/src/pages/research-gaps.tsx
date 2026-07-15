import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Sparkles,
  XCircle,
  Filter,
  Search,
  Zap,
  Loader2,
  ListFilter,
  ChevronLeft,
  ChevronRight,
  Star,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  useGaps,
  useAnalyzeGap,
  useGapAnalysisStatus,
  useActiveGapAnalysis,
} from "@/features/gaps";
import type { GapSource, ResearchGapItem } from "@trend/shared-types";
import { GapCard } from "@/features/gaps/components/gap-card";
import { GapDetailDrawer } from "@/features/gaps/components/gap-detail-drawer";
import { cn } from "@/utils/cn";

type GapSortKey = "default" | "evidence" | "confidence" | "papers" | "newest" | "ai_only_last";

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
  const [yearFrom, setYearFrom] = useState<string>("");
  const [yearTo, setYearTo] = useState<string>("");
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"active" | "resolved" | "dismissed">("active");
  const [searchTopic, setSearchTopic] = useState(searchParams.get("topic") || "");
  const [sourceFilter, setSourceFilter] = useState<GapSource | "all">("all");
  const [page, setPage] = useState(1);
  const [minConfidence, setMinConfidence] = useState(0);
  const [debouncedConfidence, setDebouncedConfidence] = useState(0);
  const [selectedGap, setSelectedGap] = useState<ResearchGapItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Search & Sort & Shortlist states
  const [clientSearch, setClientSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<GapSortKey>("default");
  const [shortlistedGaps, setShortlistedGaps] = useState<ResearchGapItem[]>([]);
  const [showShortlistedOnly, setShowShortlistedOnly] = useState(false);
  const shortlistedIds = shortlistedGaps.map((gap) => gap.id);

  // Sync with URL params
  const urlSource = searchParams.get("source") as GapSource | null;
  const urlTopic = searchParams.get("topic") || "";

  useEffect(() => {
    if (urlSource) {
      setSourceFilter(urlSource);
    }
    if (urlTopic) {
      setSearchTopic(urlTopic);
    }
  }, [urlSource, urlTopic]);

  // Debounce confidence slider value
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedConfidence(minConfidence), 300);
    return () => clearTimeout(timer);
  }, [minConfidence]);

  // Debounce search box
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(clientSearch), 250);
    return () => clearTimeout(timer);
  }, [clientSearch]);

  // Reset page when API filters change
  useEffect(() => {
    setPage(1);
  }, [filterStatus, debouncedConfidence, searchTopic, sourceFilter]);

  const {
    data: gapsData,
    isLoading,
    isError,
    refetch,
  } = useGaps({
    status: filterStatus,
    pageSize: 10,
    page,
    minConfidence: debouncedConfidence,
    topic: searchTopic || undefined,
    source: sourceFilter !== "all" ? sourceFilter : undefined,
  });

  const { mutate: analyze, isPending } = useAnalyzeGap();
  const { data: activeAnalysis } = useActiveGapAnalysis();

  useEffect(() => {
    if (activeAnalysis && (activeAnalysis.status === "queued" || activeAnalysis.status === "analyzing")) {
      setActiveAnalysisId(activeAnalysis.id);
    }
  }, [activeAnalysis]);

  const handleDone = useCallback(() => {
    setActiveAnalysisId(null);
    void refetch();
    toast.success("Gap analysis completed successfully! Gaps list refreshed.");
  }, [refetch]);

  const handleAnalyze = () => {
    if (!topic.trim()) return;
    const fromYear = yearFrom ? parseInt(yearFrom, 10) : undefined;
    const toYear = yearTo ? parseInt(yearTo, 10) : undefined;

    if (fromYear && toYear && fromYear > toYear) {
      toast.error("Year From must be less than or equal to Year To");
      return;
    }

    analyze(
      {
        topic: topic.trim(),
        yearFrom: fromYear,
        yearTo: toYear,
      },
      {
        onSuccess: ({ analysisId }) => {
          setActiveAnalysisId(analysisId);
          setYearFrom("");
          setYearTo("");
          setTopic("");
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.error?.message || "Failed to trigger gap analysis.");
        }
      },
    );
  };

  const handleToggleShortlist = useCallback((gap: ResearchGapItem) => {
    setShortlistedGaps(prev => {
      if (prev.some((item) => item.id === gap.id)) {
        return prev.filter((item) => item.id !== gap.id);
      }
      return [...prev, gap];
    });
  }, []);

  const handleMoveUp = useCallback((gapId: string) => {
    setShortlistedGaps(prev => {
      const index = prev.findIndex((gap) => gap.id === gapId);
      if (index <= 0) return prev;
      const next = [...prev];
      const prevItem = next[index - 1];
      if (prevItem === undefined) return prev;
      next[index] = prevItem;
      next[index - 1] = prev[index]!;
      return next;
    });
  }, []);

  const handleMoveDown = useCallback((gapId: string) => {
    setShortlistedGaps(prev => {
      const index = prev.findIndex((gap) => gap.id === gapId);
      if (index === -1 || index >= prev.length - 1) return prev;
      const next = [...prev];
      const nextItem = next[index + 1];
      if (nextItem === undefined) return prev;
      next[index] = nextItem;
      next[index + 1] = prev[index]!;
      return next;
    });
  }, []);

  // Process client-side filtering and sorting
  const rawGaps = showShortlistedOnly ? shortlistedGaps : gapsData?.data ?? [];
  let processedGaps = [...rawGaps];

  if (debouncedSearch.trim()) {
    const q = debouncedSearch.toLowerCase().trim();
    processedGaps = processedGaps.filter(gap => {
      const titleMatch = gap.title?.toLowerCase().includes(q) ?? false;
      const descMatch = gap.description?.toLowerCase().includes(q) ?? false;
      const topicMatch = gap.topic?.toLowerCase().includes(q) ?? false;
      const probeAMatch = gap.probe?.topicA?.toLowerCase().includes(q) ?? false;
      const probeBMatch = gap.probe?.topicB?.toLowerCase().includes(q) ?? false;
      const paperMatch = gap.supportingPapers?.some(p => p.title?.toLowerCase().includes(q)) ?? false;
      return titleMatch || descMatch || topicMatch || probeAMatch || probeBMatch || paperMatch;
    });
  }

  if (!showShortlistedOnly) {
    if (sortBy === "evidence") {
      processedGaps.sort((a, b) => {
        const order = { confirmed: 1, weak: 2, ai_only: 3 };
        const orderA = order[a.evidenceStatus] ?? 3;
        const orderB = order[b.evidenceStatus] ?? 3;
        if (orderA !== orderB) return orderA - orderB;
        return (b.evidenceConfidence ?? b.confidence ?? 0) - (a.evidenceConfidence ?? a.confidence ?? 0);
      });
    } else if (sortBy === "confidence") {
      processedGaps.sort((a, b) => (b.evidenceConfidence ?? b.confidence ?? 0) - (a.evidenceConfidence ?? a.confidence ?? 0));
    } else if (sortBy === "papers") {
      processedGaps.sort((a, b) => (b.supportingPaperIds?.length ?? b.supportingPapers?.length ?? 0) - (a.supportingPaperIds?.length ?? a.supportingPapers?.length ?? 0));
    } else if (sortBy === "newest") {
      processedGaps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "ai_only_last") {
      processedGaps.sort((a, b) => {
        const isAiA = a.evidenceStatus === "ai_only" ? 1 : 0;
        const isAiB = b.evidenceStatus === "ai_only" ? 1 : 0;
        return isAiA - isAiB;
      });
    } else if (sortBy === "default") {
      processedGaps.sort((a, b) => {
        const order = { confirmed: 1, weak: 2, ai_only: 3 };
        const orderA = order[a.evidenceStatus] ?? 3;
        const orderB = order[b.evidenceStatus] ?? 3;
        if (orderA !== orderB) return orderA - orderB;
        const confA = a.evidenceConfidence ?? a.confidence ?? 0;
        const confB = b.evidenceConfidence ?? b.confidence ?? 0;
        if (confB !== confA) return confB - confA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
  }

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

      {/* Standalone Gap Analysis Form */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border border-cyan-200 dark:border-cyan-900/40 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Trigger Standalone Gap Analysis</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Analyze a specific topic concept to identify under-explored research opportunities and get empirical evidence scores.
        </p>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-grow flex flex-col gap-1.5 w-full">
            <label htmlFor="gap-topic" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Topic Concept</label>
            <input
              id="gap-topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. federated learning in medical imaging"
              className="h-10 rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full"
            />
          </div>
          <div className="w-28 flex flex-col gap-1.5 shrink-0">
            <label htmlFor="gap-year-from" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Year From</label>
            <input
              id="gap-year-from"
              type="number"
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
              placeholder="2020"
              className="h-10 rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full text-center"
            />
          </div>
          <div className="w-28 flex flex-col gap-1.5 shrink-0">
            <label htmlFor="gap-year-to" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Year To</label>
            <input
              id="gap-year-to"
              type="number"
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value)}
              placeholder="2026"
              className="h-10 rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full text-center"
            />
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={isPending || !topic.trim()}
            className="h-10 bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-6 rounded-md shadow-sm shrink-0 w-full md:w-auto"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2 animate-pulse" />}
            Analyze Gaps
          </Button>
        </div>
      </div>

      {/* Unified Filters & Research Workflow Toolbar */}
      <div className="bg-white dark:bg-[#1c1f26] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col gap-4 p-5">
        <div className="absolute left-0 top-0 w-1.5 h-full bg-cyan-500" />

        {/* Row 1: Search & Topic filters (Primary Inputs) */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center relative z-10">
          {/* Client-side Search Box */}
          <div className="flex-grow md:flex-[2] min-w-[280px] relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-450" />
            <Input
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Search loaded gaps by title, description, papers, topic..."
              className="pl-9 h-9 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 rounded-lg text-sm bg-slate-50/50 dark:bg-slate-950"
            />
            {clientSearch && (
              <button
                onClick={() => setClientSearch("")}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Server-side Topic Box */}
          <div className="flex-grow md:flex-[1.5] min-w-[280px] relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-455" />
            <Input
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
              placeholder="Filter by topic concept (API query)..."
              className="pl-9 h-9 border-slate-200 dark:border-slate-800 focus-visible:ring-cyan-500 rounded-lg text-sm bg-slate-50/50 dark:bg-slate-950"
            />
            {searchTopic && (
              <button
                onClick={() => setSearchTopic("")}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap self-center md:ml-auto">
            Search applies to loaded results
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-slate-100 dark:border-slate-800/60" />

        {/* Row 2: Secondary Controls (Filters & Sort & Shortlist) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          {/* Left Group: Filters */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {/* Status filter */}
            <div className="flex items-center gap-2 h-9">
              <ListFilter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Status:</span>
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg h-9 items-center">
                <Button
                  size="sm"
                  variant={filterStatus === "active" ? "default" : "ghost"}
                  className={`h-7 px-3 text-xs ${filterStatus === "active" ? "shadow-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white" : ""}`}
                  onClick={() => setFilterStatus("active")}
                >
                  Active
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === "resolved" ? "default" : "ghost"}
                  className={`h-7 px-3 text-xs ${filterStatus === "resolved" ? "shadow-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white" : ""}`}
                  onClick={() => setFilterStatus("resolved")}
                >
                  Resolved
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === "dismissed" ? "default" : "ghost"}
                  className={`h-7 px-3 text-xs ${filterStatus === "dismissed" ? "shadow-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white" : ""}`}
                  onClick={() => setFilterStatus("dismissed")}
                >
                  Dismissed
                </Button>
              </div>
            </div>

            {/* Source filter */}
            <div className="flex items-center gap-2 h-9">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Source:</span>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as GapSource | "all")}
                className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="all">All Sources</option>
                <option value="report">Report-generated</option>
                <option value="standalone">Standalone Analysis</option>
              </select>
            </div>

            {/* Min Confidence */}
            <div className="flex items-center gap-2 h-9">
               <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
               <span className="text-xs font-bold text-slate-700 dark:text-slate-300 min-w-[120px]">
                 Confidence &ge; {Math.round(minConfidence * 100)}%
               </span>
               <input
                 type="range"
                 min="0"
                 max="1"
                 step="0.1"
                 value={minConfidence}
                 onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                 className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-500 dark:bg-slate-700"
               />
            </div>
          </div>

          {/* Right Group: Actions */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Sort Select */}
            <div className="flex items-center gap-2 h-9">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Sort:</span>
              <select
            value={sortBy}
            disabled={showShortlistedOnly}
            onChange={(e) => setSortBy(e.target.value as GapSortKey)}
                className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
              >
                <option value="default">Default Sort (AI priority)</option>
                <option value="evidence">Most Evidence-backed</option>
                <option value="confidence">Highest Confidence</option>
                <option value="papers">Most Supporting Papers</option>
                <option value="newest">Newest Gaps First</option>
                <option value="ai_only_last">AI-only Last</option>
              </select>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden lg:block" />

            {/* Show Shortlisted Only Toggle */}
            <div className="flex items-center gap-2 h-9">
              <Button
                size="sm"
                variant={showShortlistedOnly ? "default" : "outline"}
                className={cn(
                  "h-9 px-3.5 text-xs font-bold gap-1.5 rounded-lg transition-all",
                  showShortlistedOnly
                    ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                )}
                onClick={() => setShowShortlistedOnly(prev => !prev)}
              >
                <Star className={cn("w-3.5 h-3.5", showShortlistedOnly ? "fill-amber-400 text-amber-300" : "text-slate-500")} />
            <span>Shortlist ({shortlistedGaps.length})</span>
              </Button>
              {showShortlistedOnly && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-wider animate-pulse">
                  Session-only order
                </span>
              )}
            </div>
          </div>
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
              Could not load research gaps. Please try again later.
            </p>
          </div>
        </div>
      )}

      {/* Empty State when no results match filter */}
      {processedGaps.length === 0 && !isLoading && !isError && (
        <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 p-12 rounded-2xl text-center space-y-3">
          <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2 opacity-50" />
          <h3 className="text-slate-900 dark:text-white font-bold text-base">
            {showShortlistedOnly
              ? "Your shortlist is empty"
              : "No gaps match your search"}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {showShortlistedOnly
              ? "Star interesting research opportunities from the main list to add them to your session-only shortlist."
              : "We couldn't find any results matching your search query. Try clearing the search text or widening your confidence slider."}
          </p>
          <div className="pt-2">
            {showShortlistedOnly ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                onClick={() => setShowShortlistedOnly(false)}
              >
                Show all gaps
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                onClick={() => setClientSearch("")}
              >
                Clear search
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Grid container for Card List */}
      {!isError && processedGaps.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {processedGaps.map((gap, index) => (
            <GapCard
              key={gap.id}
              gap={gap}
              filterStatus={filterStatus}
              onViewDetails={(g) => {
                setSelectedGap(g);
                setIsDrawerOpen(true);
              }}
              isShortlisted={shortlistedIds.includes(gap.id)}
              onToggleShortlist={handleToggleShortlist}
              showReorderButtons={showShortlistedOnly}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              isFirst={index === 0}
              isLast={index === processedGaps.length - 1}
            />
          ))}
        </div>
      )}

      {/* Pagination (Only visible when not displaying shortlist) */}
      {!showShortlistedOnly && gapsData?.meta && gapsData.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-10 mb-6">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-slate-500 rounded-md border-slate-200 dark:border-slate-800"
            disabled={page <= 1}
            onClick={() => setPage(prev => prev - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-slate-600 dark:text-slate-400 mx-4">
            Page {page} of {gapsData.meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-slate-500 rounded-md border-slate-200 dark:border-slate-800"
            disabled={page >= gapsData.meta.totalPages}
            onClick={() => setPage(prev => prev + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Meta Total */}
      {!showShortlistedOnly && gapsData?.meta && (
        <p className="text-xs text-muted-foreground mt-4">
          {gapsData.meta.total} gap{gapsData.meta.total !== 1 ? "s" : ""} found
        </p>
      )}

      <GapDetailDrawer
        gap={selectedGap}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedGap(null);
        }}
      />
    </main>
  );
}
