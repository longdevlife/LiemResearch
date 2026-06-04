/**
 * Minimal typing of the OpenAlex `Work` object — only the fields we read.
 * Everything is optional because the normalizer must be permissive: a missing
 * field becomes undefined rather than throwing.
 * Ref: https://docs.openalex.org/api-entities/works/work-object
 */
export interface OpenAlexWork {
  id?: string; // "https://openalex.org/W2741809807"
  doi?: string | null; // "https://doi.org/10.7717/peerj.4375"
  title?: string | null;
  display_name?: string | null;
  publication_year?: number | null;
  publication_date?: string | null; // "2018-02-13"
  language?: string | null;
  type?: string | null; // "article", "review", "preprint", ...
  cited_by_count?: number | null;
  abstract_inverted_index?: Record<string, number[]> | null;
  authorships?: OpenAlexAuthorship[];
  primary_location?: OpenAlexLocation | null;
  best_oa_location?: OpenAlexLocation | null;
  open_access?: {
    is_oa?: boolean;
    oa_status?: string; // "gold" | "green" | "hybrid" | "bronze" | "closed" | "diamond"
    oa_url?: string | null;
  } | null;
  topics?: { id?: string; display_name?: string; score?: number }[];
  keywords?: { id?: string; display_name?: string; score?: number }[];
}

export interface OpenAlexAuthorship {
  author_position?: string; // "first" | "middle" | "last"
  is_corresponding?: boolean;
  author?: { id?: string; display_name?: string; orcid?: string | null };
  institutions?: { display_name?: string; country_code?: string; ror?: string }[];
}

export interface OpenAlexLocation {
  is_oa?: boolean;
  license?: string | null;
  landing_page_url?: string | null;
  pdf_url?: string | null;
  source?: {
    id?: string;
    display_name?: string;
    issn_l?: string | null;
    issn?: string[] | null;
    host_organization_name?: string | null;
    type?: string;
    is_oa?: boolean;
  } | null;
}

export interface OpenAlexPage {
  meta: { count: number; next_cursor: string | null; per_page: number };
  results: OpenAlexWork[];
}
