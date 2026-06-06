/** One point of a yearly time series. */
export interface YearlyCount {
  year: number;
  count: number;
}

export interface TopItem {
  id: string;
  name: string;
  count: number;
}

/**
 * Growth metrics computed from a yearly publication series.
 *
 * Metrics are computed over COMPLETE years only (the current calendar year is
 * excluded because it is still accumulating papers and would always look like
 * a decline). `yearlyBreakdown` still includes the current year so charts can
 * render it — label it "YTD" on the FE.
 */
export interface TrendMetrics {
  /** Year-over-year growth, %: last complete year vs the year before.
   *  Denominator is clamped to >= 1 so a 0→N jump reads as N*100%. */
  growthRatePct: number;
  /** Compound annual growth rate over (up to) the last 3 complete years, %.
   *  Null when the series is too short or starts at 0. */
  cagr3yPct: number | null;
  /** Least-squares slope of count-per-year over the window (papers/year).
   *  Positive = rising, negative = declining. The steeper, the hotter. */
  momentum: number;
}

/** One topic in the trends overview list (GET /trends). */
export interface TrendingTopic extends TrendMetrics {
  topic: string;
  totalPapers: number;
  /** Gap years are filled with count 0; sorted by year ascending. */
  yearlyBreakdown: YearlyCount[];
}

/** A keyword growing fast from a small base (early signal of a new direction). */
export interface RisingKeyword {
  keyword: string;
  totalPapers: number;
  growthRatePct: number;
  yearlyBreakdown: YearlyCount[];
}

/** Response shape of GET /api/v1/trends. */
export interface TrendsOverview {
  yearFrom: number;
  yearTo: number;
  /** Metrics only use years <= this. Entries in any yearlyBreakdown with
   *  year > lastCompleteYear are the still-accumulating YTD year — style and
   *  label them differently on charts (`yc.year > lastCompleteYear`). */
  lastCompleteYear: number;
  totalPapersInWindow: number;
  topics: TrendingTopic[];
  risingKeywords: RisingKeyword[];
  computedAt: string;
}

/** Response shape of GET /api/v1/trends/:topic — deep dive into one topic. */
export interface PublicationTrend extends TrendMetrics {
  topic: string;
  totalPapers: number;
  yearlyBreakdown: YearlyCount[];
  /** Same semantics as TrendsOverview.lastCompleteYear. */
  lastCompleteYear: number;
  topJournals: TopItem[];
  topAuthors: TopItem[];
  topKeywords: TopItem[];
  computedAt: string;
}
