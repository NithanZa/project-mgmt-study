export type Resource = "programmer" | "artist";

export const RESOURCES: readonly Resource[] = ["programmer", "artist"];

export interface Task {
  id: string;
  name: string;
  days: number;
  deps: string[];
  needs: Partial<Record<Resource, number>>;
}

export type Capacities = Record<Resource, number>;

export interface Placement {
  id: string;
  start: number;
  finish: number;
}

/** One placement per task, in the task list's order. */
export type Schedule = Placement[];

export type Rule =
  | "min-lst"
  | "most-successors"
  | "longest"
  | "greatest-demand"
  | "shortest"
  | "input-order";

export const RULES: readonly Rule[] = [
  "min-lst",
  "most-successors",
  "longest",
  "greatest-demand",
  "shortest",
  "input-order",
];
