export function getTopicTrendTarget(topic: string): string {
  return `/trends/${encodeURIComponent(topic)}`;
}

export function getRisingKeywordTarget(keyword: string): string {
  return `/search?q=${encodeURIComponent(keyword)}`;
}
