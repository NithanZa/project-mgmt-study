import { cpm } from "./cpm";
import { RESOURCES, type Capacities, type Resource, type Rule, type Schedule, type Task } from "./types";

export type Priority = (a: Task, b: Task) => number;

/**
 * Serial schedule generation: repeatedly take the highest-priority task whose
 * predecessors are all scheduled and start it on the first day from which every
 * unit it needs is free for its whole duration.
 */
export function serialSgs(tasks: Task[], capacities: Capacities, priority: Priority): Schedule {
  const finish = new Map<string, number>();
  const used: Record<Resource, number[]> = { programmer: [], artist: [] };
  const starts = new Map<string, number>();
  const fits = (t: Task, start: number) => {
    for (let day = start; day < start + t.days; day++) {
      for (const r of RESOURCES) {
        if ((used[r][day] ?? 0) + (t.needs[r] ?? 0) > capacities[r]) return false;
      }
    }
    return true;
  };

  while (starts.size < tasks.length) {
    let pick: Task | undefined;
    for (const t of tasks) {
      if (starts.has(t.id) || !t.deps.every((d) => finish.has(d))) continue;
      if (!pick || priority(t, pick) < 0) pick = t;
    }
    if (!pick) throw new Error("Dependency cycle");
    for (const r of RESOURCES) {
      if ((pick.needs[r] ?? 0) > capacities[r]) throw new Error(`${pick.id} needs more ${r}s than exist`);
    }
    let start = 0;
    for (const d of pick.deps) start = Math.max(start, finish.get(d) ?? 0);
    while (!fits(pick, start)) start++;
    for (let day = start; day < start + pick.days; day++) {
      for (const r of RESOURCES) used[r][day] = (used[r][day] ?? 0) + (pick.needs[r] ?? 0);
    }
    starts.set(pick.id, start);
    finish.set(pick.id, start + pick.days);
  }
  return tasks.map((t) => ({ id: t.id, start: starts.get(t.id) ?? 0, finish: finish.get(t.id) ?? 0 }));
}

export function makespan(schedule: Schedule): number {
  return Math.max(0, ...schedule.map((p) => p.finish));
}

/** Units of each resource in use on each day from 0 to `horizon`. */
export function usage(tasks: Task[], schedule: Schedule, horizon: number): Record<Resource, number[]> {
  const out: Record<Resource, number[]> = {
    programmer: new Array<number>(horizon).fill(0),
    artist: new Array<number>(horizon).fill(0),
  };
  schedule.forEach((p, i) => {
    for (let day = p.start; day < Math.min(p.finish, horizon); day++) {
      for (const r of RESOURCES) out[r][day] += tasks[i].needs[r] ?? 0;
    }
  });
  return out;
}

/** Priority that prefers tasks earlier in `order`. */
export function orderPriority(order: string[]): Priority {
  const rank = new Map(order.map((id, i) => [id, i]));
  return (a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0);
}

/** Priority for a rule; ties go to the task listed first. */
export function ruleComparator(rule: Rule, tasks: Task[]): Priority {
  const index = new Map(tasks.map((t, i) => [t.id, i]));
  const key = ruleKey(rule, tasks);
  return (a, b) => key(a) - key(b) || (index.get(a.id) ?? 0) - (index.get(b.id) ?? 0);
}

function ruleKey(rule: Rule, tasks: Task[]): (t: Task) => number {
  switch (rule) {
    case "min-lst": {
      const { latestStart } = cpm(tasks);
      return (t) => latestStart[t.id];
    }
    case "most-successors":
      return (t) => -successors(tasks, t.id).size;
    case "longest":
      return (t) => -t.days;
    case "greatest-demand":
      // Person-days of work: duration times units needed.
      return (t) => -t.days * RESOURCES.reduce((sum, r) => sum + (t.needs[r] ?? 0), 0);
    case "shortest":
      return (t) => t.days;
    case "input-order":
      return () => 0;
  }
}

/** Every task that transitively depends on `id`. */
function successors(tasks: Task[], id: string): Set<string> {
  const found = new Set<string>();
  const visit = (from: string) => {
    for (const t of tasks) {
      if (t.deps.includes(from) && !found.has(t.id)) {
        found.add(t.id);
        visit(t.id);
      }
    }
  };
  visit(id);
  return found;
}
