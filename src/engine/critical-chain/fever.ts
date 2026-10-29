import { bestFeasible, buffers, chain, duration, forwardPass, links } from "./schedule";
import type { BufferMethod, FeverPoint, Task, Zone } from "./types";

export interface Fever extends FeverPoint {
  zone: Zone;
  /** Status after each reported chain task, starting at the origin. */
  trail: FeverPoint[];
}

/** Zone boundaries: buffer used = `at0` + `slope` * chain complete. */
export const ZONE_LINES = {
  yellow: { at0: 0.15, slope: 0.5 },
  red: { at0: 0.4, slope: 0.5 },
} as const;

const above = (line: { at0: number; slope: number }, p: FeverPoint) =>
  p.bufferUsed > line.at0 + line.slope * p.chainComplete;

export function zone(point: FeverPoint): Zone {
  if (above(ZONE_LINES.red, point)) return "red";
  if (above(ZONE_LINES.yellow, point)) return "yellow";
  return "green";
}

/**
 * Buffer status of the aggressive critical-chain plan once the tasks in `overruns`
 * are reported done, each `overruns[id]` days later than its aggressive estimate.
 * Status is taken at the last reported chain task; earlier chain tasks count as done.
 */
export function fever(
  tasks: Task[],
  overruns: Partial<Record<string, number>>,
  method: BufferMethod = "half",
): Fever {
  const plan = bestFeasible(tasks, "aggressive");
  const { ids } = chain(tasks, plan);
  const projectBuffer = buffers(tasks, plan, method).project.days;
  const actual = forwardPass(
    [...tasks].sort((a, b) => plan.start[a.id] - plan.start[b.id]),
    links(tasks, plan),
    (t) => duration(t, "aggressive") + (overruns[t.id] ?? 0),
    plan.start,
  );
  const days = (id: string) => plan.finish[id] - plan.start[id];
  const chainDays = ids.reduce((sum, id) => sum + days(id), 0);
  const last = Math.max(-1, ...ids.map((id, i) => (id in overruns ? i : -1)));
  const trail: FeverPoint[] = [{ chainComplete: 0, bufferUsed: 0 }];
  let finished = 0;
  for (const id of ids.slice(0, last + 1)) {
    finished += days(id);
    const delay = Math.max(0, actual.finish[id] - plan.finish[id]);
    trail.push({ chainComplete: finished / chainDays, bufferUsed: delay / projectBuffer });
  }
  const now = trail[trail.length - 1];
  return { ...now, zone: zone(now), trail };
}
