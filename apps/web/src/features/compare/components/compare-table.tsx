import type { PaperComparison } from "@trend/shared-types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X, Sparkles, BookOpen, Clock, BarChart3, Database } from "lucide-react";

interface CompareTableProps {
  comparison: PaperComparison;
}

export function CompareTable({ comparison }: CompareTableProps) {
  const { papers, metrics, llmComparison } = comparison;

  // Lấy metric của một paper dựa trên index
  const getMetricForPaper = (paperId: string) => {
    return metrics.find((m) => m.paperId === paperId);
  };

  // Ánh xạ tên dimension tiếng Anh sang tiếng Việt thân thiện hơn
  const dimensionNames: Record<string, string> = {
    method: "Phương pháp nghiên cứu",
    dataScope: "Phạm vi dữ liệu",
    keyFinding: "Phát hiện chính",
    limitation: "Hạn chế đề tài",
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121212] overflow-hidden shadow-sm">
      <Table className="w-full border-collapse">
        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
          <TableRow className="border-b border-slate-200 dark:border-slate-800">
            <TableHead className="w-64 font-bold text-slate-700 dark:text-slate-300 py-4 px-6 text-sm">
              Tiêu chí so sánh
            </TableHead>
            {papers.map((paper, idx) => {
              const metric = getMetricForPaper(paper.id);
              return (
                <TableHead key={paper.id} className="min-w-[240px] py-4 px-6 align-top">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300 text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Bài viết {idx === 0 ? "(Hiện tại)" : ""}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm line-clamp-2 leading-snug" title={paper.title}>
                      {paper.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {paper.authors.map((a) => a.displayName).join(", ")}
                    </p>
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* --- SECTION: DETERMINISTIC METRICS --- */}
          <TableRow className="bg-slate-50/30 dark:bg-zinc-900/5 border-b border-slate-200 dark:border-slate-800">
            <TableCell colSpan={papers.length + 1} className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 py-2.5 px-6">
              Chỉ số định lượng (Deterministic Metrics)
            </TableCell>
          </TableRow>

          {/* Năm xuất bản */}
          <TableRow className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10">
            <TableCell className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 px-6 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" /> Năm xuất bản
            </TableCell>
            {papers.map((paper) => {
              const metric = getMetricForPaper(paper.id);
              return (
                <TableCell key={paper.id} className="py-3.5 px-6 text-slate-900 dark:text-slate-100 text-sm font-medium">
                  {metric?.publicationYear || "N/A"}
                </TableCell>
              );
            })}
          </TableRow>

          {/* Số trích dẫn */}
          <TableRow className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10">
            <TableCell className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 px-6 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-400" /> Số trích dẫn
            </TableCell>
            {papers.map((paper) => {
              const metric = getMetricForPaper(paper.id);
              return (
                <TableCell key={paper.id} className="py-3.5 px-6 text-slate-900 dark:text-slate-100 text-sm font-medium">
                  {metric?.citationCount !== undefined ? metric.citationCount.toLocaleString() : "N/A"}
                </TableCell>
              );
            })}
          </TableRow>

          {/* Tạp chí */}
          <TableRow className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10">
            <TableCell className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 px-6 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-400" /> Tạp chí (Journal)
            </TableCell>
            {papers.map((paper) => {
              const metric = getMetricForPaper(paper.id);
              return (
                <TableCell key={paper.id} className="py-3.5 px-6 text-slate-600 dark:text-slate-300 text-sm italic">
                  {metric?.journalName || "N/A"}
                </TableCell>
              );
            })}
          </TableRow>

          {/* Open Access */}
          <TableRow className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10">
            <TableCell className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 px-6 text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" /> Open Access
            </TableCell>
            {papers.map((paper) => {
              const metric = getMetricForPaper(paper.id);
              return (
                <TableCell key={paper.id} className="py-3.5 px-6">
                  {metric?.openAccess ? (
                    <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-none gap-1 py-0.5 px-2">
                      <Check className="w-3.5 h-3.5" /> Có
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-400 border-slate-200 dark:border-slate-800 gap-1 py-0.5 px-2">
                      <X className="w-3.5 h-3.5" /> Không
                    </Badge>
                  )}
                </TableCell>
              );
            })}
          </TableRow>

          {/* Loại bài viết */}
          <TableRow className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10">
            <TableCell className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 px-6 text-sm flex items-center gap-2">
              Loại bài viết
            </TableCell>
            {papers.map((paper) => {
              const metric = getMetricForPaper(paper.id);
              return (
                <TableCell key={paper.id} className="py-3.5 px-6 text-slate-700 dark:text-slate-300 text-sm font-medium capitalize">
                  {metric?.paperKind || "N/A"}
                </TableCell>
              );
            })}
          </TableRow>

          {/* Điểm AI Overall */}
          <TableRow className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 bg-cyan-50/10 dark:bg-cyan-950/5">
            <TableCell className="font-bold text-cyan-700 dark:text-cyan-400 py-4 px-6 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Điểm AI tổng quan (Overall Score)
            </TableCell>
            {papers.map((paper) => {
              const metric = getMetricForPaper(paper.id);
              return (
                <TableCell key={paper.id} className="py-4 px-6">
                  {metric?.aiScore ? (
                    <span className="text-xl font-extrabold text-cyan-600 dark:text-cyan-400">
                      {metric.aiScore.finalScore.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-slate-400">N/A</span>
                  )}
                </TableCell>
              );
            })}
          </TableRow>

          {/* Chi tiết Điểm AI (Impact & Recency) */}
          <TableRow className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10">
            <TableCell className="text-slate-500 dark:text-slate-400 pl-10 py-3 px-6 text-xs">
              ↳ Ảnh hưởng theo tuổi
            </TableCell>
            {papers.map((paper) => {
              const metric = getMetricForPaper(paper.id);
              return (
                <TableCell key={paper.id} className="py-3 px-6 text-sm text-slate-600 dark:text-slate-400">
                  {metric?.aiScore ? metric.aiScore.citationImpactScore.toFixed(2) : "N/A"}
                </TableCell>
              );
            })}
          </TableRow>
          <TableRow className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10">
            <TableCell className="text-slate-500 dark:text-slate-400 pl-10 py-3 px-6 text-xs">
              ↳ Độ mới (Recency)
            </TableCell>
            {papers.map((paper) => {
              const metric = getMetricForPaper(paper.id);
              return (
                <TableCell key={paper.id} className="py-3 px-6 text-sm text-slate-600 dark:text-slate-400">
                  {metric?.aiScore ? metric.aiScore.recencyScore.toFixed(2) : "N/A"}
                </TableCell>
              );
            })}
          </TableRow>

          {/* --- SECTION: QUALITATIVE LLM COMPARISON --- */}
          <TableRow className="bg-slate-50/30 dark:bg-zinc-900/5 border-b border-slate-200 dark:border-slate-800">
            <TableCell colSpan={papers.length + 1} className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 py-2.5 px-6">
              Đánh giá định tính (LLM Qualitative Dimensions)
            </TableCell>
          </TableRow>

          {llmComparison?.dimensions.map((dim) => (
            <TableRow key={dim.name} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 align-top">
              <TableCell className="font-semibold text-slate-700 dark:text-slate-300 py-4 px-6 text-sm">
                {dimensionNames[dim.name] || dim.name}
              </TableCell>
              {papers.map((_, idx) => (
                <TableCell key={idx} className="py-4 px-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                  {dim.perPaper[idx] || (
                    <span className="text-slate-400 italic">Đang phân tích hoặc không khả dụng...</span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
