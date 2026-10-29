import { HOUSE, MAX_OVERLAP } from "./fixture";
import type { Overlaps } from "./types";

export interface Bar {
  id: string;
  start: number;
  end: number;
}

export interface Edge {
  /** Days the successor starts early. */
  saved: number;
  /** Chance the overlapped work must be redone. */
  risk: number;
  /** Expected days of redone work: risk × overlap. */
  expectedRework: number;
  net: number;
}

export interface Schedule {
  bars: Bar[];
  planned: number;
  expectedRework: number;
  expected: number;
  edges: Edge[];
}

const STEP = 0.5;

export function clampOverlap(edgeIndex: number, value: number): number {
  return Math.min(Math.max(value, 0), MAX_OVERLAP[edgeIndex]);
}

function edge(edgeIndex: number, value: number): Edge {
  const overlap = clampOverlap(edgeIndex, value);
  const risk = overlap / HOUSE[edgeIndex].days;
  const expectedRework = risk * overlap;
  return { saved: overlap, risk, expectedRework, net: overlap - expectedRework };
}

export function schedule(overlaps: Overlaps): Schedule {
  const edges = overlaps.map((o, i) => edge(i, o));
  const bars: Bar[] = [];
  let end = 0;
  HOUSE.forEach((phase, i) => {
    const start = i === 0 ? 0 : end - edges[i - 1].saved;
    end = start + phase.days;
    bars.push({ id: phase.id, start, end });
  });
  const expectedRework = edges.reduce((sum, e) => sum + e.expectedRework, 0);
  return { bars, planned: end, expectedRework, expected: end + expectedRework, edges };
}

export function netCurve(edgeIndex: number): { overlap: number; net: number }[] {
  const points = [];
  for (let overlap = 0; overlap <= MAX_OVERLAP[edgeIndex]; overlap += STEP) {
    points.push({ overlap, net: edge(edgeIndex, overlap).net });
  }
  return points;
}

/** Edges are independent, so the best grid point per edge gives the best schedule. */
export function bestOverlaps(): Overlaps {
  const best = (i: number) =>
    netCurve(i).reduce((a, b) => (b.net > a.net ? b : a)).overlap;
  return [best(0), best(1), best(2)];
}
