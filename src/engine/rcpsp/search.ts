import { mulberry32 } from "@/lib/random";
import { makespan, orderPriority, serialSgs } from "./sgs";
import type { Capacities, Schedule, Task } from "./types";

export interface OrderResult {
  order: string[];
  makespan: number;
}

export interface SearchResult {
  best: OrderResult;
  worst: OrderResult;
  /** Number of priority orders per makespan. */
  histogram: Record<number, number>;
  evaluated: number;
}

const memo = new WeakMap<Task[], Map<string, SearchResult>>();

/** Runs the serial generator for every priority order (Heap's algorithm). */
export function exhaustive(tasks: Task[], capacities: Capacities): SearchResult {
  const key = `${capacities.programmer}/${capacities.artist}`;
  const byCaps = memo.get(tasks) ?? new Map<string, SearchResult>();
  memo.set(tasks, byCaps);
  const cached = byCaps.get(key);
  if (cached) return cached;

  const order = tasks.map((t) => t.id);
  const histogram: Record<number, number> = {};
  let best: OrderResult = { order: [], makespan: Infinity };
  let worst: OrderResult = { order: [], makespan: -Infinity };
  let evaluated = 0;
  const visit = () => {
    const m = makespan(serialSgs(tasks, capacities, orderPriority(order)));
    histogram[m] = (histogram[m] ?? 0) + 1;
    evaluated++;
    if (m < best.makespan) best = { order: [...order], makespan: m };
    if (m > worst.makespan) worst = { order: [...order], makespan: m };
  };

  const c = new Array<number>(order.length).fill(0);
  visit();
  for (let i = 1; i < order.length; ) {
    if (c[i] < i) {
      const j = i % 2 === 0 ? 0 : c[i];
      [order[j], order[i]] = [order[i], order[j]];
      visit();
      c[i]++;
      i = 1;
    } else {
      c[i] = 0;
      i++;
    }
  }

  const result = { best, worst, histogram, evaluated };
  byCaps.set(key, result);
  return result;
}

export interface SampledOrder extends OrderResult {
  schedule: Schedule;
}

/** `n` random priority orders (seeded) with their schedules. */
export function sampleOrders(tasks: Task[], capacities: Capacities, n: number, seed: number): SampledOrder[] {
  const rng = mulberry32(seed);
  return Array.from({ length: n }, () => {
    const order = tasks.map((t) => t.id);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const schedule = serialSgs(tasks, capacities, orderPriority(order));
    return { order, makespan: makespan(schedule), schedule };
  });
}
