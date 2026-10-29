/**
 * Days rounded up to one decimal: a commitment should never promise less
 * confidence than the one chosen (16.797 days for 80% reads 16.8).
 */
export const commitDays = (days: number): string =>
  (Math.ceil(days * 10 - 1e-9) / 10).toFixed(1);
