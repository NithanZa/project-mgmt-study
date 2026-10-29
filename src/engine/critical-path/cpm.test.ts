import { describe, expect, it } from "vitest";
import { computeCriticalPath, CycleError, withWeeks } from "./cpm";
import { COFFEE_SHOP, PRESETS } from "./fixture";
import type { Task } from "./types";

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

const tasks = deepFreeze(structuredClone(COFFEE_SHOP));

// id: [ES, EF, LS, LF, float]
const TABLE: Record<string, [number, number, number, number, number]> = {
  A: [0, 2, 0, 2, 0],
  B: [2, 6, 2, 6, 0],
  C: [2, 8, 4, 10, 2],
  D: [2, 5, 6, 9, 4],
  E: [6, 9, 6, 9, 0],
  G: [8, 9, 10, 11, 2],
  F: [9, 11, 9, 11, 0],
  H: [11, 12, 11, 12, 0],
};

describe("computeCriticalPath", () => {
  it("solves the coffee shop", () => {
    const result = computeCriticalPath(tasks);
    expect(result.duration).toBe(12);
    for (const [id, [es, ef, ls, lf, float]] of Object.entries(TABLE)) {
      expect(result.rows[id]).toEqual({ es, ef, ls, lf, float, critical: float === 0 });
    }
    expect(result.criticalPaths).toEqual([["A", "B", "E", "F", "H"]]);
  });

  it("returns a topological order", () => {
    const { order } = computeCriticalPath(tasks);
    expect(order).toHaveLength(tasks.length);
    for (const t of tasks) {
      for (const d of t.deps) expect(order.indexOf(d)).toBeLessThan(order.indexOf(t.id));
    }
  });

  it.each([
    [PRESETS[0], 13, [["A", "C", "G", "H"]]],
    [PRESETS[1], 13, [["A", "D", "F", "H"]]],
    [PRESETS[2], 10, [["A", "B", "E", "F", "H"], ["A", "C", "G", "H"]]],
  ])("preset %o", ({ task, weeks }, duration, paths) => {
    const result = computeCriticalPath(withWeeks(tasks, task, weeks));
    expect(result.duration).toBe(duration);
    expect(result.criticalPaths).toEqual(paths);
  });

  it("keeps the opening while Renovation uses its float", () => {
    const result = computeCriticalPath(withWeeks(tasks, "C", 8));
    expect(result.duration).toBe(12);
  });

  it("throws CycleError on a cycle", () => {
    const cyclic: Task[] = tasks.map((t) => (t.id === "A" ? { ...t, deps: ["H"] } : t));
    expect(() => computeCriticalPath(cyclic)).toThrow(CycleError);
  });

  it("does not mutate its input", () => {
    const before = structuredClone(tasks);
    computeCriticalPath(tasks);
    const changed = withWeeks(tasks, "C", 9);
    expect(tasks).toEqual(before);
    expect(changed).not.toBe(tasks);
    expect(changed.find((t) => t.id === "C")?.weeks).toBe(9);
  });
});
