export function zScore(ratios: readonly number[]): number {
  const n = ratios.length;
  if (n !== 52) {
    throw new Error("z-score uses 52 Friday ratios");
  }
  let sum = 0;
  for (const value of ratios) sum += value;
  const mean = sum / n;
  let square = 0;
  for (const value of ratios) {
    const delta = value - mean;
    square += delta * delta;
  }
  const sampleStdev = Math.sqrt(square / (n - 1));
  const ratio = ratios[n - 1] ?? 0;
  return (100 * (ratio - mean)) / sampleStdev;
}

export function officialFeedMatchesPublished(
  feedDates: readonly string[],
  publishedDates: readonly string[],
): boolean {
  const feed = new Set(feedDates);
  const published = new Set(publishedDates);
  if (feed.size !== published.size) return false;
  for (const date of feed) {
    if (!published.has(date)) return false;
  }
  return true;
}
