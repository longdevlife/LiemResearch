import { useState, useMemo, useCallback, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  BookOpen,
  FileText,
  Lightbulb,
  Users,
  Compass,
  ArrowRight,
  TrendingUp,
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Bookmark,
  Sparkles,
  History,
  FolderKanban,
  RefreshCw,
  Plus,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  X,
  Check,
  ChevronLeft,
  Calendar,
  Unlock,
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/features/auth";
import { useHomeOverview } from "@/features/home/hooks/use-home-overview";
import { PaperCard } from "@/components/paper-card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { usePapers } from "@/features/papers";
import { useSearch } from "@/features/search";
import { useBookmarks } from "@/features/bookmarks";

const PAGE_SIZE = 10;

export function HomePage() {
  const navigate = useNavigate();
  const { data: me } = useCurrentUser();
  const { data: homeOverview, isLoading: isOverviewLoading, isError: isOverviewError } = useHomeOverview();
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  // Search Filter States
  const [searchMode, setSearchMode] = useState<"semantic" | "keyword">("semantic");
  const [yearFrom, setYearFrom] = useState<string>("2020");
  const [yearTo, setYearTo] = useState<string>("2026");
  const [openAccessOnly, setOpenAccessOnly] = useState<boolean>(false);
  const [journalTypes, setJournalTypes] = useState<string[]>([]);
  const [primaryProvider, setPrimaryProvider] = useState<string>("all");
  const [aiScoreThreshold, setAiScoreThreshold] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"relevance" | "date" | "citations">("relevance");
  const [rerank, setRerank] = useState<boolean>(false);

  // Dropdown states
  const [isOpenModeDropdown, setIsOpenModeDropdown] = useState<boolean>(false);
  const [isOpenMiniFilters, setIsOpenMiniFilters] = useState<boolean>(false);
  const [isOpenMiniType, setIsOpenMiniType] = useState<boolean>(false);
  const [isOpenMiniSource, setIsOpenMiniSource] = useState<boolean>(false);

  const [localSearchQuery, setLocalSearchQuery] = useState(q);

  useEffect(() => {
    const handleGlobalClick = () => {
      setIsOpenModeDropdown(false);
      setIsOpenMiniFilters(false);
      setIsOpenMiniType(false);
      setIsOpenMiniSource(false);
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  useEffect(() => {
    setLocalSearchQuery(q);
  }, [q]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(prev => {
      if (localSearchQuery.trim()) {
        prev.set("q", localSearchQuery.trim());
      } else {
        prev.delete("q");
      }
      prev.set("page", "1");
      return prev;
    });
  }, [localSearchQuery, setSearchParams]);

  const parsedYearFrom = yearFrom ? parseInt(yearFrom, 10) : undefined;
  const parsedYearTo = yearTo ? parseInt(yearTo, 10) : undefined;
  const hasQuery = q.trim().length > 0;
  const isSemanticSearchActive = searchMode === "semantic" && hasQuery;
  const beSort = sortBy === "date" ? "year" : sortBy;

  const filterParams = {
    yearFrom: (!isNaN(parsedYearFrom!) ? parsedYearFrom : undefined),
    yearTo: (!isNaN(parsedYearTo!) ? parsedYearTo : undefined),
    paperKind: journalTypes.length > 0 ? journalTypes : undefined,
    openAccess: openAccessOnly || undefined,
    provider: primaryProvider !== "all" ? primaryProvider : undefined,
    sort: beSort as "relevance" | "year" | "citations",
  };

  // Fetch lists
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
    rerank: isSemanticSearchActive ? rerank : undefined,
  });

  const searchData = isSemanticSearchActive ? search.data : browse.data;
  const isSearchLoading = isSemanticSearchActive ? search.isLoading : browse.isLoading;
  const papersResult = (searchData?.papers ?? []) as any[];
  const meta = searchData?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const { data: bookmarks } = useBookmarks();
  const bookmarkedPaperIds = useMemo(() => {
    if (!bookmarks) return new Set<string>();
    return new Set(bookmarks.filter(b => b.targetKind === "paper").map(b => b.targetId));
  }, [bookmarks]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (yearFrom !== "2020" || yearTo !== "2026") count += 1;
    if (openAccessOnly) count += 1;
    if (searchMode === "semantic" && aiScoreThreshold > 0) count += 1;
    return count;
  }, [yearFrom, yearTo, openAccessOnly, aiScoreThreshold, searchMode]);

  const yearlyDistribution = useMemo(() => {
    const map = new Map<number, number>();
    const from = parseInt(yearFrom, 10) || 2020;
    const to = parseInt(yearTo, 10) || 2026;
    for (let y = from; y <= to; y++) {
      map.set(y, 0);
    }
    papersResult.forEach(p => {
      if (p.publicationYear && p.publicationYear >= from && p.publicationYear <= to) {
        map.set(p.publicationYear, (map.get(p.publicationYear) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([year, count]) => ({ year: String(year), count }))
      .sort((a, b) => Number(a.year) - Number(b.year));
  }, [papersResult, yearFrom, yearTo]);

  const handlePageChange = useCallback((newPage: number) => {
    setSearchParams(prev => {
      prev.set("page", newPage.toString());
      return prev;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [setSearchParams]);

  const resetPage = useCallback(() => {
    setSearchParams(prev => {
      prev.set("page", "1");
      return prev;
    });
  }, [setSearchParams]);

  const handleClearAll = useCallback(() => {
    setYearFrom("2020");
    setYearTo("2026");
    setOpenAccessOnly(false);
    setJournalTypes([]);
    setPrimaryProvider("all");
    setAiScoreThreshold(0);
    setRerank(false);
    resetPage();
  }, [resetPage]);

  const handleJournalTypeToggle = (type: string) => {
    setJournalTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
    resetPage();
  };

  const renderSearchBox = () => {
    return (
      <div className="relative w-full">
        <form onSubmit={handleSearchSubmit} className="w-full bg-white dark:bg-[#121212] rounded-[20px] border border-slate-200 dark:border-slate-800 p-2 shadow-xs hover:shadow-sm focus-within:border-blue-500/40 transition-all flex flex-col gap-1.5">
          {/* Search Input */}
          <div className="flex-1 min-w-0 flex items-center px-3 py-1 gap-2.5">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder={
                searchMode === "semantic"
                  ? "Search research papers by concept, question or topic..."
                  : "Search papers by keywords in title or abstract..."
              }
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="w-full h-10 bg-transparent text-sm font-semibold text-slate-900 dark:text-white focus:outline-none placeholder-slate-450"
            />
            {localSearchQuery && (
              <button
                type="button"
                onClick={() => setLocalSearchQuery("")}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-650"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800/60 my-0.5"></div>

          {/* Row 2: Search Options */}
          <div className="flex items-center justify-between px-2 pt-0.5 pb-0.5 select-none">
            <div className="flex items-center gap-2 flex-wrap">
              {/* 1. Filters Dropdown Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpenMiniFilters(prev => !prev);
                    setIsOpenMiniType(false);
                    setIsOpenMiniSource(false);
                  }}
                  className={`h-8 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all border active:scale-95 ${
                    activeFiltersCount > 0
                      ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 font-extrabold shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 text-[10px] font-extrabold bg-blue-600 text-white rounded-full shrink-0">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {isOpenMiniFilters && (
                  <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-4 select-none" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">More Filters</span>
                      <button
                        type="button"
                        onClick={() => {
                          setYearFrom("2020");
                          setYearTo("2026");
                          setOpenAccessOnly(false);
                          setAiScoreThreshold(0);
                          resetPage();
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        Reset
                      </button>
                    </div>

                    {/* Publication Year range */}
                    <div className="mb-4">
                      <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block">
                        Publication Year
                      </label>
                      <div className="space-y-2.5">
                        <div>
                          <div className="flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-450 mb-0.5">
                            <span>From Year</span>
                            <span className="font-extrabold text-blue-700 dark:text-blue-400">{yearFrom}</span>
                          </div>
                          <input
                            type="range"
                            min="2020"
                            max="2026"
                            value={yearFrom}
                            onChange={(e) => {
                              const val = e.target.value;
                              setYearFrom(val);
                              if (parseInt(val) > parseInt(yearTo)) {
                                setYearTo(val);
                              }
                              resetPage();
                            }}
                            className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-700"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-450 mb-0.5">
                            <span>To Year</span>
                            <span className="font-extrabold text-blue-700 dark:text-blue-400">{yearTo}</span>
                          </div>
                          <input
                            type="range"
                            min="2020"
                            max="2026"
                            value={yearTo}
                            onChange={(e) => {
                              const val = e.target.value;
                              setYearTo(val);
                              if (parseInt(val) < parseInt(yearFrom)) {
                                setYearFrom(val);
                              }
                              resetPage();
                            }}
                            className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-700"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Open Access Toggle */}
                    <div
                      onClick={() => { setOpenAccessOnly(prev => !prev); resetPage(); }}
                      className="mb-4 flex items-center justify-between cursor-pointer select-none py-1.5 border-t border-slate-100 dark:border-slate-800"
                    >
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Open Access Only
                      </span>
                      <div className={`w-9 h-5 rounded-full relative transition-colors ${openAccessOnly ? "bg-blue-650" : "bg-slate-200 dark:bg-slate-800"}`}>
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-xs transition-transform duration-200 ${openAccessOnly ? "translate-x-4" : "translate-x-0"}`}></div>
                      </div>
                    </div>

                    {/* AI Score Threshold */}
                    {searchMode === "semantic" && (
                      <div className="mb-2 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                        <div className="flex justify-between text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                          <span>AI Score Threshold</span>
                          <span className="font-extrabold text-blue-700 dark:text-blue-400">{aiScoreThreshold.toFixed(2)}+</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={Math.round(aiScoreThreshold * 100)}
                          onChange={(e) => {
                            setAiScoreThreshold(parseInt(e.target.value, 10) / 100);
                            resetPage();
                          }}
                          className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-700"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Type Filter */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpenMiniType(prev => !prev);
                    setIsOpenMiniFilters(false);
                    setIsOpenMiniSource(false);
                  }}
                  className={`h-8 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all border active:scale-95 ${
                    journalTypes.length > 0
                      ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 font-extrabold shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Type{journalTypes.length > 0 ? `: ${journalTypes.length}` : ""}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {isOpenMiniType && (
                  <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2.5 select-none" onClick={(e) => e.stopPropagation()}>
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1 mb-1 block">
                      Journal Type
                    </div>
                    <div className="flex flex-col gap-2 p-1">
                      <label className="flex items-center gap-2 cursor-pointer" onClick={() => handleJournalTypeToggle("proceedings")}>
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${journalTypes.includes("proceedings") ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-700 bg-card"}`}>
                          {journalTypes.includes("proceedings") && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Conference Proceedings</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer" onClick={() => handleJournalTypeToggle("article")}>
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${journalTypes.includes("article") ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-700 bg-card"}`}>
                          {journalTypes.includes("article") && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Journal Article</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer" onClick={() => handleJournalTypeToggle("preprint")}>
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${journalTypes.includes("preprint") ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-700 bg-card"}`}>
                          {journalTypes.includes("preprint") && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Preprint</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Source Filter */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpenMiniSource(prev => !prev);
                    setIsOpenMiniFilters(false);
                    setIsOpenMiniType(false);
                  }}
                  className={`h-8 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all border active:scale-95 ${
                    primaryProvider !== "all"
                      ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 font-extrabold shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-slate-400" />
                  <span>Source{primaryProvider !== "all" ? `: ${primaryProvider === "openalex" ? "OpenAlex" : "Crossref"}` : ""}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {isOpenMiniSource && (
                  <div className="absolute left-0 mt-2 w-44 bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => { setPrimaryProvider("all"); resetPage(); setIsOpenMiniSource(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between"
                    >
                      <span>All Sources</span>
                      {primaryProvider === "all" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPrimaryProvider("openalex"); resetPage(); setIsOpenMiniSource(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between"
                    >
                      <span>OpenAlex</span>
                      {primaryProvider === "openalex" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPrimaryProvider("crossref"); resetPage(); setIsOpenMiniSource(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between"
                    >
                      <span>Crossref</span>
                      {primaryProvider === "crossref" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Semantic / Boolean select */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsOpenModeDropdown(prev => !prev); }}
                  className="h-8 px-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all border border-slate-200/60 dark:border-slate-850 active:scale-95 shadow-xs"
                >
                  {searchMode === "semantic" ? (
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
                  ) : (
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{searchMode === "semantic" ? "Semantic" : "Boolean"}</span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>
                {isOpenModeDropdown && (
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-1">
                    <button
                      type="button"
                      onClick={() => { setSearchMode("keyword"); setIsOpenModeDropdown(false); resetPage(); }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg flex flex-col gap-0.5"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>Boolean</span>
                        {searchMode === "keyword" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <span className="text-[10px] text-slate-400">Keyword search with operators</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSearchMode("semantic"); setIsOpenModeDropdown(false); resetPage(); }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg flex flex-col gap-0.5"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>Semantic</span>
                        {searchMode === "semantic" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <span className="text-[10px] text-slate-400">AI conceptual meaning search</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Rerank */}
              <button
                type="button"
                onClick={() => { if (searchMode === "semantic") { setRerank(prev => !prev); resetPage(); } }}
                className={`h-8 px-3.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 active:scale-95 ${
                  rerank && searchMode === "semantic"
                    ? "bg-purple-500/10 border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-400 font-extrabold shadow-xs"
                    : "bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-750"
                }`}
                disabled={searchMode !== "semantic"}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>AI Rerank</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  };

  if (isOverviewLoading) {
    return <HomeSkeleton />;
  }

  if (isOverviewError || !homeOverview) {
    return <HomeErrorFallback />;
  }

  // Giao diện khi có từ khóa tìm kiếm
  if (hasQuery) {
    return (
      <div className="w-full flex flex-col md:flex-row gap-8 items-start select-none pb-10">
        {/* Left Sidebar bộ lọc */}
        <aside className="w-full md:w-64 lg:w-72 shrink-0 bg-card rounded-xl border p-5 shadow-xs sticky top-20">
          <div className="mb-6 flex items-center justify-between border-b pb-2">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Filters</h2>
            </div>
            <button
              onClick={handleClearAll}
              className="text-[10px] font-bold text-blue-600 hover:underline"
            >
              Clear All
            </button>
          </div>

          {/* Publication Year distribution chart */}
          <div className="mb-6 space-y-4">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
              PUBLICATION YEAR
            </label>

            {yearlyDistribution.length > 0 && (
              <div className="h-12 w-full mb-3 opacity-90 hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={yearlyDistribution}
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                    onClick={(data) => {
                      if (data && data.activeLabel) {
                        const yr = data.activeLabel;
                        setYearFrom(yr);
                        setYearTo(yr);
                        resetPage();
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {yearlyDistribution.map((entry, index) => {
                        const isSelected = parseInt(entry.year) >= parseInt(yearFrom) && parseInt(entry.year) <= parseInt(yearTo);
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={isSelected ? "#2563EB" : "#E2E8F0"}
                            className="transition-colors duration-150"
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="space-y-3 pt-1 select-none">
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <span>From Year</span>
                  <span className="font-extrabold text-blue-700 dark:text-blue-400">{yearFrom}</span>
                </div>
                <input
                  type="range"
                  min="2020"
                  max="2026"
                  value={yearFrom}
                  onChange={(e) => {
                    const val = e.target.value;
                    setYearFrom(val);
                    if (parseInt(val) > parseInt(yearTo)) {
                      setYearTo(val);
                    }
                    resetPage();
                  }}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-700"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <span>To Year</span>
                  <span className="font-extrabold text-blue-700 dark:text-blue-400">{yearTo}</span>
                </div>
                <input
                  type="range"
                  min="2020"
                  max="2026"
                  value={yearTo}
                  onChange={(e) => {
                    const val = e.target.value;
                    setYearTo(val);
                    if (parseInt(val) < parseInt(yearFrom)) {
                      setYearFrom(val);
                    }
                    resetPage();
                  }}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-700"
                />
              </div>
            </div>
          </div>

          {/* Open Access toggle */}
          <div
            onClick={() => { setOpenAccessOnly(prev => !prev); resetPage(); }}
            className="mb-6 flex items-center justify-between cursor-pointer select-none border-t border-slate-100 dark:border-slate-800/60 pt-4"
          >
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Open Access Only
            </span>
            <div
              className={`w-9 h-5 rounded-full relative transition-colors ${openAccessOnly ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800"}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-xs transition-transform duration-200 ${openAccessOnly ? "translate-x-4" : "translate-x-0"}`}></div>
            </div>
          </div>

          {/* Journal Type checklist */}
          <div className="mb-6 border-t border-slate-100 dark:border-slate-800/60 pt-4">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 block">
              JOURNAL TYPE
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none text-xs" onClick={() => handleJournalTypeToggle("proceedings")}>
                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${journalTypes.includes("proceedings") ? "bg-blue-700 border-blue-700 text-white" : "border-slate-300 dark:border-slate-700 bg-card"}`}>
                  {journalTypes.includes("proceedings") && <Check className="w-3 h-3" />}
                </div>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Conference Proceedings</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer select-none text-xs" onClick={() => handleJournalTypeToggle("article")}>
                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${journalTypes.includes("article") ? "bg-blue-700 border-blue-700 text-white" : "border-slate-300 dark:border-slate-700 bg-card"}`}>
                  {journalTypes.includes("article") && <Check className="w-3 h-3" />}
                </div>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Journal Article</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer select-none text-xs" onClick={() => handleJournalTypeToggle("preprint")}>
                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${journalTypes.includes("preprint") ? "bg-blue-700 border-blue-700 text-white" : "border-slate-300 dark:border-slate-700 bg-card"}`}>
                  {journalTypes.includes("preprint") && <Check className="w-3 h-3" />}
                </div>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Preprint</span>
              </label>
            </div>
          </div>

          {/* AI Score Threshold */}
          <div className="mb-2 border-t border-slate-100 dark:border-slate-800/60 pt-4">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
              <span>AI Score Threshold</span>
              <span className="font-extrabold text-blue-700 dark:text-blue-400">{aiScoreThreshold.toFixed(2)}+</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(aiScoreThreshold * 100)}
              onChange={(e) => { setAiScoreThreshold(parseInt(e.target.value, 10) / 100); resetPage(); }}
              disabled={searchMode !== "semantic"}
              className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-700 disabled:opacity-50"
            />
          </div>
        </aside>

        {/* Right side: Results list */}
        <main className="flex-1 w-full min-w-0 space-y-6">
          {/* Integrated search box */}
          <div>{renderSearchBox()}</div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                {isSearchLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4.5 h-4.5 animate-spin text-blue-600" />
                    Searching...
                  </span>
                ) : (
                  `Results for "${q}"`
                )}
              </h1>
              {!isSearchLoading && meta && (
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Found {meta.total.toLocaleString()} papers • Page {page}/{totalPages}
                </p>
              )}
            </div>

            {/* Sort options */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value as any); resetPage(); }}
                className="h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-card px-2.5 font-bold text-slate-800 dark:text-white cursor-pointer focus:outline-none"
              >
                <option value="relevance">Relevance</option>
                <option value="date">Newest Date</option>
                <option value="citations">Most Citations</option>
              </select>
            </div>
          </div>

          {/* List items */}
          <div className="flex flex-col gap-4">
            {isSearchLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={`ske-r-${idx}`} className="space-y-2 border p-5 rounded-xl bg-card">
                  <Skeleton className="h-4 w-3/4 rounded-lg" />
                  <Skeleton className="h-3 w-1/2 rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              ))
            ) : papersResult.length === 0 ? (
              <div className="text-center py-20 border border-dashed rounded-xl bg-card text-slate-400 text-xs">
                No papers found matching your query filters.
              </div>
            ) : (
              papersResult.map((paper) => (
                <PaperCard
                  key={paper.id}
                  id={paper.id}
                  journal={paper.journalName || "Unknown Journal"}
                  date={paper.publicationDate ? new Date(paper.publicationDate).toLocaleDateString() : paper.publicationYear.toString()}
                  title={paper.title}
                  abstract={paper.abstractText || "No abstract available"}
                  authors={paper.authors?.map((a: any) => a.displayName).join(", ") || "Unknown Author"}
                  score={paper.dataQualityScore?.toFixed(2) || "N/A"}
                  isBookmarked={bookmarkedPaperIds.has(paper.id)}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {!isSearchLoading && totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="gap-1 rounded-lg text-xs"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </Button>
              <span className="text-xs text-slate-400 font-mono">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="gap-1 rounded-lg text-xs"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 select-none pb-10 animate-fadeIn duration-150">
      {/* 1. Header / Hero Section based on Mode */}
      {homeOverview.mode === "guest" ? (
        <GuestHero query={localSearchQuery} setQuery={setLocalSearchQuery} submitSearch={handleSearchSubmit} />
      ) : (
        <UserHero
          name={me?.user?.fullName || me?.user?.email || "Researcher"}
          query={localSearchQuery}
          setQuery={setLocalSearchQuery}
          submitSearch={handleSearchSubmit}
        />
      )}

      {/* 2. Admin Health summary (If Admin Mode) */}
      {homeOverview.mode === "admin" && homeOverview.admin && <AdminHealthSummary admin={homeOverview.admin} />}

      {/* 3. Primary Workspace snapshot cards for Logged-in Users */}
      {homeOverview.mode !== "guest" && homeOverview.workspace && (
        <WorkspaceSnapshot workspace={homeOverview.workspace} />
      )}

      {/* 4. Guest explanation Pipeline under Hero */}
      {homeOverview.mode === "guest" && <PipelineSection />}

      {/* 5. Capability cards for Guest */}
      {homeOverview.mode === "guest" && <CapabilityCards />}

      {/* 6. Dashboard grid for User / Admin */}
      {homeOverview.mode !== "guest" && homeOverview.workspace && (
        <WorkspaceDetailGrid workspace={homeOverview.workspace} />
      )}

      {/* 7. Live Research Signals */}
      <LiveSignalsSection trends={homeOverview.trends} recentPapers={homeOverview.recentPapers} />
    </div>
  );
}

// ==================== SUBCOMPONENTS ====================

// 1. Guest Hero Section
function GuestHero({
  query,
  setQuery,
  submitSearch,
}: {
  query: string;
  setQuery: (val: string) => void;
  submitSearch: (e: React.FormEvent) => void;
}) {
  return (
    <div className="text-center py-12 md:py-20 space-y-6 max-w-4xl mx-auto select-none">
      <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
        All the world's research,<br />
        <span className="bg-gradient-to-r from-blue-700 to-indigo-650 bg-clip-text text-transparent">connected and open.</span>
      </h1>
      <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
        Analyze millions of scholarly works, mapping concepts, citations, and emerging research directions in an open database.
      </p>

      {/* Central prominent search input */}
      <form onSubmit={submitSearch} className="max-w-2xl mx-auto relative flex items-center gap-2 px-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search research papers by concept, question or topic..."
            className="w-full pl-11 pr-4 h-12 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-ring bg-card font-semibold"
          />
        </div>
        <Button type="submit" size="lg" className="h-12 px-6 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold active:scale-[0.98] transition-transform duration-100 shadow-sm">
          Search
        </Button>
      </form>

      {/* CTA Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button variant="outline" size="sm" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card hover:bg-slate-50 dark:hover:bg-slate-900/50 font-bold h-10 px-5 transition-all animate-fadeIn" asChild>
          <Link to="/trends">Explore Trends</Link>
        </Button>
        <Button size="sm" className="rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold h-10 px-5 shadow-sm transition-all" asChild>
          <Link to="/reports?create=true">Generate Report</Link>
        </Button>
        <Button variant="ghost" size="sm" className="rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold h-10 px-4" asChild>
          <Link to="/login">Sign in <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
        </Button>
      </div>
    </div>
  );
}

// 2. Logged-in User Hero Section
function UserHero({
  name,
  query,
  setQuery,
  submitSearch,
}: {
  name: string;
  query: string;
  setQuery: (val: string) => void;
  submitSearch: (e: React.FormEvent) => void;
}) {
  return (
    <div className="py-6 border-b border-slate-100 dark:border-slate-900 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome back, {name}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Here is an overview of your research cockpit and system indicators today.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-lg text-xs font-bold border-slate-200 dark:border-slate-800 bg-card h-8" asChild>
            <Link to="/trends">Explore Trends</Link>
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg text-xs font-bold border-slate-200 dark:border-slate-800 bg-card h-8" asChild>
            <Link to="/research-gaps">Research Gaps</Link>
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg text-xs font-bold border-slate-200 dark:border-slate-800 bg-card h-8" asChild>
            <Link to="/projects">Projects</Link>
          </Button>
          <Button size="sm" className="rounded-lg text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white h-8" asChild>
            <Link to="/reports?create=true" className="flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Create Report</Link>
          </Button>
        </div>
      </div>

      {/* Hero central search */}
      <form onSubmit={submitSearch} className="max-w-2xl relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search normalized corpus instantly..."
            className="w-full pl-10 pr-4 h-10 rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-ring bg-card"
          />
        </div>
        <Button type="submit" size="sm" className="h-10 px-4 rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold active:scale-[0.98] transition-transform duration-100 shadow-xs">
          Search
        </Button>
      </form>
    </div>
  );
}

// 3. Workspace Snapshot Cards
function WorkspaceSnapshot({ workspace }: { workspace: any }) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KpiCard
        label="SAVED PAPERS"
        value={workspace.bookmarkCount.toLocaleString()}
        icon={Bookmark}
        onClick={() => navigate("/bookmarks")}
      />
      <KpiCard
        label="AI REPORTS"
        value={workspace.reportCount.toLocaleString()}
        icon={FileText}
        onClick={() => navigate("/reports")}
      />
      <KpiCard
        label="PROJECTS"
        value={workspace.projectCount.toLocaleString()}
        icon={FolderKanban}
        onClick={() => navigate("/projects")}
      />
      <KpiCard
        label="RECENT SEARCHES"
        value={workspace.recentSearches.length.toString()}
        icon={History}
        isNeutral
      />
    </div>
  );
}

// 4. Admin Mini Health Card
function AdminHealthSummary({ admin }: { admin: any }) {
  const reportsCount = (admin.reports?.queued || 0) + (admin.reports?.generating || 0);
  return (
    <div className="rounded-xl border border-dashed border-red-500/20 bg-red-500/5 dark:bg-red-950/5 p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-red-500/10 pb-2">
        <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          System Health indicators
        </h3>
        <Link to="/admin" className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline">
          Admin Dashboard ➔
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-500 block">Pending Requests:</span>
          <Link to="/admin/papers" className="text-sm font-bold text-slate-800 dark:text-white hover:underline mt-0.5 block">
            {admin.pendingPaperRequests} papers
          </Link>
        </div>

        <div>
          <span className="text-slate-500 block">Embedding Queue:</span>
          <Link to="/admin/sync" className="text-sm font-bold text-slate-800 dark:text-white hover:underline mt-0.5 block">
            {admin.embedding.pending} pending
          </Link>
        </div>

        <div>
          <span className="text-slate-500 block">Sync Pipeline:</span>
          <Link to="/admin/sync" className="text-sm font-bold mt-0.5 block">
            {admin.sync.running ? (
              <span className="text-amber-500 font-bold animate-pulse">Running</span>
            ) : admin.sync.latest?.status === "failed" ? (
              <span className="text-red-500 font-bold">Latest Failed</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Idle</span>
            )}
          </Link>
        </div>

        <div>
          <span className="text-slate-500 block">Active AI Jobs:</span>
          <Link to="/reports" className="text-sm font-bold text-slate-800 dark:text-white hover:underline mt-0.5 block">
            {reportsCount} reports
          </Link>
        </div>
      </div>
    </div>
  );
}

// 5. Pipeline explanation Section
function PipelineSection() {
  return (
    <div className="rounded-xl border bg-slate-50/50 dark:bg-slate-900/10 p-6 space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest">
          Academic Intel Pipeline
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          How raw academic metadata is transformed into actionable research insights.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch text-xs text-center">
        {/* Step 1 */}
        <div className="bg-card border rounded-lg p-4 flex flex-col justify-between shadow-xs">
          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center mx-auto mb-2">1</div>
            <h4 className="font-bold text-slate-800 dark:text-white">Corpus Sourcing</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              OpenAlex Live Index combined with manual PDF upload and custom team internal directories.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-card border rounded-lg p-4 flex flex-col justify-between shadow-xs">
          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center mx-auto mb-2">2</div>
            <h4 className="font-bold text-slate-800 dark:text-white">Vector Norm</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Metadata normalization, content-structure quality gate filtering, and 768-D dense vector embedding.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-card border rounded-lg p-4 flex flex-col justify-between shadow-xs">
          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center mx-auto mb-2">3</div>
            <h4 className="font-bold text-slate-800 dark:text-white">AI Analysis</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Vector retrieval semantic search, multi-axis trend charting, and algorithmic gap discovery.
            </p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-card border rounded-lg p-4 flex flex-col justify-between shadow-xs">
          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center mx-auto mb-2">4</div>
            <h4 className="font-bold text-blue-700 dark:text-blue-300">Evidence Direction</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              RAG synthesized reports, structured citation matrix, and conversational research project cockpit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 6. Capability Cards (6 blocks)
function CapabilityCards() {
  const capabilities = [
    {
      title: "Semantic Search",
      desc: "Go beyond keywords. Find papers via vector-dense embeddings mapped by neural understanding.",
      icon: Compass
    },
    {
      title: "Trend Intelligence",
      desc: "Visualize multi-year publication volumes, citation spikes, and topic comparison charts.",
      icon: TrendingUp
    },
    {
      title: "Research Gaps",
      desc: "Systematic algorithmic detection of underserved areas, discrepancies, and new research directions.",
      icon: Lightbulb
    },
    {
      title: "RAG Reports",
      desc: "Structured evidence-backed analytical documents generated directly on top of filtered corpora.",
      icon: FileText
    },
    {
      title: "Project Chat",
      desc: "Collaborate and query files in real-time inside structured workspaces with persistent memory.",
      icon: Users
    },
    {
      title: "Local AI via Ollama",
      desc: "Optional local model provider for project chat / lightweight local AI tasks when configured.",
      icon: Cpu,
      isDisclaimer: true
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest text-center">
        Platform Core Capabilities
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {capabilities.map((c) => (
          <div key={c.title} className="rounded-xl border bg-card p-5 shadow-xs flex flex-col justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <c.icon className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{c.title}</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {c.desc}
              </p>
            </div>
            {c.isDisclaimer && (
              <span className="text-[9px] font-mono text-slate-400 block border-t border-slate-100 dark:border-slate-800/60 pt-2">
                * Note: Gemini remains standard for heavy RAG report synthesis.
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 7. Workspace Detail Grid (Logged-in details)
function WorkspaceDetailGrid({ workspace }: { workspace: any }) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Col 1: Recent Searches */}
      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-slate-400" />
          Recent Searches
        </h3>
        {workspace.recentSearches.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No recent searches. Try querying the search box above.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
            {workspace.recentSearches.slice(0, 5).map((s: any, idx: number) => (
              <li
                key={`s-${idx}`}
                onClick={() => navigate(`/?q=${encodeURIComponent(s.query)}`)}
                className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/20 px-1 rounded-lg transition-all"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-white truncate" title={s.query}>
                    {s.query}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                  {s.resultCount} results
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Col 2: Latest Reports */}
      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          Latest Reports
        </h3>
        {workspace.latestReports.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 space-y-2">
            <p>No reports generated yet.</p>
            <Button variant="outline" size="sm" className="h-7 text-[10px]" asChild>
              <Link to="/reports?create=true">Generate First Report</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
            {workspace.latestReports.slice(0, 5).map((r: any) => (
              <li
                key={r.id}
                onClick={() => navigate(`/reports/${r.id}`)}
                className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/20 px-1 rounded-lg transition-all"
              >
                <div className="truncate pr-2">
                  <span className="font-semibold text-slate-850 dark:text-white truncate block" title={r.topic || r.query}>
                    {r.topic || r.query}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                  r.status === "ready" ? "bg-emerald-50 text-emerald-600 border border-emerald-200/20" :
                  r.status === "failed" ? "bg-red-50 text-red-600 border border-red-200/20" :
                  "bg-amber-50 text-amber-600 border border-amber-200/20 animate-pulse"
                }`}>
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Col 3: Latest Projects */}
      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
          Latest Projects
        </h3>
        {workspace.latestProjects.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 space-y-2">
            <p>No research projects created.</p>
            <Button variant="outline" size="sm" className="h-7 text-[10px]" asChild>
              <Link to="/projects">Create Project</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
            {workspace.latestProjects.slice(0, 5).map((p: any) => (
              <li
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/20 px-1 rounded-lg transition-all"
              >
                <div className="truncate pr-2">
                  <span className="font-semibold text-slate-850 dark:text-white truncate block" title={p.title}>
                    {p.title}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    Updated: {new Date(p.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                  {p.paperCount} papers
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// 8. Live Signals Section (Publication Velocity + Trending Topics + Rising Keywords)
function LiveSignalsSection({ trends, recentPapers }: { trends: any; recentPapers: any[] }) {
  const navigate = useNavigate();

  // Xử lý dữ liệu Velocity và gán YTD nếu cần
  const velocityData = (trends.yearlyTotalPapers || []).map((p: any) => ({
    name: p.year > trends.lastCompleteYear ? `${p.year} (YTD)` : p.year.toString(),
    value: p.count
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-slate-150 dark:border-slate-900 pt-8">
      {/* Main Column: Chart & Recent Papers */}
      <div className="lg:col-span-8 space-y-8">
        {/* Publication Velocity Chart */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest">
              Publication Velocity
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Annual volume of academic papers indexed within the current corpus scope.
            </p>
          </div>

          <div className="h-48 w-full text-xs">
            {velocityData.length === 0 ? (
              <div className="h-full flex items-center justify-center border border-dashed rounded-lg text-slate-400 text-xs">
                No yearly trend data yet. Sync more papers to populate this chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocityData} barSize={24}>
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Papers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest">
              Recent Indexed Papers
            </h3>
            <button
              onClick={() => {
                navigate(`/?q=`);
              }}
              className="text-xs font-bold text-blue-600 hover:underline p-0 h-auto bg-transparent border-none cursor-pointer"
            >
              Explore Library
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {recentPapers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                No recent papers found. Click "Explore Library" to run search.
              </div>
            ) : (
              recentPapers.map((paper) => (
                <PaperCard
                  key={paper.id}
                  id={paper.id}
                  journal={paper.journalName || "Unknown Journal"}
                  date={paper.publicationDate ? new Date(paper.publicationDate).toLocaleDateString() : paper.publicationYear.toString()}
                  title={paper.title}
                  abstract={paper.abstractText || "No abstract available"}
                  authors={paper.authors?.map((a: any) => a.displayName).join(", ") || "Unknown Author"}
                  score={paper.dataQualityScore?.toFixed(2) || "N/A"}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Column: Topics & Keywords */}
      <div className="lg:col-span-4 space-y-6">
        {/* Trending Topics */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
            Trending Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {trends.topics.length === 0 ? (
              <span className="text-xs text-slate-400">No trending topics.</span>
            ) : (
              trends.topics.slice(0, 6).map((topic: any, idx: number) => {
                const colors = [
                  "bg-blue-55 text-blue-600 border-blue-200/30",
                  "bg-emerald-50 text-emerald-600 border-emerald-200/30",
                  "bg-purple-50 text-purple-600 border-purple-200/30",
                  "bg-slate-50 text-slate-700 border-slate-200/30"
                ];
                const colorClass = colors[idx % colors.length];
                return (
                  <button
                    key={topic.topic}
                    onClick={() => navigate(`/trends/${encodeURIComponent(topic.topic)}`)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border hover:opacity-85 transition-all text-left ${colorClass}`}
                  >
                    {topic.topic}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Rising Keywords */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-slate-400" />
            Rising Keywords
          </h3>
          <ul className="space-y-2 text-xs">
            {trends.risingKeywords.length === 0 ? (
              <li className="text-slate-400">No rising keywords.</li>
            ) : (
              trends.risingKeywords.slice(0, 8).map((k: any, idx: number) => (
                <li
                  key={`k-${idx}`}
                  onClick={() => navigate(`/?q=${encodeURIComponent(k.keyword)}`)}
                  className="p-2 border rounded-lg hover:bg-slate-50/50 dark:hover:bg-slate-900/20 cursor-pointer transition-all space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800 dark:text-white">{k.keyword}</span>
                    <span className="text-[10px] font-bold text-emerald-600">+{Math.round(k.momentum * 100)}%</span>
                  </div>
                  {k.warning && (
                    <div className="flex items-center gap-1 text-[9px] text-amber-600 font-mono">
                      <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                      <span>{k.warning}</span>
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

// 9. Standard KPI Card Sub-component
function KpiCard({
  label,
  value,
  icon: Icon,
  isNeutral = false,
  onClick
}: {
  label: string;
  value: string;
  icon: any;
  isNeutral?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`rounded-xl border bg-card p-4 shadow-sm flex items-center justify-between transition-all select-none focus:outline-none focus:ring-1 focus:ring-ring ${
        onClick ? "cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/20" : ""
      }`}
    >
      <div className="space-y-1">
        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest block">
          {label}
        </span>
        <span className="text-2xl font-extrabold text-slate-900 dark:text-white block font-mono">
          {value}
        </span>
      </div>
      <div className={`p-2 rounded-xl border shrink-0 ${isNeutral ? "bg-slate-50/50 dark:bg-slate-900/20 border-slate-200/20" : "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/20"}`}>
        <Icon className={`w-4 h-4 ${isNeutral ? "text-slate-400" : "text-blue-600"}`} />
      </div>
    </div>
  );
}

// 10. Home Skeletons (Loading state)
function HomeSkeleton() {
  return (
    <div className="w-full space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-4 w-96 rounded-lg" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={`ske-k-${idx}`} className="h-20 w-full rounded-xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Skeleton key={`ske-col-${idx}`} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// 11. Home Error Fallback View
function HomeErrorFallback() {
  return (
    <div className="w-full max-w-md mx-auto py-16 text-center space-y-4">
      <AlertTriangle className="mx-auto h-12 w-12 text-red-500/80" />
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Failed to load overview</h3>
      <p className="text-xs text-slate-550 dark:text-slate-400 max-w-[36ch] mx-auto leading-relaxed">
        Home overview failed to load. You can still search papers or explore trends.
      </p>
      <div className="flex items-center justify-center gap-3 pt-2">
        <Button variant="outline" size="sm" asChild>
          <Link to="/search">Search Papers</Link>
        </Button>
        <Button size="sm" asChild>
          <Link to="/trends">Explore Trends</Link>
        </Button>
      </div>
    </div>
  );
}
