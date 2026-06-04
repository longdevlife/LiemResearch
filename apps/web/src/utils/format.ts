/** Format a citation count: 1234 → "1.2K", 1_500_000 → "1.5M". */
export function formatCitations(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/** Format a number with thousands separators. */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

/** Extract year from an ISO date string. */
export function getYear(date: string | Date): number {
  return new Date(date).getFullYear();
}
