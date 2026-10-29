import { convergence, p80Path, simulate } from "@/engine/monte-carlo/simulate";
import type { Simulation } from "@/engine/monte-carlo/types";

export const SEED = 7;
export const MAX_RUNS = 5000;
export const DEFAULT_STREAMS = 3;
export const RUN_STOPS = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000];

const sims = new Map<string, Simulation>();

/** The lesson's simulation for a network, cached: every run count is a prefix of it. */
export function simFor(streams: number, rush = false): Simulation {
  const key = `${streams}:${rush}`;
  let sim = sims.get(key);
  if (!sim) {
    sim = simulate({ streams, rush, runs: MAX_RUNS, seed: SEED });
    sims.set(key, sim);
  }
  return sim;
}

export const BAND_SEEDS = 20;
const BAND_CONFIG = { streams: DEFAULT_STREAMS, runs: MAX_RUNS, seed: SEED };

/** P80 spread per run count for the default network (memoised by the engine). */
export const band = () => convergence(BAND_CONFIG, RUN_STOPS, BAND_SEEDS);

/** Precomputes one seed of `band`; about 10 ms. */
export const warmBand = (i: number) => p80Path(BAND_CONFIG, RUN_STOPS, SEED + i);
