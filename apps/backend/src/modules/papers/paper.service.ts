import type { Paper, PaperRef } from "@trend/shared-types";
import { AppError } from "../../common/exceptions/app-error.js";
import { PaperModel, type PaperDoc } from "./models/paper.model.js";
import type { SearchSortKey } from "./dto/paper-filters.schema.js";

export interface ListPapersParams {
  q?: string;
  page: number;
  pageSize: number;
  yearFrom?: number;
  yearTo?: number;
  paperKinds?: string[];
  openAccess?: boolean;
  provider?: string;
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
    sort = "relevance",
  }: ListPapersParams): Promise<ListPapersResult> {
    const filter: Record<string, unknown> = {};
    if (q) filter.$text = { $search: q };
    if (paperKinds && paperKinds.length) filter.paperKind = { $in: paperKinds };
    if (openAccess) filter.openAccessUrl = { $type: "string", $ne: "" };
    if (provider) filter.primaryProvider = provider;
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
    const doc = await PaperModel.findById(id).lean();
    return doc ? toPaperDto(doc) : null;
  },

  /** Resolve a paper's referenced OpenAlex IDs to the papers we hold in corpus. */
  async getReferences(
    id: string,
  ): Promise<{ references: PaperRef[]; totalReferenced: number; inCorpus: number }> {
    const paper = await PaperModel.findById(id).select("referencedWorks").lean();
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
    if (ids.length === 0) return [];
    const docs = await PaperModel.find({ _id: { $in: ids } })
      .select("title publicationYear authors externalIds")
      .lean();
    return orderByIds(docs.map(toPaperRef), ids);
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

/**
 * Map a lean Mongo doc to the public Paper DTO: `_id` → `id`, drop internal
 * fields (`__v`, `embedding`). Cast through `unknown` because Mongoose's lean
 * type uses `Date`/`DocumentArray` while the wire shape (after res.json
 * serialization) is the plain `Paper` with ISO date strings.
 */
function toPaperDto(doc: PaperDoc): Paper {
  const { _id, __v, embedding, ...rest } = doc as Record<string, unknown>;
  void __v;
  void embedding;
  return { id: String(_id), ...rest } as unknown as Paper;
}
