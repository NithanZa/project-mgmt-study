import { describe, expect, it } from "vitest";
import { cpm, earlySchedule } from "./cpm";
import { DEFAULT_CAPACITIES, FEATURES } from "./fixture";
import { level, levelWithinFloat, makespan, shift } from "./level";
import { demand, overloadedDays, overloads } from "./profile";
import { RESOURCES, type Capacities, type Schedule } from "./types";

const starts = (schedule: Schedule) =>
  Object.fromEntries(FEATURES.map((t) => [t.id, schedule[t.id].start]));

function feasible(schedule: Schedule, capacities: Capacities) {
  const deps = FEATURES.every((t) => t.deps.every((d) => schedule[d].end <= schedule[t.id].start));
  const profile = demand(FEATURES, schedule);
  return deps && RESOURCES.every((r) => profile[r].every((n) => n <= capacities[r]));
}

describe("resource leveling engine", () => {
  it("CPM matches the table", () => {
    const { rows, duration } = cpm(FEATURES);
    expect(duration).toBe(8);
    const table = FEATURES.map((t) => [t.id, rows[t.id].es, rows[t.id].ef, rows[t.id].ls, rows[t.id].lf, rows[t.id].float]);
    expect(table).toEqual([
      ["X1", 0, 3, 0, 3, 0],
      ["X2", 3, 7, 3, 7, 0],
      ["X3", 7, 8, 7, 8, 0],
      ["Y1", 0, 2, 2, 4, 2],
      ["Y2", 2, 5, 4, 7, 2],
      ["Y3", 5, 6, 7, 8, 2],
      ["Z1", 0, 2, 4, 6, 4],
      ["Z2", 2, 4, 6, 8, 4],
    ]);
  });

  it("the early schedule overloads designer days 0-1 and developer day 3", () => {
    const profile = demand(FEATURES, earlySchedule(FEATURES));
    const list = overloads(profile, DEFAULT_CAPACITIES);
    expect(list).toEqual([
      { resource: "designer", day: 0, demand: 3 },
      { resource: "designer", day: 1, demand: 3 },
      { resource: "developer", day: 3, demand: 3 },
    ]);
    expect(overloadedDays(list)).toBe(3);
  });

  it("leveling within float moves Z1 to day 3 and leaves Y1 unresolved", () => {
    const { schedule, unresolved } = levelWithinFloat(FEATURES, DEFAULT_CAPACITIES);
    expect(unresolved).toEqual(["Y1"]);
    expect(schedule.Z1).toEqual({ start: 3, end: 5 });
    expect(makespan(schedule)).toBe(8);
    const early = earlySchedule(FEATURES);
    const moved = FEATURES.filter((t) => schedule[t.id].start !== early[t.id].start).map((t) => t.id);
    expect(moved).toEqual(["Z1", "Z2"]);
    const list = overloads(demand(FEATURES, schedule), DEFAULT_CAPACITIES);
    expect(list.map((o) => [o.resource, o.day])).toEqual([
      ["designer", 0],
      ["designer", 1],
    ]);
  });

  it("min-LST leveling gives 9 days with the listed starts", () => {
    const schedule = level(FEATURES, DEFAULT_CAPACITIES, "min-lst");
    expect(makespan(schedule)).toBe(9);
    expect(starts(schedule)).toEqual({ X1: 0, Y1: 3, Z1: 5, X2: 3, Y2: 5, Z2: 7, X3: 7, Y3: 8 });
    expect(feasible(schedule, DEFAULT_CAPACITIES)).toBe(true);
  });

  it("shortest-first gives 12 days", () => {
    const schedule = level(FEATURES, DEFAULT_CAPACITIES, "shortest");
    expect(makespan(schedule)).toBe(12);
    expect(feasible(schedule, DEFAULT_CAPACITIES)).toBe(true);
  });

  it("two designers give 8 days and one developer gives 12", () => {
    const two = { designer: 2, developer: 2 };
    const one = { designer: 1, developer: 1 };
    expect(makespan(level(FEATURES, two, "min-lst"))).toBe(8);
    expect(makespan(level(FEATURES, one, "min-lst"))).toBe(12);
    expect(feasible(level(FEATURES, two, "min-lst"), two)).toBe(true);
    expect(feasible(level(FEATURES, one, "min-lst"), one)).toBe(true);
  });

  it("shift pushes successors and never starts a task before its deps", () => {
    const base = level(FEATURES, DEFAULT_CAPACITIES, "min-lst");
    const moved = shift(base, FEATURES, "X1", 1);
    expect(moved.X1).toEqual({ start: 1, end: 4 });
    expect(moved.X2).toEqual({ start: 4, end: 8 });
    expect(moved.X3).toEqual({ start: 8, end: 9 });
    expect(moved.Y1).toEqual(base.Y1);
    expect(shift(base, FEATURES, "X2", 0).X2.start).toBe(3);
    expect(overloads(demand(FEATURES, moved), DEFAULT_CAPACITIES)).toContainEqual({
      resource: "designer",
      day: 3,
      demand: 2,
    });
  });
});
