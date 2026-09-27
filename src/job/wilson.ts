// Two-sided 90% normal quantile.
const Z_90 = 1.6448536269514722;

export function wilsonLower(hits: number, n: number): number {
  const p = hits / n;
  const z2 = Z_90 * Z_90;
  const denom = 1 + z2 / n;
  const center = p + z2 / (2 * n);
  const margin = Z_90 * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
  return (center - margin) / denom;
}

export function highConfidence(bound: number): boolean {
  return bound >= 0.8;
}
