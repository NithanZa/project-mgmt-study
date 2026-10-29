import type { PertTask } from "./types";

/** A database migration: five sequential tasks, estimates in days. */
export const MIGRATION: PertTask[] = [
  { id: "audit", name: "Audit", estimate: { o: 1, m: 2, p: 4 } },
  { id: "schema", name: "Schema design", estimate: { o: 2, m: 3, p: 7 } },
  { id: "write", name: "Write migration", estimate: { o: 3, m: 5, p: 12 } },
  { id: "dry-run", name: "Dry run", estimate: { o: 1, m: 2, p: 5 } },
  { id: "cutover", name: "Cutover", estimate: { o: 1, m: 1, p: 3 } },
];

/** The deadline the team is asked to hit, in days. */
export const DEADLINE = 17;

/** The widest pessimistic estimate the learner can give Write migration. */
export const WIDE_PESSIMISTIC = 20;
