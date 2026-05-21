import mongoose from 'mongoose';

const paperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    doi: { type: String, required: true, trim: true },
    paperLink: { type: String, required: true, trim: true },
    abstract: { type: String, required: true, trim: true },
    keywords: [{ type: String, trim: true }],
    publishedYear: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'downloaded', 'not-downloaded'],
      default: 'pending',
    },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pdfPath: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date },
  },
  { timestamps: true }
);

paperSchema.index({ doi: 1 }, { unique: true });
paperSchema.index({ paperLink: 1 }, { unique: true });

export const Paper = mongoose.model('Paper', paperSchema);
