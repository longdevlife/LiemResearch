import { useState, useMemo, useCallback } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Check, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Paper, SearchSortKey } from "@trend/shared-types";

type FeSortKey = "relevance" | "date" | "citations";
import { usePapers } from "@/features/papers";
import { useSearch } from "@/features/search";
import { useSearchParams, Link } from "react-router-dom";
import { useBookmarks } from "@/features/bookmarks";
import { PaperCard } from "@/components/paper-card";

const PAGE_SIZE = 10;

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
  const [aiScoreThreshold, setAiScoreThreshold] = useState<number>(0);
  const [sortBy, setSortBy] = useState<FeSortKey>("relevance");

  const parsedYearFrom = yearFrom ? parseInt(yearFrom, 10) : undefined;
  const parsedYearTo = yearTo ? parseInt(yearTo, 10) : undefined;
  const hasQuery = q.trim().length > 0;

  const isSemanticSearchActive = searchMode === "semantic" && hasQuery;

  // Map FE sort key → BE sort key
  const beSort: SearchSortKey = sortBy === "date" ? "year" : sortBy as SearchSortKey;

  // Server-side filter params shared between both endpoints.
  const filterParams = {
    yearFrom: (!isNaN(parsedYearFrom!) ? parsedYearFrom : undefined) as number | undefined,
    yearTo: (!isNaN(parsedYearTo!) ? parsedYearTo : undefined) as number | undefined,
    paperKind: journalTypes.length > 0 ? journalTypes : undefined,
    openAccess: openAccessOnly || undefined,
    provider: primaryProvider !== "all" ? primaryProvider : undefined,
    sort: beSort,
  };

  // Server-side pagination + filters. No more POOL_SIZE or client slicing.
  const browse = usePapers({
    page,
    pageSize: PAGE_SIZE,
    q: searchMode === "keyword" ? q : undefined,
    ...filterParams,
  });

  const search = useSearch({
    q,
    page,
    pageSize: PAGE_SIZE,
    ...filterParams,
    minScore: aiScoreThreshold > 0 ? aiScoreThreshold : undefined,
  });

  const data = isSemanticSearchActive ? search.data : browse.data;
  const isLoading = isSemanticSearchActive ? search.isLoading : browse.isLoading;
  const papers = (data?.papers ?? []) as (Paper & { score?: number })[];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const safePage = Math.min(Math.max(1, page), totalPages);

  const { data: bookmarks } = useBookmarks();

  const bookmarkedPaperIds = useMemo(() => {
    if (!bookmarks) return new Set<string>();
    return new Set(bookmarks.filter(b => b.targetKind === "paper").map(b => b.targetId));
  }, [bookmarks]);

  const bookmarkIdMap = useMemo(() => {
    if (!bookmarks) return new Map<string, string>();
    return new Map(bookmarks.filter(b => b.targetKind === "paper").map(b => [b.targetId, b.id]));
  }, [bookmarks]);

  const handlePageChange = useCallback((newPage: number) => {
    setSearchParams(prev => {
      prev.set("page", newPage.toString());
      return prev;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [setSearchParams]);

  /** Reset page to 1 whenever a filter changes. */
  const resetPage = useCallback(() => {
    setSearchParams(prev => {
      prev.set("page", "1");
      return prev;
    });
  }, [setSearchParams]);

  const handleJournalTypeToggle = (type: string) => {
    setJournalTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
    resetPage();
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-8 items-start">
      {/* LEFT SIDEBAR: Filters */}
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
              onClick={() => { setSearchMode("semantic"); resetPage(); }}
            >
              Semantic
            </button>
            <button
              className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${searchMode === "keyword" ? "bg-blue-700 text-white shadow-sm" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium"}`}
              onClick={() => { setSearchMode("keyword"); resetPage(); }}
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
              onChange={(e) => { setYearFrom(e.target.value); resetPage(); }}
              placeholder="From"
              className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1e1e1e] text-center text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-slate-400">-</span>
            <input
              type="text"
              value={yearTo}
              onChange={(e) => { setYearTo(e.target.value); resetPage(); }}
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
              onChange={() => { setOpenAccessOnly(!openAccessOnly); resetPage(); }}
              className="sr-only"
            />
            <span className={`w-3.5 h-3.5 border rounded-sm flex items-center justify-center transition-colors ${openAccessOnly ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 dark:border-slate-750 bg-white dark:bg-[#1e1e1e]"}`}>
              {openAccessOnly && <Check className="w-2.5 h-2.5" />}
            </span>
            Open Access Only
          </label>
          {/* Custom toggle switch */}
          <div
            onClick={() => { setOpenAccessOnly(prev => !prev); resetPage(); }}
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
              onChange={(e) => { setPrimaryProvider(e.target.value); resetPage(); }}
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
              onChange={(e) => { setAiScoreThreshold(parseInt(e.target.value, 10) / 100); resetPage(); }}
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

      {/* MAIN CONTENT: Search Results */}
      <main className="flex-1 w-full min-w-0">

        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isLoading ? "Searching..." : hasQuery ? `Results for "${q}"` : "Browse papers"}
            </h1>
            {!isLoading && meta && (
              <p className="text-sm text-slate-500 mt-1">
                Showing {papers.length > 0 ? ((safePage - 1) * PAGE_SIZE) + 1 : 0}–{Math.min(safePage * PAGE_SIZE, meta.total)} of {meta.total}{isSemanticSearchActive ? " top matches" : " papers"}
              </p>
            )}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs font-medium text-slate-500">Active:</span>
              {(yearFrom || yearTo) && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs font-medium animate-fadeIn animate-duration-150">
                  {yearFrom || "Min"} - {yearTo || "Max"}
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500"
                    onClick={() => { setYearFrom(""); setYearTo(""); resetPage(); }}
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
                    onClick={() => { setOpenAccessOnly(false); resetPage(); }}
                  />
                </div>
              )}
              {journalTypes.length > 0 && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs font-medium animate-fadeIn animate-duration-150">
                  Kinds: {journalTypes.join(", ")}
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500"
                    onClick={() => { setJournalTypes([]); resetPage(); }}
                  />
                </div>
              )}
              {primaryProvider !== "all" && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs font-medium uppercase animate-fadeIn animate-duration-150">
                  Source: {primaryProvider}
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500"
                    onClick={() => { setPrimaryProvider("all"); resetPage(); }}
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
                  setAiScoreThreshold(0);
                  setSortBy("relevance");
                  resetPage();
                }}
              >
                Clear all
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Link to="/settings/submit-paper">
              <Button size="sm" className="h-8 bg-blue-700 hover:bg-blue-800 text-white font-bold gap-1.5 rounded-lg px-3 shadow-sm transition-all active:scale-95 duration-150">
                <Plus className="w-3.5 h-3.5" />
                Contribute Paper
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Sort by:</span>
              <div className="relative z-0">
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value as FeSortKey); resetPage(); }}
                  className="h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1e1e1e] pl-3 pr-8 text-xs font-medium text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="relevance">Relevance (AI Score)</option>
                  <option value="date">Date (Newest)</option>
                  <option value="citations">Citations</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-8 text-center text-slate-500">Loading papers...</div>
          ) : papers.length === 0 ? (
            <div className="py-8 text-center text-slate-500">No papers found matching the filters.</div>
          ) : (
            papers.map(paper => (
              <PaperCard
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
                showBookmark={true}
              />
            ))
          )}
        </div>

        {/* Pagination — server-side */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-10 mb-8">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-slate-500 rounded-md border-slate-200 dark:border-slate-800"
              disabled={safePage <= 1}
              onClick={() => handlePageChange(safePage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-600 dark:text-slate-400 mx-4">
              Page {safePage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-slate-500 rounded-md border-slate-200 dark:border-slate-800"
              disabled={safePage >= totalPages}
              onClick={() => handlePageChange(safePage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
