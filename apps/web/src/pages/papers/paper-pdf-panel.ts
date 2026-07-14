type UserRole = "student" | "lecturer" | "researcher" | "admin";

type PaperStatus =
  | "pending"
  | "not-downloaded"
  | "downloaded"
  | "rejected"
  | "pending-requester-acceptance";

export interface PaperPdfPanelInput {
  paper: {
    pdfPath?: string;
    paperStatus?: PaperStatus;
    qualityTier?: number;
    downloadCost?: number | null;
    requestedBy?: { _id: string };
    uploadedBy?: { _id: string };
  };
  currentUser?: { id: string; role?: UserRole } | null;
}

export type PaperPdfPanelMode =
  | "hidden"
  | "pending-approval"
  | "upload"
  | "available"
  | "awaiting-acceptance";

export interface PaperPdfPanelState {
  mode: PaperPdfPanelMode;
  shouldShowPanel: boolean;
  isRequester: boolean;
  isUploader: boolean;
  isOwner: boolean;
  isWaitingRequesterAccept: boolean;
  isPrivateDownload: boolean;
  canAcceptPdf: boolean;
  canDownloadPdf: boolean;
  canUploadPdf: boolean;
}

export function getPaperPdfPanelState({
  paper,
  currentUser,
}: PaperPdfPanelInput): PaperPdfPanelState {
  const isAdmin = currentUser?.role === "admin";
  const isRequester = paper.requestedBy?._id === currentUser?.id;
  const isUploader = paper.uploadedBy?._id === currentUser?.id;
  const isOwner = isRequester || isUploader;
  const hasPdf = Boolean(paper.pdfPath);
  const isPdfAvailable = hasPdf && paper.paperStatus === "downloaded";
  const isWaitingRequesterAccept =
    paper.paperStatus === "pending-requester-acceptance" ||
    (paper.paperStatus === "pending" && hasPdf && paper.uploadedBy?._id !== paper.requestedBy?._id);

  const canAcceptPdf = Boolean(currentUser && isRequester && isWaitingRequesterAccept && hasPdf);
  const isPrivateDownload = Boolean(isAdmin || isRequester || isUploader);
  const canPublicDownload = Boolean(
    isPdfAvailable &&
      paper.qualityTier !== 0 &&
      paper.downloadCost !== null &&
      paper.downloadCost !== undefined,
  );
  const canDownloadPdf = Boolean(hasPdf && (isPrivateDownload || canPublicDownload));
  const canUploadPdf = Boolean(
    currentUser &&
      !hasPdf &&
      paper.paperStatus === "not-downloaded" &&
      (isAdmin || isRequester),
  );
  const shouldShowPendingApproval = Boolean(
    currentUser &&
      !hasPdf &&
      paper.paperStatus === "pending" &&
      (isAdmin || isRequester),
  );

  let mode: PaperPdfPanelMode = "hidden";
  if (canUploadPdf) mode = "upload";
  else if (canAcceptPdf || isWaitingRequesterAccept) mode = "awaiting-acceptance";
  else if (canDownloadPdf || hasPdf) mode = "available";
  else if (shouldShowPendingApproval) mode = "pending-approval";

  return {
    mode,
    shouldShowPanel: mode !== "hidden",
    isRequester,
    isUploader,
    isOwner,
    isWaitingRequesterAccept,
    isPrivateDownload,
    canAcceptPdf,
    canDownloadPdf,
    canUploadPdf,
  };
}
