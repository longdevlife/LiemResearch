import type { PipelineStage } from "mongoose";
import { env } from "../../config/env.js";
import { logger } from "../../infrastructure/logger.js";
import { cache, LLM_CACHE_TTL_SECONDS } from "../../infrastructure/cache.js";
import { AppError } from "../../common/exceptions/app-error.js";
import { getEmbeddingProvider } from "../embeddings/embedding.factory.js";
import { generateJSON, LlmContentError } from "../llm/gemini.client.js";
import { PaperModel } from "../papers/models/paper.model.js";
import { ResearchGapModel } from "./models/research-gap.model.js";
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

/** Atlas Vector Search index — same one the /search and /reports endpoints use. */
const VECTOR_INDEX = "paper_vector_index";

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

export const gapsService = {
  /** Create a queued analysis row, enqueue the BullMQ job, and return the id. */
  async enqueue(userId: string, dto: AnalyzeGapDto): Promise<string> {
    const analysis = await GapAnalysisModel.create({
      userId,
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

    let output = await cache.get<GapsLlmOutput>(cacheKey);
    const cacheHit = output !== null;

    // ④ Generate on cache miss
    if (!output) {
      output = await generateJSON<GapsLlmOutput>(buildGapsPrompt(analysis.topic, papers), {
        model,
        system: GAPS_SYSTEM_PROMPT,
        temperature: 0.2,
        maxOutputTokens: env.GAPS_MAX_OUTPUT_TOKENS,
      });

      if (!output || !Array.isArray(output.gaps) || output.gaps.length === 0) {
        // Empty/malformed output won't self-heal on retry → fail fast.
        throw new LlmContentError("LLM returned empty gaps output");
      }

      await cache.set(cacheKey, output, LLM_CACHE_TTL_SECONDS);
    }

    // ⑤ Persist gaps (map 1-based evidence numbers back to real paper ids)
    const gapDocs = await Promise.all(
      output.gaps.slice(0, 5).map((g) =>
        ResearchGapModel.create({
          topic: analysis.topic,
          normalizedTopic,
          title: String(g.title ?? "").slice(0, 200),
          description: String(g.description ?? ""),
          rationale: String(g.rationale ?? ""),
          supportingPaperIds: (g.supportingEvidence ?? [])
            .filter((n) => Number.isInteger(n) && n >= 1 && n <= papers.length)
            .map((n) => papers[n - 1]!.id),
          confidence: clamp01(g.confidence),
          source: "standalone",
          userId: analysis.userId,
        }),
      ),
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
          source: "report",
          sourceReportId: report._id,
          userId: report.userId,
        }),
      ),
    );
  },

  /** Paginated, filterable list of gaps (the FE gaps page). */
  async list(userId: string, query: ListGapsQuery) {
    const filter: Record<string, unknown> = { userId, status: query.status };
    if (query.topic) {
      filter.normalizedTopic = { $regex: normalizeTopicStr(query.topic), $options: "i" };
    }
    if (query.source) filter.source = query.source;
    if (query.minConfidence !== undefined) filter.confidence = { $gte: query.minConfidence };

    const { page, pageSize } = query;
    const [docs, total] = await Promise.all([
      ResearchGapModel.find(filter)
        .sort({ confidence: -1, createdAt: -1 })
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
  const filter: Record<string, unknown> = { dataStatus: "active" };
  if (filters.yearFrom !== undefined || filters.yearTo !== undefined) {
    filter.publicationYear = {
      ...(filters.yearFrom !== undefined ? { $gte: filters.yearFrom } : {}),
      ...(filters.yearTo !== undefined ? { $lte: filters.yearTo } : {}),
    };
  }
  const pipeline = [
    {
      $vectorSearch: {
        index: VECTOR_INDEX,
        path: "embedding",
        queryVector,
        numCandidates: 80,
        limit: env.GAPS_TOP_K,
        filter,
      },
    },
    { $project: { title: 1, abstractText: 1, publicationYear: 1 } },
  ];
  const docs = await PaperModel.aggregate(pipeline as unknown as PipelineStage[]);
  return docs.map((d) => ({
    id: String(d._id),
    title: String(d.title),
    abstractText: d.abstractText ? String(d.abstractText) : undefined,
    publicationYear: d.publicationYear as number | undefined,
  }));
}
