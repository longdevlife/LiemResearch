import React from "react";
import { Cpu, ChevronDown, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { TopicRelationshipEdge, TopicRelationshipResponse, TrendExplanationResponse, TrendsOverview } from "@trend/shared-types";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import type { TrendExplainInput, TrendsOverviewParams } from "@/features/trends/api/trends.api";

type CitationBandFilter = NonNullable<TrendsOverviewParams["citationBands"]>;

interface AITabProps {
  data: TrendsOverview;
  activeFocusTopic: string;
  setFocusTopic: (topic: string) => void;
  relationshipsQuery: Pick<UseQueryResult<TopicRelationshipResponse, Error>, "data" | "isLoading" | "isError">;
  explainMutation: UseMutationResult<TrendExplanationResponse, Error, TrendExplainInput, unknown>;
  yearFrom: number;
  yearTo: number;
  domains: string[];
  fields: string[];
  subfields: string[];
  topicsFilter: string[];
  domainIds: string[];
  fieldIds: string[];
  subfieldIds: string[];
  topicIds: string[];
  paperKinds: string[];
  openAccessStatuses: string[];
  providers: string[];
  sources: string[];
  citationBands: CitationBandFilter;
}

export function AITab({
  data,
  activeFocusTopic,
  setFocusTopic,
  relationshipsQuery,
  explainMutation,
  yearFrom,
  yearTo,
  domains,
  fields,
  subfields,
  topicsFilter,
  domainIds,
  fieldIds,
  subfieldIds,
  topicIds,
  paperKinds,
  openAccessStatuses,
  providers,
  sources,
  citationBands,
}: AITabProps) {
  const relationshipEdges = relationshipsQuery.data?.edges ?? [];

  return (
    <div className="space-y-6">
      {/* Tab Purpose Header (P10 Request) */}
      <div className="text-xs text-slate-550 dark:text-slate-400 font-medium select-none">
        Pick a topic and ask AI to explain why the trend may matter. The answer is grounded in aggregate trend metrics from the current dataset, not arbitrary web knowledge.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cột Trái: Topic co-occurrence graph preview (5 columns) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[460px]">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4 select-none">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Topic Co-occurrence</h3>

              {/* select focusTopic */}
              <div className="relative">
                <select
                  value={activeFocusTopic}
                  onChange={(e) => setFocusTopic(e.target.value)}
                  className="h-8 pl-3 pr-8 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 appearance-none cursor-pointer"
                >
                  {data.topics.map(t => (
                    <option key={t.topic} value={t.topic}>{t.topic}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-6">Built from topics appearing together on the same papers. This is graph-ready data; Neo4j can replace the query layer later.</p>

            {relationshipsQuery.isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                <p className="text-xs text-slate-500 font-medium">Fetching relationships...</p>
              </div>
            ) : relationshipsQuery.isError ? (
              <p className="text-sm text-red-600 py-6 text-center">Failed to load co-occurrences.</p>
            ) : relationshipEdges.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-10 text-center">No co-occurring topics found for this topic.</p>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {relationshipEdges.slice(0, 10).map((edge: TopicRelationshipEdge, idx: number) => {
                  const relatedName = edge.source === activeFocusTopic ? edge.target : edge.source;
                  const maxCount = Math.max(...relationshipEdges.map((e: TopicRelationshipEdge) => e.count));
                  const percentage = maxCount > 0 ? Math.round((edge.count / maxCount) * 100) : 0;
                  return (
                    <div key={idx} className="text-xs bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/40 rounded-xl p-3 flex flex-col justify-between hover:border-slate-200/80 dark:hover:border-slate-800/80 transition-colors">
                      <div className="flex justify-between items-center mb-1.5 font-bold">
                        <span className="text-slate-800 dark:text-slate-200 capitalize">{relatedName}</span>
                        <span className="text-blue-700 dark:text-blue-400">{edge.count} papers</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 dark:bg-blue-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-150 dark:border-slate-800/40">
            {/* Explain Target Context Preview (P10 Request) */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-3 text-xs mb-4 space-y-1 text-slate-500 dark:text-slate-400 select-none">
              <p className="font-extrabold text-slate-800 dark:text-slate-350">Explanation Context:</p>
              <div className="flex justify-between">
                <span>Selected Topic:</span>
                <strong className="text-blue-650 dark:text-blue-400 font-extrabold capitalize">{activeFocusTopic}</strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="shrink-0">Dataset Scope:</span>
                <strong className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-[180px] capitalize">
                  {(() => {
                    const parts: string[] = [];
                    if (domainIds.length > 0) {
                      const name = data.facets?.domains?.find(d => d.openalexId === domainIds[0] || d.id === domainIds[0])?.name || domainIds[0];
                      if (name) parts.push(name);
                    } else if (domains.length > 0 && domains[0]) {
                      parts.push(domains[0]);
                    }
                    if (fieldIds.length > 0) {
                      const name = data.facets?.fields?.find(f => f.openalexId === fieldIds[0] || f.id === fieldIds[0])?.name || fieldIds[0];
                      if (name) parts.push(name);
                    } else if (fields.length > 0 && fields[0]) {
                      parts.push(fields[0]);
                    }
                    if (subfieldIds.length > 0) {
                      const name = data.facets?.subfields?.find(s => s.openalexId === subfieldIds[0] || s.id === subfieldIds[0])?.name || subfieldIds[0];
                      if (name) parts.push(name);
                    } else if (subfields.length > 0 && subfields[0]) {
                      parts.push(subfields[0]);
                    }
                    if (topicIds.length > 0) {
                      const name = data.facets?.topics?.find(t => t.openalexId === topicIds[0] || t.id === topicIds[0])?.name || topicIds[0];
                      if (name) parts.push(name);
                    } else if (topicsFilter.length > 0 && topicsFilter[0]) {
                      parts.push(topicsFilter[0]);
                    }
                    return parts.length > 0 ? parts.join(" > ") : "All Domains";
                  })()}
                </strong>
              </div>
            </div>

            <Button
              onClick={() => explainMutation.mutate({
                topic: activeFocusTopic,
                yearFrom,
                yearTo,
                domains,
                fields,
                subfields,
                topics: topicsFilter,
                domainIds,
                fieldIds,
                subfieldIds,
                topicIds,
                paperKinds,
                openAccessStatuses,
                providers,
                sources,
                citationBands,
                language: "en"
              })}
              disabled={explainMutation.isPending}
              className="w-full h-10 bg-blue-700 hover:bg-blue-800 text-white font-extrabold rounded-xl shadow-md gap-2 flex items-center justify-center active:scale-98 transition-transform"
            >
              {explainMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating explanation...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
                  Explain trend with AI
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Cột Phải: AI "Why This Trend Matters" (7 columns) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col min-h-[460px]">
          <div className="border-b border-slate-100 dark:border-slate-800/50 pb-4 mb-4 select-none">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-600" />
              AI Research Explainer
            </h3>
            <p className="text-xs text-slate-500 mt-1">Get an instant AI overview on why the selected focus topic is trending.</p>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[480px] pr-1 space-y-4">
            {explainMutation.isPending ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : explainMutation.isError ? (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 rounded-xl text-xs font-semibold text-red-600 leading-relaxed select-text">
                AI explanation failed. You can still inspect the charts and facets.
              </div>
            ) : explainMutation.data ? (
              <div className="space-y-4 text-xs leading-relaxed select-text">
                <div className="bg-blue-50/50 dark:bg-blue-950/15 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
                  <h4 className="font-extrabold text-blue-700 dark:text-blue-400 mb-1.5 uppercase text-[10px] tracking-wider">AI Trend Summary</h4>
                  <p className="text-slate-705 dark:text-slate-300 font-medium text-xs leading-relaxed">{explainMutation.data.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50/40 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/40 rounded-xl p-4">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase text-[9px] tracking-wider">Why It Matters</h4>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400">
                      {explainMutation.data.whyItMatters.map((item: string, idx: number) => (
                        <li key={idx} className="indent-[-12px] pl-3 leading-normal">{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-50/40 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/40 rounded-xl p-4">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase text-[9px] tracking-wider">Evidence Signals</h4>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400">
                      {explainMutation.data.evidenceSignals.map((item: string, idx: number) => (
                        <li key={idx} className="indent-[-12px] pl-3 leading-normal">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-amber-50/30 dark:bg-amber-950/5 border border-amber-100/50 dark:border-amber-950/20 rounded-xl p-4">
                    <h4 className="font-bold text-amber-700 dark:text-amber-400 mb-2 uppercase text-[9px] tracking-wider">Cautions</h4>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400">
                      {explainMutation.data.cautions.map((item: string, idx: number) => (
                        <li key={idx} className="indent-[-12px] pl-3 leading-normal">{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-100/40 dark:border-emerald-950/20 rounded-xl p-4">
                    <h4 className="font-bold text-emerald-700 dark:text-emerald-500 mb-2 uppercase text-[9px] tracking-wider">Suggested Actions</h4>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400">
                      {explainMutation.data.suggestedActions.map((item: string, idx: number) => (
                        <li key={idx} className="indent-[-12px] pl-3 leading-normal">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-slate-400 dark:text-slate-500 font-semibold border-t border-slate-100 dark:border-slate-800/60 select-none">
                  AI explanation is grounded in aggregate trend metrics, not individual paper-level citations. Generated at {new Date(explainMutation.data.generatedAt).toLocaleDateString()}.
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/10 dark:bg-slate-900/5 select-none">
                <Cpu className="w-8 h-8 text-blue-600/30 animate-pulse mb-3" />
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">AI Explainer is ready.</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">Pick a topic and ask AI to explain why the trend may matter. The answer is grounded in aggregate trend metrics from the current dataset, not arbitrary web knowledge.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
