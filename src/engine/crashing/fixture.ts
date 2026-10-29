import type { CrashTask } from "./types";

/** A trade show booth, listed in dependency order. */
export const BOOTH: CrashTask[] = [
  { id: "A", name: "Design", days: 4, deps: [], minDays: 2, costPerDay: 600, pos: { col: 0, row: 0.5 } },
  { id: "B", name: "Fabricate", days: 6, deps: ["A"], minDays: 4, costPerDay: 400, pos: { col: 1, row: 0 } },
  { id: "C", name: "Graphics", days: 5, deps: ["A"], minDays: 3, costPerDay: 900, pos: { col: 1, row: 1 } },
  { id: "D", name: "Ship", days: 3, deps: ["B", "C"], minDays: 1, costPerDay: 1500, pos: { col: 2, row: 0.5 } },
  { id: "E", name: "Set up", days: 2, deps: ["D"], minDays: 2, costPerDay: 0, pos: { col: 3, row: 0.5 } },
];

export const DEFAULT_OVERHEAD = 800;
export const OVERHEAD_RANGE = { min: 300, max: 2000, step: 100 } as const;
