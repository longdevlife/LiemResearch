import * as DialogPrimitive from "@radix-ui/react-dialog";
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  ExternalLink,
  X,
  TrendingUp,
  GitBranch,
  FileText,
  ArrowUpRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { GapOrigin } from "./gap-origin";
import { GapDirectionsPanel } from "./gap-directions";
import { AiEvaluation } from "@/components/ai-evaluation";
import type { ResearchGapItem } from "@trend/shared-types";
import { cn } from "@/utils/cn";

interface GapDetailDrawerProps {
  gap: ResearchGapItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GapDetailDrawer({ gap, isOpen, onClose }: GapDetailDrawerProps) {
  if (!gap) return null;

  // Determine evidence status visual mapping
  let strengthLabel = "";
  let strengthColor = "";
  let strengthTooltip = "";

  if (gap.evidenceStatus === "confirmed") {
    strengthLabel = "Confirmed by corpus";
    strengthColor = "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400";
    strengthTooltip = "The gap has a corpus probe and deterministic evidence score.";
  } else if (gap.evidenceStatus === "weak") {
    strengthLabel = "Weak corpus evidence";
    strengthColor = "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400";
    strengthTooltip = "The system found a possible gap, but corpus evidence is sparse or inconclusive.";
  } else {
    strengthLabel = "AI-only from report";
    strengthColor = "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-400";
    strengthTooltip = "This came from a report and has not yet been verified with a corpus probe.";
  }

  const confidencePct = Math.round((gap.evidenceConfidence ?? gap.confidence) * 100);

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        {/* Backdrop blur overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        
        {/* Right side slide-over drawer content */}
        <DialogPrimitive.Content className="fixed right-0 top-0 z-50 h-full w-full max-w-xl border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c1f26] p-0 shadow-2xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right flex flex-col focus:outline-none">
          
          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Header section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Research Opportunity Detail
                </span>
                <DialogPrimitive.Close
                  onClick={onClose}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  aria-label="Close details"
                >
                  <X className="h-5 w-5" />
                </DialogPrimitive.Close>
              </div>

              <div className="space-y-2.5">
                <DialogPrimitive.Title className="text-lg md:text-xl font-bold leading-tight text-slate-900 dark:text-white flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-500 shrink-0 mt-1" />
                  <span>{gap.title}</span>
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">
                  Research gap detail drawer showing source, corpus evidence, supporting papers,
                  AI directions, and evaluation for this gap.
                </DialogPrimitive.Description>

                <div className="pt-1.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/60">
                  <GapOrigin 
                    source={gap.source} 
                    sourceReportId={gap.sourceReportId} 
                    topic={gap.topic} 
                    analysisId={gap.analysisId} 
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge variant="outline" className={cn("rounded-lg text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 border", strengthColor)}>
                    {strengthLabel}
                  </Badge>
                  <span className="text-[10px] text-slate-500 dark:text-slate-500 font-medium">
                    {strengthTooltip}
                  </span>
                </div>
              </div>
            </div>

            {/* Rationale & Description */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Why this gap exists
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-slate-705 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-900/10 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                  {gap.description}
                </p>
                {gap.rationale && (
                  <div className="border-l-2 border-amber-500/50 pl-4 py-1 bg-amber-500/5 dark:bg-amber-500/2 rounded-r-2xl p-4 border-y border-r border-slate-100/50 dark:border-slate-800/30">
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-xs block mb-1 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" /> Rationale
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                      {gap.rationale}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Corpus Evidence Probe details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Corpus Evidence
              </h3>
              {gap.probe ? (
                <div className="bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Topic Concept A</span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 px-2.5 py-1 rounded-md block truncate">
                        {gap.probe.topicA}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Topic Concept B</span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 px-2.5 py-1 rounded-md block truncate">
                        {gap.probe.topicB}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="text-center p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] text-slate-405 font-bold uppercase block">Intersection</span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {gap.intersectionCount ?? 0}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">papers</span>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] text-slate-405 font-bold uppercase block">Growth Trend</span>
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-0.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {gap.parentTrend ? `${Math.round(gap.parentTrend.growthRatePct)}%` : "0%"}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">/ year</span>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] text-slate-405 font-bold uppercase block">Evidence Score</span>
                      <span className="text-sm font-extrabold text-cyan-600 dark:text-cyan-400">
                        {confidencePct}%
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">confidence</span>
                    </div>
                  </div>

                  {gap.parentTrend && gap.parentCounts && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-white dark:bg-slate-900/30 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800/40 flex items-start gap-2">
                      <GitBranch className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>
                        Parent topic <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px] font-mono">"{gap.parentTrend.topic}"</code> has{" "}
                        <strong>
                          {gap.parentTrend.topic === gap.probe.topicA ? gap.parentCounts.a : gap.parentCounts.b}
                        </strong>{" "}
                        historical papers in current corpus.
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-2.5 p-4 bg-slate-50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 rounded-2xl border border-slate-100/60 dark:border-slate-800/40 text-xs leading-relaxed">
                  <AlertCircle className="size-4 shrink-0 mt-0.5 text-slate-400" />
                  <span>
                    This gap is AI-only because no corpus probe was saved. Treat it as a brainstorming candidate until regenerated/backfilled.
                  </span>
                </div>
              )}
            </div>

            {/* Supporting Papers list */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Supporting papers
              </h3>
              {gap.supportingPapers && gap.supportingPapers.length > 0 ? (
                <div className="space-y-3">
                  {gap.supportingPapers.map((paper) => (
                    <div 
                      key={paper.id}
                      className="p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/30 hover:border-cyan-400/40 dark:hover:border-cyan-900/40 transition-all space-y-1.5"
                    >
                      <Link
                        to={`/papers/${paper.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-slate-800 dark:text-slate-205 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-start gap-1 group leading-snug break-words max-w-full text-xs"
                      >
                        <span>{paper.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      </Link>
                      <div className="flex flex-wrap gap-x-3 text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider">
                        {paper.publicationYear && <span>{paper.publicationYear}</span>}
                        {paper.journalName && <span>{paper.journalName}</span>}
                        {paper.citationCount !== undefined && <span>{paper.citationCount} citations</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-900/10 p-4 rounded-2xl border border-slate-100/50 dark:border-slate-800/30">
                  No supporting papers were saved for this gap.
                </div>
              )}
            </div>

            {/* AI Research Directions */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Next research directions
              </h3>
              <GapDirectionsPanel 
                gapId={gap.id} 
                supportingPapers={gap.supportingPapers}
                variant="flat" 
                autoFetch={true} 
              />
            </div>

            {/* AI Quality evaluation */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                AI Evaluation
              </h3>
              <AiEvaluation targetKind="gap" targetId={gap.id} variant="flat" />
            </div>

          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
