import type { AnalyticalReport, ReportListItem } from "@trend/shared-types";
import { AppError } from "../../common/exceptions/app-error.js";
import { env } from "../../config/env.js";
import { reportQueue } from "../../infrastructure/queue.js";
import { ReportModel, type ReportDoc } from "./models/report.model.js";
import type { CreateReportInput, ListReportsQuery } from "./dto/report.schema.js";

/**
 * HTTP-facing report operations. The heavy RAG work lives in rag.service.ts
 * and runs in the report worker — this service only creates/reads documents
 * and enqueues jobs (CLAUDE.md: no long-running work in request handlers).
 */

/** "generating" docs older than this are dead-worker orphans — don't count
 *  them against the user's pending quota (the worker sweeps them on restart). */
const STALE_GENERATING_MS = 5 * 60_000;

export const reportService = {
  /** Create a queued report + enqueue its job. Guarded against quota abuse. */
  async create(userId: string, input: CreateReportInput): Promise<{ id: string; status: string }> {
    // NOTE: check-then-insert is not atomic; a same-user burst can slightly
    // exceed the cap. Accepted — the per-user rate limiter on the route is the
    // real throughput throttle; this guard only bounds CONCURRENT work.
    const pending = await ReportModel.countDocuments({
      userId,
      $or: [
        { status: "queued" },
        { status: "generating", updatedAt: { $gte: new Date(Date.now() - STALE_GENERATING_MS) } },
      ],
    });
    if (pending >= env.REPORT_MAX_PENDING_PER_USER) {
      throw AppError.tooMany(
        `You already have ${pending} report(s) in progress — wait for them to finish first.`,
      );
    }

    const report = await ReportModel.create({
      userId,
      query: input.query,
      topic: input.topic,
      yearFrom: input.yearFrom,
      yearTo: input.yearTo,
      deepAnalysis: input.deepAnalysis ?? false,
      fast: input.fast ?? false,
      status: "queued",
    });

    // jobId = reportId → BullMQ dedups accidental double-submits of the same doc.
    await reportQueue.add(
      "generate-report",
      { reportId: String(report._id) },
      { jobId: String(report._id) },
    );

    return { id: String(report._id), status: "queued" };
  },

  /** The user's own reports, newest first — WITHOUT heavy fields. */
  async list(userId: string, { page, pageSize }: ListReportsQuery) {
    const filter = { userId };
    const [docs, total] = await Promise.all([
      ReportModel.find(filter)
        .select("-markdown -researchGaps -groundingPaperIds")
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      ReportModel.countDocuments(filter),
    ]);
    return { reports: docs.map((d) => toReportDto(d) as ReportListItem), total };
  },

  /** Full report — owner only. 404 (not 403) so we don't leak existence. */
  async getById(userId: string, id: string): Promise<AnalyticalReport> {
    const doc = await ReportModel.findOne({ _id: id, userId }).lean().catch(() => null);
    if (!doc) throw AppError.notFound("Report not found");
    return toReportDto(doc);
  },

  /** Delete a single report by ID. */
  async deleteById(userId: string, id: string): Promise<void> {
    const result = await ReportModel.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      throw AppError.notFound("Report not found or not owned by you");
    }
  },

  /** Delete multiple reports by IDs. */
  async deleteBatch(userId: string, ids: string[]): Promise<void> {
    await ReportModel.deleteMany({ _id: { $in: ids }, userId });
  },
};

/**
 * `_id` → `id`; strip internals (`__v`, `cacheKey`, `updatedAt`) — they are
 * not part of the wire contract. Dates serialize to ISO strings via res.json.
 */
function toReportDto(doc: Partial<ReportDoc> & { _id: unknown }): AnalyticalReport {
  const { _id, __v, cacheKey, updatedAt, ...rest } = doc as Record<string, unknown>;
  void __v;
  void cacheKey;
  void updatedAt;
  return { id: String(_id), ...rest } as unknown as AnalyticalReport;
}
