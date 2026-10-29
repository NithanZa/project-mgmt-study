import type { CrashTask } from "./types";

export interface Schedule {
  duration: number;
  float: Record<string, number>;
  /** Every start-to-finish chain of zero-float tasks, as task ids. */
  paths: string[][];
}

/** Forward and backward pass. Tasks must be listed in dependency order. */
export function schedule(tasks: CrashTask[]): Schedule {
  const ef: Record<string, number> = {};
  for (const t of tasks) ef[t.id] = Math.max(0, ...t.deps.map((d) => ef[d])) + t.days;
  const duration = Math.max(...tasks.map((t) => ef[t.id]));

  const ls: Record<string, number> = {};
  for (const t of [...tasks].reverse()) {
    const successors = tasks.filter((s) => s.deps.includes(t.id));
    ls[t.id] = Math.min(duration, ...successors.map((s) => ls[s.id])) - t.days;
  }

  const float: Record<string, number> = {};
  for (const t of tasks) float[t.id] = ls[t.id] - (ef[t.id] - t.days);

  const tight = (from: CrashTask, to: CrashTask) =>
    float[to.id] === 0 && to.deps.includes(from.id) && ef[from.id] === ef[to.id] - to.days;
  const extend = (path: CrashTask[]): CrashTask[][] => {
    const tail = path[path.length - 1];
    const next = tasks.filter((t) => tight(tail, t));
    if (next.length === 0) return ef[tail.id] === duration ? [path] : [];
    return next.flatMap((t) => extend([...path, t]));
  };
  const paths = tasks
    .filter((t) => t.deps.length === 0 && float[t.id] === 0)
    .flatMap((t) => extend([t]))
    .map((p) => p.map((t) => t.id));

  return { duration, float, paths };
}
