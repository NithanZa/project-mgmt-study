import type { Activity, FeedbackMark, Mark, Order } from "./types";

export function marks(activities: Activity[]): Mark[] {
  return activities.flatMap((a) => a.deps.map((col) => ({ row: a.id, col })));
}

/** Marks whose dependency is sequenced after the row that needs it. */
export function feedback(
  activities: Activity[],
  order: Order,
): { count: number; marks: FeedbackMark[] } {
  const pos = new Map(order.map((id, i) => [id, i]));
  const above = marks(activities).flatMap((m) => {
    const span = pos.get(m.col)! - pos.get(m.row)!;
    return span > 0 ? [{ ...m, span }] : [];
  });
  return { count: above.length, marks: above };
}

/** Tarjan's strongly connected components over the dependency edges. */
function components(activities: Activity[]): string[][] {
  const deps = new Map(activities.map((a) => [a.id, a.deps]));
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const out: string[][] = [];

  const visit = (v: string) => {
    index.set(v, index.size);
    low.set(v, index.get(v)!);
    stack.push(v);
    onStack.add(v);
    for (const w of deps.get(v)!) {
      if (!index.has(w)) {
        visit(w);
        low.set(v, Math.min(low.get(v)!, low.get(w)!));
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v)!, index.get(w)!));
      }
    }
    if (low.get(v) === index.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);
      out.push(scc);
    }
  };

  for (const a of activities) if (!index.has(a.id)) visit(a.id);
  return out;
}

/**
 * Orders a block's members so as many of their in-block dependencies as
 * possible come first: repeatedly take the member with the fewest unplaced
 * in-block dependencies, ties by input order.
 */
function sequenceBlock(members: Activity[]): string[] {
  const left = [...members];
  const placed = new Set<string>();
  const ids = new Set(members.map((m) => m.id));
  const waiting = (a: Activity) => a.deps.filter((d) => ids.has(d) && !placed.has(d)).length;
  const out: string[] = [];
  while (left.length) {
    const next = left.reduce((best, a) => (waiting(a) < waiting(best) ? a : best));
    left.splice(left.indexOf(next), 1);
    placed.add(next.id);
    out.push(next.id);
  }
  return out;
}

/**
 * Sequences activities so every dependency comes first except inside coupled
 * blocks (strongly connected components), which stay contiguous. Ready blocks
 * are taken in input order.
 */
export function partition(activities: Activity[]): { order: Order; blocks: string[][] } {
  const byId = new Map(activities.map((a) => [a.id, a]));
  const rank = new Map(activities.map((a, i) => [a.id, i]));
  const sccs = components(activities).map((ids) =>
    sequenceBlock(
      ids.sort((a, b) => rank.get(a)! - rank.get(b)!).map((id) => byId.get(id)!),
    ),
  );
  const blockOf = new Map(sccs.flatMap((ids, b) => ids.map((id) => [id, b])));
  const first = (b: number) => rank.get(sccs[b][0])!;
  const prereqs = sccs.map((ids, b) => {
    const set = new Set<number>();
    for (const id of ids)
      for (const d of byId.get(id)!.deps) if (blockOf.get(d) !== b) set.add(blockOf.get(d)!);
    return set;
  });

  const done = new Set<number>();
  const order: Order = [];
  while (done.size < sccs.length) {
    const ready = sccs
      .map((_, b) => b)
      .filter((b) => !done.has(b) && [...prereqs[b]].every((p) => done.has(p)));
    const next = ready.reduce((best, b) => (first(b) < first(best) ? b : best));
    done.add(next);
    order.push(...sccs[next]);
  }
  return { order, blocks: sccs.filter((ids) => ids.length > 1) };
}

export function moveRow(order: Order, from: number, to: number): Order {
  const next = [...order];
  const [id] = next.splice(from, 1);
  next.splice(to, 0, id);
  return next;
}
