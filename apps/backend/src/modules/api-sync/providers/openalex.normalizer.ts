import type { OpenAlexWork } from "./openalex.types.js";

type DetectedBy = "openalex" | "ai" | "user";
type PaperKind = "article" | "proceedings" | "preprint" | "review" | "book-chapter" | "other";
type OpenAccessStatus = "gold" | "green" | "hybrid" | "bronze" | "closed" | "unknown";

/**
 * The provider-agnostic shape the sync service upserts into `research_papers`.
 * Matches the PaperModel schema field-for-field (minus server-managed fields).
 */
export interface NormalizedPaper {
  externalIds: {
    doi?: string;
    openalexId?: string;
  };
  title: string;
  abstractText?: string;
  authors: {
    displayName: string;
    position: number;
    isCorresponding: boolean;
    affiliation?: string;
  }[];
  journalName?: string;
  publicationYear: number;
  publicationDate?: Date;
  paperKind: PaperKind;
  language: string;
  openAccessStatus: OpenAccessStatus;
  openAccessUrl?: string;
  licenseName?: string;
  citationCount: number;
  keywords: { keywordName: string; detectedBy: DetectedBy; confidence?: number }[];
  topics: { topicName: string; detectedBy: DetectedBy; confidence?: number }[];
  primaryProvider: "openalex";
}

/** Convert one OpenAlex Work into the normalized paper shape. Pure & permissive. */
export function normalizeOpenAlexWork(w: OpenAlexWork): NormalizedPaper {
  return {
    externalIds: {
      doi: stripPrefix(w.doi, "https://doi.org/")?.toLowerCase(),
      openalexId: stripPrefix(w.id, "https://openalex.org/"),
    },
    title: (w.title ?? w.display_name ?? "Untitled").trim(),
    abstractText: reconstructAbstract(w.abstract_inverted_index),
    authors: (w.authorships ?? []).map((a, i) => ({
      displayName: a.author?.display_name?.trim() ?? "Unknown",
      position: i,
      isCorresponding: a.is_corresponding ?? a.author_position === "first",
      affiliation: a.institutions?.[0]?.display_name,
    })),
    journalName: w.primary_location?.source?.display_name ?? undefined,
    publicationYear: w.publication_year ?? 0,
    publicationDate: w.publication_date ? new Date(w.publication_date) : undefined,
    paperKind: mapPaperKind(w.type),
    language: w.language ?? "en",
    openAccessStatus: mapOpenAccessStatus(w.open_access?.oa_status),
    openAccessUrl:
      w.open_access?.oa_url ??
      w.best_oa_location?.pdf_url ??
      w.best_oa_location?.landing_page_url ??
      undefined,
    licenseName: w.primary_location?.license ?? undefined,
    citationCount: w.cited_by_count ?? 0,
    keywords: (w.keywords ?? [])
      .filter((k) => k.display_name)
      .map((k) => ({
        keywordName: k.display_name!.trim(),
        detectedBy: "openalex" as const,
        confidence: k.score,
      })),
    topics: (w.topics ?? [])
      .filter((t) => t.display_name)
      .map((t) => ({
        topicName: t.display_name!.trim(),
        detectedBy: "openalex" as const,
        confidence: t.score,
      })),
    primaryProvider: "openalex",
  };
}

/**
 * OpenAlex stores abstracts as an inverted index { word: [positions] }.
 * Rebuild the original text by placing each word at its positions.
 */
export function reconstructAbstract(idx?: Record<string, number[]> | null): string | undefined {
  if (!idx || Object.keys(idx).length === 0) return undefined;
  const words: string[] = [];
  for (const [word, positions] of Object.entries(idx)) {
    for (const pos of positions) words[pos] = word;
  }
  const text = words.join(" ").replace(/\s+/g, " ").trim();
  return text.length > 0 ? text : undefined;
}

function stripPrefix(value: string | null | undefined, prefix: string): string | undefined {
  if (!value) return undefined;
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

function mapPaperKind(type?: string | null): PaperKind {
  switch (type) {
    case "article":
      return "article";
    case "review":
      return "review";
    case "preprint":
      return "preprint";
    case "book-chapter":
      return "book-chapter";
    case "proceedings-article":
    case "proceedings":
      return "proceedings";
    default:
      return "other";
  }
}

function mapOpenAccessStatus(status?: string): OpenAccessStatus {
  switch (status) {
    case "gold":
    case "diamond": // treat diamond OA as gold for our enum
      return "gold";
    case "green":
      return "green";
    case "hybrid":
      return "hybrid";
    case "bronze":
      return "bronze";
    case "closed":
      return "closed";
    default:
      return "unknown";
  }
}
