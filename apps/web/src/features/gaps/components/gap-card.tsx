import { Link } from "react-router-dom";
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  Undo2, 
  Loader2, 
  Search, 
  ArrowUpRight,
  FileText,
  Star,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GapEvidenceSummary } from "./gap-evidence-summary";
import { SupportingPaperList } from "./supporting-paper-list";
import { usePatchGapStatus } from "../hooks/use-gaps";
import type { ResearchGapItem, GapStatus } from "@trend/shared-types";
import { cn } from "@/utils/cn";
import { toast } from "sonner";

interface GapCardProps {
  gap: ResearchGapItem;
  filterStatus: GapStatus;
  onViewDetails?: (gap: ResearchGapItem) => void;
  isShortlisted?: boolean;
  onToggleShortlist?: (gap: ResearchGapItem) => void;
  showReorderButtons?: boolean;
  onMoveUp?: (gapId: string) => void;
  onMoveDown?: (gapId: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

function ConfidenceBar({ value, isEvidence }: { value: number; isEvidence?: boolean }) {
  const pct = Math.round(value * 100);
  let colorClass = "bg-rose-500";
  if (value >= 0.7) colorClass = "bg-emerald-500";
  else if (value >= 0.4) colorClass = "bg-amber-500";

  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
      <div className="w-20 sm:w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
        <div className={`h-full ${colorClass} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-[10px] sm:text-[11px]", value >= 0.7 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "font-semibold")}>
        {pct}% {isEvidence ? "Evidence" : "AI Conf"}
      </span>
    </div>
  );
}

export function GapCard({
  gap,
  filterStatus,
  onViewDetails,
  isShortlisted = false,
  onToggleShortlist,
  showReorderButtons = false,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false
}: GapCardProps) {
  const { mutateAsync: patchStatus, isPending: isPatching } = usePatchGapStatus();

  const handleUpdateStatus = async (status: GapStatus) => {
    try {
      await patchStatus({ id: gap.id, status });
      toast.success(`Gap marked as ${status}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to update gap status.");
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Do not trigger click on card if user clicks interactive items like buttons, anchor tags, select or inputs
    if (target.closest("button") || target.closest("a") || target.closest("select") || target.closest("input")) {
      return;
    }
    if (onViewDetails) {
      onViewDetails(gap);
    }
  };

  // Determine evidence status visual mapping
  let strengthColor = "";
  let strengthTooltip = "";

  if (gap.evidenceStatus === "confirmed") {
    strengthColor = "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400";
    strengthTooltip = "The gap has a corpus probe and deterministic evidence score.";
  } else if (gap.evidenceStatus === "weak") {
    strengthColor = "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400";
    strengthTooltip = "The system found a possible gap, but corpus evidence is sparse or inconclusive.";
  } else {
    strengthColor = "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-400";
    strengthTooltip = "This came from a report and has not yet been verified with a corpus probe.";
  }

  return (
    <article
      onClick={handleCardClick}
      className="bg-white dark:bg-[#1c1f26] border border-slate-200 dark:border-slate-800/80 hover:border-cyan-400 dark:hover:border-cyan-800/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group relative overflow-hidden cursor-pointer"
    >
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50/20 dark:bg-cyan-900/5 rounded-bl-full -mr-10 -mt-10 opacity-40 group-hover:bg-cyan-100/20 dark:group-hover:bg-cyan-900/10 transition-colors pointer-events-none" />

      {/* 1. Header: Topic tag on the left, badges & status actions on the right */}
      <div className="mb-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-4 relative z-10">
        <Badge variant="secondary" className="bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold px-2 py-0.5 text-[9px] uppercase tracking-wider rounded">
          # {gap.topic}
        </Badge>

        <div className="flex items-center gap-2">
          {gap.sourceReportId && (
            <Link
              to={`/reports/${gap.sourceReportId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline inline-flex items-center gap-0.5 text-[10px] font-bold mr-1 transition-colors"
              title="View source report"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Report</span>
              <ArrowUpRight className="w-2.5 h-2.5" />
            </Link>
          )}

          <Badge variant="outline" className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border", strengthColor)} title={strengthTooltip}>
            {gap.evidenceStatus === "confirmed" ? "Confirmed" : gap.evidenceStatus === "weak" ? "Weak" : "AI Only"}
          </Badge>

          <div className="h-3 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          {/* Shortlist Action (Star) */}
          {onToggleShortlist && (
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onToggleShortlist(gap);
              }}
              className="h-6 w-6 rounded-md hover:bg-amber-50 dark:hover:bg-amber-950/20 text-slate-400 hover:text-amber-500 transition-colors"
              title={isShortlisted ? "Remove from session shortlist" : "Shortlist in this session"}
            >
              <Star className={cn("w-3.5 h-3.5", isShortlisted ? "fill-amber-400 text-amber-500" : "text-slate-400")} />
            </Button>
          )}

          {/* Status actions */}
          {filterStatus === "active" ? (
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                disabled={isPatching}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus("resolved");
                }}
                className="h-6 w-6 rounded-md hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/20 text-slate-400 dark:text-slate-500 transition-colors"
                title="Mark as Resolved"
              >
                {isPatching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                disabled={isPatching}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus("dismissed");
                }}
                className="h-6 w-6 rounded-md hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 text-slate-400 dark:text-slate-500 transition-colors"
                title="Dismiss Gap"
              >
                {isPatching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              </Button>
            </div>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              disabled={isPatching}
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStatus("active");
              }}
              className="h-6 w-6 rounded-md hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/20 text-slate-400 dark:text-slate-500 transition-colors"
              title="Restore to Active"
            >
              {isPatching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
            </Button>
          )}

          {/* Reorder Buttons */}
          {showReorderButtons && onMoveUp && onMoveDown && (
            <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-800 pl-1.5 ml-1">
              <Button
                size="icon"
                variant="ghost"
                disabled={isFirst}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp(gap.id);
                }}
                className="h-6 w-6 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-30"
                title="Move Up"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                disabled={isLast}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown(gap.id);
                }}
                className="h-6 w-6 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-30"
                title="Move Down"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Gap Claim */}
      <div className="mb-4 space-y-2.5 flex-1 relative z-10">
        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug flex items-start gap-1.5 transition-colors">
          <Sparkles className="size-4 text-cyan-500 shrink-0 mt-0.5" />
          <span
            onClick={() => onViewDetails?.(gap)}
            className="hover:underline hover:text-cyan-600 dark:hover:text-cyan-400 cursor-pointer"
          >
            {gap.title}
          </span>
        </h3>
        
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {gap.description}
        </p>

        {gap.rationale && (
          <div className="border-l-2 border-amber-500/40 pl-3 py-0.5 bg-slate-50/20 dark:bg-slate-900/10 rounded-r-xl border-y border-r border-slate-100/50 dark:border-slate-800/20">
            <span className="font-bold text-slate-500 dark:text-slate-450 text-[10px] uppercase tracking-wider block mb-0.5">Why this may be a gap:</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed">
              {gap.rationale}
            </p>
          </div>
        )}
      </div>

      {/* 3. Evidence Check & Papers */}
      <div className="space-y-3.5 mb-4 border-t border-slate-100 dark:border-slate-800/60 pt-3 relative z-10">
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

      {/* 4. Actions Footer */}
      <div className="flex flex-row items-center justify-between gap-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 mt-auto relative z-10">
        <ConfidenceBar
          value={gap.evidenceConfidence !== undefined && gap.evidenceConfidence !== null ? gap.evidenceConfidence : gap.confidence}
          isEvidence={gap.evidenceConfidence !== undefined && gap.evidenceConfidence !== null}
        />
        
        <div className="flex items-center gap-2">
          {onViewDetails && (
            <Button
              size="sm"
              variant="default"
              className="h-8 px-3.5 text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg shadow-sm transition-colors"
              onClick={() => onViewDetails(gap)}
            >
              View details
            </Button>
          )}

          <Link
            to={`/search?q=${encodeURIComponent(gap.probe ? `${gap.probe.topicA} ${gap.probe.topicB}` : gap.title)}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:text-cyan-600 dark:border-slate-800 dark:text-slate-350 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search papers</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
