import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, CheckCircle2, XCircle, Trash2, Zap, Settings2, Plus, Sparkles, ChevronRight, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useReports, useCreateReport, useDeleteReport, useDeleteBatchReports } from "@/features/reports/hooks/use-reports";
import { toast } from "sonner";
import type { ReportLanguage } from "@trend/shared-types";

export function ReportsListPage() {
  const { data: reports, isLoading } = useReports();
  const createReport = useCreateReport();
  const deleteReport = useDeleteReport();
  const deleteBatchReports = useDeleteBatchReports();

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
  
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  React.useEffect(() => {
    const isCreate = searchParams.get("create") === "true" || searchParams.has("topic");
    if (isCreate) {
      const urlTopic = searchParams.get("topic") || "";
      const urlQuery = searchParams.get("query") || searchParams.get("q") || "";
      if (urlTopic) setTopic(urlTopic);
      if (urlQuery) setQuery(urlQuery);

      // Clear URL params
      setSearchParams(prev => {
        prev.delete("create");
        prev.delete("topic");
        prev.delete("query");
        prev.delete("q");
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

  const handleGenerate = async () => {
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

    try {
      await createReport.mutateAsync({
        query: query.trim(),
        topic: topic.trim() || undefined,
        language,
        deepAnalysis,
        fast,
        yearFrom: fromYear,
        yearTo: toYear,
      });
      setTopic("");
      setQuery("");
      setYearFrom("");
      setYearTo("");
      setLanguage("auto");
      setDeepAnalysis(false);
      setFast(true);
      setShowAdvanced(false);
      toast.success("Report generation started!");
    } catch (error) {
      console.error("Failed to create report:", error);
      toast.error("Failed to create report. Please try again.");
    }
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
            Ask a complex research question. Our AI agents will retrieve relevant literature, synthesize findings, identify gaps, and draft a comprehensive report in seconds.
          </p>
        </div>
      </section>

      {/* Inline Generation Form (Replaces Modal) */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm mb-16 relative overflow-hidden group">
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
              onClick={handleGenerate} 
              disabled={createReport.isPending || !query.trim()} 
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm"
            >
              {createReport.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Zap className="w-5 h-5 mr-2" />}
              Generate Report
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
