import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

const initialReports = [
  { id: "123", title: "LLM in Education Trends 2020-2024", topic: "LLM in Education", date: "Oct 24, 2024", status: "ready" },
  { id: "124", title: "RAG Systems Architecture and Performance", topic: "RAG Architecture", date: "Oct 23, 2024", status: "ready" },
  { id: "125", title: "AI Alignment in Medical Papers", topic: "AI Alignment", date: "Oct 20, 2024", status: "failed" },
];

export function ReportsListPage() {
  const [reports, setReports] = useState(initialReports);
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const navigate = useNavigate();

  const handleGenerate = () => {
    if (!topic.trim()) return;
    
    // Fake adding a report to the list
    const newId = "generating-" + Date.now();
    setReports([{
      id: newId,
      title: "Generating report for: " + topic,
      topic: topic,
      date: "Just now",
      status: "generating"
    }, ...reports]);
    
    setOpen(false);
    setTopic("");

    // Automatically navigate to the generating viewer (as per typical flow)
    navigate(`/reports/generating`);
  };

  return (
    <main className="container py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="AI Reports"
        description="Analytical reports grounded in retrieved papers."
        actions={
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleGenerate} className="bg-[#001b69] hover:bg-[#001040] text-white">Generate</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mt-8 bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/50 dark:bg-[#181818] text-slate-500 text-xs uppercase font-semibold tracking-wider">
            <tr>
              <th className="px-6 py-4">Report Title</th>
              <th className="px-6 py-4 hidden md:table-cell">Topic</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1c1f26] transition-colors group">
                <td className="px-6 py-4">
                  <Link to={`/reports/${report.status === 'generating' ? 'generating' : report.id}`} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      report.status === 'generating' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:border-blue-900/30' : 
                      report.status === 'failed' ? 'bg-red-50 text-red-600 border-red-200 dark:border-red-900/30' : 
                      'bg-emerald-50 text-emerald-600 border-emerald-200 dark:border-emerald-900/30'
                    }`}>
                      {report.status === 'generating' ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                       report.status === 'failed' ? <XCircle className="w-4 h-4" /> : 
                       <FileText className="w-4 h-4" />}
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {report.title}
                    </span>
                  </Link>
                </td>
                <td className="px-6 py-4 text-slate-500 font-medium hidden md:table-cell">{report.topic}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                    report.status === 'generating' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-400' :
                    report.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400'
                  }`}>
                    {report.status === 'generating' ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                     report.status === 'failed' ? <XCircle className="w-3 h-3" /> : 
                     <CheckCircle2 className="w-3 h-3" />}
                    {report.status === 'generating' ? 'Generating' : 
                     report.status === 'failed' ? 'Failed' : 'Ready'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-slate-500 font-medium whitespace-nowrap">
                  {report.date}
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  No reports generated yet. Click "New report" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
