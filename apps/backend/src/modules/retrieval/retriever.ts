import mongoose, { type PipelineStage } from "mongoose";
import type { DataSource, PaperKind, ScoredPaper } from "@trend/shared-types";
import { getEmbeddingProvider } from "../embeddings/embedding.factory.js";
import { PaperModel } from "../papers/models/paper.model.js";
import type { PaperStructuredAnalysis } from "../papers/paper-structured-context.js";

export const VECTOR_INDEX = "paper_vector_index";

export type RetrievalProjection = "search" | "report" | "gap" | "chat";

export interface RetrieveFilters {
  yearFrom?: number;
  yearTo?: number;
  topics?: string[];
  paperIds?: string[];
  paperKinds?: PaperKind[] | string[];
  openAccess?: boolean;
  provider?: DataSource | string;
  minScore?: number;
}

export interface RetrieveOptions {
  queryText?: string;
  queryVector?: number[];
  topK: number;
  poolSize?: number;
  numCandidates?: number;
  filters?: RetrieveFilters;
  projection?: RetrievalProjection;
}

export interface RetrievedPaper {
  id: string;
  title: string;
  abstractText?: string;
  publicationYear?: number;
  journalName?: string;
  citationCount?: number;
  authorNames: string[];
  score: number;
  aiAnalysis?: PaperStructuredAnalysis | null;
}

export async function retrieve(opts: RetrieveOptions): Promise<RetrievedPaper[]> {
  const queryVector = opts.queryVector ?? (await embedQuery(opts.queryText));
  const pipeline = buildRetrievePipeline({ ...opts, queryVector });
  const docs = await PaperModel.aggregate(pipeline as PipelineStage[]);
  return docs.map(toRetrievedPaper);
}

export async function retrieveScored(opts: RetrieveOptions): Promise<ScoredPaper[]> {
  const queryVector = opts.queryVector ?? (await embedQuery(opts.queryText));
  const pipeline = buildRetrievePipeline({ ...opts, queryVector });
  const docs = await PaperModel.aggregate(pipeline as PipelineStage[]);
  return docs.map(toScoredPaper);
}

async function embedQuery(queryText: string | undefined): Promise<number[]> {
  const q = queryText?.trim();
  if (!q) throw new Error("retrieve requires queryText or queryVector");
  return getEmbeddingProvider().embed(q);
}

export function buildVectorFilter(opts: Pick<RetrieveOptions, "filters">): Record<string, unknown> {
  const f = opts.filters ?? {};
  const filter: Record<string, unknown> = { dataStatus: "active" };
  if (f.yearFrom !== undefined || f.yearTo !== undefined) {
    filter.publicationYear = {
      ...(f.yearFrom !== undefined ? { $gte: f.yearFrom } : {}),
      ...(f.yearTo !== undefined ? { $lte: f.yearTo } : {}),
    };
  }
  if (f.topics && f.topics.length > 0) filter.topics = { $in: f.topics };
  return filter;
}

export function buildRetrievePipeline(opts: RetrieveOptions): PipelineStage[] {
  if (!opts.queryVector || opts.queryVector.length === 0) {
    throw new Error("buildRetrievePipeline requires queryVector");
  }

  const topK = Math.max(1, opts.topK);
  const poolSize = opts.poolSize ?? Math.min(1000, Math.max(topK, topK * 10));
  const numCandidates = opts.numCandidates ?? Math.min(1000, Math.max(100, poolSize * 10));
  const postMatch = buildPostMatch(opts.filters);

  return [
    {
      $vectorSearch: {
        index: VECTOR_INDEX,
        path: "embedding",
        queryVector: opts.queryVector,
        numCandidates,
        limit: poolSize,
        filter: buildVectorFilter(opts),
      },
    },
    { $addFields: { score: { $meta: "vectorSearchScore" } } },
    ...(postMatch ? [{ $match: postMatch } as PipelineStage] : []),
    buildProjection(opts.projection ?? "search"),
    { $limit: topK },
  ];
}

function buildPostMatch(filters: RetrieveFilters | undefined): Record<string, unknown> | null {
  const f = filters ?? {};
  const m: Record<string, unknown> = {};
  if (f.paperIds && f.paperIds.length > 0) {
    m._id = { $in: f.paperIds.map(toMongoId) };
  }
  if (f.paperKinds && f.paperKinds.length > 0) m.paperKind = { $in: f.paperKinds };
  if (f.openAccess) m.openAccessUrl = { $type: "string", $ne: "" };
  if (f.provider) m.primaryProvider = f.provider;
  if (f.minScore && f.minScore > 0) m.score = { $gte: f.minScore };
  return Object.keys(m).length > 0 ? m : null;
}

function toMongoId(id: string): mongoose.Types.ObjectId | string {
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
}

function buildProjection(projection: RetrievalProjection): PipelineStage.Project {
  if (projection === "gap") {
    return { $project: { title: 1, abstractText: 1, aiAnalysis: 1, publicationYear: 1, score: 1 } };
  }
  if (projection === "report") {
    return {
      $project: {
        title: 1,
        abstractText: 1,
        publicationYear: 1,
        journalName: 1,
        citationCount: 1,
        "authors.displayName": 1,
        score: 1,
      },
    };
  }
  if (projection === "chat") {
    return {
      $project: {
        title: 1,
        abstractText: 1,
        publicationYear: 1,
        "authors.displayName": 1,
        score: 1,
      },
    };
  }
  return { $project: { embedding: 0, __v: 0 } };
}

export function toRetrievedPaper(d: Record<string, unknown>): RetrievedPaper {
  const paper: RetrievedPaper = {
    id: String(d._id),
    title: String(d.title ?? ""),
    abstractText: d.abstractText ? String(d.abstractText) : undefined,
    publicationYear: d.publicationYear as number | undefined,
    journalName: d.journalName ? String(d.journalName) : undefined,
    citationCount: d.citationCount as number | undefined,
    authorNames: ((d.authors ?? []) as Array<{ displayName?: string }>)
      .map((a) => a.displayName ?? "")
      .filter(Boolean),
    score: Number(d.score ?? 0),
  };
  if (d.aiAnalysis !== undefined) {
    paper.aiAnalysis = d.aiAnalysis as PaperStructuredAnalysis | null;
  }
  return paper;
}

function toScoredPaper(d: Record<string, unknown>): ScoredPaper {
  const { _id, score, ...rest } = d;
  return { id: String(_id), score: Number(score), ...rest } as unknown as ScoredPaper;
}
