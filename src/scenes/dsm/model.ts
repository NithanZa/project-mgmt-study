import { feedback, marks, partition } from "@/engine/dsm/dsm";
import { BIKE } from "@/engine/dsm/fixture";
import type { Mark, Order } from "@/engine/dsm/types";

export const SPRING = { type: "spring", bounce: 0.2, visualDuration: 0.4 } as const;
export const FADE = { duration: 0.18, ease: "easeOut" } as const;

export const NAME = Object.fromEntries(BIKE.map((a) => [a.id, a.name])) as Record<string, string>;
export const MARKS = marks(BIKE);
export const BEST = partition(BIKE);
export const BLOCK = BEST.blocks[0];
/** Edges that stay backward even in the best order: the true feedback loops. */
export const LOOPS = feedback(BIKE, BEST.order).marks;

export const edgeKey = (m: Mark) => `${m.col}>${m.row}`;
export const sameMark = (a: Mark | null, b: Mark) => a?.row === b.row && a?.col === b.col;

/** First and last row the coupled block occupies in `order`. */
export function blockRows(order: Order): { first: number; last: number } {
  const rows = BLOCK.map((id) => order.indexOf(id));
  return { first: Math.min(...rows), last: Math.max(...rows) };
}

/** Graph nodes and matrix row headers share this id, so one morphs into the other. */
export const nodeLayoutId = (id: string) => `row-${id}`;
