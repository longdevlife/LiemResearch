import { env } from "../../config/env.js";
import { logger } from "../../infrastructure/logger.js";
import { gapsService } from "../gaps/gaps.service.js";
import { getEmbeddingProvider } from "../embeddings/embedding.factory.js";
import {
  generateJSON,
  generateWithTools,
  LlmTruncationError,
  LlmContentError,
} from "../llm/gemini.client.js";
import { buildLlmCacheKey, cachedGenerate } from "../llm/llm.run.js";
import { assertCitationsInRange as assertGroundedCitationsInRange } from "../llm/grounding.js";
import { MCP_TOOL_DEFS } from "../mcp/mcp.tools.js";
import { executeMcpTool } from "../mcp/mcp.executor.js";
import { retrieve } from "../retrieval/retriever.js";
import { ReportModel, type ReportHydrated } from "./models/report.model.js";
import { RagQueryModel } from "./models/rag-query.model.js";
import {
  buildReportPrompt,
  PROMPT_VERSION,
  REPORT_SYSTEM_PROMPT,
  type EvidencePaper,
  type ReportLlmOutput,
} from "./report.prompt.js";

const DEEP_ANALYSIS_SYSTEM_PROMPT = [
  REPORT_SYSTEM_PROMPT,
  "",
  "ADDITIONAL RULES FOR TOOL-ASSISTED MODE:",
  "- You MAY call tools (search_papers, get_trends, count_papers) to gather ADDITIONAL context.",
  "- BUT [n] citations ALWAYS refer to the numbered EVIDENCE PAPERS provided in the user message.",
  "  Never cite or invent papers discovered via tools — use tool results only to inform analysis.",
  '- Return the SAME JSON format: { "markdown": "...", "gaps": [...] }.',
  "- Return ONLY valid JSON. No markdown fences, no commentary.",
].join("\n");

export interface ReportJob {
  reportId: string;
}

/**
 * The full RAG pipeline for one report. Runs inside report.worker (NEVER in a
 * request handler). Throws on transient failures so BullMQ retries; marks the
 * report `failed` only when the job has exhausted its attempts (worker decides).
 */
export async function runRagPipeline(job: ReportJob): Promise<void> {
  const report: ReportHydrated | null = await ReportModel.findById(job.reportId);
  if (!report) {
    logger.warn({ reportId: job.reportId }, "report vanished before processing");
    return;
  }
  if (report.status === "ready") return; // replayed job — already done

  report.status = "generating";
  await report.save();

  // ① Embed the question.
  const t0 = Date.now();
  const queryVector = await getEmbeddingProvider().embed(report.query);
  const embeddingMs = Date.now() - t0;

  // ② Retrieve top-K evidence via vector search.
  const t1 = Date.now();
  const papers = await retrieveEvidence(queryVector, {
    yearFrom: report.yearFrom ?? undefined,
    yearTo: report.yearTo ?? undefined,
  });
  const searchMs = Date.now() - t1;

  // ③ No evidence → permanent failure (retrying won't grow the corpus).
  if (papers.length === 0) {
    report.status = "failed";
    report.errorMessage = "Not enough corpus data for this query — try a broader question.";
    await report.save();
    await auditRagRun(report, { embeddingMs, searchMs, llmMs: 0, cacheHit: false, papers: [] });
    return;
  }

  // ④ Cache lookup (§6 formula). Hit → skip Gemini entirely.
  // Model tier: deepAnalysis → Pro + tools (slowest); fast → Flash (fastest);
  // otherwise Pro classic (default). Cache key includes `model`, so fast (Flash)
  // and standard (Pro) outputs never collide.
  const model =
    !report.deepAnalysis && report.fast ? env.GEMINI_MODEL_FAST : env.GEMINI_MODEL_DEEP;
  const prompt = buildReportPrompt(report.query, papers);
  const keyParts = {
    query: report.query,
    yearFrom: report.yearFrom ?? null,
    yearTo: report.yearTo ?? null,
    deepAnalysis: Boolean(report.deepAnalysis),
    retrievedPaperIds: papers.map((p) => p.id),
  };
  const inputHash = report.deepAnalysis ? `${DEEP_ANALYSIS_SYSTEM_PROMPT}\n${prompt}` : `${REPORT_SYSTEM_PROMPT}\n${prompt}`;
  const effectiveCacheKey = buildLlmCacheKey({
    task: "report",
    promptVersion: PROMPT_VERSION,
    model,
    keyParts,
    inputHash,
  });
  let cacheHit = false;

  // ⑤ Generate (only on cache miss).
  const t2 = Date.now();
  const output = await cachedGenerate<ReportLlmOutput>({
    task: "report",
    promptVersion: PROMPT_VERSION,
    keyParts,
    model,
    inputHash,
    onCacheHit: () => {
      cacheHit = true;
    },
    generate: async (routedModel) => {
      if (report.deepAnalysis) {
      // D2: Gemini may call tools to gather extra context, but it cites from the
      // SAME pre-fetched `papers[]` evidence list as classic mode — so citations,
      // groundingPaperIds, and gap supportingEvidence all map to one paper set.
      // On truncation OR malformed content, fall back to classic RAG so the report
      // still completes rather than failing after 5 retries.
      try {
        const rawJson = await generateWithTools(
          prompt +
            "\n\n---\n\nYou MAY call tools to gather additional context before writing, " +
            "but cite ONLY from the numbered EVIDENCE PAPERS listed above.",
          MCP_TOOL_DEFS,
          (call) =>
            executeMcpTool(call, {
              reportId: String(report._id),
              userId: String(report.userId),
            }),
          {
            model: routedModel,
            system: DEEP_ANALYSIS_SYSTEM_PROMPT,
            temperature: 0.3,
            maxOutputTokens: env.DEEP_ANALYSIS_MAX_OUTPUT_TOKENS,
            maxTurns: env.DEEP_ANALYSIS_MAX_TURNS,
          },
        );
        const fenceMatch = rawJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        const stripped = (fenceMatch?.[1] != null ? fenceMatch[1] : rawJson).trim();
        let parsed: ReportLlmOutput;
        try {
          parsed = JSON.parse(stripped) as ReportLlmOutput;
        } catch {
          throw new LlmContentError("Deep analysis returned non-JSON output");
        }
        if (!parsed || typeof parsed.markdown !== "string" || parsed.markdown.length < 50) {
          throw new LlmContentError("Deep analysis LLM returned malformed report JSON");
        }
        assertCitationsInRange(parsed.markdown, papers.length);
        return parsed;
      } catch (err) {
        // Only truncation / malformed content fall back; real errors propagate.
        if (!(err instanceof LlmTruncationError || err instanceof LlmContentError)) throw err;
        logger.warn(
          { reportId: String(report._id), reason: err.name },
          "deepAnalysis failed — falling back to classic RAG",
        );
        const fallback = await generateJSON<ReportLlmOutput>(
          prompt,
          { model: routedModel, system: REPORT_SYSTEM_PROMPT, temperature: 0.3, maxOutputTokens: env.REPORT_MAX_OUTPUT_TOKENS },
        );
        if (!fallback || typeof fallback.markdown !== "string" || fallback.markdown.length < 50) {
          throw new LlmContentError("Fallback classic RAG also returned malformed report JSON");
        }
        assertCitationsInRange(fallback.markdown, papers.length);
        return fallback;
      }
    }
      // Classic path — existing generateJSON call:
      const output = await generateJSON<ReportLlmOutput>(prompt, {
        model: routedModel,
        system: REPORT_SYSTEM_PROMPT,
        temperature: 0.3,
        maxOutputTokens: env.REPORT_MAX_OUTPUT_TOKENS,
      });
      if (!output || typeof output.markdown !== "string" || output.markdown.length < 50) {
        // Malformed JSON won't self-heal on retry → fail fast (LlmContentError).
        throw new LlmContentError("LLM returned malformed report JSON");
      }
      assertCitationsInRange(output.markdown, papers.length);
      return output;
    },
  });
  const llmMs = Date.now() - t2;

  // ⑥ Persist the finished report.
  report.markdown = output.markdown;
  report.set(
    "researchGaps",
    (output.gaps ?? []).slice(0, 6).map((g) => ({
      title: String(g.title ?? "").slice(0, 200),
      description: String(g.description ?? ""),
      rationale: String(g.rationale ?? ""),
      // Map 1-based evidence numbers back to real paper ids; drop out-of-range.
      supportingPaperIds: (g.supportingEvidence ?? [])
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= papers.length)
        .map((n) => papers[n - 1]!.id),
      confidence: clamp01(g.confidence),
    })),
  );
  report.set(
    "groundingPaperIds",
    papers.map((p) => p.id),
  );
  report.modelVersion = model;
  report.promptVersion = PROMPT_VERSION;
  report.cacheKey = effectiveCacheKey;
  report.status = "ready";
  report.completedAt = new Date();
  report.errorMessage = undefined;
  await report.save();

  // ⑦ Audit trail.
  await auditRagRun(report, { embeddingMs, searchMs, llmMs, cacheHit, papers });

  // ⑧ Fan-out gaps into research_gaps collection (non-fatal).
  await gapsService
    .fanOutGapsFromReport({
      _id: report._id,
      userId: report.userId,
      query: report.query,
      researchGaps: ((report.researchGaps ?? []) as unknown[]).map((raw) => {
        const g = raw as {
          title?: string;
          description?: string;
          rationale?: string;
          supportingPaperIds?: unknown[];
          confidence?: unknown;
        };
        return {
          title: String(g.title ?? ""),
          description: String(g.description ?? ""),
          rationale: String(g.rationale ?? ""),
          supportingPaperIds: g.supportingPaperIds ?? [],
          confidence: Number(g.confidence ?? 0.5),
        };
      }),
    })
    .catch((err) =>
      logger.warn({ err, reportId: String(report._id) }, "gap fan-out failed (non-fatal)"),
    );

  logger.info(
    { reportId: String(report._id), papers: papers.length, embeddingMs, searchMs, llmMs, cacheHit },
    "report ready",
  );
}

/** Mark a report failed — called by the worker when retries are exhausted. */
export async function markReportFailed(reportId: string, message: string): Promise<void> {
  await ReportModel.updateOne(
    { _id: reportId, status: { $ne: "ready" } },
    { $set: { status: "failed", errorMessage: message.slice(0, 500) } },
  );
}

async function retrieveEvidence(queryVector: number[], filters: { yearFrom?: number; yearTo?: number }): Promise<EvidencePaper[]> {
  return retrieve({
    queryVector,
    topK: env.REPORT_TOP_K,
    poolSize: env.REPORT_TOP_K,
    numCandidates: 200,
    filters,
    projection: "report",
  });
}

async function auditRagRun(
  report: { _id: unknown; userId: unknown; query: string; yearFrom?: number | null; yearTo?: number | null },
  run: {
    embeddingMs: number;
    searchMs: number;
    llmMs: number;
    cacheHit: boolean;
    papers: EvidencePaper[];
  },
): Promise<void> {
  try {
    await RagQueryModel.create({
      reportId: report._id,
      userId: report.userId,
      queryText: report.query,
      topK: env.REPORT_TOP_K,
      filters: { yearFrom: report.yearFrom ?? undefined, yearTo: report.yearTo ?? undefined },
      retrieved: run.papers.map((p, i) => ({ paperId: p.id, score: p.score, rank: i + 1 })),
      embeddingMs: run.embeddingMs,
      searchMs: run.searchMs,
      llmMs: run.llmMs,
      cacheHit: run.cacheHit,
    });
  } catch (err) {
    logger.warn({ err }, "rag audit write failed (non-fatal)");
  }
}

function clamp01(x: unknown): number {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

/**
 * Grounding guard: every [n] cited in the markdown must point at a real evidence
 * paper. An out-of-range citation (hallucinated, or injected via a malicious
 * abstract) fails the report rather than shipping fake grounding. Applied to BOTH
 * classic and deepAnalysis output so deep mode is not the weaker path.
 */
function assertCitationsInRange(markdown: string, papersLength: number): void {
  assertGroundedCitationsInRange(markdown, papersLength, (message) => new LlmContentError(message));
}
