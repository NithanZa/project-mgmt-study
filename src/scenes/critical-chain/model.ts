import { fever } from "@/engine/critical-chain/fever";
import { REDESIGN } from "@/engine/critical-chain/fixture";
import {
  bestFeasible,
  buffers,
  chain,
  committedDate,
  cpm,
  float,
} from "@/engine/critical-chain/schedule";
import type { Zone } from "@/engine/critical-chain/types";

/** The scenario's facts, shared by the scene and the beat copy. */
export const TASKS = REDESIGN;

export const UNCONSTRAINED = cpm(TASKS, "safe");
export const SAFE = bestFeasible(TASKS, "safe");
export const PLAN = bestFeasible(TASKS, "aggressive");

export const CHAINS = {
  unconstrained: chain(TASKS, UNCONSTRAINED),
  feasible: chain(TASKS, SAFE),
  buffered: chain(TASKS, PLAN),
};

/** Non-chain tasks with float in the feasible safe schedule. */
export const FEASIBLE_FLOAT = Object.fromEntries(
  Object.entries(float(TASKS, SAFE)).filter(([id, f]) => f > 0 && !CHAINS.feasible.ids.includes(id)),
);
export const HALF = buffers(TASKS, PLAN, "half");
export const RSS = buffers(TASKS, PLAN, "rss");
export const COMMITTED = {
  half: committedDate(TASKS, PLAN, "half"),
  rss: committedDate(TASKS, PLAN, "rss"),
};

export const OVERRUN_MAX = { cms: 4, pages: 6 };

/** Smallest CMS overrun that puts the fever point in `zone`. */
export function firstCmsOverrun(target: Zone): number {
  for (let days = 0; days <= OVERRUN_MAX.cms; days++) {
    if (fever(TASKS, { cms: days }).zone === target) return days;
  }
  throw new Error(`No CMS overrun reaches ${target}`);
}

export const nameOf = (id: string) => TASKS.find((t) => t.id === id)!.name;
export const names = (ids: string[]) => ids.map(nameOf).join(" → ");
