import { HOURS_PER_DAY, IMPROVEMENTS } from "./fixture";
import type { ImprovementId, Step, StepId } from "./types";

export interface Summary {
  leadTimeDays: number;
  processDays: number;
  waitDays: number;
  /** Process cycle efficiency: process time ÷ lead time. */
  efficiency: number;
}

export function summary(steps: readonly Step[]): Summary {
  let waitDays = 0;
  let processHours = 0;
  for (const s of steps) {
    waitDays += s.waitDays;
    processHours += s.processHours;
  }
  const processDays = processHours / HOURS_PER_DAY;
  const leadTimeDays = waitDays + processDays;
  return { leadTimeDays, processDays, waitDays, efficiency: processDays / leadTimeDays };
}

export function applyImprovements(
  steps: readonly Step[],
  ids: Iterable<ImprovementId>,
): Step[] {
  const on = new Set(ids);
  return IMPROVEMENTS.filter((i) => on.has(i.id)).reduce<Step[]>((acc, i) => i.apply(acc), [...steps]);
}

export function withProcessHours(steps: readonly Step[], id: StepId, hours: number): Step[] {
  return steps.map((s) => (s.id === id ? { ...s, processHours: hours } : s));
}
