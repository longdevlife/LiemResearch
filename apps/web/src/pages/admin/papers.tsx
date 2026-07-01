import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api-client";
import { toast } from "sonner";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth";

interface AdminPaper {
  id: string;
  title: string;
  paperStatus: string;
  dataStatus: string;
  publicationYear: number;
  paperKind?: string;
  externalIds?: { doi?: string };
  qualityScore?: number;
  qualityTier?: number;
  qualityTierName?: string;
  downloadCost?: number | null;
  uploadCreditReward?: number;
  pdfPath?: string;
  requestedBy?: string;
  createdAt: string;
}

const STATUS_OPTIONS = ["all", "pending", "not-downloaded", "downloaded", "rejected", "pending-requester-acceptance"];
const STATUS_LABELS: Record<string, string> = {
  all: "All",
  pending: "Pending",
  "not-downloaded": "Approved (No PDF)",
  downloaded: "Completed",
  rejected: "Rejected",
  "pending-requester-acceptance": "Awaiting Acceptance",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50 dark:text-amber-400",
  "not-downloaded": "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/50 dark:text-blue-400",
  downloaded: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/50 dark:text-emerald-400",
  rejected: "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/50 dark:text-red-400",
  "pending-requester-acceptance": "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800/50 dark:text-purple-400",
};
const TIER_COLORS: Record<number, string> = { 0: "text-slate-500", 1: "text-blue-500", 2: "text-green-500", 3: "text-purple-500", 4: "text-yellow-500" };

const PAGE_SIZE = 15;

export function AdminPapersPage() {
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const isAdmin = user?.user?.role === "admin";

  const [papers, setPapers] = useState<AdminPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchPapers = async () => {
    if (isUserLoading || !isAdmin) return;
    setLoading(true);
    try {
      const params: Record<string, string | number> = { adminView: "1", page, pageSize: PAGE_SIZE };
      if (statusFilter !== "all") params.status = statusFilter;
      if (search) params.search = search;
      const res = await api.get("/papers", { params });
      setPapers(res.data.data ?? []);
      setTotal(res.data.meta?.total ?? 0);
    } catch {
      toast.error("Failed to load paper list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isUserLoading && isAdmin) {
      fetchPapers();
    } else if (!isUserLoading && !isAdmin) {
      setLoading(false);
    }
  }, [statusFilter, search, page, isUserLoading, isAdmin]);

  const updateStatus = async (paperId: string, status: string, rejectionReason?: string) => {
    setUpdatingId(paperId);
    try {
      await api.patch(`/papers/${paperId}/status`, { status, rejectionReason });
      toast.success(`Paper status updated to "${STATUS_LABELS[status] ?? status}"`);
      fetchPapers();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message ?? "Failed to update status");
    } finally {
      setUpdatingId(null);
      setRejectingId(null);
      setRejectReason("");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Paper Requests</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage all paper submission requests from users.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or DOI..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
            className="pl-9 pr-3 h-9 w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <Button size="sm" onClick={() => { setSearch(searchInput); setPage(1); }}>
          <Search className="w-4 h-4 mr-1" /> Search
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : papers.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">No papers found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {papers.map((paper) => {
            const statusColor = STATUS_COLORS[paper.paperStatus] ?? "";
            const tierColor = TIER_COLORS[paper.qualityTier ?? 0] ?? "text-slate-500";

            return (
              <div key={paper.id} className="bg-white dark:bg-[#0e0e11] border border-slate-200/80 dark:border-zinc-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <Link to={`/papers/${paper.id}`} className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-1">
                      {paper.title}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {paper.publicationYear}
                      {paper.externalIds?.doi && <span> · <span className="font-mono">{paper.externalIds.doi}</span></span>}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${statusColor}`}>
                    {STATUS_LABELS[paper.paperStatus] ?? paper.paperStatus}
                  </span>
                </div>

                {/* Quality */}
                {paper.qualityScore !== undefined && paper.qualityScore > 0 && (
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>Score: <strong className={tierColor}>{paper.qualityScore}/100</strong></span>
                    {paper.qualityTierName && <span>· <strong className={tierColor}>{paper.qualityTierName}</strong></span>}
                    {paper.downloadCost != null && <span>· Download: <strong>{paper.downloadCost} cr</strong></span>}
                    {paper.uploadCreditReward && paper.uploadCreditReward > 0 && (
                      <span>· Reward: <strong className="text-emerald-500">+{paper.uploadCreditReward} cr</strong></span>
                    )}
                  </div>
                )}

                {/* Admin actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {paper.paperStatus === "pending" && (
                    <>
                      <Button
                        size="sm"
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={updatingId === paper.id}
                        onClick={() => updateStatus(paper.id, "not-downloaded")}
                      >
                        {updatingId === paper.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-red-600 border-red-200"
                        onClick={() => setRejectingId(paper.id)}
                      >
                        <XCircle className="w-3 h-3 mr-1" /> Reject
                      </Button>
                    </>
                  )}

                  {(paper.paperStatus === "not-downloaded" || paper.paperStatus === "downloaded") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-red-600 border-red-200"
                      disabled={updatingId === paper.id}
                      onClick={() => setRejectingId(paper.id)}
                    >
                      <XCircle className="w-3 h-3 mr-1" /> Revoke Approval
                    </Button>
                  )}

                  {/* Rejection form inline */}
                  {rejectingId === paper.id && (
                    <div className="w-full flex gap-2 mt-1">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Enter rejection reason (min 5 chars)..."
                        className="flex-1 h-8 px-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-1 focus:ring-red-400"
                      />
                      <Button
                        size="sm"
                        className="text-xs bg-red-600 hover:bg-red-700 text-white"
                        disabled={updatingId === paper.id}
                        onClick={() => updateStatus(paper.id, "rejected", rejectReason)}
                      >
                        Confirm Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => { setRejectingId(null); setRejectReason(""); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-slate-500">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} papers
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm px-3 py-1 border rounded-md dark:border-zinc-800">
              {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
