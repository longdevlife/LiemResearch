import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Zap, 
  Settings2, 
  Plus, 
  Sparkles, 
  ChevronRight, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  Info, 
  Database,
  Search,
  ExternalLink
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  
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
      setShowAdvanced(false);
      
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
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm mb-12 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" /> New Report
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-5">
            <div>
              <label htmlFor="topic" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Topic / Keyword (Optional)</label>
              <input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Federated Learning in Medical Imaging"
                className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="query" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Research Question <span className="text-red-500">*</span></label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What specific insights are you looking for?"
                rows={3}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
              />
            </div>
          </div>
          
          <div className="lg:col-span-4 flex flex-col justify-end space-y-4">
            <Button
              variant="outline"
              className="w-full justify-between h-12 rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <span className="flex items-center gap-2"><Settings2 className="w-4 h-4" /> Advanced Options</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
            </Button>
            
            <Button 
              onClick={handlePreviewEvidence} 
              disabled={previewEvidence.isPending || !query.trim()} 
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-colors"
            >
              {previewEvidence.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Database className="w-5 h-5 mr-2" />}
              Preview Evidence Pack
            </Button>
          </div>
        </div>

        {/* Collapsible Advanced Options */}
        {showAdvanced && (
          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4 fade-in duration-200">
            <div className="space-y-2">
              <label htmlFor="report-language" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Output Language</label>
              <select
                id="report-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as ReportLanguage)}
                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="auto">Auto-detect from query</option>
                <option value="en">English (Forced)</option>
                <option value="vi">Vietnamese</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="year-from" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Year From</label>
              <input
                id="year-from"
                type="number"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
                placeholder="2020"
                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="year-to" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Year To</label>
              <input
                id="year-to"
                type="number"
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
                placeholder="2026"
                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-3 pt-6">
              <label className="flex cursor-pointer items-center gap-3 group">
                <input
                  type="checkbox"
                  checked={fast}
                  onChange={(e) => setFast(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Fast Mode (Flash Model)</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 group">
                <input
                  type="checkbox"
                  checked={deepAnalysis}
                  onChange={(e) => setDeepAnalysis(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Deep Web Analysis</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Loading Skeleton during preview fetch */}
      {previewEvidence.isPending && (
        <div className="space-y-6 mb-12 p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/20">
          <div className="flex items-center justify-between border-b pb-4">
            <Skeleton className="h-6 w-48 rounded" />
            <Skeleton className="h-6 w-32 rounded-full" />
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
        <div className="mb-12 p-6 border border-red-200 dark:border-red-900/50 bg-red-500/5 rounded-2xl text-red-950 dark:text-red-200 space-y-4">
          <div className="flex gap-2">
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <span className="font-bold block">Failed to generate evidence preview</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">{previewError}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 dark:border-red-900 hover:bg-red-500/10 rounded-lg text-xs"
              onClick={handlePreviewEvidence}
            >
              Retry Preview
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
              onClick={() => handleGenerate(true)}
              disabled={createReport.isPending}
            >
              {createReport.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 mr-1.5" />}
              Skip Preview & Generate Report
            </Button>
          </div>
        </div>
      )}

      {/* Evidence Pack UI */}
      {showPreview && previewData && (
        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm mb-12 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Selected Evidence Pack</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                The report will cite only this evidence pack.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1 font-semibold rounded-full bg-slate-50 dark:bg-slate-900/60 border text-xs">
                {previewData.papers.length} / {previewData.maxEvidencePapers} Papers
              </Badge>
              <Badge variant="outline" className="px-3 py-1 font-semibold rounded-full bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900 text-xs uppercase">
                Lang: {previewData.papers.length > 0 ? language : "auto"}
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
              <span className="text-xs font-semibold text-slate-500 block">Need different evidence?</span>
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
              <span><strong>Operational guidelines:</strong></span>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                <li>Adding a paper does not force the AI to agree with it; it only makes it available as evidence.</li>
                <li>If the selected evidence is weak or contradictory, the AI report should explicitly state that the evidence pack is insufficient.</li>
              </ul>
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
            <span className="text-xs text-slate-500 dark:text-slate-400 italic">
              {previewData.papers.length === 0
                ? "Add or preview papers to enable generation." 
                : "Confirm you have selected all required papers for the review."}
            </span>
            <Button
              onClick={() => handleGenerate(false)}
              disabled={createReport.isPending || previewData.papers.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 rounded-xl shadow-sm text-sm"
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
