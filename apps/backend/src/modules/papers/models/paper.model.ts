import mongoose, { type InferSchemaType, Schema } from "mongoose";

const authorRefSchema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "Author" },
    displayName: { type: String, required: true },
    position: { type: Number, required: true },
    affiliation: { type: String },
  },
  { _id: false },
);

const keywordSchema = new Schema(
  {
    term: { type: String, required: true },
    score: { type: Number },
  },
  { _id: false },
);

const aiScoreSchema = new Schema(
  {
    relevanceScore: Number,
    semanticSimilarityScore: Number,
    trendAlignmentScore: Number,
    metadataQualityScore: Number,
    recencyScore: Number,
    researchGapScore: Number,
    finalScore: Number,
    modelVersion: String,
    computedAt: Date,
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
    abstract: { type: String, index: "text" },
    authors: { type: [authorRefSchema], default: [] },
    journalId: { type: Schema.Types.ObjectId, ref: "Journal" },
    journalName: { type: String },
    publicationYear: { type: Number, required: true, index: true },
    publicationDate: { type: Date },
    type: {
      type: String,
      enum: ["article", "proceedings", "preprint", "review", "book-chapter", "other"],
    },
    language: { type: String, default: "en" },
    citationCount: { type: Number, default: 0, index: true },
    referenceCount: { type: Number, default: 0 },
    keywords: { type: [keywordSchema], default: [] },
    topics: { type: [String], default: [], index: true },
    openAccessUrl: { type: String },
    pdfUrl: { type: String },
    isOpenAccess: { type: Boolean, default: false },
    source: {
      type: String,
      enum: ["openalex", "semanticscholar", "crossref", "arxiv"],
      required: true,
    },
    hasEmbedding: { type: Boolean, default: false, index: true },
    /** Vector embedding for Atlas Vector Search. 768 dim from gemini-embedding-2. */
    embedding: { type: [Number], default: undefined, select: false },
    aiScore: { type: aiScoreSchema },
  },
  { timestamps: true },
);

// Compound index for the main "topic + year" trend queries.
paperSchema.index({ topics: 1, publicationYear: -1 });
paperSchema.index({ publicationYear: -1, citationCount: -1 });

export type PaperDoc = InferSchemaType<typeof paperSchema> & { _id: mongoose.Types.ObjectId };

// IMPORTANT: explicit collection name "research_papers" so that Atlas Vector
// Search index `paper_vector_index` (created against research_papers) actually
// matches what Mongoose writes. Without this, Mongoose pluralizes "Paper" to
// "papers" and the vector index would never see new documents.
export const PaperModel = mongoose.model("Paper", paperSchema, "research_papers");
