import type { ISODateString } from "./common.js";

export type DataSource = "openalex" | "semanticscholar" | "crossref" | "arxiv";
export type PaperKind =
  | "article"
  | "proceedings"
  | "preprint"
  | "review"
  | "book-chapter"
  | "other";
export type OpenAccessStatus = "gold" | "green" | "hybrid" | "bronze" | "closed" | "unknown";
export type DataStatus = "draft" | "active" | "low-quality" | "archived";
export type DetectedBy = "openalex" | "ai" | "user";

export interface PaperAuthorRef {
  authorId?: string;
  displayName: string;
  position: number;
  isCorresponding?: boolean;
}

export interface PaperKeyword {
  keywordId?: string;
  keywordName: string;
  detectedBy?: DetectedBy;
  confidence?: number; // 0..1
}

export interface PaperTopic {
  topicId?: string;
  topicName: string;
  detectedBy?: DetectedBy;
  confidence?: number; // 0..1
}

/**
 * Paper as returned by the API (`GET /papers`, `GET /papers/:id`).
 * Mirrors the backend `research_papers` document, with `_id` exposed as `id`
 * and the `embedding` vector omitted. `aiScore` is populated in Phase B.
 */
export interface Paper {
  id: string;
  externalIds: {
    doi?: string;
    openalexId?: string;
    semanticScholarId?: string;
    arxivId?: string;
    pubmedId?: string;
  };
  title: string;
  abstractText?: string;
  authors: PaperAuthorRef[];
  journalId?: string;
  journalName?: string;
  publicationYear: number;
  publicationDate?: ISODateString;
  paperKind?: PaperKind;
  language?: string;
  openAccessStatus?: OpenAccessStatus;
  openAccessUrl?: string;
  licenseName?: string;
  citationCount: number;
  keywords: PaperKeyword[];
  topics: PaperTopic[];
  primaryProvider: DataSource;
  dataStatus: DataStatus;
  dataQualityScore: number; // 0..1 — field-presence quality
  isAiAnalyzable: boolean; // true when quality is high enough for AI analysis
  aiScore?: PaperAiScore; // Phase B
  metadataScore?: number;
  sourceScore?: number;
  duplicateScore?: number;
  relevanceScore?: number;
  prestigeScore?: number;
  utilityScore?: number;
  qualityScore?: number;
  qualityTier?: number;
  qualityTierName?: string;
  downloadCost?: number | null;
  uploadCreditReward?: number;
  pdfPath?: string;
  paperLink?: string;
  rejectionReason?: string;
  paperStatus?: "pending" | "not-downloaded" | "downloaded" | "rejected" | "pending-requester-acceptance";
  requestedBy?: {
    _id: string;
    fullName: string;
    email?: string;
    university?: string;
    role?: string;
    avatarUrl?: string | null;
  };
  uploadedBy?: {
    _id: string;
    fullName: string;
    email?: string;
    university?: string;
    role?: string;
    avatarUrl?: string | null;
  };
  uploadedAt?: ISODateString;
  uploadRewardedAt?: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface PaperAiScore {
  relevanceScore: number; // 0..1 — vs the user's query
  semanticSimilarityScore: number; // 0..1 — vector similarity
  trendAlignmentScore: number; // 0..1 — does it match a rising topic
  metadataQualityScore: number; // 0..1 — completeness
  recencyScore: number; // 0..1 — newer = higher
  researchGapScore: number; // 0..1 — does it expose a gap
  finalScore: number; // 0..1 — weighted blend
  modelVersion: string;
  computedAt: ISODateString;
}

export type PaperSummary = Pick<
  Paper,
  | "id"
  | "title"
  | "authors"
  | "publicationYear"
  | "journalName"
  | "citationCount"
  | "openAccessStatus"
  | "dataQualityScore"
  | "aiScore"
>;
