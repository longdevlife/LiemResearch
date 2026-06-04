import type { Paper } from "@trend/shared-types";
import { PaperModel, type PaperDoc } from "./models/paper.model.js";

export interface ListPapersParams {
  q?: string;
  page: number;
  pageSize: number;
}

export interface ListPapersResult {
  papers: Paper[];
  total: number;
}

export const paperService = {
  /** Keyword search over title + abstract (Phase A). Paginated. */
  async list({ q, page, pageSize }: ListPapersParams): Promise<ListPapersResult> {
    const filter = q ? { $text: { $search: q } } : {};
    const [docs, total] = await Promise.all([
      PaperModel.find(filter)
        .sort({ publicationYear: -1, citationCount: -1 })
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
