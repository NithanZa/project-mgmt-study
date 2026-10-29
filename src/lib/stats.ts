/** Standard normal CDF (Abramowitz-Stegun 7.1.26 erf, |error| < 1.5e-7). */
export function normalCdf(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const poly =
    t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-x * x);
  return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}

/** Inverse standard normal CDF by bisection. */
export function normalQuantile(p: number): number {
  let lo = -10;
  let hi = 10;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (normalCdf(mid) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Linear-interpolated quantile of an ascending array. */
export function quantile(sorted: ArrayLike<number>, p: number): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  const i = (n - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.min(n - 1, lo + 1);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

export function mean(xs: ArrayLike<number>): number {
  let sum = 0;
  for (let i = 0; i < xs.length; i++) sum += xs[i];
  return sum / xs.length;
}

/** Sample standard deviation. */
export function stddev(xs: ArrayLike<number>): number {
  const m = mean(xs);
  let sum = 0;
  for (let i = 0; i < xs.length; i++) sum += (xs[i] - m) ** 2;
  return Math.sqrt(sum / (xs.length - 1));
}
