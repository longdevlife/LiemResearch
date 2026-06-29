import { env } from "../../config/env.js";
import { logger } from "../../infrastructure/logger.js";
import { auditService } from "../audit/audit.service.js";
import { PaperModel } from "../papers/models/paper.model.js";
import { getEmbeddingProvider } from "./embedding.factory.js";

export interface RunEmbeddingJob {
  /** Override env.EMBED_BATCH_SIZE for this run. */
  batchSize?: number;
  /** Override env.EMBED_MAX_PAPERS_PER_RUN for this run. */
  maxPapers?: number;
}

export interface EmbeddingRunResult {
  totalEmbedded: number;
  totalFailed: number;
  batches: number;
}

/**
 * Generate vector embeddings for every paper that is AI-analyzable but has no
 * vector yet, then store the vector in `paper.embedding`.
 *
 * IDEMPOTENT: a paper drops out of the candidate filter once its embedding is
 * stored (`embedding: { $exists: false }` no longer matches), so re-running only
 * processes newly-synced papers. The Phase A quality gate (`isAiAnalyzable`)
 * keeps low-quality papers out of the (paid) embedding API.
 */
export async function runEmbedding(job: RunEmbeddingJob = {}): Promise<EmbeddingRunResult> {
  const provider = getEmbeddingProvider();
  const batchSize = job.batchSize ?? env.EMBED_BATCH_SIZE;
  const maxPapers = job.maxPapers ?? env.EMBED_MAX_PAPERS_PER_RUN;

  // Only ACTIVE papers good enough for AI, that don't have a vector yet. The
  // `dataStatus: "active"` gate keeps unreviewed user submissions (draft/pending)
  // out of the embedding quota + semantic index until an admin approves them.
  const filter = { isAiAnalyzable: true, dataStatus: "active", embedding: { $exists: false } };

  let totalEmbedded = 0;
  let totalFailed = 0;
  let batches = 0;

  await auditService.log("embedding.run.started", { details: { batchSize, maxPapers } });
  logger.info(
    { batchSize, maxPapers, model: provider.modelName, dims: provider.dimensions },
    "embedding run started",
  );

  while (totalEmbedded + totalFailed < maxPapers) {
    const candidates = await PaperModel.find(filter)
      // Embed the most valuable papers FIRST. Under the daily embed quota we may
      // not clear the backlog for days, so prioritize high-citation, recent
      // papers (the ones users actually search) over arbitrary insertion order.
      .sort({ citationCount: -1, publicationYear: -1 })
      .select("_id title abstractText")
      .limit(batchSize)
      .lean();

    if (candidates.length === 0) break;
    batches += 1;

    // Input text = title + abstract. Abstract may be missing → still embeddable.
    const texts = candidates.map((p) => `${p.title ?? ""}\n\n${p.abstractText ?? ""}`.trim());

    let vectors: number[][];
    try {
      vectors = await provider.embedBatch(texts);
    } catch (err) {
      // Batch failed (rate limit / network). Papers from earlier batches in this
      // run are already persisted (we store per batch). RETHROW — do not `break`
      // and return — so the worker's job actually FAILS and BullMQ retries it with
      // exponential backoff (a transient blip recovers in minutes instead of
      // waiting for the next daily cron). Returning normally marks the job COMPLETED
      // and no retry ever happens. Throwing also can't loop: it exits runEmbedding.
      totalFailed += candidates.length;
      logger.error(
        { err, batch: batches, size: candidates.length, totalEmbedded, totalFailed },
        "embedding batch failed — rethrowing for BullMQ retry",
      );
      throw err;
    }

    await Promise.all(
      candidates.map((p, i) => {
        const vec = vectors[i];
        if (!vec) return Promise.resolve();
        return PaperModel.updateOne({ _id: p._id }, { $set: { embedding: vec } });
      }),
    );
    totalEmbedded += candidates.length;
    logger.info({ batch: batches, embedded: totalEmbedded }, "embedding batch stored");
  }

  await auditService.log("embedding.run.completed", {
    details: { totalEmbedded, totalFailed, batches },
  });
  logger.info({ totalEmbedded, totalFailed, batches }, "embedding run completed");

  return { totalEmbedded, totalFailed, batches };
}
