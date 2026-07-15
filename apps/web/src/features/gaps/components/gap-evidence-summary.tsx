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
      <div className="flex gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-100/50 dark:border-slate-800/40 text-[12.5px] leading-relaxed">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
        <span>
          No corpus probe is attached yet. Treat this as an AI/report-derived hypothesis.
        </span>
      </div>
    );
  }

  // Determine parent info if parentTrend is present
  const showParentInfo = parentTrend && parentCounts;
  const parentPaperCount = showParentInfo
    ? parentTrend.topic === probe.topicA
      ? parentCounts.a
      : parentCounts.b
    : null;

  return (
    <div className="border-l-2 border-emerald-500/40 pl-3.5 py-0.5 text-[12.5px] text-slate-600 dark:text-slate-400 leading-relaxed space-y-1">
      <span className="font-bold text-emerald-800 dark:text-emerald-400 text-xs block mb-1 flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Evidence check:
      </span>
      <div>
        Only <strong className="text-slate-800 dark:text-slate-200">{intersectionCount}</strong> papers exist at the intersection of{" "}
        <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono text-slate-800 dark:text-slate-200">
          "{probe.topicA}"
        </code>{" "}
        ×{" "}
        <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono text-slate-800 dark:text-slate-200">
          "{probe.topicB}"
        </code>
        {showParentInfo && parentTrend && (
          <>
            {" — whereas "}
            <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono text-slate-800 dark:text-slate-200">
              "{parentTrend.topic}"
            </code>{" "}
            has <strong className="text-slate-800 dark:text-slate-200">{parentPaperCount}</strong> papers and is growing at{" "}
            <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {parentTrend.growthRatePct >= 0 ? "+" : ""}
              {Math.round(parentTrend.growthRatePct)}%/year
            </strong>
          </>
        )}
        .
      </div>
    </div>
  );
}
