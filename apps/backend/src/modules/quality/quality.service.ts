import mongoose from "mongoose";
import type {
  AgreementBucket,
  AgreementStats,
  QualityEvaluation,
  QualityTargetKind,
  QualityView,
  RatingSummary,
} from "@trend/shared-types";
import { env } from "../../config/env.js";
import { AppError } from "../../common/exceptions/app-error.js";
import { generateJSON } from "../llm/gemini.client.js";
import { PaperModel } from "../papers/models/paper.model.js";
import { ReportModel } from "../reports/models/report.model.js";
import { ResearchGapModel } from "../gaps/models/research-gap.model.js";
import { QualityEvaluationModel, type QualityEvaluationDoc } from "./models/quality-evaluation.model.js";
import { UserRatingModel } from "./models/user-rating.model.js";
import {
  QUALITY_JUDGE_SYSTEM_PROMPT,
  QUALITY_PROMPT_VERSION,
  buildGapJudgePrompt,
  buildReportJudgePrompt,
  type JudgeEvidence,
} from "./quality.prompt.js";
import type { EvaluateInput, RateInput } from "./dto/quality.schema.js";

interface JudgeRaw {
  relevance: number;
  groundedness: number;
  completeness: number;
  rationale: string;
}

function clampScore(x: unknown): number {
  const n = Math.round(Number(x));
  if (!Number.isFinite(n)) return 3;
  return Math.max(1, Math.min(5, n));
}

function toEvaluationDto(d: QualityEvaluationDoc): QualityEvaluation {
  return {
    targetKind: d.targetKind as QualityTargetKind,
    targetId: String(d.targetId),
    relevance: d.relevance,
    groundedness: d.groundedness,
    completeness: d.completeness,
    overall: d.overall,
    rationale: d.rationale,
    model: d.model,
    createdAt: (d as unknown as { createdAt: Date }).createdAt.toISOString(),
  };
}

async function loadEvidence(paperIds: unknown[]): Promise<JudgeEvidence[]> {
  if (!paperIds || paperIds.length === 0) return [];
  const docs = await PaperModel.find({ _id: { $in: paperIds } })
    .select("title abstractText")
    .lean();
  return docs.map((p) => ({
    title: String(p.title),
    abstractText: p.abstractText ? String(p.abstractText) : undefined,
  }));
}

/**
 * Load the target + ENFORCE ACCESS, then build the judge prompt.
 * Reports are owner-private (404 for non-owners); gaps are readable by any authed user.
 */
async function buildPromptForTarget(
  userId: string,
  kind: QualityTargetKind,
  id: string,
): Promise<string> {
  if (kind === "report") {
    const report = await ReportModel.findOne({ _id: id, userId }).lean();
    if (!report) throw AppError.notFound("Report not found");
    if (report.status !== "ready" || !report.markdown) {
      throw AppError.badRequest("Report is not ready to evaluate yet");
    }
    const evidence = await loadEvidence((report.groundingPaperIds ?? []) as unknown[]);
    return buildReportJudgePrompt(report.query, report.markdown, evidence);
  }
  const gap = await ResearchGapModel.findById(id).lean();
  if (!gap) throw AppError.notFound("Research gap not found");
  const evidence = await loadEvidence((gap.supportingPaperIds ?? []) as unknown[]);
  return buildGapJudgePrompt(
    { topic: gap.topic, title: gap.title, description: gap.description, rationale: gap.rationale },
    evidence,
  );
}

/** Access check for rate/view (reports owner-only; gaps readable by any authed user). */
async function assertCanAccess(userId: string, kind: QualityTargetKind, id: string): Promise<void> {
  if (kind === "report") {
    const exists = await ReportModel.exists({ _id: id, userId });
    if (!exists) throw AppError.notFound("Report not found");
  } else {
    const exists = await ResearchGapModel.exists({ _id: id });
    if (!exists) throw AppError.notFound("Research gap not found");
  }
}

async function summarize(kind: QualityTargetKind, id: string): Promise<RatingSummary> {
  const agg = await UserRatingModel.aggregate<{ avg: number; count: number }>([
    { $match: { targetKind: kind, targetId: new mongoose.Types.ObjectId(id) } },
    { $group: { _id: null, avg: { $avg: "$stars" }, count: { $sum: 1 } } },
  ]);
  const r = agg[0];
  return { avg: r ? Math.round(r.avg * 10) / 10 : 0, count: r?.count ?? 0 };
}

export const qualityService = {
  /** On-demand LLM-as-judge. Cached unless `force`. */
  async evaluate(userId: string, input: EvaluateInput): Promise<QualityEvaluation> {
    const { targetKind, targetId, force } = input;

    const existing = await QualityEvaluationModel.findOne({ targetKind, targetId });
    if (existing && !force) return toEvaluationDto(existing);

    const prompt = await buildPromptForTarget(userId, targetKind, targetId);

    let raw: JudgeRaw;
    try {
      raw = await generateJSON<JudgeRaw>(prompt, {
        model: env.GEMINI_MODEL_FAST,
        system: QUALITY_JUDGE_SYSTEM_PROMPT,
        temperature: 0.2,
        maxOutputTokens: 512,
      });
    } catch {
      throw AppError.serviceUnavailable("AI evaluation is temporarily unavailable. Please try again.");
    }
    if (!raw || typeof raw !== "object") {
      throw AppError.serviceUnavailable("AI evaluation returned an unexpected result.");
    }

    const relevance = clampScore(raw.relevance);
    const groundedness = clampScore(raw.groundedness);
    const completeness = clampScore(raw.completeness);
    const overall = Math.round(((relevance + groundedness + completeness) / 3) * 10) / 10;

    const doc = await QualityEvaluationModel.findOneAndUpdate(
      { targetKind, targetId },
      {
        $set: {
          relevance,
          groundedness,
          completeness,
          overall,
          rationale: String(raw.rationale ?? "").slice(0, 2000),
          model: env.GEMINI_MODEL_FAST,
          promptVersion: QUALITY_PROMPT_VERSION,
        },
      },
      { upsert: true, new: true },
    );
    return toEvaluationDto(doc as QualityEvaluationDoc);
  },

  /** Upsert the caller's 1-5 rating; return the new summary. */
  async rate(
    userId: string,
    input: RateInput,
  ): Promise<{ ratingSummary: RatingSummary; myRating: { stars: number; comment?: string } }> {
    const { targetKind, targetId, stars, comment } = input;
    await assertCanAccess(userId, targetKind, targetId);
    await UserRatingModel.updateOne(
      { userId, targetKind, targetId },
      { $set: { stars, comment: comment ?? undefined } },
      { upsert: true },
    );
    const ratingSummary = await summarize(targetKind, targetId);
    return { ratingSummary, myRating: { stars, comment } };
  },

  /** Everything the FE needs for one target. */
  async view(userId: string, kind: QualityTargetKind, id: string): Promise<QualityView> {
    await assertCanAccess(userId, kind, id);
    const [evalDoc, ratingSummary, mine] = await Promise.all([
      QualityEvaluationModel.findOne({ targetKind: kind, targetId: id }),
      summarize(kind, id),
      UserRatingModel.findOne({ userId, targetKind: kind, targetId: id }).lean(),
    ]);
    return {
      evaluation: evalDoc ? toEvaluationDto(evalDoc) : undefined,
      ratingSummary,
      myRating: mine ? { stars: mine.stars, comment: mine.comment ?? undefined } : undefined,
    };
  },

  /** Admin: LLM-vs-human agreement over targets that have BOTH scores. */
  async agreement(): Promise<AgreementStats> {
    const evals = await QualityEvaluationModel.find().select("targetKind targetId overall").lean();
    if (evals.length === 0) return emptyAgreement();

    const ratingAgg = await UserRatingModel.aggregate<{
      _id: { k: string; t: mongoose.Types.ObjectId };
      avg: number;
    }>([{ $group: { _id: { k: "$targetKind", t: "$targetId" }, avg: { $avg: "$stars" } } }]);

    const ratingMap = new Map<string, number>();
    for (const r of ratingAgg) ratingMap.set(`${r._id.k}:${String(r._id.t)}`, r.avg);

    const pairs: { kind: QualityTargetKind; llm: number; user: number }[] = [];
    for (const e of evals) {
      const userAvg = ratingMap.get(`${e.targetKind}:${String(e.targetId)}`);
      if (userAvg === undefined) continue;
      pairs.push({ kind: e.targetKind as QualityTargetKind, llm: e.overall, user: userAvg });
    }

    const all = bucketize(pairs);
    return {
      sampleSize: all.sampleSize,
      mae: all.mae,
      withinOnePct: all.withinOnePct,
      correlation: all.correlation,
      byKind: {
        report: bucketize(pairs.filter((p) => p.kind === "report")),
        gap: bucketize(pairs.filter((p) => p.kind === "gap")),
      },
    };
  },
};

function bucketize(pairs: { llm: number; user: number }[]): AgreementBucket {
  const n = pairs.length;
  if (n === 0) return { sampleSize: 0, mae: 0, withinOnePct: 0, correlation: null };
  const mae = pairs.reduce((s, p) => s + Math.abs(p.llm - p.user), 0) / n;
  const withinOne = pairs.filter((p) => Math.abs(p.llm - p.user) <= 1).length;
  return {
    sampleSize: n,
    mae: Math.round(mae * 100) / 100,
    withinOnePct: Math.round((withinOne / n) * 100),
    correlation: n >= 3 ? pearson(pairs.map((p) => p.llm), pairs.map((p) => p.user)) : null,
  };
}

function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i]! - mx;
    const b = ys[i]! - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  if (den === 0) return null;
  return Math.round((num / den) * 100) / 100;
}

function emptyAgreement(): AgreementStats {
  const zero: AgreementBucket = { sampleSize: 0, mae: 0, withinOnePct: 0, correlation: null };
  return { sampleSize: 0, mae: 0, withinOnePct: 0, correlation: null, byKind: { report: zero, gap: zero } };
}
