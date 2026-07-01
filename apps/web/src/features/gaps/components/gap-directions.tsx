import { useState } from "react";
import { Lightbulb, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { gapsApi } from "@/features/gaps/api/gaps.api";
import type { GapDirections } from "@trend/shared-types";
import { toast } from "sonner";

/**
 * On-demand AI research-direction suggestions for one gap. Advisory — never
 * affects tier/credit/approval. Lazy by design: this renders once PER gap card
 * in a list, so it does NOT fetch on mount (N cards would fire N un-throttled
 * GETs — the sibling AiEvaluation skips its on-mount GET for the same reason).
 * The first button click sends force:false, so the backend returns the cached
 * doc if one exists, otherwise generates.
 */
export function GapDirectionsPanel({
  gapId,
  className,
  variant = "default",
}: {
  gapId: string;
  className?: string;
  variant?: "default" | "flat";
}) {
  const [data, setData] = useState<GapDirections | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // First click (data === null) sends force:false → cached-or-generate.
      // A later click (data set) sends force:true → real re-generate ("Gợi ý lại").
      const res = await gapsApi.generateDirections(gapId, !!data);
      setData(res);
      toast.success("AI research directions suggested.");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to suggest directions.");
    } finally {
      setGenerating(false);
    }
  };

  const isFlat = variant === "flat";

  return (
    <div
      className={
        isFlat
          ? `space-y-3 ${className ?? ""}`
          : `rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121212] p-6 space-y-4 ${className ?? ""}`
      }
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
          <h3 className="font-bold text-slate-850 dark:text-slate-200 text-sm">Research Directions (AI)</h3>
          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
            AI Advisory
          </span>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          variant={isFlat ? "outline" : "default"}
          className={
            isFlat
              ? "h-8 px-3 rounded-lg text-xs font-semibold border-amber-200 dark:border-amber-900/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-amber-755 dark:text-amber-400 gap-1.5"
              : "h-9 px-4 gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold"
          }
        >
          {generating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {data ? "Suggest Again" : "Suggest Directions"}
        </Button>
      </div>

      {data && data.directions.length > 0 ? (
        <div className="space-y-3">
          {data.directions.map((d, i) => (
            <div key={i} className="rounded-xl bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-100/50 dark:border-zinc-800/30 p-3 space-y-1.5">
              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                {i + 1}. {d.title}
              </div>
              {d.rationale && (
                <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed">{d.rationale}</p>
              )}
              {d.suggestedApproach && (
                <p className="text-[11px] text-slate-550 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-350">Approach: </span>
                  {d.suggestedApproach}
                </p>
              )}
              {d.relatedPaperIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {d.relatedPaperIds.map((id) => (
                    <Link key={id} to={`/papers/${id}`}>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-medium cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 px-2 py-0.5 border-transparent"
                      >
                        Paper #{id.slice(-6)}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <p className="text-[10px] text-slate-400">
            Suggestions are grounded in gap evidence, supporting papers, and structured paper knowledge when available. Advisory only; does not affect approval.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No suggestions yet. Click to generate 2-4 research directions for this gap.
          </p>
          <p className="text-[10px] text-slate-400">
            Suggestions are grounded in gap evidence, supporting papers, and structured paper knowledge when available. Advisory only; does not affect approval.
          </p>
        </div>
      )}
    </div>
  );
}
