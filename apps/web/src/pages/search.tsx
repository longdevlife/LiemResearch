import { useState, useMemo } from "react";
import { ExternalLink, ChevronDown, ChevronLeft, ChevronRight, Check, X, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Paper } from "@trend/shared-types";
import { usePapers } from "@/features/papers";
import { useSearch } from "@/features/search";
import { useSearchParams, Link } from "react-router-dom";
import { useBookmarks, useCreateBookmark, useDeleteBookmark } from "@/features/bookmarks";
import { toast } from "sonner";

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  
  // Filter States
  const [searchMode, setSearchMode] = useState<"semantic" | "keyword">("semantic");
  const [yearFrom, setYearFrom] = useState<string>("2020");
  const [yearTo, setYearTo] = useState<string>("2026");
  const [openAccessOnly, setOpenAccessOnly] = useState<boolean>(false);
  const [journalTypes, setJournalTypes] = useState<string[]>(["article", "proceedings"]);
  const [primaryProvider, setPrimaryProvider] = useState<string>("all");
  const [aiScoreThreshold, setAiScoreThreshold] = useState<number>(0.8);

  const parsedYearFrom = yearFrom ? parseInt(yearFrom, 10) : undefined;
  const parsedYearTo = yearTo ? parseInt(yearTo, 10) : undefined;
  const hasQuery = q.trim().length > 0;

  // No query or keyword mode → browse papers. Otherwise → semantic search.
  const isSemanticSearchActive = searchMode === "semantic" && hasQuery;

  const browse = usePapers({ 
    page, 
    pageSize: 20, 
    q: searchMode === "keyword" ? q : undefined 
  });
  const search = useSearch({ 
    q, 
    page, 
    pageSize: 20, 
    yearFrom: parsedYearFrom, 
    yearTo: parsedYearTo 
  });

  const data = isSemanticSearchActive ? search.data : browse.data;
  const isLoading = isSemanticSearchActive ? search.isLoading : browse.isLoading;
  const rawPapers = (data?.papers ?? []) as (Paper & { score?: number })[];
  const meta = data?.meta;

  const { data: bookmarks } = useBookmarks();

  const bookmarkedPaperIds = useMemo(() => {
    if (!bookmarks) return new Set<string>();
    return new Set(bookmarks.filter(b => b.targetKind === "paper").map(b => b.targetId));
  }, [bookmarks]);

  const bookmarkIdMap = useMemo(() => {
    if (!bookmarks) return new Map<string, string>();
    return new Map(bookmarks.filter(b => b.targetKind === "paper").map(b => [b.targetId, b.id]));
  }, [bookmarks]);

  const filteredPapers = useMemo(() => {
    return rawPapers.filter(paper => {
      // 1. Year filter (applied client-side for keyword search)
      if (searchMode === "keyword") {
        const yFrom = yearFrom ? parseInt(yearFrom, 10) : null;
        const yTo = yearTo ? parseInt(yearTo, 10) : null;
        if (yFrom !== null && !isNaN(yFrom) && paper.publicationYear < yFrom) return false;
        if (yTo !== null && !isNaN(yTo) && paper.publicationYear > yTo) return false;
      }

      // 2. Open Access filter
      if (openAccessOnly && !paper.openAccessUrl) {
        return false;
      }

      // 3. Journal Type filter
      if (journalTypes.length > 0) {
        const kind = paper.paperKind || "other";
        if (!journalTypes.includes(kind)) return false;
      }

      // 4. Source (primaryProvider) filter
      if (primaryProvider !== "all") {
        if (paper.primaryProvider !== primaryProvider) return false;
      }

      // 5. AI Score Threshold (applied to semantic similarity score if available)
      if (searchMode === "semantic" && hasQuery) {
        const scoreVal = paper.score ?? 0;
        if (scoreVal < aiScoreThreshold) return false;
      }

      return true;
    });
  }, [rawPapers, searchMode, yearFrom, yearTo, openAccessOnly, journalTypes, primaryProvider, aiScoreThreshold, q, hasQuery]);

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => {
      prev.set("page", newPage.toString());
      return prev;
    });
  };

  const handleJournalTypeToggle = (type: string) => {
    setJournalTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

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
            <button 
              className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${searchMode === "semantic" ? "bg-blue-700 text-white shadow-sm" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium"}`}
              onClick={() => setSearchMode("semantic")}
            >
              Semantic
            </button>
            <button 
              className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${searchMode === "keyword" ? "bg-blue-700 text-white shadow-sm" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium"}`}
              onClick={() => setSearchMode("keyword")}
            >
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
            <input 
              type="text" 
              value={yearFrom} 
              onChange={(e) => setYearFrom(e.target.value)}
              placeholder="From"
              className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1e1e1e] text-center text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
            <span className="text-slate-400">-</span>
            <input 
              type="text" 
              value={yearTo} 
              onChange={(e) => setYearTo(e.target.value)}
              placeholder="To"
              className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1e1e1e] text-center text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
          </div>
        </div>

        {/* Open Access Only */}
        <div className="mb-6 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={openAccessOnly} 
              onChange={() => setOpenAccessOnly(!openAccessOnly)}
              className="sr-only"
            />
            <span className={`w-3.5 h-3.5 border rounded-sm flex items-center justify-center transition-colors ${openAccessOnly ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 dark:border-slate-750 bg-white dark:bg-[#1e1e1e]"}`}>
              {openAccessOnly && <Check className="w-2.5 h-2.5" />}
            </span>
            Open Access Only
          </label>
          {/* Custom toggle switch */}
          <div 
            onClick={() => setOpenAccessOnly(prev => !prev)}
            className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${openAccessOnly ? "bg-blue-700" : "bg-slate-200 dark:bg-slate-800"}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${openAccessOnly ? "right-0.5" : "left-0.5"}`}></div>
          </div>
        </div>

        {/* Journal Type */}
        <div className="mb-6">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-3 h-3 border border-current rounded-sm inline-block"></span> JOURNAL TYPE
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer select-none" onClick={() => handleJournalTypeToggle("proceedings")}>
              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${journalTypes.includes("proceedings") ? "bg-blue-700 border-blue-700 text-white" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1e1e1e]"}`}>
                {journalTypes.includes("proceedings") && <Check className="w-3 h-3" />}
              </div>
              <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Conference Proceedings</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none" onClick={() => handleJournalTypeToggle("article")}>
              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${journalTypes.includes("article") ? "bg-blue-700 border-blue-700 text-white" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1e1e1e]"}`}>
                {journalTypes.includes("article") && <Check className="w-3 h-3" />}
              </div>
              <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Journal Article</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none" onClick={() => handleJournalTypeToggle("preprint")}>
              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${journalTypes.includes("preprint") ? "bg-blue-700 border-blue-700 text-white" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1e1e1e]"}`}>
                {journalTypes.includes("preprint") && <Check className="w-3 h-3" />}
              </div>
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
            <select 
              value={primaryProvider}
              onChange={(e) => setPrimaryProvider(e.target.value)}
              className="w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1e1e1e] px-3 text-sm font-medium text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Sources</option>
              <option value="openalex">OpenAlex</option>
              <option value="crossref">Crossref</option>
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
            <span className="text-xs font-bold text-blue-700 dark:text-blue-500">
              {aiScoreThreshold.toFixed(2)}+
            </span>
          </div>
          <div className="relative pt-1 pb-4">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={Math.round(aiScoreThreshold * 100)} 
              onChange={(e) => setAiScoreThreshold(parseInt(e.target.value, 10) / 100)}
              disabled={searchMode !== "semantic" || !hasQuery}
              className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-700 disabled:opacity-50" 
            />
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isLoading ? "Searching..." : `${filteredPapers.length} papers found`}
            </h1>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs font-medium text-slate-500">Active:</span>
              {(yearFrom || yearTo) && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs font-medium animate-fadeIn animate-duration-150">
                  {yearFrom || "Min"} - {yearTo || "Max"}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500" 
                    onClick={() => { setYearFrom(""); setYearTo(""); }}
                  />
                </div>
              )}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs font-medium capitalize animate-fadeIn animate-duration-150">
                {searchMode} Mode
              </div>
              {openAccessOnly && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs font-medium animate-fadeIn animate-duration-150">
                  Open Access
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500" 
                    onClick={() => setOpenAccessOnly(false)}
                  />
                </div>
              )}
              {journalTypes.length > 0 && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs font-medium animate-fadeIn animate-duration-150">
                  Kinds: {journalTypes.join(", ")}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500" 
                    onClick={() => setJournalTypes([])}
                  />
                </div>
              )}
              {primaryProvider !== "all" && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs font-medium uppercase animate-fadeIn animate-duration-150">
                  Source: {primaryProvider}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500" 
                    onClick={() => setPrimaryProvider("all")}
                  />
                </div>
              )}
              <Button 
                variant="link" 
                className="text-blue-600 dark:text-blue-400 text-xs p-0 h-auto ml-2"
                onClick={() => {
                  setYearFrom("2020");
                  setYearTo("2026");
                  setSearchMode("semantic");
                  setOpenAccessOnly(false);
                  setJournalTypes(["article", "proceedings"]);
                  setPrimaryProvider("all");
                  setAiScoreThreshold(0.8);
                }}
              >
                Clear all
              </Button>
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
          {isLoading ? (
            <div className="py-8 text-center text-slate-500">Loading papers...</div>
          ) : filteredPapers.length === 0 ? (
            <div className="py-8 text-center text-slate-500">No papers found matching the filters.</div>
          ) : (
            filteredPapers.map(paper => (
              <SearchResultCard 
                key={paper.id}
                id={paper.id}
                title={paper.title}
                authors={
                  paper.authors.length > 3 
                    ? paper.authors.slice(0, 3).map(a => a.displayName).join(", ") + ` +${paper.authors.length - 3} more`
                    : paper.authors.map(a => a.displayName).join(", ")
                }
                journal={paper.journalName || "Unknown Journal"}
                doi={paper.externalIds?.doi || ""}
                abstract={paper.abstractText || "No abstract available."}
                score={paper.score?.toFixed(2) ?? "N/A"}
                keywords={paper.keywords?.map(k => k.keywordName) || []}
                isBookmarked={bookmarkedPaperIds.has(paper.id)}
                bookmarkId={bookmarkIdMap.get(paper.id)}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-10 mb-8">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 text-slate-500 rounded-md border-slate-200 dark:border-slate-800" 
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-600 dark:text-slate-400 mx-4">
              Page {page} of {meta.totalPages}
            </span>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 text-slate-500 rounded-md border-slate-200 dark:border-slate-800"
              disabled={page >= meta.totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

// Sub-components

function SearchResultCard({ 
  id, 
  title, 
  authors, 
  journal, 
  doi, 
  abstract, 
  score, 
  keywords,
  isBookmarked,
  bookmarkId
}: { 
  id: string, 
  title: string, 
  authors: string, 
  journal: string, 
  doi: string, 
  abstract: string, 
  score: string, 
  keywords: string[],
  isBookmarked: boolean,
  bookmarkId?: string
}) {
  const isHigh = parseFloat(score) >= 0.8;
  const badgeColors = isHigh 
    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
    : "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400";
  
  const createBookmark = useCreateBookmark();
  const deleteBookmark = useDeleteBookmark();

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isBookmarked && bookmarkId) {
      deleteBookmark.mutate(
        { id: bookmarkId, targetKind: "paper", targetId: id },
        {
          onSuccess: () => toast.success("Removed from library"),
          onError: () => toast.error("Failed to remove bookmark"),
        }
      );
    } else {
      createBookmark.mutate(
        { targetKind: "paper", targetId: id },
        {
          onSuccess: () => toast.success("Saved to library"),
          onError: () => toast.error("Failed to save bookmark"),
        }
      );
    }
  };

  return (
    <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative">
      {/* Title & Score */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <Link to={`/papers/${id}`} className="text-lg font-bold text-blue-900 dark:text-blue-100 leading-tight pr-16 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer block">
          {title}
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-full transition-colors ${
              isBookmarked
                ? "text-amber-500 hover:text-amber-600 bg-amber-500/10 hover:bg-amber-500/20"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            onClick={handleBookmarkToggle}
            disabled={createBookmark.isPending || deleteBookmark.isPending}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
          </Button>

          <div className={`flex flex-col items-center justify-center border rounded-lg px-2 py-1 shrink-0 ${badgeColors}`}>
            <span className="font-extrabold text-sm flex items-center leading-none">
               <span className="w-2.5 h-2.5 bg-current opacity-20 rounded-full inline-block mr-1"></span>
               {score}
            </span>
          </div>
        </div>
      </div>

      {/* Meta Info */}
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1 mb-4">
        <span className="text-slate-700 dark:text-slate-300 font-bold">{authors}</span>
        <span className="text-slate-300 dark:text-slate-600">•</span>
        <span>{journal}</span>
        {doi && (
          <>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <a href={`https://doi.org/${doi}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
              {doi} <ExternalLink className="w-3 h-3" />
            </a>
          </>
        )}
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
