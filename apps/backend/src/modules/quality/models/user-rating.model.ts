import mongoose, { type InferSchemaType, Schema } from "mongoose";

/** user_ratings — one rating per (user, target). A user updates theirs via upsert. */
const userRatingSchema = new Schema(
  {
    targetKind: { type: String, enum: ["report", "gap", "paper"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    stars: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 1000 },
  },
  { timestamps: true },
);

userRatingSchema.index({ userId: 1, targetKind: 1, targetId: 1 });
userRatingSchema.index({ targetKind: 1, targetId: 1 }); // summary aggregation

// Drop legacy unique index if exists to allow multiple reviews per user
mongoose.connection.on("open", async () => {
  try {
    await mongoose.connection.db?.collection("user_ratings").dropIndex("userId_1_targetKind_1_targetId_1");
  } catch (err) {
    // index might not exist
  }
});

export type UserRatingDoc = InferSchemaType<typeof userRatingSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const UserRatingModel = mongoose.model("UserRating", userRatingSchema, "user_ratings");
