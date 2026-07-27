import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Database,
  ExternalLink,
  Loader2,
  Plus,
  Search,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import type {
  AnalyzeGapRequest,
  GapEvidencePaper,
  PreviewGapEvidenceResponse,
  ScoredPaper,
} from "@trend/shared-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGapEvidencePreview } from "../hooks/use-gaps";
import { searchApi } from "@/features/search/api/search.api";
import { formatNumber } from "@/utils/format";
import { cn } from "@/utils/cn";

interface GapAnalysisWorkflowProps {
  isAnalyzing: boolean;
  onAnalyze: (payload: AnalyzeGapRequest) => void;
}

export function GapAnalysisWorkflow({
  isAnalyzing,
  onAnalyze,
}: GapAnalysisWorkflowProps) {
  const [topic, setTopic] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [preview, setPreview] = useState<PreviewGapEvidenceResponse | null>(null);
  const [papers, setPapers] = useState<GapEvidencePaper[]>([]);
  const [paperSearch, setPaperSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ScoredPaper[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const evidenceRef = useRef<HTMLDivElement>(null);
  const previewEvidence = useGapEvidencePreview();

  const years = useMemo(() => ({
    yearFrom: yearFrom ? Number(yearFrom) : undefined,
    yearTo: yearTo ? Number(yearTo) : undefined,
  }), [yearFrom, yearTo]);
  const selectedIds = papers.map((paper) => paper.id);
  const canPreview = topic.trim().length >= 3 && !previewEvidence.isPending;
  const canAnalyze = papers.length >= 3 && !isAnalyzing;

  const validateYears = () => {
    if (years.yearFrom && years.yearTo && years.yearFrom > years.yearTo) {
      toast.error("Year From must be less than or equal to Year To.");
      return false;
    }
    return true;
  };

  const loadPreview = async (pinnedIds: string[] = []) => {
    if (!canPreview || !validateYears()) return;
    try {
      const data = await previewEvidence.mutateAsync({
        topic: topic.trim(),
        ...years,
        selectedPaperIds: pinnedIds,
        evidenceMode: "hybrid",
      });
      setPreview(data);
      setPapers(data.papers);
      requestAnimationFrame(() => evidenceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message ?? "Could not retrieve gap evidence.");
    }
  };

  const searchPapers = async () => {
    if (paperSearch.trim().length < 2) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const result = await searchApi.semantic({
        q: paperSearch.trim(),
        page: 1,
        pageSize: 8,
        ...years,
        sort: "relevance",
      });
      setSearchResults(result.papers);
    } catch (error: any) {
      setSearchError(error.response?.data?.error?.message ?? "Paper search failed.");
    } finally {
      setIsSearching(false);
    }
  };

  const addPaper = async (paperId: string) => {
    if (!preview || selectedIds.includes(paperId)) return;
    if (papers.length >= preview.maxEvidencePapers) {
      toast.error(`Evidence pack is limited to ${preview.maxEvidencePapers} papers. Remove one first.`);
      return;
    }
    await loadPreview([paperId, ...selectedIds]);
  };

  const analyzeReviewedPack = () => {
    if (!canAnalyze || !validateYears()) return;
    onAnalyze({
      topic: topic.trim(),
      ...years,
      selectedPaperIds: selectedIds,
      evidenceMode: "selected",
    });
  };

  const reset = () => {
    setPreview(null);
    setPapers([]);
    setSearchResults([]);
    setPaperSearch("");
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#1c1f26]">
      <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-cyan-50 p-2 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-950 dark:text-white">Create a grounded gap analysis</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Define the topic, review the exact evidence papers, then spend credits on AI analysis.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_130px_130px]">
          <label className="space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Research topic
            <input
              value={topic}
              onChange={(event) => {
                setTopic(event.target.value);
                if (preview) reset();
              }}
              placeholder="e.g. federated learning in medical imaging"
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Year from
            <input
              type="number"
              value={yearFrom}
              onChange={(event) => {
                setYearFrom(event.target.value);
                if (preview) reset();
              }}
              placeholder="2020"
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Year to
            <input
              type="number"
              value={yearTo}
              onChange={(event) => {
                setYearTo(event.target.value);
                if (preview) reset();
              }}
              placeholder="2026"
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
        </div>

        {!preview ? (
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <p className="text-xs text-slate-500">
              Evidence preview is free. The 30-credit charge happens only after you approve at least 3 papers.
            </p>
            <Button
              onClick={() => void loadPreview()}
              disabled={!canPreview}
              className="h-11 rounded-lg bg-cyan-600 px-5 font-bold text-white hover:bg-cyan-700"
            >
              {previewEvidence.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              Review Evidence
            </Button>
          </div>
        ) : (
          <div ref={evidenceRef} className="scroll-mt-24 space-y-5 border-t border-slate-100 pt-5 dark:border-slate-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                  <CheckCircle2 className="h-4 w-4" /> Step 2: Review evidence
                </div>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                  These papers are the only sources the gap worker will read. Remove weak matches or add a missing study.
                </p>
              </div>
              <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
                {papers.length} / {preview.maxEvidencePapers} papers
              </Badge>
            </div>

            {preview.warnings.map((warning) => (
              <div key={warning} className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {warning}
              </div>
            ))}

            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {papers.map((paper, index) => (
                <article key={paper.id} className="grid gap-3 p-4 sm:grid-cols-[32px_minmax(0,1fr)_auto] sm:items-start">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={cn(
                        "text-[10px] uppercase",
                        paper.source === "selected" ? "border-purple-200 text-purple-700" : "border-blue-200 text-blue-700",
                      )}>
                        {paper.source === "selected" ? "Added by you" : "Retrieved"}
                      </Badge>
                      {paper.publicationYear && <span className="text-xs text-slate-500">{paper.publicationYear}</span>}
                      {paper.citationCount !== undefined && (
                        <span className="text-xs text-slate-500">{formatNumber(paper.citationCount)} citations</span>
                      )}
                      {paper.source === "retrieved" && (
                        <span className="text-xs font-semibold text-emerald-700">
                          {Math.round(Math.max(0, Math.min(1, paper.score)) * 100)}% match
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/papers/${paper.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-start gap-1.5 font-semibold leading-snug text-slate-950 hover:text-cyan-700 dark:text-white dark:hover:text-cyan-300"
                    >
                      {paper.title}
                      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {paper.authorNames.slice(0, 3).join(", ")}
                      {paper.authorNames.length > 3 ? " et al." : ""}
                      {paper.journalName ? ` · ${paper.journalName}` : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Remove from evidence"
                    onClick={() => setPapers((current) => current.filter((item) => item.id !== paper.id))}
                    className="h-8 w-8 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </article>
              ))}
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Add a paper from the corpus</p>
              <div className="mt-3 flex gap-2">
                <input
                  value={paperSearch}
                  onChange={(event) => setPaperSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void searchPapers();
                  }}
                  placeholder="Search by title, DOI, topic, or keyword"
                  className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950"
                />
                <Button variant="outline" onClick={() => void searchPapers()} disabled={isSearching || paperSearch.trim().length < 2}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Search
                </Button>
              </div>
              {searchError && <p className="mt-2 text-xs text-red-600">{searchError}</p>}
              {searchResults.length > 0 && (
                <div className="mt-3 max-h-64 divide-y divide-slate-200 overflow-y-auto rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">
                  {searchResults.map((paper) => {
                    const added = selectedIds.includes(paper.id);
                    return (
                      <div key={paper.id} className="flex items-start justify-between gap-3 p-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-white">{paper.title}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {paper.publicationYear} · {formatNumber(paper.citationCount ?? 0)} citations · {Math.round(paper.score * 100)}% match
                          </p>
                        </div>
                        <Button size="sm" variant={added ? "outline" : "default"} disabled={added} onClick={() => void addPaper(paper.id)}>
                          <Plus className="h-3.5 w-3.5" /> {added ? "Added" : "Add"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <Button variant="ghost" onClick={reset}>
                <ArrowLeft className="h-4 w-4" /> Change topic
              </Button>
              <div className="flex flex-col items-end gap-1.5">
                <Button
                  onClick={analyzeReviewedPack}
                  disabled={!canAnalyze}
                  className="h-11 rounded-lg bg-cyan-600 px-6 font-bold text-white hover:bg-cyan-700"
                >
                  {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  Analyze {papers.length} Reviewed Papers
                </Button>
                <span className="text-[11px] text-slate-500">Costs 30 credits · failures and cache hits are refunded</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
