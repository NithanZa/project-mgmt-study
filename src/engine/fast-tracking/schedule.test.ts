import { describe, expect, it } from "vitest";
import { MAX_OVERLAP } from "./fixture";
import { bestOverlaps, clampOverlap, netCurve, schedule } from "./schedule";

describe("fast tracking schedule", () => {
  it("runs the four phases end to end in 80 days with no overlap", () => {
    const s = schedule([0, 0, 0]);
    expect(s.planned).toBe(80);
    expect(s.expected).toBe(80);
    expect(s.bars.map((b) => [b.start, b.end])).toEqual([
      [0, 20],
      [20, 35],
      [35, 55],
      [55, 80],
    ]);
  });

  it("nets o - o²/p on Design → Foundations, peaking at half the predecessor", () => {
    // The plan's sweep also lists 0 at 20 days; that overlap is beyond MAX_OVERLAP (19).
    const nets = [1.8, 3.2, 4.2, 4.8, 5, 4.8, 4.2, 3.2, 1.8];
    nets.forEach((net, i) => {
      const overlap = 2 * (i + 1);
      expect(schedule([overlap, 0, 0]).edges[0].net).toBeCloseTo(net, 9);
      expect(netCurve(0).find((p) => p.overlap === overlap)?.net).toBeCloseTo(net, 9);
    });
  });

  it("shows saved 10, risk 50%, rework 5 for a 10-day Foundations overlap", () => {
    const s = schedule([10, 0, 0]);
    expect(s.edges[0]).toEqual({ saved: 10, risk: 0.5, expectedRework: 5, net: 5 });
    expect(s.planned).toBe(70);
    expect(s.expected).toBe(75);
  });

  it("finds the best overlaps by grid search", () => {
    expect(bestOverlaps()).toEqual([10, 7.5, 10]);
    const s = schedule(bestOverlaps());
    expect(s.expected).toBeCloseTo(66.25, 2);
    expect(80 - s.planned).toBeCloseTo(27.5, 9);
    expect(s.expectedRework).toBeCloseTo(13.75, 9);
  });

  it("gives the light and maximum presets", () => {
    expect(schedule([5, 4, 5]).expected).toBeCloseTo(69.6, 1);
    expect(schedule([19, 14, 19]).expected).toBeCloseTo(77.17, 2);
  });

  it("never lets an overlap exceed MAX_OVERLAP or go negative", () => {
    const s = schedule([30, 30, 30]);
    expect(s.edges.map((e) => e.saved)).toEqual(MAX_OVERLAP);
    expect(schedule([-5, -5, -5]).planned).toBe(80);
    MAX_OVERLAP.forEach((max, i) => {
      expect(clampOverlap(i, max + 1)).toBe(max);
      expect(netCurve(i).at(-1)?.overlap).toBe(max);
    });
  });
});
