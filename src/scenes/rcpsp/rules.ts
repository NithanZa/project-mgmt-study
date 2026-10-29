import type { Rule } from "@/engine/rcpsp/types";

export const RULE_LABEL: Record<Rule, string> = {
  "min-lst": "Latest start",
  "most-successors": "Successors",
  longest: "Longest",
  "greatest-demand": "Demand",
  shortest: "Shortest",
  "input-order": "List order",
};
