import { schedule } from "./cpm";
import type { CrashTask } from "./types";

export interface CrashStep {
  tasks: CrashTask[];
  crashed: string[];
  cost: number;
}

export interface CurvePoint {
  days: number;
  direct: number;
  step: { crashed: string[]; cost: number } | null;
}

export interface TotalPoint {
  days: number;
  direct: number;
  overhead: number;
  total: number;
}

/** Takes one day off each listed task. */
export function shorten(tasks: CrashTask[], ids: string[]): CrashTask[] {
  return tasks.map((t) => (ids.includes(t.id) ? { ...t, days: t.days - 1 } : t));
}

/** Direct cost spent to get from `base` to `tasks` (same tasks, same order). */
export function spent(base: CrashTask[], tasks: CrashTask[]): number {
  return tasks.reduce((sum, t, i) => sum + (base[i].days - t.days) * t.costPerDay, 0);
}

/**
 * The cheapest single critical task or pair of critical tasks whose crash
 * shortens the project by exactly one day. Ties: fewer tasks, then input order.
 */
export function crashOnce(tasks: CrashTask[]): CrashStep | null {
  const { duration, float } = schedule(tasks);
  const open = tasks.filter((t) => float[t.id] === 0 && t.days > t.minDays);
  const candidates = [
    ...open.map((t) => [t]),
    ...open.flatMap((a, i) => open.slice(i + 1).map((b) => [a, b])),
  ];
  let best: CrashStep | null = null;
  for (const set of candidates) {
    const cost = set.reduce((sum, t) => sum + t.costPerDay, 0);
    if (best && cost >= best.cost) continue;
    const crashed = set.map((t) => t.id);
    const next = shorten(tasks, crashed);
    if (schedule(next).duration === duration - 1) best = { tasks: next, crashed, cost };
  }
  return best;
}

/** Crash one day at a time, cheapest first, until no crash shortens the project. */
export function crashCurve(tasks: CrashTask[]): CurvePoint[] {
  const curve: CurvePoint[] = [{ days: schedule(tasks).duration, direct: 0, step: null }];
  for (let step = crashOnce(tasks); step; step = crashOnce(step.tasks)) {
    const prev = curve[curve.length - 1];
    curve.push({
      days: prev.days - 1,
      direct: prev.direct + step.cost,
      step: { crashed: step.crashed, cost: step.cost },
    });
  }
  return curve;
}

export function totalCostCurve(curve: CurvePoint[], overhead: number): TotalPoint[] {
  return curve.map(({ days, direct }) => ({
    days,
    direct,
    overhead: overhead * days,
    total: direct + overhead * days,
  }));
}

/** Cheapest total; on a tie, the longer schedule, which spends less on crashing. */
export function optimum(curve: CurvePoint[], overhead: number): { days: number; total: number } {
  let best = { days: curve[0].days, total: Infinity };
  for (const p of totalCostCurve(curve, overhead)) if (p.total < best.total) best = p;
  return { days: best.days, total: best.total };
}
