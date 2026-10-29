import { cpm, earlySchedule } from "./cpm";
import { demand, overloads } from "./profile";
import type { Capacities, Rule, Schedule, Task } from "./types";

export function makespan(schedule: Schedule): number {
  return Math.max(0, ...Object.values(schedule).map((s) => s.end));
}

/** Moves `id` to `newStart` (never before its deps finish) and pushes later work so every dependency holds. */
export function shift(schedule: Schedule, tasks: Task[], id: string, newStart: number): Schedule {
  const next: Schedule = {};
  for (const t of tasks) {
    const ready = Math.max(0, ...t.deps.map((d) => next[d].end));
    const start = Math.max(ready, t.id === id ? newStart : schedule[t.id].start);
    next[t.id] = { start, end: start + t.days };
  }
  return next;
}

/**
 * Resolves overloads with float only. On an overloaded day, the active task with the most float
 * left slides one day at a time until its days fit. If its float runs out first, it stays put and
 * is reported as unresolved. Repeats until nothing changes.
 */
export function levelWithinFloat(
  tasks: Task[],
  capacities: Capacities,
): { schedule: Schedule; unresolved: string[] } {
  const { rows } = cpm(tasks);
  let schedule = earlySchedule(tasks);
  const unresolved: string[] = [];
  const slack = (t: Task) => rows[t.id].ls - schedule[t.id].start;

  const fits = (candidate: Schedule, t: Task) => {
    const load = demand(tasks, candidate)[t.resource];
    const { start, end } = candidate[t.id];
    for (let d = start; d < end; d++) if (load[d] > capacities[t.resource]) return false;
    return true;
  };

  const step = (): boolean => {
    for (const o of overloads(demand(tasks, schedule), capacities)) {
      const movable = tasks.filter((t) => {
        const { start, end } = schedule[t.id];
        return (
          t.resource === o.resource &&
          start <= o.day &&
          o.day < end &&
          slack(t) > 0 &&
          !unresolved.includes(t.id)
        );
      });
      if (movable.length === 0) continue;
      const pick = movable.reduce((best, t) => (slack(t) > slack(best) ? t : best));
      for (let s = schedule[pick.id].start + 1; s <= rows[pick.id].ls; s++) {
        const candidate = shift(schedule, tasks, pick.id, s);
        if (fits(candidate, pick)) {
          schedule = candidate;
          return true;
        }
      }
      unresolved.push(pick.id);
      return true;
    }
    return false;
  };

  while (step());
  return { schedule, unresolved };
}

/**
 * Serial schedule generation: repeatedly take the eligible task the rule ranks first (ties keep
 * list order) and book it at the earliest day its resource has room for its whole run.
 */
export function level(tasks: Task[], capacities: Capacities, rule: Rule): Schedule {
  const { rows } = cpm(tasks);
  const rank = (t: Task) => (rule === "min-lst" ? rows[t.id].ls : t.days);
  const booked: Record<Task["resource"], number[]> = { designer: [], developer: [] };
  const schedule: Schedule = {};

  while (Object.keys(schedule).length < tasks.length) {
    const eligible = tasks.filter((t) => !(t.id in schedule) && t.deps.every((d) => d in schedule));
    const t = eligible.reduce((best, c) => (rank(c) < rank(best) ? c : best));
    const load = booked[t.resource];
    const free = (s: number) => {
      for (let d = s; d < s + t.days; d++) if ((load[d] ?? 0) >= capacities[t.resource]) return false;
      return true;
    };
    let start = Math.max(0, ...t.deps.map((d) => schedule[d].end));
    while (!free(start)) start++;
    for (let d = start; d < start + t.days; d++) load[d] = (load[d] ?? 0) + 1;
    schedule[t.id] = { start, end: start + t.days };
  }
  return schedule;
}
