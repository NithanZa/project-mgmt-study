import type { Schedule, Task } from "./types";

export interface CpmResult {
  duration: number;
  /** Earliest starts: the schedule that ignores resources. */
  schedule: Schedule;
  latestStart: Record<string, number>;
}

/** Forward and backward pass. Tasks must be listed after their predecessors. */
export function cpm(tasks: Task[]): CpmResult {
  const finish: Record<string, number> = {};
  const schedule = tasks.map((t) => {
    const start = Math.max(0, ...t.deps.map((d) => finish[d]));
    finish[t.id] = start + t.days;
    return { id: t.id, start, finish: finish[t.id] };
  });
  const duration = Math.max(...schedule.map((p) => p.finish));

  const latestStart: Record<string, number> = {};
  for (const t of [...tasks].reverse()) {
    const successors = tasks.filter((s) => s.deps.includes(t.id));
    const latestFinish = Math.min(duration, ...successors.map((s) => latestStart[s.id]));
    latestStart[t.id] = latestFinish - t.days;
  }
  return { duration, schedule, latestStart };
}
