import { betaPert, mulberry32 } from "@/lib/random";
import { mean, quantile, stddev } from "@/lib/stats";
import { PREP, streamsFor } from "./fixture";
import type { Bin, Config, ConvergencePoint, Estimate, RunSample, Simulation, Summary } from "./types";

export const BIN_WIDTH = 0.5;

export const pertMean = ({ o, m, p }: Estimate) => (o + 4 * m + p) / 6;

/** PERT's single-number answer: the longest expected stream plus Event prep. */
export function pertTotal({ streams, rush }: Pick<Config, "streams" | "rush">): number {
  const paths = streamsFor(streams, rush).map((s) => pertMean(s.shortlist) + pertMean(s.confirm));
  return Math.max(...paths) + pertMean(PREP);
}

function histogram(sorted: Float64Array): Bin[] {
  if (sorted.length === 0) return [];
  const start = Math.floor(sorted[0] / BIN_WIDTH);
  const end = Math.floor(sorted[sorted.length - 1] / BIN_WIDTH);
  const bins: Bin[] = [];
  for (let b = start; b <= end; b++) bins.push({ from: b * BIN_WIDTH, to: (b + 1) * BIN_WIDTH, count: 0 });
  for (const d of sorted) bins[Math.floor(d / BIN_WIDTH) - start].count++;
  return bins;
}

/**
 * Rolls the conference network `runs` times. Run i always consumes the same
 * draws for a given seed, so a smaller run count is a prefix of a larger one.
 */
export function simulate(config: Config): Simulation {
  const { runs, seed } = config;
  const streams = streamsFor(config.streams, config.rush);
  const k = streams.length;
  const width = 2 * k + 1;
  const tasks = new Float64Array(runs * width);
  const durations = new Float64Array(runs);
  const longest = new Uint8Array(runs);
  const rng = mulberry32(seed);

  for (let r = 0; r < runs; r++) {
    const row = r * width;
    let max = -Infinity;
    for (let s = 0; s < k; s++) {
      const { shortlist: a, confirm: b } = streams[s];
      const x = betaPert(a.o, a.m, a.p, rng);
      const y = betaPert(b.o, b.m, b.p, rng);
      tasks[row + 2 * s] = x;
      tasks[row + 2 * s + 1] = y;
      if (x + y > max) {
        max = x + y;
        longest[r] = s;
      }
    }
    const prep = betaPert(PREP.o, PREP.m, PREP.p, rng);
    tasks[row + 2 * k] = prep;
    durations[r] = max + prep;
  }

  const upTo = (n: number): Summary => {
    const count = Math.max(0, Math.min(runs, Math.floor(n)));
    const head = durations.subarray(0, count);
    const sorted = Float64Array.from(head).sort();
    const critical = new Array<number>(k).fill(0);
    for (let r = 0; r < count; r++) critical[longest[r]]++;
    return {
      runs: count,
      mean: mean(head),
      p50: quantile(sorted, 0.5),
      p80: quantile(sorted, 0.8),
      p90: quantile(sorted, 0.9),
      histogram: histogram(sorted),
      criticality: critical.map((c) => c / count),
    };
  };

  const sample = (run: number): RunSample => {
    const row = run * width;
    return {
      shortlist: streams.map((_, s) => tasks[row + 2 * s]),
      confirm: streams.map((_, s) => tasks[row + 2 * s + 1]),
      prep: tasks[row + 2 * k],
      finish: durations[run],
      longest: longest[run],
    };
  };

  return { ...upTo(runs), durations, sample, upTo };
}

const pathCache = new Map<string, number[]>();
const convergenceCache = new Map<string, ConvergencePoint[]>();

/**
 * One seed's P80 at each run count, memoised, so callers can warm
 * `convergence` a seed at a time instead of in one long task.
 */
export function p80Path(config: Config, runsList: number[], seed: number): number[] {
  const key = [config.streams, config.rush ?? false, seed, ...runsList].join(",");
  let path = pathCache.get(key);
  if (!path) {
    const sim = simulate({ ...config, runs: Math.max(...runsList), seed });
    path = runsList.map((runs) => sim.upTo(runs).p80);
    pathCache.set(key, path);
  }
  return path;
}

/** Spread of the P80 estimate across seeds `config.seed` onward, per run count. */
export function convergence(config: Config, runsList: number[], seeds = 20): ConvergencePoint[] {
  const key = [config.streams, config.rush ?? false, config.seed, seeds, ...runsList].join(",");
  let points = convergenceCache.get(key);
  if (!points) {
    const paths = Array.from({ length: seeds }, (_, i) => p80Path(config, runsList, config.seed + i));
    points = runsList.map((runs, j) => {
      const p80s = paths.map((path) => path[j]);
      return { runs, p80: mean(p80s), sd: stddev(p80s) };
    });
    convergenceCache.set(key, points);
  }
  return points;
}
