import { normalCdf, normalQuantile } from "@/lib/stats";
import type { Estimate, PertTask } from "./types";

export const expected = ({ o, m, p }: Estimate): number => (o + 4 * m + p) / 6;

export const variance = ({ o, p }: Estimate): number => ((p - o) / 6) ** 2;

export function betaShape({ o, m, p }: Estimate): { alpha: number; beta: number } {
  const range = p - o;
  return { alpha: 1 + (4 * (m - o)) / range, beta: 1 + (4 * (p - m)) / range };
}

// Lanczos approximation (g = 7, n = 9), accurate to ~15 digits for z > 0.5.
const LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61503916999185, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
  1.5056327351493116e-7,
];

function lnGamma(z: number): number {
  const x = z - 1;
  let sum = LANCZOS[0];
  for (let i = 1; i < LANCZOS.length; i++) sum += LANCZOS[i] / (x + i);
  const t = x + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(sum);
}

/** Density of the beta-PERT distribution at x (zero outside [o, p]). */
export function betaPertPdf(e: Estimate, x: number): number {
  if (x < e.o || x > e.p) return 0;
  const { alpha, beta } = betaShape(e);
  const range = e.p - e.o;
  const t = (x - e.o) / range;
  const lnB = lnGamma(alpha) + lnGamma(beta) - lnGamma(alpha + beta);
  return (t ** (alpha - 1) * (1 - t) ** (beta - 1)) / Math.exp(lnB) / range;
}

export interface Projection {
  /** Sum of most-likely values: the number people promise. */
  modeSum: number;
  expected: number;
  sigma: number;
  probabilityBy(days: number): number;
  daysFor(confidence: number): number;
}

/** Normal approximation for a single chain of tasks: means and variances add. */
export function projectEstimate(tasks: readonly PertTask[]): Projection {
  let modeSum = 0;
  let mean = 0;
  let spread = 0;
  for (const { estimate } of tasks) {
    modeSum += estimate.m;
    mean += expected(estimate);
    spread += variance(estimate);
  }
  const sigma = Math.sqrt(spread);
  return {
    modeSum,
    expected: mean,
    sigma,
    probabilityBy: (days) => normalCdf((days - mean) / sigma),
    daysFor: (confidence) => mean + sigma * normalQuantile(confidence),
  };
}

export function withEstimate(
  tasks: readonly PertTask[],
  id: string,
  estimate: Estimate,
): PertTask[] {
  return tasks.map((t) => (t.id === id ? { ...t, estimate } : t));
}
