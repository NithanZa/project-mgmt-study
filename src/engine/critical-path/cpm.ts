import type { CpmResult, Task, TaskTimes } from "./types";

export class CycleError extends Error {
  constructor(public readonly remaining: string[]) {
    super(`Dependency cycle among: ${remaining.join(", ")}`);
    this.name = "CycleError";
  }
}

function successorsOf(tasks: readonly Task[]): Map<string, string[]> {
  const succ = new Map<string, string[]>(tasks.map((t) => [t.id, []]));
  for (const t of tasks) {
    for (const d of t.deps) {
      const list = succ.get(d);
      if (!list) throw new Error(`Task ${t.id} depends on unknown task ${d}`);
      list.push(t.id);
    }
  }
  return succ;
}

function topologicalOrder(tasks: readonly Task[], succ: Map<string, string[]>): string[] {
  const indegree = new Map(tasks.map((t) => [t.id, t.deps.length]));
  const queue = tasks.filter((t) => t.deps.length === 0).map((t) => t.id);
  const order: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    for (const s of succ.get(id)!) {
      const left = indegree.get(s)! - 1;
      indegree.set(s, left);
      if (left === 0) queue.push(s);
    }
  }
  if (order.length < tasks.length) {
    throw new CycleError(tasks.filter((t) => !order.includes(t.id)).map((t) => t.id));
  }
  return order;
}

export function computeCriticalPath(tasks: readonly Task[]): CpmResult {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const succ = successorsOf(tasks);
  const order = topologicalOrder(tasks, succ);

  const es = new Map<string, number>();
  const ef = new Map<string, number>();
  for (const id of order) {
    const task = byId.get(id)!;
    const start = Math.max(0, ...task.deps.map((d) => ef.get(d)!));
    es.set(id, start);
    ef.set(id, start + task.weeks);
  }
  const duration = Math.max(0, ...ef.values());

  const rows: Record<string, TaskTimes> = {};
  for (const id of [...order].reverse()) {
    const lf = Math.min(duration, ...succ.get(id)!.map((s) => rows[s].ls));
    const ls = lf - byId.get(id)!.weeks;
    const float = ls - es.get(id)!;
    rows[id] = { es: es.get(id)!, ef: ef.get(id)!, ls, lf, float, critical: float === 0 };
  }

  // Depth-first over zero-float edges (successor starts the moment the task ends).
  const criticalPaths: string[][] = [];
  const walk = (path: string[]) => {
    const id = path[path.length - 1];
    const next = succ.get(id)!.filter((s) => rows[s].critical && rows[s].es === rows[id].ef);
    if (succ.get(id)!.length === 0) criticalPaths.push(path);
    for (const s of next) walk([...path, s]);
  };
  for (const t of tasks) if (t.deps.length === 0 && rows[t.id].critical) walk([t.id]);

  return { duration, order, rows, criticalPaths };
}

export function withWeeks(tasks: readonly Task[], id: string, weeks: number): Task[] {
  return tasks.map((t) => (t.id === id ? { ...t, weeks } : t));
}
