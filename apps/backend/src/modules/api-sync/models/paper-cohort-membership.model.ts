import mongoose, { type InferSchemaType, Schema } from "mongoose";

const paperCohortMembershipSchema = new Schema(
  {
    paperId: { type: Schema.Types.ObjectId, ref: "Paper", required: true },
    cohortId: { type: String, required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "OpenAlexIngestCampaign", required: true, index: true },
    stratumKey: { type: String, required: true },
    samplingWeight: { type: Number, min: 0 },
    selectionMethod: { type: String, enum: ["seeded-sample", "cursor", "priority-policy", "user-contributed", "refresh"], required: true },
    policyVersion: { type: String, required: true },
    reason: { type: String, enum: ["analytics_baseline", "cs_ai_priority", "user_contributed", "high_value_refresh", "repair"], required: true },
    sourcePopulation: { type: Number, min: 0 },
    selectedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

paperCohortMembershipSchema.index({ paperId: 1, cohortId: 1 }, { unique: true });
paperCohortMembershipSchema.index({ cohortId: 1, stratumKey: 1 });

export type PaperCohortMembershipDoc = InferSchemaType<typeof paperCohortMembershipSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const PaperCohortMembershipModel = mongoose.model(
  "PaperCohortMembership",
  paperCohortMembershipSchema,
  "paper_cohort_memberships",
);
