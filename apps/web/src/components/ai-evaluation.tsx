import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api-client";
import { toast } from "sonner";

type TargetKind = "paper" | "report" | "gap";

interface Evaluation {
  relevance: number;
  groundedness: number;
  completeness: number;
  overall: number;
  rationale: string;
}

/**
 * On-demand LLM-as-judge block (relevance / groundedness / completeness). Advisory —
 * the score never affects tier/credit/approval. Reused across paper / report / gap
 * (the backend `/quality/evaluate` + `/quality/:kind/:id` are kind-agnostic).
 */
export function AiEvaluation({
  targetKind,
  targetId,
  enabled = true,
  disabledHint,
  lazy = false,
  className,
}: {
  targetKind: TargetKind;
  targetId: string;
  enabled?: boolean;
  disabledHint?: string;
  /** In a list (e.g. gap cards), skip the on-mount fetch so N cards don't fire N
   *  GETs — the cached score loads only when the user clicks "AI đánh giá". */
  lazy?: boolean;
  className?: string;
}) {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(!lazy);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    if (lazy || !targetId) return;
    api
      .get(`/quality/${targetKind}/${targetId}`)
      .then((res) => {
        if (res.data.success) setEvaluation(res.data.data?.evaluation ?? null);
      })
      .catch(() => {}) // no cached eval / not accessible — show the empty state
      .finally(() => setLoading(false));
  }, [targetKind, targetId, lazy]);

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      // force a real re-judge when an eval already exists ("Đánh giá lại"); without
      // force, evaluate() just returns the cached doc.
      const res = await api.post("/quality/evaluate", {
        targetKind,
        targetId,
        force: !!evaluation,
      });
      if (res.data.success) {
        setEvaluation(res.data.data);
        toast.success("AI đã đánh giá xong.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Không đánh giá được.");
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) return null;

  const dims = evaluation
    ? [
        { label: "Relevance", value: evaluation.relevance },
        { label: "Groundedness", value: evaluation.groundedness },
        { label: "Completeness", value: evaluation.completeness },
      ]
    : [];

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121212] p-6 space-y-4 ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">AI đánh giá chất lượng</h3>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
            AI tư vấn
          </span>
        </div>
        <Button
          onClick={handleEvaluate}
          disabled={evaluating || !enabled}
          title={enabled ? undefined : disabledHint}
          className="h-9 px-4 gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold"
        >
          {evaluating && <Loader2 className="w-4 h-4 animate-spin" />}
          {evaluation ? "Đánh giá lại" : "AI đánh giá"}
        </Button>
      </div>

      {!enabled ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {disabledHint ?? "Chưa đủ dữ liệu để AI chấm."}
        </p>
      ) : evaluation ? (
        <div className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {evaluation.overall.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500">/ 5 — điểm AI tổng</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {dims.map((d) => (
              <div key={d.label} className="rounded-xl bg-slate-50 dark:bg-zinc-900/40 p-3 text-center">
                <div className="text-lg font-black text-slate-800 dark:text-slate-200">{d.value}/5</div>
                <div className="text-[11px] text-slate-500 mt-1">{d.label}</div>
              </div>
            ))}
          </div>
          {evaluation.rationale && (
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-l-2 border-indigo-300 dark:border-indigo-800 pl-3">
              {evaluation.rationale}
            </p>
          )}
          <p className="text-[11px] text-slate-400">
            Điểm AI mang tính tham khảo, không ảnh hưởng tier / credit / duyệt.
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Chưa có đánh giá AI. Bấm “AI đánh giá” để Gemini chấm relevance / groundedness / completeness.
        </p>
      )}
    </div>
  );
}
