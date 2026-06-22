import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useReports, useCreateReport, useDeleteReport, useDeleteBatchReports } from "@/features/reports/hooks/use-reports";
import { toast } from "sonner";

export function ReportsListPage() {
  const { data: reports, isLoading } = useReports();
  const createReport = useCreateReport();
  const deleteReport = useDeleteReport();
  const deleteBatchReports = useDeleteBatchReports();
  
  const [open, setOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | 'ALL' | null>(null);
  const [topic, setTopic] = useState("");
  const [query, setQuery] = useState("");
  const [fast, setFast] = useState(true);
  const navigate = useNavigate();

  const handleDeleteAll = () => {
    if (!reports || reports.length === 0) return;
    setItemToDelete('ALL');
    setDeleteModalOpen(true);
  };

  const handleDeleteSingle = (id: string) => {
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

    try {
      await createReport.mutateAsync({ query: query.trim(), topic: topic.trim() || undefined, fast });
      setOpen(false);
      setTopic("");
      setQuery("");
      setFast(true);
    } catch (error) {
      console.error("Failed to create report:", error);
    }
  };

  return (
    <main className="container py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="AI Reports"
        description="Analytical reports grounded in retrieved papers."
        actions={
          <div className="flex items-center gap-2">
            {reports && reports.length > 0 && (
              <Button variant="destructive" onClick={handleDeleteAll} disabled={deleteBatchReports.isPending}>
                {deleteBatchReports.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete All
              </Button>
            )}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#001b69] hover:bg-[#001040] text-white">New report</Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Generate AI Report</DialogTitle>
                <DialogDescription>
                  Enter a research topic to analyze. Our AI will scan thousands of papers to create a comprehensive report.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="topic" className="text-sm font-semibold text-slate-900 dark:text-white">Topic / Keyword</label>
                  <input
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. LLM in Education"
                    className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#001b69] focus:ring-offset-2"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="query" className="text-sm font-semibold text-slate-900 dark:text-white">Question</label>
                  <textarea
                    id="query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="What should AI analyze?"
                    rows={4}
                    className="flex w-full rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#001b69] focus:ring-offset-2 resize-none"
                  />
                </div>

                <label
                  htmlFor="fast-mode"
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 dark:border-slate-800 p-3"
                >
                  <input
                    id="fast-mode"
                    type="checkbox"
                    checked={fast}
                    onChange={(e) => setFast(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#001b69]"
                  />
                  <span className="text-sm">
                    <span className="font-semibold text-slate-900 dark:text-white">⚡ Fast mode</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      Nhanh hơn (model Flash). Bỏ chọn để phân tích kỹ hơn bằng model Pro — chậm hơn ~2–4×.
                    </span>
                  </span>
                </label>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={createReport.isPending}>Cancel</Button>
                <Button onClick={handleGenerate} disabled={createReport.isPending} className="bg-[#001b69] hover:bg-[#001040] text-white">
                  {createReport.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Generate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        }
      />

      <div className="mt-8 bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden min-h-[300px]">
        {isLoading ? (
          <div className="w-full h-[300px] flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-500">Loading reports...</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 dark:bg-[#181818] text-slate-500 text-xs uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">Report Topic</th>
                <th className="px-6 py-4 hidden md:table-cell">Query</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Date</th>
                <th className="px-6 py-4 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {reports?.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1c1f26] transition-colors group">
                  <td className="px-6 py-4">
                    <Link to={`/reports/${report.id}`} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        (report.status === 'generating' || report.status === 'queued') ? 'bg-blue-50 text-blue-600 border-blue-200 dark:border-blue-900/30' : 
                        report.status === 'failed' ? 'bg-red-50 text-red-600 border-red-200 dark:border-red-900/30' : 
                        'bg-emerald-50 text-emerald-600 border-emerald-200 dark:border-emerald-900/30'
                      }`}>
                        {(report.status === 'generating' || report.status === 'queued') ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                         report.status === 'failed' ? <XCircle className="w-4 h-4" /> : 
                         <FileText className="w-4 h-4" />}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {report.topic || 'AI Report'}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium hidden md:table-cell truncate max-w-xs">{report.query}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                      (report.status === 'generating' || report.status === 'queued') ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-400' :
                      report.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400'
                    }`}>
                      {(report.status === 'generating' || report.status === 'queued') ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                       report.status === 'failed' ? <XCircle className="w-3 h-3" /> : 
                       <CheckCircle2 className="w-3 h-3" />}
                      {report.status === 'generating' ? 'Generating' : 
                       report.status === 'queued' ? 'Queued' : 
                       report.status === 'failed' ? 'Failed' : 'Ready'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500 font-medium whitespace-nowrap">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleDeleteSingle(report.id)}
                      disabled={deleteReport.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {(!reports || reports.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No reports generated yet. Click "New report" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

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
