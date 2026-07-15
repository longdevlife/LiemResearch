import { CheckCircle2, AlertCircle } from "lucide-react";

interface GapEvidenceSummaryProps {
  probe?: { topicA: string; topicB: string; yearFrom?: number; yearTo?: number };
  intersectionCount?: number;
  parentCounts?: { a: number; b: number };
  parentTrend?: { topic: string; growthRatePct: number } | null;
}

export function GapEvidenceSummary({
  probe,
  intersectionCount = 0,
  parentCounts,
  parentTrend,
}: GapEvidenceSummaryProps) {
  if (!probe) {
    return (
      <div className="flex items-center gap-1.5 p-2.5 bg-slate-50/50 dark:bg-slate-900/10 text-slate-450 dark:text-slate-500 italic rounded-xl border border-slate-100 dark:border-slate-800/40 text-xs">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-slate-450 dark:text-slate-500" />
        <span>No corpus probe attached. AI-derived hypothesis.</span>
      </div>
    );
  }

  const showParentInfo = parentTrend && parentCounts;
  const parentPaperCount = showParentInfo
    ? parentTrend.topic === probe.topicA
      ? parentCounts.a
      : parentCounts.b
    : null;

  return (
    <div className="bg-slate-50/30 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/45 rounded-xl p-3 space-y-2 text-xs">
      <span className="font-bold text-emerald-800 dark:text-emerald-400 text-[10px] uppercase tracking-wider block flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Evidence check
      </span>
      <div className="text-slate-605 dark:text-slate-350 leading-relaxed">
        Only <strong className="text-slate-900 dark:text-white">{intersectionCount}</strong> papers exist at the intersection of{" "}
        <code className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 px-1 rounded text-[10px] font-mono text-slate-800 dark:text-slate-200">
          "{probe.topicA}"
        </code>{" "}
        ×{" "}
        <code className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 px-1 rounded text-[10px] font-mono text-slate-800 dark:text-slate-200">
          "{probe.topicB}"
        </code>
        {showParentInfo && parentTrend && (
          <>
            {" — whereas "}
            <code className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 px-1 rounded text-[10px] font-mono text-slate-800 dark:text-slate-200">
              "{parentTrend.topic}"
            </code>{" "}
            has <strong className="text-slate-900 dark:text-white">{parentPaperCount}</strong> papers (
            <strong className="text-emerald-600 dark:text-emerald-400">
              {parentTrend.growthRatePct >= 0 ? "+" : ""}
              {Math.round(parentTrend.growthRatePct)}%
            </strong>
            /year)
          </>
        )}
        .
      </div>
    </div>
  );
}
