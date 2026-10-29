import type { Schedule, Task } from "./types";

export interface CpmRow {
  es: number;
  ef: number;
  ls: number;
  lf: number;
  float: number;
}

export interface CpmResult {
  rows: Record<string, CpmRow>;
  duration: number;
}

/**
 * Forward and backward pass. `tasks` must list every task after its deps.
 * `end` fixes the finish used by the backward pass (default: the critical path length).
 */
export function cpm(tasks: Task[], end?: number): CpmResult {
  const ef: Record<string, number> = {};
  for (const t of tasks) ef[t.id] = Math.max(0, ...t.deps.map((d) => ef[d])) + t.days;
  const duration = Math.max(...tasks.map((t) => ef[t.id]));
  const finish = end ?? duration;

  const lf: Record<string, number> = {};
  for (const t of [...tasks].reverse()) {
    const succ = tasks.filter((s) => s.deps.includes(t.id));
    lf[t.id] = Math.min(finish, ...succ.map((s) => lf[s.id] - s.days));
  }

  const rows: Record<string, CpmRow> = {};
  for (const t of tasks) {
    const es = ef[t.id] - t.days;
    const ls = lf[t.id] - t.days;
    rows[t.id] = { es, ef: ef[t.id], ls, lf: lf[t.id], float: ls - es };
  }
  return { rows, duration };
}

/** Every task at its early start, ignoring people. */
export function earlySchedule(tasks: Task[]): Schedule {
  const { rows } = cpm(tasks);
  return Object.fromEntries(tasks.map((t) => [t.id, { start: rows[t.id].es, end: rows[t.id].ef }]));
}
