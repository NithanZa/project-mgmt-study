export type Resource = "designer" | "developer";

export const RESOURCES: readonly Resource[] = ["designer", "developer"];

export interface Task {
  id: string;
  name: string;
  days: number;
  /** Ids of tasks that must finish first. */
  deps: string[];
  resource: Resource;
}

/** Half-open day interval: the task works days `start` to `end - 1`. */
export interface Slot {
  start: number;
  end: number;
}

export type Schedule = Record<string, Slot>;

export type Capacities = Record<Resource, number>;

export type Rule = "min-lst" | "shortest";
