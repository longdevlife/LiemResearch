import mongoose, { type InferSchemaType, Schema } from "mongoose";

const projectChatMessageSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, trim: true, maxlength: 4000 },
    citedPaperIds: { type: [Schema.Types.ObjectId], ref: "Paper", default: [] },
    creditTransactionId: { type: Schema.Types.ObjectId, ref: "CreditTransaction" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

projectChatMessageSchema.index({ projectId: 1, userId: 1, createdAt: -1 });

export type ProjectChatMessageDoc = InferSchemaType<typeof projectChatMessageSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type ProjectChatMessageHydrated = mongoose.HydratedDocument<
  InferSchemaType<typeof projectChatMessageSchema>
>;

export const ProjectChatMessageModel = mongoose.model(
  "ProjectChatMessage",
  projectChatMessageSchema,
  "project_chat_messages",
);
