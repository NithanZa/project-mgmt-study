import { CAPACITIES } from "./fixture";
import type {
  BufferMethod,
  Buffers,
  Chain,
  FeedingBuffer,
  Link,
  Mode,
  ResourceId,
  Schedule,
  Task,
} from "./types";

export const duration = (task: Task, mode: Mode) => task[mode];

const safety = (task: Task) => task.safe - task.aggressive;

function topoOrder(tasks: Task[]): Task[] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const seen = new Set<string>();
  const out: Task[] = [];
  const visit = (t: Task) => {
    if (seen.has(t.id)) return;
    seen.add(t.id);
    t.deps.forEach((d) => visit(byId.get(d)!));
    out.push(t);
  };
  tasks.forEach(visit);
  return out;
}

/**
 * Earliest start for each task in `order` (predecessors first), honouring `links`.
 * Tasks without incoming links start at `release[id]` (default 0).
 */
export function forwardPass(
  order: Task[],
  links: Link[],
  dur: (task: Task) => number,
  release: Record<string, number> = {},
): Pick<Schedule, "start" | "finish" | "makespan"> {
  const start: Record<string, number> = {};
  const finish: Record<string, number> = {};
  for (const t of order) {
    const preds = links.filter((l) => l.to === t.id).map((l) => finish[l.from]);
    start[t.id] = Math.max(release[t.id] ?? 0, ...preds);
    finish[t.id] = start[t.id] + dur(t);
  }
  return { start, finish, makespan: Math.max(0, ...Object.values(finish)) };
}

const byStart = (tasks: Task[], schedule: Schedule) =>
  [...tasks].sort((a, b) => schedule.start[a.id] - schedule.start[b.id]);

const dependencyLinks = (tasks: Task[]): Link[] =>
  tasks.flatMap((t) => t.deps.map((d) => ({ from: d, to: t.id, kind: "dependency" as const })));

/** Critical path schedule that ignores resource limits. */
export function cpm(tasks: Task[], mode: Mode): Schedule {
  const pass = forwardPass(topoOrder(tasks), dependencyLinks(tasks), (t) => duration(t, mode));
  return { mode, ...pass };
}

/** Serial schedule generator: take the first eligible task in `priority`, place it as early as resources allow. */
function serialSchedule(
  priority: Task[],
  mode: Mode,
  capacities: Record<ResourceId, number>,
): Schedule {
  const start: Record<string, number> = {};
  const finish: Record<string, number> = {};
  const usage = new Map<ResourceId, number[]>();
  const pending = [...priority];
  while (pending.length > 0) {
    const i = pending.findIndex((t) => t.deps.every((d) => d in finish));
    const [task] = pending.splice(i, 1);
    const d = duration(task, mode);
    const used = usage.get(task.resource) ?? [];
    usage.set(task.resource, used);
    const fits = (s: number) => {
      for (let day = s; day < s + d; day++) {
        if ((used[day] ?? 0) >= capacities[task.resource]) return false;
      }
      return true;
    };
    let s = Math.max(0, ...task.deps.map((dep) => finish[dep]));
    while (!fits(s)) s++;
    for (let day = s; day < s + d; day++) used[day] = (used[day] ?? 0) + 1;
    start[task.id] = s;
    finish[task.id] = s + d;
  }
  return { mode, start, finish, makespan: Math.max(0, ...Object.values(finish)) };
}

function* permutations<T>(items: T[]): Generator<T[]> {
  if (items.length <= 1) {
    yield items;
    return;
  }
  for (let i = 0; i < items.length; i++) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const tail of permutations(rest)) yield [items[i], ...tail];
  }
}

const feasibleCache = new WeakMap<Task[], Map<Mode, Schedule>>();

/** Shortest resource-feasible schedule over every priority order (6 tasks: 720 orders). Memoised. */
export function bestFeasible(tasks: Task[], mode: Mode): Schedule {
  const byMode = feasibleCache.get(tasks) ?? new Map<Mode, Schedule>();
  feasibleCache.set(tasks, byMode);
  const cached = byMode.get(mode);
  if (cached) return cached;
  let best: Schedule | undefined;
  for (const order of permutations(tasks)) {
    const s = serialSchedule(order, mode, CAPACITIES);
    if (!best || s.makespan < best.makespan) best = s;
  }
  byMode.set(mode, best!);
  return best!;
}

/** Dependencies plus a resource link between consecutive, non-overlapping tasks on the same resource. */
export function links(tasks: Task[], schedule: Schedule): Link[] {
  const out = dependencyLinks(tasks);
  const resources = new Set(tasks.map((t) => t.resource));
  for (const r of resources) {
    const ordered = byStart(
      tasks.filter((t) => t.resource === r),
      schedule,
    );
    for (let i = 1; i < ordered.length; i++) {
      const [a, b] = [ordered[i - 1], ordered[i]];
      const exists = out.some((l) => l.from === a.id && l.to === b.id);
      if (!exists && schedule.finish[a.id] <= schedule.start[b.id]) {
        out.push({ from: a.id, to: b.id, kind: "resource" });
      }
    }
  }
  return out;
}

/** Longest path, by duration, through dependency and resource links. */
export function chain(tasks: Task[], schedule: Schedule): Chain {
  const all = links(tasks, schedule);
  const length: Record<string, number> = {};
  const prev: Record<string, Link | undefined> = {};
  for (const t of byStart(tasks, schedule)) {
    let best: Link | undefined;
    for (const l of all.filter((l) => l.to === t.id)) {
      if (!best || length[l.from] > length[best.from]) best = l;
    }
    prev[t.id] = best;
    length[t.id] = (best ? length[best.from] : 0) + duration(t, schedule.mode);
  }
  let end = tasks.reduce((a, b) => (length[b.id] > length[a.id] ? b : a)).id;
  const ids = [end];
  const path: Link[] = [];
  for (let l = prev[end]; l; l = prev[l.from]) {
    path.unshift(l);
    ids.unshift(l.from);
    end = l.from;
  }
  return { ids, links: path };
}

export interface Clash {
  resource: ResourceId;
  from: number;
  to: number;
}

/** Day ranges where a resource is booked beyond its capacity. */
export function clashes(tasks: Task[], schedule: Schedule): Clash[] {
  const out: Clash[] = [];
  for (const resource of new Set(tasks.map((t) => t.resource))) {
    const mine = tasks.filter((t) => t.resource === resource);
    let open: Clash | undefined;
    for (let day = 0; day <= schedule.makespan; day++) {
      const load = mine.filter((t) => schedule.start[t.id] <= day && day < schedule.finish[t.id]);
      if (load.length > CAPACITIES[resource]) {
        open ??= { resource, from: day, to: day };
        open.to = day + 1;
      } else if (open) {
        out.push(open);
        open = undefined;
      }
    }
  }
  return out;
}

/** Total float in `schedule`, given its dependency and resource links. */
export function float(tasks: Task[], schedule: Schedule): Record<string, number> {
  const all = links(tasks, schedule);
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const lateFinish: Record<string, number> = {};
  const out: Record<string, number> = {};
  for (const t of byStart(tasks, schedule).reverse()) {
    const succ = all
      .filter((l) => l.from === t.id)
      .map((l) => lateFinish[l.to] - duration(byId.get(l.to)!, schedule.mode));
    lateFinish[t.id] = Math.min(schedule.makespan, ...succ);
    out[t.id] = lateFinish[t.id] - schedule.finish[t.id];
  }
  return out;
}

function size(removed: number[], method: BufferMethod): number {
  const days =
    method === "half"
      ? removed.reduce((a, b) => a + b, 0) / 2
      : Math.sqrt(removed.reduce((a, b) => a + b * b, 0));
  return Math.ceil(days - 1e-9);
}

/**
 * Project buffer sized from the safety removed along the chain (`method`), and a
 * feeding buffer (half the safety removed) wherever a non-chain path joins the chain.
 */
export function buffers(tasks: Task[], schedule: Schedule, method: BufferMethod = "half"): Buffers {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const onChain = new Set(chain(tasks, schedule).ids);
  const feedingSafety = (id: string): number => {
    const t = byId.get(id)!;
    const upstream = t.deps.filter((d) => !onChain.has(d)).map(feedingSafety);
    return safety(t) + Math.max(0, ...upstream);
  };
  const feeding: FeedingBuffer[] = [];
  for (const id of onChain) {
    for (const from of byId.get(id)!.deps.filter((d) => !onChain.has(d))) {
      feeding.push({ before: id, from, days: size([feedingSafety(from)], "half") });
    }
  }
  const removed = [...onChain].map((id) => safety(byId.get(id)!));
  return { project: { days: size(removed, method), method }, feeding };
}

export function committedDate(
  tasks: Task[],
  schedule: Schedule,
  method: BufferMethod = "half",
): number {
  return schedule.makespan + buffers(tasks, schedule, method).project.days;
}
