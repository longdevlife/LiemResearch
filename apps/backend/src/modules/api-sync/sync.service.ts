import crypto from "node:crypto";
import { logger } from "../../infrastructure/logger.js";
import { auditService } from "../audit/audit.service.js";
import { PaperModel, type PaperHydrated } from "../papers/models/paper.model.js";
import { PaperSourceRecordModel } from "../papers/models/paper-source-record.model.js";
import { PaperQualityCheckModel } from "../papers/models/paper-quality-check.model.js";
import { ApiProviderModel } from "./models/api-provider.model.js";
import { ApiSyncRunModel, type ApiSyncRunDoc } from "./models/api-sync-run.model.js";
import { fetchOpenAlexPage } from "./providers/openalex.client.js";
import {
  normalizeOpenAlexWork,
  type NormalizedPaper,
} from "./providers/openalex.normalizer.js";
import type { OpenAlexWork } from "./providers/openalex.types.js";

export interface RunSyncJob {
  searchText: string;
  yearFrom: number;
  maxPages: number;
  syncConfigId?: string;
}

/** Run a full OpenAlex sync. Returns the completed api_sync_runs document. */
export async function runSync(job: RunSyncJob): Promise<ApiSyncRunDoc> {
  const provider = await ApiProviderModel.findOne({ providerName: "openalex" });
  if (!provider) {
    throw new Error(
      "openalex provider not seeded — run `pnpm --filter backend seed:providers` first",
    );
  }

  const run = await ApiSyncRunModel.create({
    syncConfigId: job.syncConfigId,
    providerId: provider._id,
    runStatus: "running",
    searchText: job.searchText,
    startedAt: new Date(),
  });

  await auditService.log("sync.started", {
    targetTableName: "api_sync_runs",
    targetRecordId: run._id.toString(),
    details: job,
  });
  logger.info({ runId: run._id.toString(), ...job }, "sync run started");

  let cursor = "*";
  let page = 0;
  try {
    while (page < job.maxPages) {
      const { results, nextCursor, total } = await fetchOpenAlexPage({
        searchText: job.searchText,
        yearFrom: job.yearFrom,
        cursor,
      });
      logger.info(
        { runId: run._id.toString(), page: page + 1, results: results.length, total },
        "openalex page fetched",
      );

      for (const work of results) {
        try {
          await ingestOne(work, provider._id, run);
        } catch (err) {
          logger.error({ err, workId: work.id }, "paper ingest failed — skipped");
        }
      }

      await run.save(); // persist running stats after each page
      if (!nextCursor || results.length === 0) break;
      cursor = nextCursor;
      page += 1;
    }

    run.runStatus = "succeeded";
  } catch (err) {
    run.runStatus = "failed";
    run.errorMessage = err instanceof Error ? err.message : String(err);
    logger.error({ err, runId: run._id.toString() }, "sync run failed");
  } finally {
    run.finishedAt = new Date();
    await run.save();
    await auditService.log("sync.completed", {
      targetTableName: "api_sync_runs",
      targetRecordId: run._id.toString(),
      details: {
        runStatus: run.runStatus,
        totalFetched: run.totalFetched,
        totalInserted: run.totalInserted,
        totalUpdated: run.totalUpdated,
        totalDuplicates: run.totalDuplicates,
      },
    });
    logger.info(
      {
        runId: run._id.toString(),
        status: run.runStatus,
        fetched: run.totalFetched,
        inserted: run.totalInserted,
        updated: run.totalUpdated,
        duplicates: run.totalDuplicates,
      },
      "sync run completed",
    );
  }

  return run;
}

/** Normalize → upsert → record source → quality check → counters. */
async function ingestOne(
  work: OpenAlexWork,
  providerId: ApiSyncRunDoc["providerId"],
  run: ApiSyncRunDoc,
): Promise<void> {
  const normalized = normalizeOpenAlexWork(work);
  const { action, paper } = await upsertPaper(normalized);

  await recordSource(paper._id, work, providerId);
  await computeAndStoreQuality(paper);

  run.totalFetched += 1;
  if (action === "insert") {
    run.totalInserted += 1;
  } else {
    run.totalUpdated += 1;
    run.totalDuplicates += 1;
  }

  await auditService.log("paper.upserted", {
    targetTableName: "research_papers",
    targetRecordId: paper._id.toString(),
    details: { action, doi: normalized.externalIds.doi },
  });
}

/** Dedup by DOI, fallback OpenAlex ID; insert new or merge into existing. */
async function upsertPaper(
  n: NormalizedPaper,
): Promise<{ action: "insert" | "update"; paper: PaperHydrated }> {
  const existing = await findExisting(n);

  if (!existing) {
    const created = await PaperModel.create({ ...n, dataStatus: "active" });
    return { action: "insert", paper: created };
  }

  // Merge: only overwrite when the incoming value is clearly better.
  existing.citationCount = Math.max(existing.citationCount ?? 0, n.citationCount);
  if (n.abstractText && n.abstractText.length > (existing.abstractText?.length ?? 0)) {
    existing.abstractText = n.abstractText;
  }
  if (!existing.journalName && n.journalName) existing.journalName = n.journalName;
  if (!existing.openAccessUrl && n.openAccessUrl) existing.openAccessUrl = n.openAccessUrl;
  // `.set()` so TypeScript accepts plain arrays into Mongoose DocumentArray paths.
  if (n.topics.length > (existing.topics?.length ?? 0)) existing.set("topics", n.topics);
  if (n.keywords.length > (existing.keywords?.length ?? 0)) existing.set("keywords", n.keywords);

  await existing.save();
  return { action: "update", paper: existing };
}

async function findExisting(n: NormalizedPaper): Promise<PaperHydrated | null> {
  if (n.externalIds.doi) {
    const byDoi = await PaperModel.findOne({ "externalIds.doi": n.externalIds.doi });
    if (byDoi) return byDoi;
  }
  if (n.externalIds.openalexId) {
    return PaperModel.findOne({ "externalIds.openalexId": n.externalIds.openalexId });
  }
  return null;
}

/** Always insert a source record — the audit trail of where this paper came from. */
async function recordSource(
  paperId: PaperHydrated["_id"],
  work: OpenAlexWork,
  providerId: ApiSyncRunDoc["providerId"],
): Promise<void> {
  const metadataHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(work))
    .digest("hex");
  await PaperSourceRecordModel.create({
    paperId,
    providerId,
    externalRecordId: work.id,
    rawMetadata: work,
    metadataHash,
    fetchedAt: new Date(),
  });
}

const QUALITY_FIELDS = 7;

/** Compute the 7 field-presence checks, upsert the quality doc, denormalize onto the paper. */
async function computeAndStoreQuality(paper: PaperHydrated): Promise<void> {
  const checks = {
    hasTitle: !!paper.title,
    hasAbstract: !!paper.abstractText,
    hasDoi: !!paper.externalIds?.doi,
    hasJournal: !!paper.journalName,
    hasPublicationYear: !!paper.publicationYear,
    hasAuthors: (paper.authors?.length ?? 0) > 0,
    hasOpenAccessUrl: !!paper.openAccessUrl,
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const qualityScore = passed / QUALITY_FIELDS;
  const checkStatus = qualityScore >= 0.7 ? "pass" : qualityScore >= 0.4 ? "warn" : "fail";

  await PaperQualityCheckModel.updateOne(
    { paperId: paper._id },
    { $set: { ...checks, paperId: paper._id, qualityScore, checkStatus, checkedAt: new Date() } },
    { upsert: true },
  );

  await PaperModel.updateOne(
    { _id: paper._id },
    {
      $set: {
        dataQualityScore: qualityScore,
        isAiAnalyzable: qualityScore >= 0.7,
        dataStatus: checkStatus === "fail" ? "low-quality" : "active",
      },
    },
  );
}
