import { simulateLine, type LineConfig } from "@/lib/line-sim";
import { drum } from "./config";
import { WELD_INDEX } from "./fixture";

export interface RunMeans {
  throughput: number;
  cycleTime: number;
  wip: number;
  drumUtilization: number;
}

export interface SweepPoint extends RunMeans {
  bufferTarget: number;
}

export const BUFFER_MIN = 3;
export const BUFFER_MAX = 18;

/** Means over seeds 1..`seeds` of the same configuration. */
export function meansOverSeeds(config: LineConfig, seeds = 8): RunMeans {
  const sum: RunMeans = { throughput: 0, cycleTime: 0, wip: 0, drumUtilization: 0 };
  for (let seed = 1; seed <= seeds; seed++) {
    const r = simulateLine({ ...config, seed });
    sum.throughput += r.throughput;
    sum.cycleTime += r.avgCycleTime;
    sum.wip += r.avgWip;
    sum.drumUtilization += r.utilization[WELD_INDEX];
  }
  return {
    throughput: sum.throughput / seeds,
    cycleTime: sum.cycleTime / seeds,
    wip: sum.wip / seeds,
    drumUtilization: sum.drumUtilization / seeds,
  };
}

const cache = new Map<string, SweepPoint[]>();

/** Drum release at every buffer target from 3 to 18, memoised per variability and seed count. */
export function bufferSweep(variability: number, seeds = 8): SweepPoint[] {
  const key = `${variability}:${seeds}`;
  let points = cache.get(key);
  if (!points) {
    points = [];
    for (let bufferTarget = BUFFER_MIN; bufferTarget <= BUFFER_MAX; bufferTarget++)
      points.push({ bufferTarget, ...meansOverSeeds(drum(bufferTarget, variability), seeds) });
    cache.set(key, points);
  }
  return points;
}
