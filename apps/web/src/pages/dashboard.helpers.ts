export interface VolumePoint {
  date: string;
  count: number;
}

export interface SearchHistoryItem {
  query: string;
  mode: string;
  resultCount: number;
  durationMs?: number;
  createdAt: string;
}

export function totalSearchVolume(points: VolumePoint[]): number {
  return points.reduce((sum, p) => sum + p.count, 0);
}

export function averageSearchesPerDay(points: VolumePoint[]): number {
  if (points.length === 0) return 0;
  return Math.round((totalSearchVolume(points) / points.length) * 10) / 10;
}

export function getTopQueryLabel(topQueries: Array<{ query: string; count: number }>): string {
  return topQueries[0]?.query ?? "No query yet";
}

export function buildSearchTarget(query: string): string {
  return `/search?q=${encodeURIComponent(query)}`;
}
