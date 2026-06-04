export interface YearlyCount {
  year: number;
  count: number;
}

export interface TopItem {
  id: string;
  name: string;
  count: number;
}

export interface PublicationTrend {
  topic: string;
  totalPapers: number;
  yearlyBreakdown: YearlyCount[];
  growthRatePct: number; // negative if declining
  topJournals: TopItem[];
  topAuthors: TopItem[];
  topKeywords: TopItem[];
  computedAt: string;
}
