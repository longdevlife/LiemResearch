import mongoose, { type InferSchemaType, Schema } from "mongoose";

/**
 * research_papers — the master paper collection. Authors, keywords, and topics
 * are EMBEDDED (bounded lists always read with the parent). Source records and
 * quality checks are REFERENCED in their own collections.
 *
 * Field names (`abstractText`, `topics`, `dataStatus`, `embedding`) are aligned
 * with the Atlas Vector Search index `paper_vector_index` and the Phase A spec.
 */

const paperAuthorSchema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "Author" },
    displayName: { type: String, required: true },
    position: { type: Number, required: true },
    isCorresponding: { type: Boolean, default: false },
  },
  { _id: false },
);

const paperKeywordSchema = new Schema(
  {
    keywordId: { type: Schema.Types.ObjectId, ref: "Keyword" },
    keywordName: { type: String, required: true },
    detectedBy: { type: String, enum: ["openalex", "ai", "user"], default: "openalex" },
    confidence: { type: Number, min: 0, max: 1 },
  },
  { _id: false },
);

const paperTopicSchema = new Schema(
  {
    topicId: { type: Schema.Types.ObjectId, ref: "ResearchTopic" },
    topicName: { type: String, required: true },
    detectedBy: { type: String, enum: ["openalex", "ai", "user"], default: "openalex" },
    confidence: { type: Number, min: 0, max: 1 },
  },
  { _id: false },
);

const paperSchema = new Schema(
  {
    externalIds: {
      doi: { type: String, index: true, sparse: true, unique: true },
      openalexId: { type: String, index: true, sparse: true },
      semanticScholarId: { type: String, index: true, sparse: true },
      arxivId: { type: String, index: true, sparse: true },
      pubmedId: { type: String, index: true, sparse: true },
    },
    title: { type: String, required: true, index: "text" },
    abstractText: { type: String, index: "text" },
    authors: { type: [paperAuthorSchema], default: [] },
    journalId: { type: Schema.Types.ObjectId, ref: "Journal" },
    journalName: { type: String },
    publicationYear: { type: Number, required: true, index: true },
    publicationDate: { type: Date },
    paperKind: {
      type: String,
      enum: ["article", "proceedings", "preprint", "review", "book-chapter", "other"],
      default: "article",
    },
    language: { type: String, default: "en" },
    openAccessStatus: {
      type: String,
      enum: ["gold", "green", "hybrid", "bronze", "closed", "unknown"],
      default: "unknown",
    },
    openAccessUrl: { type: String },
    licenseName: { type: String },
    citationCount: { type: Number, default: 0, index: true },
    keywords: { type: [paperKeywordSchema], default: [] },
    topics: { type: [paperTopicSchema], default: [] },
    primaryProvider: {
      type: String,
      enum: ["openalex", "semanticscholar", "crossref", "arxiv"],
      required: true,
    },
    dataStatus: {
      type: String,
      enum: ["draft", "active", "low-quality", "archived"],
      default: "draft",
      index: true,
    },
    dataQualityScore: { type: Number, min: 0, max: 1, default: 0 },
    isAiAnalyzable: { type: Boolean, default: false, index: true },
    /** Vector embedding for Atlas Vector Search. 768 dim from gemini-embedding-2.
     *  Populated in Phase B; select:false so list queries don't carry vectors. */
    embedding: { type: [Number], default: undefined, select: false },
  },
  { timestamps: true },
);

// Compound indexes for the main "topic + year" and "year + citations" queries.
paperSchema.index({ "topics.topicName": 1, publicationYear: -1 });
paperSchema.index({ publicationYear: -1, citationCount: -1 });

/** Lean (plain-object) type — use for `.lean()` reads. */
export type PaperDoc = InferSchemaType<typeof paperSchema> & { _id: mongoose.Types.ObjectId };
/** Hydrated Mongoose document type — has `.save()`, use for mutations. */
export type PaperHydrated = mongoose.HydratedDocument<InferSchemaType<typeof paperSchema>>;

// IMPORTANT: explicit collection name "research_papers" so that Atlas Vector
// Search index `paper_vector_index` (created against research_papers) actually
// matches what Mongoose writes. Without this, Mongoose pluralizes "Paper" to
// "papers" and the vector index never sees new documents (see git dd9c2d8).
export const PaperModel = mongoose.model("Paper", paperSchema, "research_papers");
