/** Format a citation count: 1234 → "1.2K", 1_500_000 → "1.5M". */
export function formatCitations(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Format a number with thousands separators. */
export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "0";
  return integerFormatter.format(n);
}

/** Format a number in compact notation for charts and dense cards. */
export function formatCompactNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "0";
  return compactNumberFormatter.format(n);
}

/** Extract year from an ISO date string. */
export function getYear(date: string | Date): number {
  return new Date(date).getFullYear();
}
