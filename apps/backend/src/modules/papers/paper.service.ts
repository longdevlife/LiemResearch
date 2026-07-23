import type { Paper, PaperRef } from "@trend/shared-types";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { PaperModel, type PaperDoc } from "./models/paper.model.js";
import { PaperDownloadModel } from "./models/paper-download.model.js";
import { AppError } from "../../common/exceptions/app-error.js";
import { env } from "../../config/env.js";
import type { SearchSortKey } from "./dto/paper-filters.schema.js";
import type { CreatePaperInput } from "./dto/create-paper.schema.js";
import { calculatePaperQuality, getQualityTier, QUALITY_TIERS } from "./paper-quality.js";
import { computePaperScore } from "../scoring/paper-score.js";
import {
  chargePaperRequestCreditChecked,
  refundPaperRequestCredit,
  rewardPaperUploadCredit,
  recordInvalidPdfUpload,
  chargePaperDownloadCredit,
  syncUserPoints,
  applyUploadCreditReward,
  clawbackUploadReward,
  REQUEST_PAPER_COST,
} from "../auth/points.service.js";
import { UserModel } from "../auth/models/user.model.js";
import { notificationService } from "../notifications/notification.service.js";
import { pdfStorageService } from "../../infrastructure/pdf-storage.service.js";
import { buildUserPaperRequestFilter } from "./paper-workflow.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ListPapersParams {
  q?: string;
  page: number;
  pageSize: number;
  yearFrom?: number;
  yearTo?: number;
  paperKinds?: string[];
  openAccess?: boolean;
  provider?: string;
  languages?: string[];
  sort?: SearchSortKey;
}

export interface ListPapersResult {
  papers: Paper[];
  total: number;
}

export interface CountPapersParams {
  topic?: string;
  yearFrom?: number;
  yearTo?: number;
  keyword?: string;
}

export interface AdminListPapersParams {
  status?: string;
  search?: string;
  page: number;
  pageSize: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildTitleDuplicateRegex(title: string): RegExp {
  const escaped = title.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`^${escaped}$`, "i");
}

function isApprovedStatus(status: string): boolean {
  return ["downloaded", "not-downloaded", "pending-requester-acceptance"].includes(status);
}

function isSameId(
  a: mongoose.Types.ObjectId | string | undefined | null,
  b: mongoose.Types.ObjectId | string | undefined | null,
): boolean {
  if (!a || !b) return false;
  return a.toString() === b.toString();
}

async function deleteStoredPdf(pdfPath: string): Promise<void> {
  await pdfStorageService.deletePdf(pdfPath);
}

function buildQualityScoreUpdate(
  paper: Record<string, any>,
  quality = calculatePaperQuality(paper),
) {
  const dataQualityScore = quality.qualityScore / 100;
  const aiScore = computePaperScore(
    {
      publicationYear: Number(paper.publicationYear ?? 0),
      citationCount: Number(paper.citationCount ?? 0),
      dataQualityScore,
      fwci: paper.fwci,
      citationNormalizedPercentile: paper.citationNormalizedPercentile,
    },
    new Date().getFullYear(),
    new Date().toISOString(),
  );

  return {
    ...quality,
    dataQualityScore,
    isAiAnalyzable: dataQualityScore >= 0.7 && Boolean(String(paper.abstractText ?? "").trim()),
    aiScore,
  };
}

// ── Service ──────────────────────────────────────────────────────────────────

export const paperService = {
  /**
   * Keyword search over title + abstract with server-side filters + sort.
   * `total` is a true `countDocuments` over the same filter, so the count and
   * the pager always agree (Cách 2). `relevance` sort uses Mongo's text score
   * when a query is present, otherwise falls back to recency.
   */
  async list({
    q,
    page,
    pageSize,
    yearFrom,
    yearTo,
    paperKinds,
    openAccess,
    provider,
    languages,
    sort = "relevance",
  }: ListPapersParams): Promise<ListPapersResult> {
    // Public listing shows only ACTIVE papers — unreviewed user submissions
    // (draft/pending) and rejected papers must NOT leak into the public corpus.
    const filter: Record<string, unknown> = { dataStatus: "active" };
    if (q) filter.$text = { $search: q };
    if (paperKinds && paperKinds.length) filter.paperKind = { $in: paperKinds };
    if (openAccess) filter.openAccessUrl = { $type: "string", $ne: "" };
    if (provider) filter.primaryProvider = provider;
    if (languages && languages.length > 0) {
      filter.language = { $in: languages.map((value) => value.toLowerCase()) };
    }
    if (yearFrom !== undefined || yearTo !== undefined) {
      filter.publicationYear = {
        ...(yearFrom !== undefined ? { $gte: yearFrom } : {}),
        ...(yearTo !== undefined ? { $lte: yearTo } : {}),
      };
    }

    const useTextScore = sort === "relevance" && !!q;
    const sortSpec: Record<string, 1 | -1 | { $meta: "textScore" }> =
      sort === "year"
        ? { publicationYear: -1, citationCount: -1 }
        : sort === "citations"
          ? { citationCount: -1, publicationYear: -1 }
          : useTextScore
            ? { score: { $meta: "textScore" } }
            : { publicationYear: -1, citationCount: -1 };

    let query = PaperModel.find(filter);
    if (useTextScore) query = query.select({ score: { $meta: "textScore" } });

    const [docs, total] = await Promise.all([
      query
        .sort(sortSpec)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      PaperModel.countDocuments(filter),
    ]);
    return { papers: docs.map(toPaperDto), total };
  },

  async getById(id: string): Promise<Paper | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await PaperModel.findById(id)
      .populate("requestedBy", "fullName email institution role avatarUrl")
      .populate("uploadedBy", "fullName email institution role avatarUrl")
      .lean();
    return doc ? toPaperDto(doc as any) : null;
  },

  /** Resolve a paper's referenced OpenAlex IDs to the papers we hold in corpus. */
  async getReferences(
    id: string,
  ): Promise<{ references: PaperRef[]; totalReferenced: number; inCorpus: number }> {
    const paper = await PaperModel.findById(id).select("+referencedWorks").lean();
    if (!paper) throw AppError.notFound("Paper not found");
    const refs = (paper as { referencedWorks?: string[] }).referencedWorks ?? [];
    if (refs.length === 0) return { references: [], totalReferenced: 0, inCorpus: 0 };
    const docs = await PaperModel.find({ "externalIds.openalexId": { $in: refs } })
      .select("title publicationYear authors externalIds")
      .lean();
    const references = docs.map(toPaperRef);
    return { references, totalReferenced: refs.length, inCorpus: references.length };
  },

  /** Resolve paper ids to PaperRefs in the SAME order as `ids` (RETRIEVAL ORDER). */
  async getSummariesByIds(ids: string[]): Promise<PaperRef[]> {
    // groundingPaperIds from a .lean() report are ObjectId[]; stringify so the
    // Map lookup in orderByIds (keyed by String(_id)) matches.
    const strIds = ids.map((x) => String(x));
    if (strIds.length === 0) return [];
    const docs = await PaperModel.find({ _id: { $in: strIds } })
      .select("title publicationYear authors externalIds")
      .lean();
    return orderByIds(docs.map(toPaperRef), strIds);
  },

  /** Count active papers matching topic/year/keyword filters (gap corpus check). */
  async count({ topic, yearFrom, yearTo, keyword }: CountPapersParams): Promise<{ count: number }> {
    const filter: Record<string, unknown> = { dataStatus: "active" };
    if (topic) filter["topics.topicName"] = topic;
    if (keyword) filter.$text = { $search: keyword };
    if (yearFrom !== undefined || yearTo !== undefined) {
      filter.publicationYear = {
        ...(yearFrom !== undefined ? { $gte: yearFrom } : {}),
        ...(yearTo !== undefined ? { $lte: yearTo } : {}),
      };
    }
    const count = await PaperModel.countDocuments(filter);
    return { count };
  },

  /**
   * Create a new paper REQUEST (Legacy flow).
   * - User: deduct 100 credits, status = "pending", notify admins.
   * - Admin: no credit deduction, with PDF → status = "downloaded"; without PDF → "not-downloaded".
   */
  async create(
    userId: string,
    isAdmin: boolean,
    input: CreatePaperInput,
    pdfPath?: string,
  ): Promise<Paper> {
    // 1. Duplicate check
    const duplicateFilters: Record<string, unknown>[] = [
      { title: buildTitleDuplicateRegex(input.title.trim()) },
    ];
    if (input.doi) duplicateFilters.push({ "externalIds.doi": input.doi.trim() });
    if (input.paperLink) duplicateFilters.push({ paperLink: input.paperLink.trim() });
    if (input.openAccessUrl) duplicateFilters.push({ openAccessUrl: input.openAccessUrl.trim() });

    const duplicate = await PaperModel.findOne({ $or: duplicateFilters }).lean();
    if (duplicate) {
      throw AppError.conflict("A paper with this title, DOI, or link already exists");
    }

    // 2. Calculate quality score
    const rawData = {
      title: input.title.trim(),
      authors: input.authors,
      publicationYear: input.publicationYear,
      abstractText: input.abstractText.trim(),
      keywords: input.keywords,
      topics: input.topics,
      doi: input.doi,
      openAccessUrl: input.openAccessUrl,
      paperLink: input.paperLink,
      pdfPath,
      isDuplicate: false,
      needsDuplicateReview: false,
    };
    const quality = calculatePaperQuality(rawData);
    const tierDef = QUALITY_TIERS.find((t) => t.tier === quality.qualityTier) ?? QUALITY_TIERS[0]!;

    // 3. Determine paperStatus
    let paperStatus: string;
    if (isAdmin) {
      paperStatus = pdfPath ? "downloaded" : "not-downloaded";
    } else {
      paperStatus = "pending";
    }

    // 3.5 Charge the request fee for non-admins — ATOMIC check-and-charge. Without
    //     this the request was FREE while cancel/reject refunded +100 → infinite-credit
    //     glitch. Insufficient balance → reject before persisting anything.
    if (!isAdmin) {
      const charged = await chargePaperRequestCreditChecked(userId);
      if (!charged) {
        throw AppError.badRequest(
          `Bạn cần tối thiểu ${REQUEST_PAPER_COST} credits để gửi yêu cầu tạo bài.`,
        );
      }
    }

    // 4. Persist — also stamp an intrinsic aiScore so a freshly-uploaded paper
    //    shows its AI score immediately (citations 0 until/if enriched; recency-driven),
    //    instead of waiting for the next batch score:recompute. isAiAnalyzable is already
    //    true, so the embedding worker picks it up for semantic search/RAG/compare.
    const qualityScoreUpdate = buildQualityScoreUpdate(rawData, quality);
    let paperDoc;
    try {
      paperDoc = await PaperModel.create({
      title: input.title.trim(),
      abstractText: input.abstractText.trim(),
      publicationYear: input.publicationYear,
      paperKind: input.paperKind,
      paperLink: input.paperLink?.trim(),
      externalIds: input.doi ? { doi: input.doi.trim() } : undefined,
      openAccessUrl: input.openAccessUrl || undefined,
      authors: input.authors,
      keywords: input.keywords,
      topics: input.topics,
      primaryProvider: "user",
      dataStatus: isAdmin ? "active" : "draft",
      pdfPath,
      requestedBy: new mongoose.Types.ObjectId(userId),
      uploadedBy: pdfPath ? new mongoose.Types.ObjectId(userId) : undefined,
      uploadedAt: pdfPath ? new Date() : undefined,
      paperStatus,
      ...qualityScoreUpdate,
      qualityTierName: tierDef.name,
      });
    } catch (err) {
      // The atomic charge already deducted credits; refund if persistence fails so a
      // failed insert (e.g. a duplicate that slipped past the pre-check) doesn't eat the fee.
      if (!isAdmin) await refundPaperRequestCredit(userId);
      throw err;
    }

    // 5. Credit operations
    if (isAdmin && pdfPath) {
      await applyUploadCreditReward({
        _id: paperDoc._id as mongoose.Types.ObjectId,
        uploadedBy: paperDoc.uploadedBy as mongoose.Types.ObjectId | undefined,
        paperStatus: paperDoc.paperStatus,
        uploadCreditReward: paperDoc.uploadCreditReward,
        uploadRewardedAt: paperDoc.uploadRewardedAt ?? null,
      });
    }

    if (!isAdmin) {
      await syncUserPoints(userId);

      // Notify the user who uploaded the paper
      await notificationService.create({
        userId,
        title: "Paper Submission Pending",
        message: `Your paper submission request for '${paperDoc.title}' is pending review.`,
        type: "submission_pending",
        paperId: paperDoc._id,
      });

      // Notify all admins about the new paper submission request
      const userDoc = await UserModel.findById(userId).lean();
      const userFullName = userDoc?.fullName || "A user";
      await notificationService.create({
        role: "admin",
        title: "New Paper Submission Request",
        message: `User ${userFullName} has submitted a new paper: '${paperDoc.title}'.`,
        type: "submission_pending",
        paperId: paperDoc._id,
      });
    }

    return toPaperDto(paperDoc as unknown as PaperDoc);
  },

  /** Get all paper requests submitted by a specific user. */
  async getMyPapers(userId: string): Promise<Paper[]> {
    const docs = await PaperModel.find({ requestedBy: new mongoose.Types.ObjectId(userId) })
      .populate("requestedBy", "fullName email institution role avatarUrl")
      .populate("uploadedBy", "fullName email institution role avatarUrl")
      .sort({ createdAt: -1 })
      .lean();
    return docs.map(toPaperDto as any);
  },

  /** Admin: list all papers with optional status/search filter and pagination. */
  async getAllPapersAdmin({
    status,
    search,
    page,
    pageSize,
  }: AdminListPapersParams): Promise<ListPapersResult> {
    const filter: Record<string, unknown> = buildUserPaperRequestFilter(status);
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ title: rx }, { "externalIds.doi": rx }];
    }
    const [docs, total] = await Promise.all([
      PaperModel.find(filter)
        .populate("requestedBy", "fullName email institution role avatarUrl")
        .populate("uploadedBy", "fullName email institution role avatarUrl")
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      PaperModel.countDocuments(filter),
    ]);
    return { papers: docs.map(toPaperDto as any), total };
  },

  /**
    * Upload a PDF to an existing paper request.
    * - Admin: publishes the PDF immediately.
    * - User uploading to an imported paper: sends the PDF to admin review.
    * - Other contributors on requested papers: waits for requester confirmation, then admin review.
    */
  async uploadPdf(
    paperId: string,
    uploaderId: string,
    uploaderRole: string,
    pdfPath: string,
  ): Promise<Paper> {
    if (!mongoose.Types.ObjectId.isValid(paperId)) throw AppError.badRequest("Invalid paper id");

    const paper = await PaperModel.findById(paperId);
    if (!paper) throw AppError.notFound("Paper not found");
    if (paper.pdfPath) throw AppError.conflict("This paper already has a PDF uploaded");
    if (paper.paperStatus === "rejected") {
      throw AppError.badRequest("Cannot upload a PDF for a rejected paper");
    }

    const isAdminUpload = uploaderRole === "admin";
    const isRequesterUpload = isSameId(paper.requestedBy, uploaderId);
    const isImportedPaper = !paper.requestedBy;
    const effectiveStatus = paper.paperStatus ?? (isImportedPaper ? "not-downloaded" : "pending");
    const isApproved = isApprovedStatus(effectiveStatus);

    if (!isAdminUpload && !isRequesterUpload && !isApproved) {
      throw AppError.forbidden("You can only upload a PDF after the request is approved");
    }

    // Determine next status
    let nextStatus: string;
    if (isAdminUpload) {
      nextStatus = "downloaded";
    } else if (isRequesterUpload) {
      nextStatus = "pending";
    } else if (isImportedPaper) {
      nextStatus = "pending";
    } else {
      nextStatus = "pending-requester-acceptance";
    }

    const nextDataStatus =
      nextStatus === "downloaded" || (isImportedPaper && paper.dataStatus === "active")
        ? "active"
        : "draft";

    const qualityInput = { ...paper.toObject(), pdfPath };
    const quality = calculatePaperQuality(qualityInput);
    const qualityScoreUpdate = buildQualityScoreUpdate(qualityInput, quality);
    const tierDef = QUALITY_TIERS.find((t) => t.tier === quality.qualityTier) ?? QUALITY_TIERS[0]!;

    const updated = await PaperModel.findByIdAndUpdate(
      paperId,
      {
        pdfPath,
        uploadedBy: new mongoose.Types.ObjectId(uploaderId),
        uploadedAt: new Date(),
        paperStatus: nextStatus,
        dataStatus: nextDataStatus,
        ...qualityScoreUpdate,
        qualityTierName: tierDef.name,
      },
      { new: true },
    );

    if (!updated) throw AppError.notFound("Paper not found");

    await applyUploadCreditReward({
      _id: updated._id as mongoose.Types.ObjectId,
      uploadedBy: updated.uploadedBy as mongoose.Types.ObjectId | undefined,
      paperStatus: updated.paperStatus,
      uploadCreditReward: updated.uploadCreditReward,
      uploadRewardedAt: updated.uploadRewardedAt ?? null,
    });

    await syncUserPoints(uploaderId);
    if (nextStatus === "downloaded" && paper.requestedBy) {
      await syncUserPoints(paper.requestedBy.toString());
    }

    return toPaperDto(updated as unknown as PaperDoc);
  },

  /** Requester accepts the PDF uploaded by a contributor → status becomes "downloaded". */
  async acceptPdf(paperId: string, requesterId: string): Promise<Paper> {
    if (!mongoose.Types.ObjectId.isValid(paperId)) throw AppError.badRequest("Invalid paper id");

    const paper = await PaperModel.findById(paperId);
    if (!paper) throw AppError.notFound("Paper not found");
    if (!isSameId(paper.requestedBy, requesterId)) {
      throw AppError.forbidden("Only the requester can accept this PDF");
    }
    if (paper.paperStatus !== "pending-requester-acceptance") {
      throw AppError.badRequest("This paper does not have a PDF waiting for your acceptance");
    }

    const qualityInput = paper.toObject();
    const quality = calculatePaperQuality(qualityInput);
    const qualityScoreUpdate = buildQualityScoreUpdate(qualityInput, quality);
    const tierDef = QUALITY_TIERS.find((t) => t.tier === quality.qualityTier) ?? QUALITY_TIERS[0]!;

    const updated = await PaperModel.findByIdAndUpdate(
      paperId,
      {
        paperStatus: "pending",
        dataStatus: "draft",
        ...qualityScoreUpdate,
        qualityTierName: tierDef.name,
      },
      { new: true },
    );
    if (!updated) throw AppError.notFound("Paper not found");

    await applyUploadCreditReward({
      _id: updated._id as mongoose.Types.ObjectId,
      uploadedBy: updated.uploadedBy as mongoose.Types.ObjectId | undefined,
      paperStatus: updated.paperStatus,
      uploadCreditReward: updated.uploadCreditReward,
      uploadRewardedAt: updated.uploadRewardedAt ?? null,
    });

    if (updated.requestedBy) await syncUserPoints(updated.requestedBy.toString());
    if (updated.uploadedBy) await syncUserPoints(updated.uploadedBy.toString());

    return toPaperDto(updated as unknown as PaperDoc);
  },

  /** Requester rejects the uploaded PDF → PDF deleted, status reverts to "not-downloaded". */
  async rejectPdf(paperId: string, requesterId: string): Promise<Paper> {
    if (!mongoose.Types.ObjectId.isValid(paperId)) throw AppError.badRequest("Invalid paper id");

    const paper = await PaperModel.findById(paperId);
    if (!paper) throw AppError.notFound("Paper not found");
    if (!isSameId(paper.requestedBy, requesterId)) {
      throw AppError.forbidden("Only the requester can reject this PDF");
    }
    if (paper.paperStatus !== "pending-requester-acceptance") {
      throw AppError.badRequest("This paper does not have a PDF waiting for your review");
    }

    const rejectedUploaderId = paper.uploadedBy;
    const pdfToDelete = paper.pdfPath;

    const qualityInput = { ...paper.toObject(), pdfPath: "", uploadedBy: undefined };
    const quality = calculatePaperQuality(qualityInput);
    const qualityScoreUpdate = buildQualityScoreUpdate(qualityInput, quality);
    const tierDef = QUALITY_TIERS.find((t) => t.tier === quality.qualityTier) ?? QUALITY_TIERS[0]!;

    const updated = await PaperModel.findByIdAndUpdate(
      paperId,
      {
        $unset: { pdfPath: "", uploadedBy: "", uploadedAt: "" },
        paperStatus: "not-downloaded",
        dataStatus: "draft",
        ...qualityScoreUpdate,
        qualityTierName: tierDef.name,
      },
      { new: true },
    );
    if (!updated) throw AppError.notFound("Paper not found");

    // Delete the physical file
    if (pdfToDelete) await deleteStoredPdf(pdfToDelete);

    // Penalise the uploader
    if (rejectedUploaderId) {
      await recordInvalidPdfUpload(rejectedUploaderId.toString());
    }
    if (updated.requestedBy) await syncUserPoints(updated.requestedBy.toString());

    return toPaperDto(updated as unknown as PaperDoc);
  },

  /** Cancel a pending paper request and refund the request credit. */
  async cancelRequest(paperId: string, userId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(paperId)) throw AppError.badRequest("Invalid paper id");

    const paper = await PaperModel.findById(paperId);
    if (!paper) throw AppError.notFound("Paper not found");
    if (!isSameId(paper.requestedBy, userId)) {
      throw AppError.forbidden("You can only cancel your own paper requests");
    }
    if (paper.paperStatus !== "pending") {
      throw AppError.badRequest("Only pending paper requests can be cancelled");
    }

    // Atomic guarded delete: only the FIRST concurrent cancel matches (status still
    // "pending"), so only it refunds — a double-cancel race can't refund +100 twice.
    const deleted = await PaperModel.findOneAndDelete({ _id: paperId, paperStatus: "pending" });
    if (!deleted) throw AppError.badRequest("Only pending paper requests can be cancelled");
    if (deleted.pdfPath) await deleteStoredPdf(deleted.pdfPath);

    await refundPaperRequestCredit(userId);
    await syncUserPoints(userId);
  },

  /** Admin updates the paperStatus of any paper. Handles credit rewards/refunds. */
  async updateStatus(
    paperId: string,
    status: string,
    rejectionReason?: string,
  ): Promise<Paper> {
    if (!mongoose.Types.ObjectId.isValid(paperId)) throw AppError.badRequest("Invalid paper id");

    const ALLOWED = ["pending", "not-downloaded", "downloaded", "rejected"];
    if (!ALLOWED.includes(status)) throw AppError.badRequest("Invalid status");

    const paper = await PaperModel.findById(paperId);
    if (!paper) throw AppError.notFound("Paper not found");

    const previousStatus = paper.paperStatus ?? "pending";
    const wasApproved = isApprovedStatus(previousStatus);

    let targetStatus = status;
    if ((status === "downloaded" || status === "not-downloaded") && paper.pdfPath) {
      targetStatus = "downloaded";
    }
    const willBeApproved = isApprovedStatus(targetStatus);

    const updates: Record<string, unknown> = { paperStatus: targetStatus };

    if (targetStatus === "rejected") {
      if (!rejectionReason || rejectionReason.trim().length < 5) {
        throw AppError.badRequest("Rejection reason must be at least 5 characters");
      }
      updates.rejectionReason = rejectionReason.trim();
      updates.dataStatus = "draft";
    } else {
      updates.$unset = { rejectionReason: "" };
      updates.dataStatus = willBeApproved ? "active" : "draft";
    }

    const qualityInput = paper.toObject();
    const quality = calculatePaperQuality(qualityInput);
    const qualityScoreUpdate = buildQualityScoreUpdate(qualityInput, quality);
    const tierDef = QUALITY_TIERS.find((t) => t.tier === quality.qualityTier) ?? QUALITY_TIERS[0]!;
    Object.assign(updates, qualityScoreUpdate, { qualityTierName: tierDef.name });
    // Once the reward has been granted, FREEZE the stored uploadCreditReward: clawback must
    // reverse EXACTLY what was granted, so a later tier-table change (or re-score) must not
    // move it. Tier/downloadCost still re-score normally.
    if (paper.uploadRewardedAt) {
      updates.uploadCreditReward = paper.uploadCreditReward;
    }

    // Guard the transition on the OBSERVED previous status, so two concurrent admins
    // (e.g. double-clicking "reject") can't both run the refund/clawback side-effects.
    const updated = await PaperModel.findOneAndUpdate(
      { _id: paperId, paperStatus: previousStatus },
      updates,
      { new: true },
    );
    if (!updated) throw AppError.conflict("Paper status changed concurrently — please retry");

    // Reward upload credits when first approved
    if (!wasApproved && willBeApproved) {
      await applyUploadCreditReward({
        _id: updated._id as mongoose.Types.ObjectId,
        uploadedBy: updated.uploadedBy as mongoose.Types.ObjectId | undefined,
        paperStatus: updated.paperStatus,
        uploadCreditReward: updated.uploadCreditReward,
        uploadRewardedAt: updated.uploadRewardedAt ?? null,
      });

      if (updated.requestedBy) {
        await notificationService.create({
          userId: updated.requestedBy,
          title: "Paper Submission Approved",
          message: `Your paper submission '${updated.title}' has been approved successfully.`,
          type: "submission_approved",
          paperId: updated._id,
        });
      }
    }

    // Approval REVOKED (was approved → now rejected): claw back the upload reward the
    // uploader was granted on approval, so a revoke doesn't leave free credits behind.
    if (wasApproved && targetStatus === "rejected") {
      await clawbackUploadReward({
        _id: updated._id as mongoose.Types.ObjectId,
        uploadedBy: updated.uploadedBy as mongoose.Types.ObjectId | undefined,
        uploadCreditReward: updated.uploadCreditReward,
      });
    }

    // Notify user on rejection / revocation
    if (status === "rejected" && updated.requestedBy) {
      if (!wasApproved) {
        await refundPaperRequestCredit(updated.requestedBy.toString());

        await notificationService.create({
          userId: updated.requestedBy,
          title: "Paper Submission Rejected",
          message: `Your paper submission '${updated.title}' was rejected. Reason: ${rejectionReason || "No specific reason provided."}`,
          type: "submission_rejected",
          paperId: updated._id,
        });
      } else {
        await notificationService.create({
          userId: updated.requestedBy,
          title: "Paper Approval Revoked",
          message: `Your paper approval for '${updated.title}' has been revoked. Reason: ${rejectionReason || "No specific reason provided."}`,
          type: "submission_rejected",
          paperId: updated._id,
        });
      }
    }

    if (updated.requestedBy) await syncUserPoints(updated.requestedBy.toString());
    if (updated.uploadedBy) await syncUserPoints(updated.uploadedBy.toString());

    return toPaperDto(updated as unknown as PaperDoc);
  },

  /** Get a signed/local URL for the PDF. Deducts download credits. */
  async getPdfDownloadUrl(
    paperId: string,
    userId: string,
    userRole: string,
    baseUrl: string,
  ): Promise<{ downloadUrl: string; cost: number; isRepeatDownload: boolean }> {
    if (!mongoose.Types.ObjectId.isValid(paperId)) throw AppError.badRequest("Invalid paper id");

    const paper = await PaperModel.findById(paperId);
    if (!paper) throw AppError.notFound("Paper not found");
    if (!paper.pdfPath) throw AppError.notFound("PDF is not available for this paper");

    const isAdmin = userRole === "admin";
    const isOwner = isSameId(paper.requestedBy, userId) || isSameId(paper.uploadedBy, userId);

    if (!isAdmin && !isOwner) {
      if (paper.paperStatus !== "downloaded") {
        throw AppError.forbidden("PDF is not available for public download yet");
      }
      if (paper.qualityTier === 0 || paper.downloadCost === null) {
        throw AppError.forbidden("This paper does not meet the minimum quality score for download");
      }

      // Check if user has enough credits
      const user = await UserModel.findById(userId).select("credits").lean();
      const currentCredits = user?.credits ?? 0;

      const existingDownload = await PaperDownloadModel.findOne({
        user: new mongoose.Types.ObjectId(userId),
        paper: paper._id,
      });
      const cost = existingDownload ? 5 : (paper.downloadCost ?? 0); // REDOWNLOAD_COST is 5

      if (currentCredits < cost) {
        throw AppError.badRequest(`Insufficient credits. You need ${cost} credits. Balance: ${currentCredits}`);
      }
    }

    const directStorageUrl = await pdfStorageService.getSignedDownloadUrl(String(paper.pdfPath));

    // Admins and the requester/uploader don't pay for downloads
    let cost = 0;
    let isRepeatDownload = false;
    if (!isAdmin && !isOwner) {
      const result = await chargePaperDownloadCredit({
        userId,
        paper: {
          _id: paper._id as mongoose.Types.ObjectId,
          downloadCost: paper.downloadCost,
        },
      });
      cost = result.cost;
      isRepeatDownload = result.isRepeatDownload;

      // Increment download counter
      await PaperModel.findByIdAndUpdate(paperId, { $inc: { downloadCount: 1 } });
    }

    const downloadUrl = directStorageUrl ?? (() => {
      const downloadToken = jwt.sign(
        { paperId, userId },
        env.JWT_ACCESS_SECRET,
        { expiresIn: "5m" },
      );
      return `${baseUrl}/api/v1/papers/${paperId}/download?token=${downloadToken}`;
    })();
    return { downloadUrl, cost, isRepeatDownload };
  },

  /** Update paper metadata and status (Admin and User resubmission feature). */
  async update(
    paperId: string,
    input: Partial<CreatePaperInput> & {
      paperStatus?: string;
      rejectionReason?: string;
      pdfPath?: string;
      uploadedBy?: mongoose.Types.ObjectId;
      uploadedAt?: Date;
    },
  ): Promise<Paper> {
    if (!mongoose.Types.ObjectId.isValid(paperId)) throw AppError.badRequest("Invalid paper id");

    const paper = await PaperModel.findById(paperId);
    if (!paper) throw AppError.notFound("Paper not found");

    const updates: Record<string, any> = {};

    if (input.title !== undefined) updates.title = input.title.trim();
    if (input.doi !== undefined) updates.externalIds = { ...paper.externalIds, doi: input.doi.trim() };
    if (input.paperLink !== undefined) updates.paperLink = input.paperLink.trim();
    if (input.abstractText !== undefined) updates.abstractText = input.abstractText.trim();
    if (input.publicationYear !== undefined) updates.publicationYear = input.publicationYear;
    if (input.paperKind !== undefined) updates.paperKind = input.paperKind;
    if (input.authors !== undefined) updates.authors = input.authors;
    if (input.keywords !== undefined) updates.keywords = input.keywords;
    if (input.topics !== undefined) updates.topics = input.topics;
    if (input.openAccessUrl !== undefined) updates.openAccessUrl = input.openAccessUrl.trim() || undefined;
    if (input.pdfPath !== undefined) updates.pdfPath = input.pdfPath;
    if (input.uploadedBy !== undefined) updates.uploadedBy = input.uploadedBy;
    if (input.uploadedAt !== undefined) updates.uploadedAt = input.uploadedAt;

    // Check duplicate
    if (updates.title || input.doi !== undefined || updates.paperLink) {
      const duplicateFilters: Record<string, unknown>[] = [];
      if (updates.title) duplicateFilters.push({ title: buildTitleDuplicateRegex(updates.title) });
      if (input.doi !== undefined) duplicateFilters.push({ "externalIds.doi": input.doi.trim() });
      if (updates.paperLink) duplicateFilters.push({ paperLink: updates.paperLink });

      if (duplicateFilters.length > 0) {
        const duplicate = await PaperModel.findOne({
          _id: { $ne: paper._id },
          $or: duplicateFilters,
        }).lean();
        if (duplicate) {
          throw AppError.conflict("A paper with this title, DOI, or link already exists");
        }
      }
    }

    const previousStatus = paper.paperStatus ?? "pending";
    const wasApproved = isApprovedStatus(previousStatus);

    if (input.paperStatus !== undefined) {
      const ALLOWED = ["pending", "not-downloaded", "downloaded", "rejected", "pending-requester-acceptance"];
      if (!ALLOWED.includes(input.paperStatus)) throw AppError.badRequest("Invalid status");
      updates.paperStatus = input.paperStatus;

      if (input.paperStatus === "rejected") {
        const reason = input.rejectionReason || paper.rejectionReason;
        if (!reason || reason.trim().length < 5) {
          throw AppError.badRequest("Rejection reason must be at least 5 characters");
        }
        updates.rejectionReason = reason.trim();
        updates.dataStatus = "draft";
      } else {
        updates.$unset = { rejectionReason: "" };
        const willBeApproved = isApprovedStatus(input.paperStatus);
        updates.dataStatus = willBeApproved ? "active" : "draft";
      }
    }

    // Merge updates to calculate new quality metrics
    const merged = {
      ...paper.toObject(),
      ...updates,
      pdfPath: updates.pdfPath !== undefined ? updates.pdfPath : paper.pdfPath,
    };
    const quality = calculatePaperQuality(merged);
    const qualityScoreUpdate = buildQualityScoreUpdate(merged, quality);
    const tierDef = QUALITY_TIERS.find((t) => t.tier === quality.qualityTier) ?? QUALITY_TIERS[0]!;
    Object.assign(updates, qualityScoreUpdate, { qualityTierName: tierDef.name });
    // Freeze the granted reward (see updateStatus): clawback must reverse exactly what was granted.
    if (paper.uploadRewardedAt) {
      updates.uploadCreditReward = paper.uploadCreditReward;
    }

    const updated = await PaperModel.findByIdAndUpdate(paperId, updates, { new: true });
    if (!updated) throw AppError.notFound("Paper not found");

    const newStatus = updated.paperStatus ?? "pending";
    const willBeApproved = isApprovedStatus(newStatus);

    // Reward upload credits when first approved
    if (!wasApproved && willBeApproved) {
      await applyUploadCreditReward({
        _id: updated._id as mongoose.Types.ObjectId,
        uploadedBy: updated.uploadedBy as mongoose.Types.ObjectId | undefined,
        paperStatus: updated.paperStatus,
        uploadCreditReward: updated.uploadCreditReward,
        uploadRewardedAt: updated.uploadRewardedAt ?? null,
      });
    }

    // Refund requester credits if admin-rejected
    if (input.paperStatus === "rejected" && !wasApproved && updated.requestedBy) {
      await refundPaperRequestCredit(updated.requestedBy.toString());
    }

    if (updated.requestedBy) await syncUserPoints(updated.requestedBy.toString());
    if (updated.uploadedBy) await syncUserPoints(updated.uploadedBy.toString());

    return toPaperDto(updated as unknown as PaperDoc);
  },

  /** Delete a paper request (User owns request or Admin). */
  async deletePaper(paperId: string, userId: string, userRole: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(paperId)) throw AppError.badRequest("Invalid paper id");

    const paper = await PaperModel.findById(paperId);
    if (!paper) throw AppError.notFound("Paper not found");

    const isAdmin = userRole === "admin";
    const isOwner = isSameId(paper.requestedBy, userId);

    if (!isAdmin && !isOwner) {
      throw AppError.forbidden("You can only delete your own paper requests");
    }

    // Refund the REQUESTER (who paid the fee) whenever a still-pending request is hard
    // deleted — by the owner OR an admin. Without this, an admin deleting a pending paper
    // would silently eat the user's 100 credits (the fee is now actually charged).
    const wantsRefund = paper.paperStatus === "pending" && !!paper.requestedBy;
    const requestedById = paper.requestedBy;
    const uploadedById = paper.uploadedBy;

    // When a refund is due, delete ATOMICALLY guarded on "pending" so only the winner
    // of a concurrent delete/cancel race refunds (no double +100). Otherwise plain delete.
    let pdfToDelete = paper.pdfPath;
    let doRefund = false;
    if (wantsRefund) {
      const deleted = await PaperModel.findOneAndDelete({ _id: paperId, paperStatus: "pending" });
      if (deleted) {
        doRefund = true;
        pdfToDelete = deleted.pdfPath;
      } else {
        await PaperModel.findByIdAndDelete(paperId);
      }
    } else {
      await PaperModel.findByIdAndDelete(paperId);
    }

    // Delete related downloads
    await PaperDownloadModel.deleteMany({ paper: new mongoose.Types.ObjectId(paperId) });

    if (pdfToDelete) {
      await deleteStoredPdf(pdfToDelete);
    }

    if (doRefund && requestedById) {
      await refundPaperRequestCredit(requestedById.toString());
    }

    if (requestedById) {
      await syncUserPoints(requestedById.toString());
    }
    if (uploadedById && uploadedById.toString() !== requestedById?.toString()) {
      await syncUserPoints(uploadedById.toString());
    }
  },

  /** Delete paper PDF only (Admin function). */
  async deletePaperPdf(paperId: string): Promise<Paper> {
    if (!mongoose.Types.ObjectId.isValid(paperId)) throw AppError.badRequest("Invalid paper id");

    const paper = await PaperModel.findById(paperId);
    if (!paper) throw AppError.notFound("Paper not found");

    if (!paper.pdfPath) {
      throw AppError.badRequest("Paper does not have a PDF to delete");
    }

    const pdfToDelete = paper.pdfPath;
    const uploadedById = paper.uploadedBy;

    const nextStatus = paper.paperStatus === "pending" ? "pending" : "not-downloaded";

    const qualityInput = { ...paper.toObject(), pdfPath: "", uploadedBy: undefined };
    const quality = calculatePaperQuality(qualityInput);
    const qualityScoreUpdate = buildQualityScoreUpdate(qualityInput, quality);
    const tierDef = QUALITY_TIERS.find((t) => t.tier === quality.qualityTier) ?? QUALITY_TIERS[0]!;

    const updated = await PaperModel.findByIdAndUpdate(
      paperId,
      {
        $unset: { pdfPath: "", uploadedBy: "", uploadedAt: "" },
        paperStatus: nextStatus,
        dataStatus: "draft",
        ...qualityScoreUpdate,
        qualityTierName: tierDef.name,
      },
      { new: true },
    );

    if (!updated) throw AppError.notFound("Paper not found");

    await deleteStoredPdf(pdfToDelete);

    if (uploadedById) {
      await syncUserPoints(uploadedById.toString());
    }

    return toPaperDto(updated as unknown as PaperDoc);
  },

  async resubmit(
    paperId: string,
    userId: string,
    input: Partial<CreatePaperInput>,
    pdfPath?: string,
  ): Promise<Paper> {
    if (!mongoose.Types.ObjectId.isValid(paperId)) throw AppError.badRequest("Invalid paper id");

    const paper = await PaperModel.findById(paperId);
    if (!paper) throw AppError.notFound("Paper not found");

    if (!paper.requestedBy || paper.requestedBy.toString() !== userId) {
      throw AppError.forbidden("You are not allowed to update this paper");
    }

    if (paper.paperStatus !== "rejected") {
      throw AppError.badRequest("You can only edit and resubmit papers that have been rejected");
    }

    const updateInput: Record<string, any> = {
      ...input,
      paperStatus: "pending",
      rejectionReason: "",
    };

    if (pdfPath) {
      updateInput.pdfPath = pdfPath;
      updateInput.uploadedBy = new mongoose.Types.ObjectId(userId);
      updateInput.uploadedAt = new Date();
    }

    const updated = await paperService.update(paperId, updateInput);

    // Create user notification
    await notificationService.create({
      userId,
      title: "Paper Submission Pending",
      message: `Your resubmitted paper '${updated.title}' is pending review.`,
      type: "submission_pending",
      paperId: updated.id,
    });

    // Create admin notification
    const userDoc = await UserModel.findById(userId).lean();
    const userFullName = userDoc?.fullName || "A user";
    await notificationService.create({
      role: "admin",
      title: "New Paper Submission Request",
      message: `User ${userFullName} has resubmitted their paper: '${updated.title}'.`,
      type: "submission_pending",
      paperId: updated.id,
    });

    return updated;
  },
};

/** Reorder resolved refs to match the requested id order; drop ids not found. */
export function orderByIds(refs: PaperRef[], ids: string[]): PaperRef[] {
  const byId = new Map(refs.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter((r): r is PaperRef => !!r);
}

/** Map a lean paper doc (any projection incl. _id/title/year/authors/doi) to a PaperRef. */
export function toPaperRef(doc: Record<string, unknown>): PaperRef {
  const ext = doc.externalIds as { doi?: string } | undefined;
  return {
    id: String(doc._id),
    title: String(doc.title ?? ""),
    publicationYear: Number(doc.publicationYear ?? 0),
    authors: (doc.authors as PaperRef["authors"]) ?? [],
    ...(ext?.doi ? { doi: ext.doi } : {}),
  };
}

// ── DTO mapper ───────────────────────────────────────────────────────────────

/**
 * Map a lean Mongo doc to the public Paper DTO: `_id` → `id`, drop internal
 * fields (`__v`, `embedding`).
 */
function toPaperDto(doc: any): Paper {
  const raw = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const { _id, __v, embedding, ...rest } = raw;
  void __v;
  void embedding;
  return { id: String(_id), ...rest } as unknown as Paper;
}
