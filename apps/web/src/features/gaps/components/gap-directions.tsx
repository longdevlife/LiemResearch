import { useEffect, useState } from "react";
import { Lightbulb, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { gapsApi } from "@/features/gaps/api/gaps.api";
import type { GapDirections } from "@trend/shared-types";
import { toast } from "sonner";

/**
 * On-demand AI research-direction suggestions for one gap. Advisory — never
 * affects tier/credit/approval. Lazy: fetches the cached doc on mount, the
 * button (re)generates.
 */
export function GapDirectionsPanel({ gapId, className }: { gapId: string; className?: string }) {
  const [data, setData] = useState<GapDirections | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!gapId) return;
    gapsApi
      .getDirections(gapId)
      .then(setData)
      .catch(() => {}); // no cached directions yet — show the empty state
  }, [gapId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // force a real re-generate when directions already exist ("Gợi ý lại").
      const res = await gapsApi.generateDirections(gapId, !!data);
      setData(res);
      toast.success("AI đã gợi ý hướng nghiên cứu.");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Không gợi ý được.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121212] p-6 space-y-4 ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Hướng nghiên cứu (AI)</h3>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
            AI tư vấn
          </span>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="h-9 px-4 gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold"
        >
          {generating && <Loader2 className="w-4 h-4 animate-spin" />}
          {data ? "Gợi ý lại" : "Gợi ý hướng nghiên cứu"}
        </Button>
      </div>

      {data && data.directions.length > 0 ? (
        <div className="space-y-4">
          {data.directions.map((d, i) => (
            <div key={i} className="rounded-xl bg-slate-50 dark:bg-zinc-900/40 p-4 space-y-2">
              <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {i + 1}. {d.title}
              </div>
              {d.rationale && (
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{d.rationale}</p>
              )}
              {d.suggestedApproach && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">Phương pháp: </span>
                  {d.suggestedApproach}
                </p>
              )}
              {d.relatedPaperIds.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {d.relatedPaperIds.map((id) => (
                    <Link key={id} to={`/papers/${id}`}>
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-medium cursor-pointer bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5"
                      >
                        Paper #{id.slice(-6)}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <p className="text-[11px] text-slate-400">
            Gợi ý mang tính tham khảo, không ảnh hưởng tier / credit / duyệt.
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Chưa có gợi ý. Bấm để AI đề xuất 2-4 hướng nghiên cứu tiếp theo từ gap này.
        </p>
      )}
    </div>
  );
}
