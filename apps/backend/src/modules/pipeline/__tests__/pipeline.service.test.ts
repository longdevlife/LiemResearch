import { describe, expect, it, vi } from "vitest";
import { createPipelineStatusService } from "../pipeline.service.js";

const now = new Date("2026-07-13T04:00:00.000Z");

function makeDeps(overrides: Partial<Parameters<typeof createPipelineStatusService>[0]> = {}) {
  return {
    now: () => now,
    queueAdapters: [
      {
        name: "report",
        label: "Reports",
        getJobCounts: vi.fn(async () => ({
          waiting: 3,
          active: 1,
          delayed: 0,
          failed: 2,
          completed: 10,
          paused: 0,
        })),
        getFailedJobs: vi.fn(async () => [
          {
            id: "job-1",
            name: "generate-report",
            failedReason: "Gemini quota exceeded",
            attemptsMade: 5,
            timestamp: now.getTime(),
          },
        ]),
      },
    ],
    corpusRepository: {
      countTotalPapers: vi.fn(async () => 100),
      countActivePapers: vi.fn(async () => 80),
      countAnalyzablePapers: vi.fn(async () => 75),
      countEmbeddedPapers: vi.fn(async () => 60),
      countAiAnalyzedPapers: vi.fn(async () => 30),
    },
    staleRepository: {
      countReportsQueuedBefore: vi.fn(async () => 2),
      countReportsGeneratingBefore: vi.fn(async () => 1),
      countGapsQueuedBefore: vi.fn(async () => 0),
      countGapsAnalyzingBefore: vi.fn(async () => 0),
      countSyncRunningBefore: vi.fn(async () => 0),
    },
    syncRepository: {
      getLatestRun: vi.fn(async () => ({
        id: "sync-1",
        status: "succeeded",
        searchText: "llm education",
        totalFetched: 200,
        totalInserted: 100,
        totalUpdated: 50,
        totalDuplicates: 50,
        totalRejected: 0,
      })),
      hasFreshRunningRun: vi.fn(async () => false),
    },
    ...overrides,
  };
}

describe("pipeline status service", () => {
  it("combines queue, corpus, stale, sync, and recommendation data", async () => {
    const service = createPipelineStatusService(makeDeps());

    const status = await service.getStatus();

    expect(status.generatedAt).toBe("2026-07-13T04:00:00.000Z");
    expect(status.redis.ok).toBe(true);
    expect(status.queues[0]).toMatchObject({
      name: "report",
      waiting: 3,
      active: 1,
      failed: 2,
      isBacklogged: false,
      hasFailures: true,
    });
    expect(status.recentFailedJobs[0]).toMatchObject({
      queue: "report",
      jobId: "job-1",
      name: "generate-report",
      failedReason: "Gemini quota exceeded",
      attemptsMade: 5,
      timestamp: "2026-07-13T04:00:00.000Z",
    });
    expect(status.corpus).toMatchObject({
      totalPapers: 100,
      activePapers: 80,
      analyzablePapers: 75,
      embeddedPapers: 60,
      pendingEmbedding: 15,
      aiAnalyzedPapers: 30,
      pendingAiAnalysis: 45,
      embeddingCoveragePct: 80,
      aiAnalysisCoveragePct: 40,
    });
    expect(status.stale).toEqual({
      reportsQueuedTooLong: 2,
      reportsGeneratingTooLong: 1,
      gapsQueuedTooLong: 0,
      gapsAnalyzingTooLong: 0,
      syncRunningTooLong: 0,
    });
    expect(status.sync.latestRun?.id).toBe("sync-1");
    expect(status.recommendations.map((r) => r.title)).toEqual(
      expect.arrayContaining([
        "Queue has failed jobs",
        "Embedding coverage is below target",
        "Structured AI coverage is still warming up",
        "Stale AI work detected",
      ]),
    );
  });

  it("still returns corpus diagnostics when Redis queue inspection fails", async () => {
    const service = createPipelineStatusService(makeDeps({
      queueAdapters: [
        {
          name: "report",
          label: "Reports",
          getJobCounts: vi.fn(async () => {
            throw new Error("ERR max requests limit exceeded");
          }),
          getFailedJobs: vi.fn(async () => []),
        },
      ],
    }));

    const status = await service.getStatus();

    expect(status.redis).toEqual({
      ok: false,
      error: "ERR max requests limit exceeded",
    });
    expect(status.queues).toEqual([]);
    expect(status.corpus.totalPapers).toBe(100);
    expect(status.recommendations[0]).toMatchObject({
      severity: "critical",
      title: "Redis/queue unavailable",
    });
  });

  it("does not treat stale running sync runs as active pipeline work", async () => {
    const service = createPipelineStatusService(makeDeps({
      staleRepository: {
        countReportsQueuedBefore: vi.fn(async () => 0),
        countReportsGeneratingBefore: vi.fn(async () => 0),
        countGapsQueuedBefore: vi.fn(async () => 0),
        countGapsAnalyzingBefore: vi.fn(async () => 0),
        countSyncRunningBefore: vi.fn(async () => 1),
      },
      syncRepository: {
        getLatestRun: vi.fn(async () => ({
          id: "sync-stale",
          status: "running",
          searchText: "deep learning healthcare",
          startedAt: "2026-07-13T00:00:00.000Z",
        })),
        hasFreshRunningRun: vi.fn(async () => false),
      },
    }));

    const status = await service.getStatus();

    expect(status.sync.running).toBe(false);
    expect(status.stale.syncRunningTooLong).toBe(1);
    expect(status.recommendations.map((r) => r.title)).toContain("Stale sync run detected");
  });
});
