import { simulateLine } from "@/lib/line-sim";
import { mean } from "@/lib/stats";
import { limited } from "./config";
import { MAX_LIMIT } from "./fixture";

export interface SweepPoint {
  limit: number;
  throughput: number;
  cycleTime: number;
  wip: number;
}

/** Mean throughput, cycle time and WIP over seeds 1..`seeds` for every WIP limit from 1 to 12. */
export function limitSweep(variability: number, seeds = 8): SweepPoint[] {
  return Array.from({ length: MAX_LIMIT }, (_, i) => {
    const limit = i + 1;
    const runs = Array.from({ length: seeds }, (_, s) => simulateLine({ ...limited(limit, variability), seed: s + 1 }));
    return {
      limit,
      throughput: mean(runs.map((r) => r.throughput)),
      cycleTime: mean(runs.map((r) => r.avgCycleTime)),
      wip: mean(runs.map((r) => r.avgWip)),
    };
  });
}
