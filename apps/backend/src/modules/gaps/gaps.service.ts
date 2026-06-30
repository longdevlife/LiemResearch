import { env } from "../../config/env.js";
import { logger } from "../../infrastructure/logger.js";
import { AppError } from "../../common/exceptions/app-error.js";
import type { GapProbe, GapDirections } from "@trend/shared-types";
import { getEmbeddingProvider } from "../embeddings/embedding.factory.js";
import { LlmContentError } from "../llm/gemini.client.js";
import { cachedGenerateJSON } from "../llm/llm.run.js";
import { retrieve } from "../retrieval/retriever.js";
import { PaperModel } from "../papers/models/paper.model.js";
import { computeGapEvidence } from "./gap-evidence.js";
import { fillMissingYears, truncateToCompleteYears, yoyGrowthPct } from "../trends/trend.formulas.js";
import { ResearchGapModel } from "./models/research-gap.model.js";
import { GapDirectionsModel, type GapDirectionsDoc } from "./models/gap-directions.model.js";
import {
  buildDirectionsPrompt,
  sanitizeDirections,
  DIRECTIONS_PROMPT_VERSION,
  DIRECTIONS_SYSTEM_PROMPT,
  type DirectionsRaw,
} from "./gaps-directions.js";
import { GapAnalysisModel } from "./models/gap-analysis.model.js";
import { gapsQueue } from "../../infrastructure/queue.js";
import {
  buildGapsCacheKey,
  buildGapsPrompt,
  GAP_PROMPT_VERSION,
  GAPS_SYSTEM_PROMPT,
  type GapEvidencePaper,
  type GapsLlmOutput,
} from "./gaps.prompt.js";
import type { AnalyzeGapDto, ListGapsQuery, PatchGapDto } from "./dto/gaps.schema.js";

export interface GapJob {
  analysisId: string;
}

function normalizeTopicStr(t: string): string {
  return t.trim().toLowerCase();
}

function clamp01(x: unknown): number {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

const GAP_WINDOW_YEARS = 5;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Filter: active papers whose title OR abstract contains EVERY phrase (concept AND).
 *  The probe is LLM-generated free text, so it is escaped before becoming a regex. */
function conceptFilter(
  phrases: string[],
  years: { yearFrom?: number; yearTo?: number },
): Record<string, unknown> {
  const filter: Record<string, unknown> = { dataStatus: "active" };
  if (years.yearFrom !== undefined || years.yearTo !== undefined) {
    filter.publicationYear = {
      ...(years.yearFrom !== undefined ? { $gte: years.yearFrom } : {}),
      ...(years.yearTo !== undefined ? { $lte: years.yearTo } : {}),
    };
  }
  filter.$and = phrases.map((p) => {
    const rx = new RegExp(escapeRegex(p.trim()), "i");
    return { $or: [{ title: rx }, { abstractText: rx }] };
  });
  return filter;
}

/** YoY growth % of a free-text concept over the analysis window (0 if too sparse). */
async function conceptGrowthPct(
  phrase: string,
  years: { yearFrom?: number; yearTo?: number },
): Promise<number> {
  const now = new Date().getFullYear();
  const yearTo = years.yearTo ?? now;
  const yearFrom = years.yearFrom ?? yearTo - GAP_WINDOW_YEARS;
  const rows = await PaperModel.aggregate<{ _id: number; count: number }>([
    { $match: conceptFilter([phrase], { yearFrom, yearTo }) },
    { $group: { _id: "$publicationYear", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const series = fillMissingYears(
    rows.map((r) => ({ year: r._id, count: r.count })),
    yearFrom,
    yearTo,
  );
  return yoyGrowthPct(truncateToCompleteYears(series, Math.min(yearTo, now - 1)));
}

/**
 * Verify an LLM-proposed gap against the corpus (intersection count + parent
 * volumes + parent growth) → deterministic evidence. Concepts are matched by
 * escaped-regex on title+abstract (the probe is free text, not a canonical topic
 * name). Returns null when the probe is missing so the gap degrades gracefully.
 */
async function scoreGapEvidence(probe: GapProbe | undefined) {
  if (!probe?.topicA || !probe?.topicB) return null;
  const years = { yearFrom: probe.yearFrom, yearTo: probe.yearTo };
  const [intersectionCount, aCount, bCount, growthA, growthB] = await Promise.all([
    PaperModel.countDocuments(conceptFilter([probe.topicA, probe.topicB], years)),
    PaperModel.countDocuments(conceptFilter([probe.topicA], years)),
    PaperModel.countDocuments(conceptFilter([probe.topicB], years)),
    conceptGrowthPct(probe.topicA, years),
    conceptGrowthPct(probe.topicB, years),
  ]);
  const parentTrend =
    growthA >= growthB
      ? { topic: probe.topicA, growthRatePct: growthA }
      : { topic: probe.topicB, growthRatePct: growthB };
  const ev = computeGapEvidence(
    {
      intersectionCount,
      parentCounts: { a: aCount, b: bCount },
      parentRisingGrowthPct: parentTrend.growthRatePct,
    },
    {
      scarceAbs: env.GAP_SCARCE_ABS,
      scarcePct: env.GAP_SCARCE_PCT,
      parentRisingMin: env.GAP_PARENT_RISING_MIN,
    },
  );
  return { ...ev, probe, parentTrend };
}

function toDirectionsDto(d: GapDirectionsDoc): GapDirections {
  return {
    gapId: String(d.gapId),
    directions: (d.directions ?? []).map((x) => ({
      title: x.title,
      rationale: x.rationale ?? "",
      suggestedApproach: x.suggestedApproach ?? "",
      relatedPaperIds: (x.relatedPaperIds ?? []).map(String),
    })),
    model: d.model ?? "",
    updatedAt: (d as unknown as { updatedAt: Date }).updatedAt.toISOString(),
  };
}

export const gapsService = {
  /** Create a queued analysis row, enqueue the BullMQ job, and return the id. */
  async enqueue(userId: string, dto: AnalyzeGapDto): Promise<string> {
    const analysis = await GapAnalysisModel.create({
      userId,
      projectId: dto.projectId,
      topic: dto.topic,
      yearFrom: dto.yearFrom,
      yearTo: dto.yearTo,
      status: "queued",
    });
    const analysisId = String(analysis._id);
    await gapsQueue.add("gap-analysis", { analysisId });
    return analysisId;
  },

  /** Fetch one analysis the caller owns (poll target for the FE). */
  async getAnalysis(userId: string, analysisId: string) {
    const doc = await GapAnalysisModel.findOne({ _id: analysisId, userId }).lean();
    if (!doc) throw AppError.notFound("Gap analysis not found");
    return {
      id: String(doc._id),
      topic: doc.topic,
      status: doc.status,
      gapIds: doc.gapIds.map(String),
      errorMessage: doc.errorMessage,
    };
  },

  /**
   * The full gap-analysis pipeline for one request. Runs inside gaps.worker
   * (NEVER in a request handler). Throws on transient failures so BullMQ
   * retries; marks the analysis `failed` itself only for permanent conditions.
   */
  async runGapPipeline(job: GapJob): Promise<void> {
    const analysis = await GapAnalysisModel.findById(job.analysisId);
    if (!analysis) {
      logger.warn({ analysisId: job.analysisId }, "gap analysis vanished before processing");
      return;
    }
    if (analysis.status === "ready") return; // replayed job — already done

    analysis.status = "analyzing";
    await analysis.save();

    // ① Embed topic
    const queryVector = await getEmbeddingProvider().embed(analysis.topic);

    // ② Vector search — BEFORE cache lookup (paper IDs needed for cache key)
    const papers = await retrieveGapEvidence(queryVector, {
      yearFrom: analysis.yearFrom ?? undefined,
      yearTo: analysis.yearTo ?? undefined,
    });

    if (papers.length === 0) {
      analysis.status = "failed";
      analysis.errorMessage = "Not enough corpus data for this topic — try a broader question.";
      await analysis.save();
      return;
    }

    // ③ Cache lookup (AFTER ②)
    const normalizedTopic = normalizeTopicStr(analysis.topic);
    const model = env.GEMINI_MODEL_DEEP;
    const cacheKey = buildGapsCacheKey({
      normalizedTopic,
      yearFrom: analysis.yearFrom ?? undefined,
      yearTo: analysis.yearTo ?? undefined,
      model,
      retrievedPaperIds: papers.map((p) => p.id),
    });

    let cacheHit = false;
    const output = await cachedGenerateJSON<GapsLlmOutput>({
      task: "gap",
      promptVersion: GAP_PROMPT_VERSION,
      keyParts: {
        legacyCacheKey: cacheKey,
        normalizedTopic,
        yearFrom: analysis.yearFrom ?? null,
        yearTo: analysis.yearTo ?? null,
        retrievedPaperIds: papers.map((p) => p.id),
      },
      model,
      prompt: buildGapsPrompt(analysis.topic, papers),
      onCacheHit: () => {
        cacheHit = true;
      },
      validate: (candidate) => {
        if (!candidate || !Array.isArray(candidate.gaps) || candidate.gaps.length === 0) {
          throw new LlmContentError("LLM returned empty gaps output");
        }
        return candidate;
      },
      options: {
        system: GAPS_SYSTEM_PROMPT,
        temperature: 0.2,
        maxOutputTokens: env.GAPS_MAX_OUTPUT_TOKENS,
      },
    });

    // ⑤ Persist gaps (map 1-based evidence numbers back to real paper ids).
    //    IDEMPOTENT: clear this analysis's prior gaps first, so a retried job (after a
    //    partial earlier run that created some gaps then threw) can't leave duplicates
    //    or orphans — the list() query is by userId+status, not gapIds, so orphans would
    //    otherwise show on the FE forever.
    await ResearchGapModel.deleteMany({ analysisId: analysis._id });
    const gapDocs = await Promise.all(
      output.gaps.slice(0, 5).map(async (g) => {
        const evidence = await scoreGapEvidence(g.probe);
        return ResearchGapModel.create({
          topic: analysis.topic,
          normalizedTopic,
          analysisId: analysis._id,
          title: String(g.title ?? "").slice(0, 200),
          description: String(g.description ?? ""),
          rationale: String(g.rationale ?? ""),
          supportingPaperIds: (g.supportingEvidence ?? [])
            .filter((n) => Number.isInteger(n) && n >= 1 && n <= papers.length)
            .map((n) => papers[n - 1]!.id),
          confidence: clamp01(g.confidence),
          probe: evidence?.probe,
          intersectionCount: evidence?.intersectionCount,
          parentCounts: evidence?.parentCounts,
          parentTrend: evidence?.parentTrend ?? null,
          // No probe → no quantitative evidence; fall back to the LLM confidence so a
          // probe-less gap still sorts sanely instead of sinking below evidence-scored ones
          // (Mongo sorts a missing field last under -1).
          evidenceConfidence: evidence?.evidenceConfidence ?? clamp01(g.confidence),
          source: "standalone",
          userId: analysis.userId,
          projectId: analysis.projectId,
        });
      }),
    );

    // ⑥ Update analysis
    analysis.status = "ready";
    analysis.gapIds = gapDocs.map((d) => d._id);
    analysis.promptVersion = GAP_PROMPT_VERSION;
    analysis.modelVersion = model;
    await analysis.save();

    logger.info(
      { analysisId: job.analysisId, gaps: gapDocs.length, cacheHit },
      "gap analysis ready",
    );
  },

  /**
   * Fan-out gaps from a finished RAG report into the research_gaps collection.
   * Fire-and-forget from rag.service (non-fatal — a report stays valid even if
   * this write fails). The supportingPaperIds here are already real ObjectIds.
   */
  async fanOutGapsFromReport(report: {
    _id: unknown;
    userId: unknown;
    projectId?: unknown;
    query: string;
    researchGaps: Array<{
      title: string;
      description: string;
      rationale: string;
      supportingPaperIds: unknown[];
      confidence: number;
    }>;
  }): Promise<void> {
    if (!report.researchGaps || report.researchGaps.length === 0) return;
    const normalizedTopic = normalizeTopicStr(report.query);
    await Promise.all(
      report.researchGaps.map((g) =>
        ResearchGapModel.create({
          topic: report.query,
          normalizedTopic,
          title: g.title,
          description: g.description,
          rationale: g.rationale,
          supportingPaperIds: g.supportingPaperIds,
          confidence: g.confidence,
          // Report-path gaps carry no probe (the report LLM doesn't emit one yet),
          // so they have no quantitative evidence. Seed evidenceConfidence from the
          // LLM confidence so they sort fairly against standalone v2 gaps instead of
          // sinking below them (null sorts last). Full probe-wiring for reports is a
          // follow-up.
          evidenceConfidence: g.confidence,
          source: "report",
          sourceReportId: report._id,
          userId: report.userId,
          projectId: report.projectId,
        }),
      ),
    );
  },

  /** Paginated, filterable list of gaps (the FE gaps page). */
  async list(userId: string, query: ListGapsQuery) {
    let filter: Record<string, unknown> = { userId, status: query.status };

    if (query.projectId) {
      const { ProjectModel } = await import("../projects/models/project.model.js");
      const project = await ProjectModel.findById(query.projectId).lean();
      if (!project) throw AppError.notFound("Project not found");
      const hasAccess = project.ownerId.toString() === userId || project.members.some((m) => m.targetId.toString() === userId);
      if (!hasAccess) throw AppError.notFound("Project not found");
      filter = { projectId: query.projectId, status: query.status }; // Show all gaps for this project
    }

    if (query.topic) {
      filter.normalizedTopic = { $regex: normalizeTopicStr(query.topic), $options: "i" };
    }
    if (query.source) filter.source = query.source;
    if (query.minConfidence !== undefined) filter.confidence = { $gte: query.minConfidence };

    const { page, pageSize } = query;
    const [docs, total] = await Promise.all([
      ResearchGapModel.find(filter)
        // Prefer the deterministic evidence score; fall back to LLM confidence for
        // legacy gaps (created before v2, no evidenceConfidence).
        .sort({ evidenceConfidence: -1, confidence: -1, createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      ResearchGapModel.countDocuments(filter),
    ]);

    return {
      gaps: docs.map((d) => ({
        id: String(d._id),
        topic: d.topic,
        normalizedTopic: d.normalizedTopic,
        title: d.title,
        description: d.description,
        rationale: d.rationale,
        supportingPaperIds: d.supportingPaperIds.map(String),
        confidence: d.confidence,
        probe: d.probe,
        intersectionCount: d.intersectionCount,
        parentCounts: d.parentCounts,
        parentTrend: d.parentTrend,
        evidenceConfidence: d.evidenceConfidence,
        source: d.source,
        sourceReportId: d.sourceReportId ? String(d.sourceReportId) : undefined,
        userId: String(d.userId),
        status: d.status,
        createdAt: d.createdAt,
      })),
      total,
    };
  },

  /** Resolve / dismiss a gap — owner only. */
  async patchStatus(userId: string, gapId: string, dto: PatchGapDto) {
    const gap = await ResearchGapModel.findById(gapId);
    if (!gap) throw AppError.notFound("Research gap not found");
    if (String(gap.userId) !== userId) {
      throw AppError.forbidden("Only the creator can update gap status");
    }
    gap.status = dto.status;
    await gap.save();
    return { id: String(gap._id), status: gap.status };
  },

  /**
   * On-demand AI research-direction suggestions for ONE gap. Advisory — never
   * touches points/credit/tier. Cached as one doc per gap; `force` re-generates.
   * Synchronous (no vector search): the gap doc already carries full context.
   */
  async generateDirections(
    _userId: string,
    gapId: string,
    force?: boolean,
  ): Promise<GapDirections> {
    const gap = await ResearchGapModel.findById(gapId).lean();
    if (!gap) throw AppError.notFound("Research gap not found");

    const existing = await GapDirectionsModel.findOne({ gapId });
    if (existing && !force && existing.promptVersion === DIRECTIONS_PROMPT_VERSION) {
      return toDirectionsDto(existing as GapDirectionsDoc);
    }

    const allowedPaperIds = (gap.supportingPaperIds ?? []).map(String);
    const papers = await PaperModel.find({ _id: { $in: gap.supportingPaperIds ?? [] } })
      .select("title abstractText")
      .lean();

    let raw: DirectionsRaw;
    const prompt = buildDirectionsPrompt(
      {
        topic: gap.topic,
        title: gap.title,
        description: gap.description,
        rationale: gap.rationale,
        intersectionCount: gap.intersectionCount ?? undefined,
        parentTrend: gap.parentTrend as { topic: string; growthRatePct: number } | undefined,
      },
      papers.map((p) => ({
        id: String(p._id),
        title: String(p.title),
        abstractText: p.abstractText ? String(p.abstractText) : undefined,
      })),
    );
    try {
      raw = await cachedGenerateJSON<DirectionsRaw>({
        task: "directions",
        promptVersion: DIRECTIONS_PROMPT_VERSION,
        keyParts: { gapId, allowedPaperIds },
        model: env.GEMINI_MODEL_FAST,
        bypassCache: force,
        prompt,
        validate: (candidate) => {
          const directions = sanitizeDirections(candidate, allowedPaperIds);
          if (directions.length === 0) {
            throw new LlmContentError("LLM returned no valid research directions");
          }
          return candidate;
        },
        options: {
          system: DIRECTIONS_SYSTEM_PROMPT,
          temperature: 0.4,
          maxOutputTokens: 1024,
        },
      });
    } catch (err) {
      logger.warn({ err, gapId }, "gap directions generation failed");
      throw AppError.serviceUnavailable(
        "AI gợi ý tạm thời không khả dụng. Vui lòng thử lại.",
      );
    }

    const directions = sanitizeDirections(raw, allowedPaperIds);
    if (directions.length === 0) {
      throw AppError.serviceUnavailable("AI không trả về gợi ý hợp lệ. Vui lòng thử lại.");
    }

    const doc = await GapDirectionsModel.findOneAndUpdate(
      { gapId },
      {
        $set: {
          directions,
          model: env.GEMINI_MODEL_FAST,
          promptVersion: DIRECTIONS_PROMPT_VERSION,
        },
      },
      { upsert: true, new: true },
    );
    return toDirectionsDto(doc as GapDirectionsDoc);
  },

  /** Cached directions for a gap (or null if never generated). */
  async getDirections(gapId: string): Promise<GapDirections | null> {
    const doc = await GapDirectionsModel.findOne({ gapId });
    return doc ? toDirectionsDto(doc as GapDirectionsDoc) : null;
  },

  /** Mark an analysis failed — called by the worker when retries are exhausted. */
  async markAnalysisFailed(analysisId: string, message: string): Promise<void> {
    await GapAnalysisModel.updateOne(
      { _id: analysisId, status: { $ne: "ready" } },
      { $set: { status: "failed", errorMessage: message.slice(0, 500) } },
    );
  },
};

async function retrieveGapEvidence(
  queryVector: number[],
  filters: { yearFrom?: number; yearTo?: number },
): Promise<GapEvidencePaper[]> {
  return retrieve({
    queryVector,
    topK: env.GAPS_TOP_K,
    poolSize: env.GAPS_TOP_K,
    numCandidates: 80,
    filters,
    projection: "gap",
  });
}
