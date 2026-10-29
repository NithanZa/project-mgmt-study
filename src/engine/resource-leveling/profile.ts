import { RESOURCES, type Capacities, type Resource, type Schedule, type Task } from "./types";

export type Demand = Record<Resource, number[]>;

export interface Overload {
  resource: Resource;
  day: number;
  demand: number;
}

/** People needed per resource per day, for days 0 to `horizon - 1` (default: up to the last end). */
export function demand(tasks: Task[], schedule: Schedule, horizon?: number): Demand {
  const length = horizon ?? Math.max(0, ...tasks.map((t) => schedule[t.id].end));
  const out: Demand = {
    designer: Array<number>(length).fill(0),
    developer: Array<number>(length).fill(0),
  };
  for (const t of tasks) {
    const { start, end } = schedule[t.id];
    for (let d = start; d < Math.min(end, length); d++) out[t.resource][d]++;
  }
  return out;
}

export function overloads(profile: Demand, capacities: Capacities): Overload[] {
  return RESOURCES.flatMap((resource) =>
    profile[resource].flatMap((units, day) =>
      units > capacities[resource] ? [{ resource, day, demand: units }] : [],
    ),
  );
}

/** Number of distinct days on which any resource is overloaded. */
export function overloadedDays(list: Overload[]): number {
  return new Set(list.map((o) => o.day)).size;
}
