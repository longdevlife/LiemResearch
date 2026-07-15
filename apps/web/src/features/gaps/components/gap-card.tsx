import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  Undo2, 
  Loader2, 
  Search, 
  ArrowUpRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AiEvaluation } from "@/components/ai-evaluation";
import { GapDirectionsPanel } from "./gap-directions";
import { GapOrigin } from "./gap-origin";
import { GapEvidenceSummary } from "./gap-evidence-summary";
import { SupportingPaperList } from "./supporting-paper-list";
import { usePatchGapStatus } from "../hooks/use-gaps";
import type { ResearchGapItem, GapStatus } from "@trend/shared-types";
import { cn } from "@/utils/cn";
import { toast } from "sonner";

interface GapCardProps {
  gap: ResearchGapItem;
  filterStatus: GapStatus;
}

function ConfidenceBar({ value, isEvidence }: { value: number; isEvidence?: boolean }) {
  const pct = Math.round(value * 100);
  let colorClass = "bg-rose-500";
  if (value >= 0.7) colorClass = "bg-emerald-500";
  else if (value >= 0.4) colorClass = "bg-amber-500";

  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
      <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
        <div className={`h-full ${colorClass} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-[11px]", value >= 0.7 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "font-medium")}>
        {pct}% {isEvidence ? "Evidence Score" : "AI Confidence"}
      </span>
    </div>
  );
}

export function GapCard({ gap, filterStatus }: GapCardProps) {
  const { mutateAsync: patchStatus, isPending: isPatching } = usePatchGapStatus();

  const handleUpdateStatus = async (status: GapStatus) => {
    try {
      await patchStatus({ id: gap.id, status });
      toast.success(`Gap marked as ${status}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to update gap status.");
    }
  };

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

  return (
    <article className="bg-white dark:bg-[#1c1f26] border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50/30 dark:bg-cyan-900/5 rounded-bl-full -mr-10 -mt-10 opacity-50 group-hover:bg-cyan-100/30 dark:group-hover:bg-cyan-900/10 transition-colors pointer-events-none" />

      {/* 1. Origin Row */}
      <div className="mb-4 space-y-3 relative z-10 border-b border-slate-100 dark:border-slate-800/60 pb-3">
        <GapOrigin 
          source={gap.source} 
          sourceReportId={gap.sourceReportId} 
          topic={gap.topic} 
          analysisId={gap.analysisId} 
        />
        
        {/* 2. Evidence Strength Row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("rounded-lg text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 border", strengthColor)}>
            {strengthLabel}
          </Badge>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            {strengthTooltip}
          </span>
        </div>
      </div>

      {/* 3. Gap Claim */}
      <div className="mb-5 space-y-3 flex-1 relative z-10">
        <h3 className="font-bold text-base md:text-lg text-slate-900 dark:text-white leading-snug flex items-start gap-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
          <Sparkles className="w-4.5 h-4.5 text-cyan-500 shrink-0 mt-1" />
          <span>{gap.title}</span>
        </h3>
        
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {gap.description}
        </p>

        {gap.rationale && (
          <div className="border-l-2 border-amber-500/40 pl-3 py-0.5 mt-3.5 bg-slate-50/50 dark:bg-slate-900/20 p-2.5 rounded-r-xl border-y border-r border-slate-100/50 dark:border-slate-850/10">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-xs block mb-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Why this may be a gap:
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
              {gap.rationale}
            </p>
          </div>
        )}
      </div>

      {/* 4. Evidence Summary & 5. Supporting Papers */}
      <div className="space-y-4 mb-5 border-t border-slate-100 dark:border-slate-800/60 pt-4 relative z-10">
        <GapEvidenceSummary 
          probe={gap.probe} 
          intersectionCount={gap.intersectionCount} 
          parentCounts={gap.parentCounts} 
          parentTrend={gap.parentTrend} 
        />
        
        <SupportingPaperList 
          papers={gap.supportingPapers} 
          totalPaperCount={gap.supportingPaperIds?.length} 
        />
      </div>

      {/* 6. Actions Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto relative z-10">
        <ConfidenceBar
          value={gap.evidenceConfidence !== undefined && gap.evidenceConfidence !== null ? gap.evidenceConfidence : gap.confidence}
          isEvidence={gap.evidenceConfidence !== undefined && gap.evidenceConfidence !== null}
        />
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick link to search papers for this topic */}
          <Link
            to={`/search?q=${encodeURIComponent(gap.probe ? `${gap.probe.topicA} ${gap.probe.topicB}` : gap.title)}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:text-cyan-600 dark:border-slate-800 dark:text-slate-300 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search papers</span>
          </Link>

          {filterStatus === "active" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={isPatching}
                className="h-8 px-3 text-xs font-bold hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                onClick={() => handleUpdateStatus("resolved")}
              >
                {isPatching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Resolved</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={isPatching}
                className="h-8 px-3 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-900/20 transition-colors flex items-center gap-1.5"
                onClick={() => handleUpdateStatus("dismissed")}
              >
                {isPatching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>Dismiss</span>
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={isPatching}
              className="h-8 px-3 text-xs font-bold text-blue-600 hover:bg-blue-50 border-blue-200 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:border-blue-900 transition-colors flex items-center gap-1.5"
              onClick={() => handleUpdateStatus("active")}
            >
              {isPatching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
              <span>Restore to Active</span>
            </Button>
          )}
        </div>
      </div>

      {/* AI Assistant blocks embedded seamlessly */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-4 relative z-10">
        <AiEvaluation targetKind="gap" targetId={gap.id} lazy variant="flat" />
        <GapDirectionsPanel gapId={gap.id} variant="flat" />
      </div>
    </article>
  );
}
