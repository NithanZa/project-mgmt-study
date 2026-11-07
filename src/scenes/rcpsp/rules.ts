import { ruleKey } from "@/engine/rcpsp/sgs";
import type { Rule, Task } from "@/engine/rcpsp/types";

export const RULE_LABEL: Record<Rule, string> = {
  "min-lst": "Latest start",
  "most-successors": "Successors",
  longest: "Longest",
  "greatest-demand": "Demand",
  shortest: "Shortest",
  "input-order": "List order",
};

/** Header of the rank column: what each rule sorts by. */
export const RANK_HEADER: Record<Rule, string> = {
  "min-lst": "LST",
  "most-successors": "succ.",
  longest: "days",
  "greatest-demand": "p-days",
  shortest: "days",
  "input-order": "#",
};

/**
 * Each task's value under a rule, as the learner reads it: rules that sort
 * largest-first negate their key, so the column shows its size; list order shows
 * the position.
 */
export function rankValues(rule: Rule, tasks: Task[]): number[] {
  if (rule === "input-order") return tasks.map((_, i) => i + 1);
  const key = ruleKey(rule, tasks);
  return tasks.map((t) => Math.abs(key(t)));
}
