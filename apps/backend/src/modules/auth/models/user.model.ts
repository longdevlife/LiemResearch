import mongoose, { type InferSchemaType, Schema } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "lecturer", "researcher", "admin"],
      default: "student",
      required: true,
    },
    avatarUrl: { type: String },
    institution: { type: String },
    researchInterests: { type: [String], default: [] },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };
export const UserModel = mongoose.model("User", userSchema);

/** Refresh tokens are stored hashed so a DB leak does not grant valid sessions. */
const refreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index
    revokedAt: { type: Date },
  },
  { timestamps: true },
);

export type RefreshTokenDoc = InferSchemaType<typeof refreshTokenSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const RefreshTokenModel = mongoose.model("RefreshToken", refreshTokenSchema);
