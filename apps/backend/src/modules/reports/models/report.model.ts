import mongoose, { type InferSchemaType, Schema } from "mongoose";

/**
 * llm_analysis_reports — one document per AI analytical report.
 * Field names mirror the `AnalyticalReport` contract in @trend/shared-types.
 */

const researchGapSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    rationale: { type: String, default: "" },
    supportingPaperIds: { type: [Schema.Types.ObjectId], ref: "Paper", default: [] },
    confidence: { type: Number, min: 0, max: 1, default: 0.5 },
  },
  { _id: false },
);

const reportSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    /** Optional display label (e.g. the Trends-page topic that spawned this). */
    topic: { type: String },
    query: { type: String, required: true },
    status: {
      type: String,
      enum: ["queued", "generating", "ready", "failed"],
      default: "queued",
      index: true,
    },
    /** Markdown body — absent until status becomes "ready". */
    markdown: { type: String },
    groundingPaperIds: { type: [Schema.Types.ObjectId], ref: "Paper", default: [] },
    researchGaps: { type: [researchGapSchema], default: [] },
    modelVersion: { type: String, default: "" },
    promptVersion: { type: String, default: "" },
    /** hash(query + filters + model + promptVersion + retrievedPaperIds) — §6. */
    cacheKey: { type: String, index: true },
    yearFrom: { type: Number },
    yearTo: { type: Number },
    errorMessage: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

// "My reports, newest first" — the list endpoint's exact query.
reportSchema.index({ userId: 1, createdAt: -1 });

export type ReportDoc = InferSchemaType<typeof reportSchema> & { _id: mongoose.Types.ObjectId };
export type ReportHydrated = mongoose.HydratedDocument<InferSchemaType<typeof reportSchema>>;

// Explicit collection name — see CLAUDE.md gotcha dd9c2d8.
export const ReportModel = mongoose.model("Report", reportSchema, "llm_analysis_reports");
