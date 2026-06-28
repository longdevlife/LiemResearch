import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ExternalLink,
  Bookmark,
  Quote,
  Link2,
  ChevronRight,
  UserPlus,
  FileText,
  Download,
  Upload,
  Check,
  Info,
  Loader2,
  Trash2,
  X,
  Edit,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePaper } from "@/features/papers";
import { useBookmarkStatus, useCreateBookmark, useDeleteBookmark } from "@/features/bookmarks";
import { usePaperReportCount } from "@/features/reports/hooks/use-paper-report-count";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/services/api-client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function PaperDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: paper, isLoading, refetch } = usePaper(id);
  const { data: bookmarkStatus } = useBookmarkStatus("paper", id);
  const createBookmark = useCreateBookmark();
  const deleteBookmark = useDeleteBookmark();
  const { data: reportCount, isLoading: isReportCountLoading } = usePaperReportCount(id);
  const queryClient = useQueryClient();

  const [ratingView, setRatingView] = useState<any>(null);
  const [ratingLoading, setRatingLoading] = useState(true);

  const fetchRatingView = async () => {
    try {
      const res = await api.get(`/quality/paper/${id}`);
      if (res.data.success) {
        setRatingView(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch paper rating view:", err);
    } finally {
      setRatingLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRatingView();
    }
  }, [id]);

  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [deletingPdf, setDeletingPdf] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === "admin";

  const handleUploadPdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
        setUploadingPdf(true);
        toast.loading("Uploading PDF...", { id: "pdf-upload" });
        try {
          const formData = new FormData();
          formData.append("pdf", file);
          await api.post(`/papers/${id}/upload-pdf`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          toast.success("PDF uploaded successfully!", { id: "pdf-upload" });
          refetch();
        } catch (error: any) {
          console.error(error);
          toast.error(error.response?.data?.error?.message || "Failed to upload PDF", { id: "pdf-upload" });
        } finally {
          setUploadingPdf(false);
        }
      } else {
        toast.error("Only PDF files are allowed");
      }
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/papers/${id}/pdf-url`);
      const { downloadUrl, cost } = res.data.data;
      window.open(downloadUrl, "_blank");
      if (cost > 0) {
        toast.success(`PDF downloaded. ${cost} credits deducted.`);
        // Instant credit update on UI!
        try {
          const resMe = await api.get("/auth/me");
          if (resMe.data.success) {
            useAuthStore.setState({ user: resMe.data.data.user });
            queryClient.setQueryData(["current-user"], resMe.data.data);
          }
        } catch (e) {
          queryClient.invalidateQueries({ queryKey: ["current-user"] });
        }
      } else {
        toast.success("PDF download started.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error?.message || "Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleAcceptPdf = async () => {
    if (!confirm("Are you sure you want to accept this PDF?")) return;
    setAccepting(true);
    try {
      await api.patch(`/papers/${id}/accept-pdf`);
      toast.success("PDF accepted successfully!");
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Failed to accept PDF");
    } finally {
      setAccepting(false);
    }
  };

  const handleRejectPdf = async () => {
    if (!confirm("Are you sure you want to reject this PDF? This will remove the PDF and deduct penalty points from uploader.")) return;
    setRejecting(true);
    try {
      await api.patch(`/papers/${id}/reject-pdf`);
      toast.success("PDF rejected and removed.");
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Failed to reject PDF");
    } finally {
      setRejecting(false);
    }
  };

  const handleDeletePdf = async () => {
    if (!confirm("Are you sure you want to delete this PDF? This is an admin operation.")) return;
    setDeletingPdf(true);
    try {
      await api.delete(`/papers/${id}/pdf`);
      toast.success("PDF deleted successfully.");
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Failed to delete PDF");
    } finally {
      setDeletingPdf(false);
    }
  };

  if (isLoading) {
    return <div className="container py-8 text-center text-slate-500 mt-20">Loading paper details...</div>;
  }

  if (!paper) {
    return <div className="container py-8 text-center text-slate-500 mt-20">Paper not found.</div>;
  }

  const isBookmarked = !!bookmarkStatus?.bookmarked;
  const bookmarkId = bookmarkStatus?.bookmarkId;

  const isRequester = paper.requestedBy?._id === currentUser?.id;
  const isUploader = paper.uploadedBy?._id === currentUser?.id;
  const isOwner = isRequester || isUploader;
  const isPdfAvailable = paper.pdfPath && paper.paperStatus === "downloaded";
  
  const isWaitingRequesterAccept =
    paper.paperStatus === "pending-requester-acceptance" ||
    (paper.paperStatus === "pending" && !!paper.pdfPath && paper.uploadedBy?._id !== paper.requestedBy?._id);

  const canAcceptPdf = !!currentUser && isRequester && isWaitingRequesterAccept && !!paper.pdfPath;
  const isPrivateDownload = isAdmin || isRequester || isUploader;
  const canPublicDownload = !!isPdfAvailable && paper.qualityTier !== 0 && paper.downloadCost !== null;
  const canDownloadPdf = !!paper.pdfPath && (isPrivateDownload || canPublicDownload);

  const canUploadPdf = !!currentUser && !paper.pdfPath && paper.paperStatus !== "rejected" && (
    isAdmin || 
    isRequester || 
    paper.paperStatus === "not-downloaded" || 
    paper.paperStatus === "pending"
  );

  const handleBookmarkToggle = () => {
    if (isBookmarked && bookmarkId) {
      deleteBookmark.mutate({ id: bookmarkId, targetKind: "paper", targetId: id! });
    } else {
      createBookmark.mutate({ targetKind: "paper", targetId: id! });
    }
  };

  const handleCopyCitation = () => {
    if (!paper) return;
    const authorString = paper.authors.length > 0
      ? paper.authors.map(a => a.displayName).join(", ")
      : "Unknown Authors";
    const titleString = paper.title.endsWith(".") ? paper.title : `${paper.title}.`;
    const journalString = paper.journalName ? `${paper.journalName}` : "";
    const citation = `${authorString} (${paper.publicationYear}). ${titleString}${journalString ? ` ${journalString}.` : ""}`;
    
    navigator.clipboard.writeText(citation).then(
      () => {
        toast.success("APA Citation copied to clipboard!");
      },
      () => {
        toast.error("Failed to copy citation.");
      }
    );
  };

  return (
    <main className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center text-xs font-medium text-slate-500 mb-6">
        <span className="hover:text-slate-900 cursor-pointer">Publication Trend</span>
        <ChevronRight className="w-3 h-3 mx-1" />
        <span className="text-slate-900 dark:text-white">Paper Detail</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Column */}
        <div className="flex-1 min-w-0">
          
          {/* Hero Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
              {paper.title}
            </h1>
            
            {/* Metadata Strip */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium mb-6">
              {paper.paperStatus && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                  paper.paperStatus === "pending"
                    ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                    : paper.paperStatus === "not-downloaded"
                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
                    : paper.paperStatus === "downloaded"
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : paper.paperStatus === "rejected"
                    ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20"
                    : "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20"
                }`}>
                  {paper.paperStatus === "pending"
                    ? "Pending Review"
                    : paper.paperStatus === "not-downloaded"
                    ? "Awaiting PDF"
                    : paper.paperStatus === "downloaded"
                    ? "Completed"
                    : paper.paperStatus === "rejected"
                    ? "Rejected"
                    : "Awaiting Acceptance"}
                </span>
              )}
              {paper.openAccessUrl && (
                <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Open Access
                </span>
              )}
              {paper.journalName && (
                <>
                  <span className="text-slate-700 dark:text-slate-300">{paper.journalName}</span>
                  <span className="text-slate-400">•</span>
                </>
              )}
              <span className="text-slate-500">Published {paper.publicationYear}</span>
              {paper.externalIds?.doi && (
                <>
                  <span className="text-slate-400">•</span>
                  <a href={`https://doi.org/${paper.externalIds.doi}`} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1">
                    DOI {paper.externalIds.doi} <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}
            </div>

            {/* Authors List */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              {paper.authors.slice(0, 5).map((author, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 border-2 border-white dark:border-slate-900 shadow-sm flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-400">
                    {author.displayName.charAt(0)}
                  </div>
                  <span className="text-sm font-semibold text-blue-800 dark:text-blue-400 cursor-pointer hover:underline">
                    {author.displayName}
                  </span>
                </div>
              ))}
              {paper.authors.length > 5 && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 shadow-sm flex items-center justify-center text-xs font-bold text-slate-500">
                    +{paper.authors.length - 5}
                  </div>
                  <span className="text-sm text-slate-500">et al.</span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 gap-4">
              <div className="flex items-center gap-3">
                {(paper.pdfPath && canDownloadPdf) || paper.openAccessUrl ? (
                  <Button
                    className="bg-blue-800 hover:bg-blue-900 text-white font-bold h-10 px-5 gap-2 rounded-lg"
                    onClick={() => {
                      if (paper.pdfPath && canDownloadPdf) {
                        handleDownloadPdf();
                      } else if (paper.openAccessUrl) {
                        window.open(paper.openAccessUrl, '_blank');
                      }
                    }}
                    disabled={downloading}
                  >
                    {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    Read PDF
                  </Button>
                ) : null}
                <Button 
                  variant={isBookmarked ? "default" : "outline"} 
                  className={`h-10 px-4 gap-2 font-bold rounded-lg ${
                    isBookmarked 
                      ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500 hover:border-amber-600" 
                      : "text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                  }`}
                  onClick={handleBookmarkToggle}
                  disabled={createBookmark.isPending || deleteBookmark.isPending}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} /> 
                  {isBookmarked ? "Saved" : "Save"}
                </Button>
                 <Button 
                  variant="outline" 
                  className="h-10 px-4 gap-2 text-slate-700 dark:text-slate-300 font-bold border-slate-300 dark:border-slate-700 rounded-lg"
                  onClick={handleCopyCitation}
                >
                  <Quote className="w-4 h-4" /> Cite
                </Button>
              </div>
              <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                <Link2 className="w-4 h-4" /> {paper.citationCount.toLocaleString()} Citations
              </div>
            </div>
          </div>

          {/* PDF Document Section */}
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm mb-10 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" /> PDF Document
            </h3>

            {paper.pdfPath ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/20">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-rose-500 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {paper.paperStatus === "downloaded"
                          ? "PDF is available for download"
                          : "PDF is awaiting requester acceptance"}
                      </p>
                      {paper.uploadedBy && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Uploaded by: <strong>{paper.uploadedBy.fullName}</strong>
                          {paper.uploadedBy.university && ` (${paper.uploadedBy.university})`}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Download cost / info */}
                  {paper.paperStatus === "downloaded" && (
                    <div className="text-xs text-slate-500 sm:text-right shrink-0">
                      {isPrivateDownload ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Free (Owner/Admin)</span>
                      ) : (
                        <span>Download Cost: <strong className="text-indigo-600 dark:text-indigo-400">{paper.downloadCost ?? 0} credits</strong></span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {paper.paperStatus === "rejected" && isRequester && (
                    <Link to={`/settings/submit-paper?edit=${id}`}>
                      <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-5 gap-2 rounded-lg">
                        <Edit className="w-4 h-4" />
                        Edit & Resubmit
                      </Button>
                    </Link>
                  )}

                  {canDownloadPdf && (
                    <Button
                      onClick={handleDownloadPdf}
                      disabled={downloading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-5 gap-2 rounded-lg"
                    >
                      {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Download PDF
                    </Button>
                  )}

                  {canAcceptPdf && (
                    <>
                      <Button
                        onClick={handleAcceptPdf}
                        disabled={accepting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-5 gap-2 rounded-lg"
                      >
                        {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Accept PDF
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleRejectPdf}
                        disabled={rejecting}
                        className="text-red-600 hover:bg-red-50 border-red-200 dark:border-red-900/50 dark:hover:bg-red-950/20 font-bold h-10 px-5 gap-2 rounded-lg"
                      >
                        {rejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        Reject PDF
                      </Button>
                    </>
                  )}

                  {isAdmin && (
                    <Button
                      variant="outline"
                      onClick={handleDeletePdf}
                      disabled={deletingPdf}
                      className="text-red-600 border-red-200 dark:border-red-900/50 dark:hover:bg-red-950/20 font-bold h-10 px-5 gap-2 rounded-lg"
                    >
                      {deletingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Delete PDF
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl p-8 text-center bg-slate-50/30 dark:bg-zinc-900/10">
                <p className="text-slate-500 dark:text-zinc-500 text-sm mb-4">
                  {paper.paperStatus === "pending"
                    ? "Awaiting request approval from administrators before PDF can be uploaded."
                    : "No PDF document uploaded for this request yet."}
                </p>
                
                {canUploadPdf && (
                  <div className="max-w-md mx-auto">
                    <label
                      htmlFor="pdf-upload"
                      className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-400/50 rounded-lg p-6 bg-white dark:bg-zinc-950 cursor-pointer transition-all group"
                    >
                      <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mb-2 transition-colors" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Click to upload PDF</span>
                      <span className="text-xs text-slate-500 mt-1">PDF only (Max 10MB)</span>
                      <input id="pdf-upload" type="file" accept="application/pdf" className="hidden" onChange={handleUploadPdfChange} />
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Analysis Summary — intrinsic, real scores only (no fabricated
              fallbacks). Renders only when paper.aiScore exists. Visual polish
              is AG's (handoff §1). */}
          {paper.aiScore && (
            <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm mb-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 flex items-center justify-center">
                    <SparklesIcon />
                  </div>
                  AI Analysis Summary
                </h2>
                <span className="text-xs font-medium text-slate-500">Overall {paper.aiScore.finalScore.toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {/* Impact */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Impact</span>
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none">
                      {paper.aiScore.citationImpactScore.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-600 dark:bg-cyan-500 rounded-full" style={{ width: `${paper.aiScore.citationImpactScore * 100}%` }}></div>
                  </div>
                </div>
                {/* Recency */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recency</span>
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none">
                      {paper.aiScore.recencyScore.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-600 dark:bg-cyan-500 rounded-full" style={{ width: `${paper.aiScore.recencyScore * 100}%` }}></div>
                  </div>
                </div>
                {/* Metadata Quality */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Metadata Quality</span>
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none">
                      {paper.aiScore.metadataQualityScore.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-600 dark:bg-cyan-500 rounded-full" style={{ width: `${paper.aiScore.metadataQualityScore * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Abstract */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Abstract</h3>
            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed text-justify">
              <p>
                {paper.abstractText || "No abstract available for this paper."}
              </p>
            </div>
          </div>

          {/* Rating Section */}
          {!isAdmin && !isOwner && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-8 mb-8">
              <PaperRatingWidget
                paperId={id || ""}
                loading={ratingLoading}
                onSuccess={fetchRatingView}
              />
            </div>
          )}

        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-4">
          {/* AI Reports Citation Card */}
          <div className="bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950/30 dark:to-blue-950/30 border border-violet-200 dark:border-violet-800/50 rounded-xl p-5 shadow-sm">
            <div className="text-[10px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              AI Reports
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-extrabold text-violet-700 dark:text-violet-300 leading-none">
                  {isReportCountLoading ? "..." : (reportCount ?? 0)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {reportCount === 1 ? "AI report citing this paper" : "AI reports citing this paper"}
                </p>
              </div>
              <Link
                to="/reports"
                className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-200 underline-offset-2 hover:underline"
              >
                View reports →
              </Link>
            </div>
          </div>

          {/* Sticky Sidebar elements */}
          <div className="sticky top-24 flex flex-col gap-4">
            {/* Lead Author Card */}
            {paper.authors[0] && (
              <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">Lead Author</div>
                
                <div className="flex gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-lg font-bold text-blue-700 dark:text-blue-400">
                    {paper.authors[0].displayName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{paper.authors[0].displayName}</h4>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-1">Citations (Paper)</div>
                    <div className="text-base font-bold text-slate-900 dark:text-white">{paper.citationCount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-1">Data Quality</div>
                    <div className="text-base font-bold text-slate-900 dark:text-white">
                      {paper.dataQualityScore ? paper.dataQualityScore.toFixed(2) : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other Users' Ratings List */}
            <PaperReviewsList
              ratingView={ratingView}
              loading={ratingLoading}
              currentUser={currentUser}
              onSuccess={fetchRatingView}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

function PaperRatingWidget({
  paperId,
  loading,
  onSuccess,
}: {
  paperId: string;
  loading: boolean;
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/quality/rate", {
        targetKind: "paper",
        targetId: paperId,
        stars: rating,
        comment: comment.trim() || undefined,
      });
      if (res.data.success) {
        toast.success("Rating submitted! +5 contribution points earned.");
        setRating(0);
        setComment("");
        
        // Instant points/credits update on UI!
        try {
          const resMe = await api.get("/auth/me");
          if (resMe.data.success) {
            useAuthStore.setState({ user: resMe.data.data.user });
            queryClient.setQueryData(["current-user"], resMe.data.data);
          }
        } catch (e) {
          queryClient.invalidateQueries({ queryKey: ["current-user"] });
        }

        onSuccess();
      }
    } catch (err: any) {
      console.error("Failed to save rating:", err);
      toast.error(err.response?.data?.error?.message || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
      <div>
        <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          Rate this Research Paper
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Help the community gauge document quality! Earn +5 contribution points for your feedback.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2 py-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const active = hoverRating ? star <= hoverRating : star <= rating;
            return (
              <button
                key={star}
                type="button"
                className="transition-transform active:scale-95 duration-100"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`w-9 h-9 cursor-pointer transition-colors ${
                    active 
                      ? "text-amber-400 fill-amber-400 filter drop-shadow-[0_0_4px_rgba(250,204,21,0.35)]" 
                      : "text-slate-200 dark:text-slate-800"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="space-y-1.5">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write an optional comment about the methodology, data quality, or general feedback..."
            className="w-full text-sm bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 h-24 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white resize-none"
            maxLength={1000}
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-11 px-6 gap-2 rounded-xl"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit Feedback (+5 pts)
          </Button>
        </div>
      </form>
    </div>
  );
}

function PaperReviewsList({
  ratingView,
  loading,
  currentUser,
  onSuccess,
}: {
  ratingView: any;
  loading: boolean;
  currentUser: any;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-center shadow-sm">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" />
      </div>
    );
  }

  const allRatings = ratingView?.allRatings || [];
  const averageRating = ratingView?.ratingSummary?.averageRating ?? ratingView?.ratingSummary?.avg ?? 0;
  const totalRatings = ratingView?.ratingSummary?.totalRatings ?? ratingView?.ratingSummary?.count ?? 0;

  const handleDeleteReview = async (ratingId: string) => {
    if (!confirm("Are you sure you want to delete your review?")) return;
    try {
      const res = await api.delete(`/quality/rate/${ratingId}`);
      if (res.data.success) {
        toast.success("Review deleted successfully.");
        
        // Instant points/credits update on UI!
        try {
          const resMe = await api.get("/auth/me");
          if (resMe.data.success) {
            useAuthStore.setState({ user: resMe.data.data.user });
            queryClient.setQueryData(["current-user"], resMe.data.data);
          }
        } catch (e) {
          queryClient.invalidateQueries({ queryKey: ["current-user"] });
        }

        onSuccess();
      }
    } catch (err: any) {
      console.error("Failed to delete review:", err);
      toast.error(err.response?.data?.error?.message || "Failed to delete review");
    }
  };

  return (
    <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col gap-2">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
          User Ratings & Reviews
        </h3>
        
        {totalRatings > 0 ? (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-zinc-800 w-fit">
            <span className="text-amber-500 flex items-center gap-0.5">
              ★ {averageRating.toFixed(1)}
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>{totalRatings} user {totalRatings === 1 ? "rating" : "ratings"}</span>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No ratings yet. Be the first to review this research paper!
          </p>
        )}
      </div>

      {allRatings.length > 0 && (
        <div className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-[350px] overflow-y-auto pr-1 space-y-3">
          {allRatings.map((rating: any, index: number) => {
            const userInit = rating.user?.fullName?.charAt(0) || "?";
            const userName = rating.user?.fullName || "Anonymous";
            const isMyReview = rating.user?.id === currentUser?.id;
            return (
              <div key={rating.id || index} className="pt-3 first:pt-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-400">
                      {userInit}
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[100px]" title={userName}>
                      {userName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= rating.stars ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-slate-800"
                          }`}
                        />
                      ))}
                    </div>
                    {isMyReview && (
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(rating.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="Delete review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {rating.comment && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50/50 dark:bg-zinc-950/20 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800/50 break-words leading-relaxed">
                    "{rating.comment}"
                  </p>
                )}
                <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1 text-right">
                  {new Date(rating.updatedAt).toLocaleDateString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
