import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, ArrowUpRight } from "lucide-react";
import type { GapSource } from "@trend/shared-types";

interface GapOriginProps {
  source: GapSource;
  sourceReportId?: string;
  topic: string;
  analysisId?: string;
}

export function GapOrigin({ source, sourceReportId, topic, analysisId }: GapOriginProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
          <Search className="w-3.5 h-3.5 text-slate-400" /> {topic}
        </span>
        {analysisId && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            ID: {analysisId.slice(-6)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {sourceReportId && (
          <Link
            to={`/reports/${sourceReportId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-800 dark:hover:text-blue-300"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View source report</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        )}
        <Badge
          variant="outline"
          className={
            source === "report"
              ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900 text-[10px] uppercase font-bold px-2 py-0.5"
              : "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/20 dark:text-cyan-400 dark:border-cyan-900 text-[10px] uppercase font-bold px-2 py-0.5"
          }
        >
          {source === "report" ? "Report-derived" : "Standalone Analysis"}
        </Badge>
      </div>
    </div>
  );
}
