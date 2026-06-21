import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useGaps,
  useAnalyzeGap,
  useGapAnalysisStatus,
  usePatchGapStatus,
} from "@/features/gaps";
import type { GapSource } from "@trend/shared-types";

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    value >= 0.7 ? "bg-green-500" : value >= 0.4 ? "bg-yellow-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span>{pct}%</span>
    </div>
  );
}

function AnalysisPoller({ analysisId, onDone }: { analysisId: string; onDone: () => void }) {
  const { data } = useGapAnalysisStatus(analysisId);

  useEffect(() => {
    if (data?.status === "ready") {
      onDone();
    }
  }, [data?.status, onDone]);

  if (data?.status === "failed") {
    return (
      <p className="text-sm text-destructive mt-2">{data.errorMessage ?? "Analysis failed."}</p>
    );
  }
  if (data?.status === "ready") return null;
  return (
    <p className="text-sm text-muted-foreground mt-2 animate-pulse">
      {data?.status === "analyzing" ? "Analyzing with Gemini…" : "Queued…"}
    </p>
  );
}

export function ResearchGapsPage() {
  const [topic, setTopic] = useState("");
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<GapSource | undefined>();
  const [searchTopic, setSearchTopic] = useState("");
  const [minConfidence, setMinConfidence] = useState(0);

  const {
    data: gapsData,
    isLoading,
    refetch,
  } = useGaps({
    source: filterSource,
    status: "active",
    pageSize: 20,
    minConfidence,
    topic: searchTopic || undefined,
  });
  const { mutate: analyze, isPending } = useAnalyzeGap();
  const { mutate: patchStatus } = usePatchGapStatus();

  const handleDone = useCallback(() => {
    setActiveAnalysisId(null);
    void refetch();
  }, [refetch]);

  const handleAnalyze = () => {
    if (!topic.trim()) return;
    analyze(
      { topic: topic.trim() },
      {
        onSuccess: ({ analysisId }) => {
          setActiveAnalysisId(analysisId);
        },
      },
    );
  };

  return (
    <main className="container py-8 space-y-6">
      <PageHeader
        title="Research Gaps"
        description="AI-suggested research opportunities grounded in retrieved papers."
      />

      {/* Analyze new topic */}
      <div className="flex gap-2 max-w-lg">
        <Input
          placeholder="e.g. large language models in education"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
        />
        <Button onClick={handleAnalyze} disabled={isPending || !topic.trim()}>
          {isPending ? "Submitting…" : "Analyze"}
        </Button>
      </div>

      {activeAnalysisId && (
        <AnalysisPoller
          analysisId={activeAnalysisId}
          onDone={handleDone}
        />
      )}

      {/* Filters */}
      <div className="flex gap-6 flex-wrap items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Source:</span>
          <Button
            size="sm"
            variant={filterSource === undefined ? "default" : "outline"}
            onClick={() => setFilterSource(undefined)}
          >
            All sources
          </Button>
          <Button
            size="sm"
            variant={filterSource === "standalone" ? "default" : "outline"}
            onClick={() => setFilterSource("standalone")}
          >
            Standalone
          </Button>
          <Button
            size="sm"
            variant={filterSource === "report" ? "default" : "outline"}
            onClick={() => setFilterSource("report")}
          >
            From reports
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
           <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Topic:</span>
           <Input 
             placeholder="Filter gaps..." 
             className="h-8 w-48 text-sm"
             value={searchTopic}
             onChange={(e) => setSearchTopic(e.target.value)}
           />
        </div>
        
        <div className="flex items-center gap-3">
           <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Min Confidence: {Math.round(minConfidence * 100)}%</span>
           <input 
             type="range" 
             min="0" 
             max="1" 
             step="0.1" 
             value={minConfidence}
             onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
             className="w-24 accent-primary"
           />
        </div>
      </div>

      {/* Gap cards */}
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && gapsData?.data?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No gaps found. Submit a topic above to generate the first analysis.
        </p>
      )}
      <div className="space-y-3">
        {gapsData?.data?.map((gap) => (
          <div key={gap.id} className="rounded-lg border p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-sm leading-snug">{gap.title}</h3>
              <Badge variant="outline" className="shrink-0">
                {gap.source}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{gap.description}</p>
            <p className="text-xs text-muted-foreground italic">{gap.rationale}</p>
            
            {gap.supportingPaperIds && gap.supportingPaperIds.length > 0 && (
               <div className="flex flex-wrap gap-1 mt-1">
                 {gap.supportingPaperIds.map((id) => (
                   <Link key={id} to={`/papers/${id}`}>
                     <Badge variant="secondary" className="text-[10px] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800">
                       Paper #{id.slice(-6)}
                     </Badge>
                   </Link>
                 ))}
               </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <ConfidenceBar value={gap.confidence} />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs"
                  onClick={() => patchStatus({ id: gap.id, status: "resolved" })}
                >
                  Resolved
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs text-muted-foreground"
                  onClick={() => patchStatus({ id: gap.id, status: "dismissed" })}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {gapsData?.meta && (
        <p className="text-xs text-muted-foreground">
          {gapsData.meta.total} gap{gapsData.meta.total !== 1 ? "s" : ""} found
        </p>
      )}
    </main>
  );
}
