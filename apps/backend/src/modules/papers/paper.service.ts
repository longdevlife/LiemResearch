import type { Paper } from "@trend/shared-types";
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
