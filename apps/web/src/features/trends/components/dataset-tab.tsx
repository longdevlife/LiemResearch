import React, { useMemo } from "react";
import type { TrendsOverview } from "@trend/shared-types";
import { FacetGroup } from "./trends-shared.components";

interface DatasetTabProps {
  data: TrendsOverview;
  yearFrom: number;
  yearTo: number;
  domainIds: string[];
  domains: string[];
  fieldIds: string[];
  fields: string[];
  subfieldIds: string[];
  subfields: string[];
  topicIds: string[];
  topicsFilter: string[];
  paperKinds: string[];
  openAccessStatuses: string[];
  providers: string[];
  sources: string[];
  citationBands: string[];
  handleBucketClick: (facet: string, val: string, openalexId?: string) => void;
}

export function DatasetTab({
  data,
  yearFrom,
  yearTo,
  domainIds,
  domains,
  fieldIds,
  fields,
  subfieldIds,
  subfields,
  topicIds,
  topicsFilter,
  paperKinds,
  openAccessStatuses,
  providers,
  sources,
  citationBands,
  handleBucketClick,
}: DatasetTabProps) {
  const scopeString = useMemo(() => {
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

    return parts.length > 0 ? parts.join(" → ") : "All OpenAlex domains";
  }, [data, domainIds, domains, fieldIds, fields, subfieldIds, subfields, topicIds, topicsFilter]);

  const activeFiltersCount = useMemo(() => {
    return (
      domains.length + fields.length + subfields.length + topicsFilter.length +
      domainIds.length + fieldIds.length + subfieldIds.length + topicIds.length +
      paperKinds.length + openAccessStatuses.length + providers.length + sources.length +
      citationBands.length
    );
  }, [
    domains, fields, subfields, topicsFilter,
    domainIds, fieldIds, subfieldIds, topicIds,
    paperKinds, openAccessStatuses, providers, sources, citationBands
  ]);

  return (
    <div className="space-y-8">
      {/* 1. Header (P1 Redundancy Fix) */}
      <div className="space-y-2 select-none">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Dataset Scope</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal max-w-3xl">
          A detailed breakdown of active paper volumes across metadata fields and taxonomy categories in the currently selected dataset scope.
        </p>
      </div>

      {/* 3. Taxonomy Coverage Alignment */}
      {data.taxonomyCoverage && (
        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Taxonomy Alignment & Coverage</h3>
            <p className="text-xs text-slate-500 mt-1">
              Coverage tells how many papers have enough OpenAlex topic metadata to support reliable scope filtering.
            </p>
          </div>
          
          <div className="w-full md:w-72 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-4 flex flex-col justify-between shrink-0 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Taxonomy Coverage</span>
              {(() => {
                const score = data.taxonomyCoverage.fullHierarchyCoveragePct;
                if (score >= 90) return <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-500 border border-emerald-200/30">Reliable</span>;
                if (score >= 70) return <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-500 border border-amber-200/30">Partial</span>;
                return <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400 border border-red-200/30">Bias Warning</span>;
              })()}
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                  <span>Full hierarchy</span>
                  <span>{data.taxonomyCoverage.fullHierarchyCoveragePct}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${data.taxonomyCoverage.fullHierarchyCoveragePct >= 90 ? "bg-emerald-500" : data.taxonomyCoverage.fullHierarchyCoveragePct >= 70 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${data.taxonomyCoverage.fullHierarchyCoveragePct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                  <span>Primary topic</span>
                  <span>{data.taxonomyCoverage.primaryTopicCoveragePct}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${data.taxonomyCoverage.primaryTopicCoveragePct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Grouped Corpus Facets (P9 Visually Grouped Request) */}
      {data.facets && (
        <div className="space-y-6">
          {/* GROUP A: Scholarly taxonomy */}
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded bg-blue-600"></span> Scholarly taxonomy
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Academic domain and topic classification from OpenAlex.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FacetGroup
                title="Domains"
                buckets={data.facets.domains}
                total={data.totalPapersInWindow}
                activeValues={domainIds.length > 0 ? domainIds : domains}
                onBucketClick={(val, openalexId) => handleBucketClick("Domains", val, openalexId)}
              />
              <FacetGroup
                title="Fields"
                buckets={data.facets.fields}
                total={data.totalPapersInWindow}
                activeValues={fieldIds.length > 0 ? fieldIds : fields}
                onBucketClick={(val, openalexId) => handleBucketClick("Fields", val, openalexId)}
              />
              <FacetGroup
                title="Subfields"
                buckets={data.facets.subfields}
                total={data.totalPapersInWindow}
                activeValues={subfieldIds.length > 0 ? subfieldIds : subfields}
                onBucketClick={(val, openalexId) => handleBucketClick("Subfields", val, openalexId)}
              />
              <FacetGroup
                title="Topics"
                buckets={data.facets.topics}
                total={data.totalPapersInWindow}
                activeValues={topicIds.length > 0 ? topicIds : topicsFilter}
                onBucketClick={(val, openalexId) => handleBucketClick("Topics", val, openalexId)}
              />
            </div>
          </div>

          {/* GROUP B: Publication metadata & GROUP C: Impact filter */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* GROUP B: Publication metadata (2/3 columns) */}
            <div className="lg:col-span-2 bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded bg-purple-600"></span> Publication metadata
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Scholarly publication formats, licensing access, sources and host providers.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FacetGroup
                  title="Paper Types"
                  buckets={data.facets.paperKinds}
                  total={data.totalPapersInWindow}
                  activeValues={paperKinds}
                  onBucketClick={(val) => handleBucketClick("Paper Types", val)}
                />
                <FacetGroup
                  title="Open Access"
                  buckets={data.facets.openAccessStatuses}
                  total={data.totalPapersInWindow}
                  activeValues={openAccessStatuses}
                  onBucketClick={(val) => handleBucketClick("Open Access", val)}
                />
                <FacetGroup
                  title="Providers"
                  buckets={data.facets.providers}
                  total={data.totalPapersInWindow}
                  activeValues={providers}
                  onBucketClick={(val) => handleBucketClick("Providers", val)}
                />
                <FacetGroup
                  title="Top Sources"
                  buckets={data.facets.topSources}
                  total={data.totalPapersInWindow}
                  activeValues={sources}
                  onBucketClick={(val) => handleBucketClick("Top Sources", val)}
                />
              </div>
            </div>

            {/* GROUP C: Impact filter (1/3 column) */}
            <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded bg-emerald-600"></span> Impact filter
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Filter by the number of citations accumulated.</p>
              </div>
              <FacetGroup
                title="Citation Bands"
                buckets={data.facets.citationBands}
                total={data.totalPapersInWindow}
                activeValues={citationBands}
                onBucketClick={(val) => handleBucketClick("Citation Bands", val)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Data basis note */}
      <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-900/10 border-l-2 border-slate-300 dark:border-slate-700 rounded-r-xl text-xs text-slate-500 dark:text-slate-400 select-none">
        <p className="leading-relaxed">
          <strong>Data Basis Hint:</strong> Trends are computed from active papers in the selected corpus window. Facets use OpenAlex-style metadata such as source/type, open access, citation band, domain, field, subfield, and topic.
        </p>
      </div>
    </div>
  );
}
