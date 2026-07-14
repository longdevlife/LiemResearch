import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Zap, 
  Plus, 
  Sparkles, 
  BookOpen, 
  AlertTriangle, 
  Info, 
  Database,
  Search,
  ExternalLink,
  Globe
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  useReports, 
  useCreateReport, 
  useDeleteReport, 
  useDeleteBatchReports, 
  useReportEvidencePreview 
} from "@/features/reports/hooks/use-reports";
import { toast } from "sonner";
import type { PreviewReportEvidenceResponse, ReportLanguage } from "@trend/shared-types";
import { searchApi, type ScoredPaper } from "@/features/search";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

export function ReportsListPage() {
  const { data: reports, isLoading } = useReports();
  const createReport = useCreateReport();
  const deleteReport = useDeleteReport();
  const deleteBatchReports = useDeleteBatchReports();
  const previewEvidence = useReportEvidencePreview();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | 'ALL' | null>(null);
  const [topic, setTopic] = useState("");
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<ReportLanguage>("auto");
  const [yearFrom, setYearFrom] = useState<string>("");
  const [yearTo, setYearTo] = useState<string>("");
  const [deepAnalysis, setDeepAnalysis] = useState(false);
  const [fast, setFast] = useState(true);
  
  // New States for Evidence Review Step
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<PreviewReportEvidenceResponse | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [collapsedAbstracts, setCollapsedAbstracts] = useState<Record<string, boolean>>({});
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [paperPickerOpen, setPaperPickerOpen] = useState(false);
  const [paperSearchQuery, setPaperSearchQuery] = useState("");
  const [paperSearchResults, setPaperSearchResults] = useState<ScoredPaper[]>([]);
  const [paperSearchLoading, setPaperSearchLoading] = useState(false);
  const [paperSearchError, setPaperSearchError] = useState<string | null>(null);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentEvidencePaperIds = previewData?.papers.map((paper) => paper.id) ?? [];
  const currentYear = new Date().getFullYear();
  const reasoningMode = deepAnalysis ? "deep" : fast ? "fast" : "balanced";
  const canPreviewEvidence = query.trim().length >= 3 && !previewEvidence.isPending;

  React.useEffect(() => {
    const isCreate = searchParams.get("create") === "true" || searchParams.has("topic");
    if (isCreate) {
      const urlTopic = searchParams.get("topic") || "";
      const urlQuery = searchParams.get("query") || searchParams.get("q") || "";
      const urlPaperId = searchParams.get("paperId") || "";

      if (urlTopic) setTopic(urlTopic);
      if (urlQuery) setQuery(urlQuery);
      if (urlPaperId) {
        setSelectedPaperIds([urlPaperId]);
        toast.info("Paper pre-selected from context", {
          description: `ID: ${urlPaperId}`
        });
      }

      // Clear URL params
      setSearchParams(prev => {
        prev.delete("create");
        prev.delete("topic");
        prev.delete("query");
        prev.delete("q");
        prev.delete("paperId");
        return prev;
      });
    }
  }, [searchParams, setSearchParams]);

  const handleDeleteAll = () => {
    if (!reports || reports.length === 0) return;
    setItemToDelete('ALL');
    setDeleteModalOpen(true);
  };

  const handleDeleteSingle = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const setReasoningMode = (mode: "fast" | "balanced" | "deep") => {
    if (mode === "fast") {
      setFast(true);
      setDeepAnalysis(false);
      return;
    }
    if (mode === "deep") {
      setFast(false);
      setDeepAnalysis(true);
      return;
    }
    setFast(false);
    setDeepAnalysis(false);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete === 'ALL') {
        if (!reports) return;
        await deleteBatchReports.mutateAsync(reports.map(r => r.id));
        toast.success("All reports deleted successfully");
      } else {
        await deleteReport.mutateAsync(itemToDelete);
        toast.success("Report deleted successfully");
      }
    } catch (error) {
      toast.error("Failed to delete report(s)");
    } finally {
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  // Step 2: Clicks "Preview evidence"
  const handlePreviewEvidence = async () => {
    if (!query.trim()) {
      toast.error("Please enter a question for the AI to analyze");
      return;
    }

    const fromYear = yearFrom ? parseInt(yearFrom, 10) : undefined;
    const toYear = yearTo ? parseInt(yearTo, 10) : undefined;

    if (fromYear && toYear && fromYear > toYear) {
      toast.error("Year From must be less than or equal to Year To");
      return;
    }

    setPreviewError(null);

    try {
      const response = await previewEvidence.mutateAsync({
        query: query.trim(),
        topic: topic.trim() || undefined,
        language: language === "auto" ? "auto" : language,
        yearFrom: fromYear,
        yearTo: toYear,
        selectedPaperIds: selectedPaperIds.length > 0 ? selectedPaperIds : undefined,
      });

      setPreviewData(response);
      setSelectedPaperIds(response.selectedPaperIds);
      setShowPreview(true);
      toast.success("Evidence pack loaded! Review papers below.");
    } catch (error: any) {
      console.error("Failed to preview evidence:", error);
      const errMsg = error?.response?.data?.error?.message ?? "Could not retrieve evidence pack from server.";
      setPreviewError(errMsg);
      toast.error(errMsg);
    }
  };

  // Step 4: User can remove retrieved/selected papers
  const handleRemovePaper = (paperId: string) => {
    if (!previewData) return;
    
    const updatedPapers = previewData.papers.filter(p => p.id !== paperId);
    const updatedSelectedIds = selectedPaperIds.filter(id => id !== paperId);

    setPreviewData({
      ...previewData,
      papers: updatedPapers,
      selectedPaperIds: updatedSelectedIds,
    });
    setSelectedPaperIds(updatedSelectedIds);
    toast.info("Paper removed from evidence pack.");
  };

  const handleOpenPaperPicker = () => {
    setPaperPickerOpen(true);
    setPaperSearchError(null);
    if (!paperSearchQuery.trim()) {
      setPaperSearchQuery(topic.trim() || query.trim());
    }
  };

  const handleSearchPapers = async () => {
    const searchText = paperSearchQuery.trim();
    if (searchText.length < 2) {
      setPaperSearchError("Enter at least 2 characters to search papers.");
      return;
    }

    const fromYear = yearFrom ? parseInt(yearFrom, 10) : undefined;
    const toYear = yearTo ? parseInt(yearTo, 10) : undefined;

    setPaperSearchLoading(true);
    setPaperSearchError(null);
    try {
      const response = await searchApi.semantic({
        q: searchText,
        page: 1,
        pageSize: 8,
        yearFrom: fromYear,
        yearTo: toYear,
        rerank: false,
      });
      setPaperSearchResults(response.papers);
    } catch (error: any) {
      const errMsg = error?.response?.data?.error?.message ?? "Could not search papers.";
      setPaperSearchError(errMsg);
    } finally {
      setPaperSearchLoading(false);
    }
  };

  // Step 5: User can add papers from corpus search.
  const handleAddPaperFromSearch = async (paperId: string) => {
    if (!previewData) return;
    if (currentEvidencePaperIds.includes(paperId)) {
      toast.warning("This paper is already in the evidence pack.");
      return;
    }
    if (currentEvidencePaperIds.length >= previewData.maxEvidencePapers) {
      toast.warning(`Evidence pack is full. Remove a paper before adding another one.`);
      return;
    }

    const fromYear = yearFrom ? parseInt(yearFrom, 10) : undefined;
    const toYear = yearTo ? parseInt(yearTo, 10) : undefined;
    const newSelectedIds = [...currentEvidencePaperIds, paperId];

    try {
      toast.loading("Adding paper to evidence pack...", { id: "add-paper" });
      const response = await previewEvidence.mutateAsync({
        query: query.trim(),
        topic: topic.trim() || undefined,
        language: language === "auto" ? "auto" : language,
        yearFrom: fromYear,
        yearTo: toYear,
        selectedPaperIds: newSelectedIds,
        fillWithRetrieved: false,
      });

      setPreviewData(response);
      setSelectedPaperIds(response.selectedPaperIds);
      toast.dismiss("add-paper");
      toast.success("Paper added to evidence pack.");
    } catch (error: any) {
      toast.dismiss("add-paper");
      const errMsg = error?.response?.data?.error?.message ?? "Failed to add paper.";
      toast.error(errMsg);
    }
  };

  // Step 6: Create report sends selectedPaperIds
  const handleGenerate = async (forceNoPreview = false) => {
    if (!query.trim()) {
      toast.error("Please enter a question");
      return;
    }

    const fromYear = yearFrom ? parseInt(yearFrom, 10) : undefined;
    const toYear = yearTo ? parseInt(yearTo, 10) : undefined;

    try {
      await createReport.mutateAsync({
        query: query.trim(),
        topic: topic.trim() || undefined,
        language,
        deepAnalysis,
        fast,
        yearFrom: fromYear,
        yearTo: toYear,
        selectedPaperIds: forceNoPreview
          ? undefined
          : currentEvidencePaperIds.length > 0
            ? currentEvidencePaperIds
            : undefined,
      });

      setTopic("");
      setQuery("");
      setYearFrom("");
      setYearTo("");
      setLanguage("auto");
      setDeepAnalysis(false);
      setFast(true);
      
      // Reset preview states
      setPreviewData(null);
      setSelectedPaperIds([]);
      setShowPreview(false);
      
      toast.success("Report generation started!");
    } catch (error) {
      console.error("Failed to create report:", error);
      toast.error("Failed to create report. Please try again.");
    }
  };

  const toggleAbstract = (paperId: string) => {
    setCollapsedAbstracts(prev => ({
      ...prev,
      [paperId]: !prev[paperId]
    }));
  };

  return (
    <main className="container py-12 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Anti-Center Bias: Left-aligned Hero Section */}
      <section className="mb-12 flex flex-col md:flex-row gap-12 items-start justify-between">
        <div className="flex-1 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-4 h-4" /> AI Research Assistant
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-6">
            Generate deep analytical reports from thousands of papers.
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-[55ch]">
            Ask a complex research question. Review the evidence pack, add or remove papers, and synthesize findings into a comprehensive report.
          </p>
        </div>
      </section>

      {/* Inline Generation Form */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm mb-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              <Plus className="h-4 w-4" />
              New grounded report
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Define the question, then review the evidence before generation.
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Reports are generated from a fixed evidence pack, so every citation maps back to a paper you can inspect.
            </p>
          </div>
          <div className="grid min-w-[260px] grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-bold dark:border-slate-800 dark:bg-slate-900/60">
            <div className={cn(
              "rounded-lg px-3 py-2 transition-colors",
              showPreview && previewData
                ? "text-slate-500 dark:text-slate-400"
                : "bg-white text-blue-700 shadow-sm dark:bg-slate-950 dark:text-blue-300"
            )}>
              Step 1
              <span className="block text-[10px] font-semibold text-slate-500">Setup</span>
            </div>
            <div className={cn(
              "rounded-lg px-3 py-2 transition-colors",
              showPreview && previewData
                ? "bg-white text-blue-700 shadow-sm dark:bg-slate-950 dark:text-blue-300"
                : "text-slate-500 dark:text-slate-400"
            )}>
              Step 2
              <span className="block text-[10px] font-semibold text-slate-500">Evidence</span>
            </div>
          </div>
        </div>

        <div className="space-y-7">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label htmlFor="topic" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Topic / Keyword</label>
              <input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Federated Learning in Medical Imaging"
                className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="query" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Research Question <span className="text-red-500">*</span></label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. What evidence shows clinical impact, limitations, and future directions?"
                rows={1}
                className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none overflow-hidden"
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Be specific. The retrieval step uses this question to choose evidence papers.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Report setup</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  These controls affect retrieval, output language, and model route.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTopic("");
                  setQuery("");
                  setYearFrom("");
                  setYearTo("");
                  setLanguage("auto");
                  setReasoningMode("fast");
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:hover:bg-slate-900 dark:hover:text-white"
              >
                Reset setup
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Output Language</span>
                <div className="flex rounded-xl bg-slate-100/80 dark:bg-slate-900/60 p-1 border border-slate-200/50 dark:border-slate-800/40 w-full">
                  <button
                    type="button"
                    onClick={() => setLanguage("auto")}
                    className={cn(
                      "flex-1 h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                      language === "auto"
                        ? "bg-white dark:bg-slate-950 shadow-sm text-blue-600 dark:text-blue-400 font-bold border border-slate-200/30 dark:border-slate-800/20"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={cn(
                      "flex-1 h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                      language === "en"
                        ? "bg-white dark:bg-slate-950 shadow-sm text-blue-600 dark:text-blue-400 font-bold border border-slate-200/30 dark:border-slate-800/20"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
                    )}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("vi")}
                    className={cn(
                      "flex-1 h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                      language === "vi"
                        ? "bg-white dark:bg-slate-950 shadow-sm text-blue-600 dark:text-blue-400 font-bold border border-slate-200/30 dark:border-slate-800/20"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
                    )}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Tiếng Việt
                  </button>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Auto detects from the topic and research question.
                </p>
              </div>
              
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Publication Year Range</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    id="year-from"
                    type="number"
                    value={yearFrom}
                    onChange={(e) => setYearFrom(e.target.value)}
                    placeholder="From: 2020"
                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                  />
                  <input
                    id="year-to"
                    type="number"
                    value={yearTo}
                    onChange={(e) => setYearTo(e.target.value)}
                    placeholder={`To: ${currentYear}`}
                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="flex gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => { setYearFrom(""); setYearTo(""); }}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer",
                      (!yearFrom && !yearTo)
                        ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900"
                        : "bg-transparent text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    All Time
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setYearFrom((currentYear - 3).toString());
                      setYearTo(currentYear.toString());
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer",
                      (yearFrom === (currentYear - 3).toString() && yearTo === currentYear.toString())
                        ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900"
                        : "bg-transparent text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    Last 3 Years
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setYearFrom((currentYear - 5).toString());
                      setYearTo(currentYear.toString());
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer",
                      (yearFrom === (currentYear - 5).toString() && yearTo === currentYear.toString())
                        ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900"
                        : "bg-transparent text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    Last 5 Years
                  </button>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {currentYear} is treated as year-to-date when charts or trend metrics use this range.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Reasoning Profile</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReasoningMode("fast")}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all cursor-pointer",
                      reasoningMode === "fast"
                        ? "border-blue-500 bg-blue-50 text-blue-900 shadow-sm dark:bg-blue-950/20 dark:text-blue-100"
                        : "border-slate-200 dark:border-slate-800 bg-transparent text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    )}
                  >
                    <Zap className="mb-2 h-4 w-4" />
                    <span className="block text-[11px] font-extrabold">Fast</span>
                    <span className="mt-1 block text-[10px] leading-snug opacity-70">Quick draft</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReasoningMode("balanced")}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all cursor-pointer",
                      reasoningMode === "balanced"
                        ? "border-blue-500 bg-blue-50 text-blue-900 shadow-sm dark:bg-blue-950/20 dark:text-blue-100"
                        : "border-slate-200 dark:border-slate-800 bg-transparent text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    )}
                  >
                    <Database className="mb-2 h-4 w-4" />
                    <span className="block text-[11px] font-extrabold">Balanced</span>
                    <span className="mt-1 block text-[10px] leading-snug opacity-70">Best default</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReasoningMode("deep")}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all cursor-pointer",
                      reasoningMode === "deep"
                        ? "border-blue-500 bg-blue-50 text-blue-900 shadow-sm dark:bg-blue-950/20 dark:text-blue-100"
                        : "border-slate-200 dark:border-slate-800 bg-transparent text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    )}
                  >
                    <Search className="mb-2 h-4 w-4" />
                    <span className="block text-[11px] font-extrabold">Deep</span>
                    <span className="mt-1 block text-[10px] leading-snug opacity-70">Slowest</span>
                  </button>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Balanced uses the standard report path. Deep enables multi-step analysis.
                </p>
              </div>
            </div>
          </div>

          {/* Action Footer Bar */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3 text-sm text-slate-500 dark:text-slate-400">
              <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Next: review the evidence pack</p>
                <p className="mt-1 max-w-xl text-xs leading-relaxed">
                  {showPreview && previewData
                    ? "Evidence is loaded below. Refresh if you changed the setup, or generate once the pack looks right."
                    : "We retrieve candidate papers first. You can remove weak papers or add your own before the AI writes."}
                </p>
              </div>
            </div>

            <Button 
              onClick={handlePreviewEvidence} 
              disabled={!canPreviewEvidence}
              className="h-12 rounded-xl bg-blue-600 px-6 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 dark:disabled:bg-blue-900/40"
            >
              {previewEvidence.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {showPreview && previewData ? "Refresh Evidence Pack" : "Review Evidence Pack"}
            </Button>
          </div>

          {/* Loading Skeleton during preview fetch */}
          {previewEvidence.isPending && (
            <div className="space-y-6 border-t border-slate-100 pt-7 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-5 w-48 rounded" />
                  <Skeleton className="mt-2 h-3 w-80 max-w-full rounded" />
                </div>
                <Skeleton className="h-7 w-32 rounded-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            </div>
          )}

          {/* Preview Error State with Fallback option */}
          {previewError && (
            <div className="border-t border-slate-100 pt-7 dark:border-slate-800/60">
              <div className="space-y-4 rounded-2xl border border-red-200 bg-red-500/5 p-5 text-red-950 dark:border-red-900/50 dark:text-red-200">
                <div className="flex gap-2">
                  <XCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                  <div>
                    <span className="block font-bold">Failed to generate evidence preview</span>
                    <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{previewError}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-red-300 text-xs text-red-700 hover:bg-red-500/10 dark:border-red-900"
                    onClick={handlePreviewEvidence}
                  >
                    Retry Preview
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-lg bg-red-600 text-xs font-bold text-white hover:bg-red-700"
                    onClick={() => handleGenerate(true)}
                    disabled={createReport.isPending}
                  >
                    {createReport.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Zap className="mr-1.5 h-3.5 w-3.5" />}
                    Skip Preview & Generate Report
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Evidence Pack UI */}
          {showPreview && previewData && (
            <div className="space-y-6 border-t border-slate-100 pt-7 dark:border-slate-800/60">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 dark:border-slate-800 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Step 2 of 2
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Review the evidence pack
                  </h2>
                  <p className="max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    This ordered set becomes the citation source for the report. Remove weak papers or add missing required studies before generation.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-full border bg-slate-50 px-3 py-1 text-xs font-semibold dark:bg-slate-900/60">
                    {previewData.papers.length} / {previewData.maxEvidencePapers} Papers
                  </Badge>
                  <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase text-blue-700 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-400">
                    {language === "auto" ? "Auto language" : language === "en" ? "English" : "Vietnamese"}
                  </Badge>
                  <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400">
                    {reasoningMode}
                  </Badge>
                </div>
              </div>

          {/* Warnings Banner */}
          {(previewData.papers.length < 3 || previewData.warnings.length > 0) && (
            <div className="space-y-2">
              {previewData.papers.length < 3 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 rounded-xl text-xs flex gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span><strong>Warning:</strong> Fewer than 3 evidence papers selected. AI analysis might be limited or insufficient.</span>
                </div>
              )}
              {previewData.warnings.map((warning, idx) => (
                <div key={idx} className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 rounded-xl text-xs flex gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}

          {/* Add papers from corpus search */}
          <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block">Curate evidence</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Search the active corpus by title, keyword, topic, or DOI, then add papers into this pack.
              </p>
            </div>
            <Button
              onClick={handleOpenPaperPicker}
              disabled={previewEvidence.isPending || previewData.papers.length >= previewData.maxEvidencePapers}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black text-xs font-bold px-4 h-9 rounded-lg shadow-sm"
            >
              <Search className="h-3.5 w-3.5 mr-2" />
              Add Papers
            </Button>
          </div>

          {/* Guidelines info text */}
          <div className="flex gap-2 p-3 bg-blue-500/5 border border-blue-500/10 text-blue-800 dark:text-blue-400 rounded-xl text-xs leading-normal">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span><strong>Grounding rule:</strong> adding a paper makes it available as evidence, not a forced conclusion. If the pack is weak or contradictory, the generated report should say so.</span>
            </div>
          </div>

          {/* Evidence Papers List */}
          {previewData.papers.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="text-sm font-semibold text-slate-500">No evidence found. Broaden query or year range.</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 space-y-4">
              {previewData.papers.map((paper) => {
                const isExpanded = collapsedAbstracts[paper.id] ?? false;
                const snippet = paper.abstractText 
                  ? (paper.abstractText.length > 150 && !isExpanded 
                    ? `${paper.abstractText.slice(0, 150)}...` 
                    : paper.abstractText) 
                  : null;

                return (
                  <div key={paper.id} className="pt-4 first:pt-0 flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "rounded-full text-[10px] font-bold uppercase tracking-wider px-2 py-0.5",
                            paper.source === "selected" 
                              ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900" 
                              : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900"
                          )}
                        >
                          {paper.source}
                        </Badge>
                        <span className="text-xs font-semibold font-mono text-slate-500">Score: {paper.score.toFixed(3)}</span>
                        {paper.publicationYear && <span className="text-xs text-slate-400">({paper.publicationYear})</span>}
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {paper.title}
                      </h3>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        {paper.authorNames.length > 0 && (
                          <span>Authors: {paper.authorNames.slice(0, 3).join(", ")}{paper.authorNames.length > 3 ? " et al." : ""}</span>
                        )}
                        {paper.journalName && <span>Journal: {paper.journalName}</span>}
                        {paper.citationCount !== undefined && <span>Citations: {paper.citationCount}</span>}
                      </div>

                      {/* Abstract snippets collapsible */}
                      {snippet && (
                        <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-100/50 dark:border-slate-800/40">
                          <p>
                            {snippet}
                            {paper.abstractText && paper.abstractText.length > 150 && (
                              <button
                                onClick={() => toggleAbstract(paper.id)}
                                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline ml-1 cursor-pointer focus:outline-none"
                              >
                                {isExpanded ? "Show Less" : "Show More"}
                              </button>
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 flex items-start justify-end md:justify-start">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                        onClick={() => handleRemovePaper(paper.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions footer for Preview Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {previewData.papers.length === 0
                ? "Add or preview papers to enable generation." 
                : "Ready to generate when this evidence set looks correct."}
            </span>
            <Button
              onClick={() => handleGenerate(false)}
              disabled={createReport.isPending || previewData.papers.length === 0}
              className="h-12 rounded-xl bg-blue-600 px-6 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700"
            >
              {createReport.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2 fill-current" />
                  Generate Report from Evidence Pack
                </>
              )}
            </Button>
          </div>
            </div>
          )}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Your Reports</h2>
        {reports && reports.length > 0 && (
          <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-semibold gap-2" onClick={handleDeleteAll} disabled={deleteBatchReports.isPending}>
            {deleteBatchReports.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Clear All
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="w-full py-24 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
          <p className="text-slate-500 font-medium">Loading your reports...</p>
        </div>
      ) : (!reports || reports.length === 0) ? (
        <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-900/20">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6 text-blue-500">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No reports generated yet</h3>
          <p className="text-slate-500 max-w-sm mb-6">
            Use the form above to ask a research question and generate your first AI-powered literature review.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Link 
              key={report.id} 
              to={`/reports/${report.id}`}
              className="group flex flex-col bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
            >
              {/* Status Badge */}
              <div className="absolute top-6 right-6">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  (report.status === 'generating' || report.status === 'queued') ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  report.status === 'failed' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                }`}>
                  {(report.status === 'generating' || report.status === 'queued') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                   report.status === 'failed' ? <XCircle className="w-3.5 h-3.5" /> :
                   <CheckCircle2 className="w-3.5 h-3.5" />}
                  {report.status === 'generating' ? 'Generating' :
                   report.status === 'queued' ? 'Queued' :
                   report.status === 'failed' ? 'Failed' : 'Ready'}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 mt-2 mb-6 pr-24">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {report.topic || 'Untitled Analysis'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {report.query}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800/60 mt-auto">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  onClick={(e) => handleDeleteSingle(report.id, e)}
                  disabled={deleteReport.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Paper Picker Modal */}
      <Dialog open={paperPickerOpen} onOpenChange={setPaperPickerOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Add Papers To Evidence Pack
            </DialogTitle>
            <DialogDescription>
              Search the active corpus and add papers into the report evidence pack. The report will cite only the final pack.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <input
              value={paperSearchQuery}
              onChange={(e) => setPaperSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSearchPapers();
              }}
              placeholder="Search title, keyword, topic, DOI..."
              className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Button
              onClick={handleSearchPapers}
              disabled={paperSearchLoading || paperSearchQuery.trim().length < 2}
              className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {paperSearchLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Search
            </Button>
          </div>

          {paperSearchError && (
            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-500/5 px-3 py-2 text-xs text-red-700 dark:text-red-300">
              {paperSearchError}
            </div>
          )}

          <div className="min-h-[260px] overflow-y-auto pr-1">
            {paperSearchLoading ? (
              <div className="space-y-3 py-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : paperSearchResults.length === 0 ? (
              <div className="flex h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                <Search className="h-8 w-8 text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Search papers to add evidence</p>
                <p className="text-xs text-slate-500 mt-1">Results will show title, year, citations, and semantic relevance.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {paperSearchResults.map((paper) => {
                  const alreadyAdded = currentEvidencePaperIds.includes(paper.id);
                  const packFull = previewData ? currentEvidencePaperIds.length >= previewData.maxEvidencePapers : false;
                  const authors = paper.authors?.map((a) => a.displayName).filter(Boolean) ?? [];
                  const abstract =
                    paper.abstractText && paper.abstractText.length > 220
                      ? `${paper.abstractText.slice(0, 220)}...`
                      : paper.abstractText;

                  return (
                    <div key={paper.id} className="py-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="rounded-full bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900">
                            Score {paper.score.toFixed(3)}
                          </Badge>
                          <span className="text-xs text-slate-500">{paper.publicationYear}</span>
                          <span className="text-xs text-slate-500">{paper.citationCount ?? 0} citations</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <h3 className="text-sm font-bold leading-snug text-slate-900 dark:text-white">{paper.title}</h3>
                          <Link
                            to={`/papers/${paper.id}`}
                            target="_blank"
                            className="mt-0.5 text-slate-400 hover:text-blue-600"
                            title="Open paper detail"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                        {(authors.length > 0 || paper.journalName) && (
                          <p className="text-xs text-slate-500">
                            {authors.slice(0, 3).join(", ")}
                            {authors.length > 3 ? " et al." : ""}
                            {authors.length > 0 && paper.journalName ? " · " : ""}
                            {paper.journalName}
                          </p>
                        )}
                        {abstract && (
                          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{abstract}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={alreadyAdded ? "outline" : "default"}
                        disabled={alreadyAdded || packFull || previewEvidence.isPending}
                        onClick={() => handleAddPaperFromSearch(paper.id)}
                        className="rounded-lg font-bold"
                      >
                        {alreadyAdded ? "Added" : packFull ? "Pack Full" : "Add"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="pt-3 text-slate-600 dark:text-slate-400">
              Are you absolutely sure? This action cannot be undone. This will permanently delete
              {itemToDelete === 'ALL' ? ` all ${reports?.length} reports` : ' this report'} from our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleteReport.isPending || deleteBatchReports.isPending}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteReport.isPending || deleteBatchReports.isPending}>
              {(deleteReport.isPending || deleteBatchReports.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Yes, delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
