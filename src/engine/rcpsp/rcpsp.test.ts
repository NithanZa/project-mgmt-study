import { describe, expect, it } from "vitest";
import { cpm } from "./cpm";
import { CAPACITIES, GAME_JAM } from "./fixture";
import { exhaustive, sampleOrders } from "./search";
import { makespan, orderPriority, ruleComparator, serialSgs, usage } from "./sgs";
import { RESOURCES, RULES, type Capacities, type Schedule } from "./types";

function withinCapacity(schedule: Schedule, capacities: Capacities) {
  const profile = usage(GAME_JAM, schedule, makespan(schedule));
  return RESOURCES.every((r) => profile[r].every((units) => units <= capacities[r]));
}

describe("rcpsp engine", () => {
  it("CPM ignoring people gives 13 days and overloads programmers", () => {
    const { duration, schedule } = cpm(GAME_JAM);
    expect(duration).toBe(13);
    expect(Math.max(...usage(GAME_JAM, schedule, duration).programmer)).toBe(4);
  });

  it("priority rules give the verified makespans", () => {
    const spans = RULES.map((rule) =>
      makespan(serialSgs(GAME_JAM, CAPACITIES, ruleComparator(rule, GAME_JAM))),
    );
    expect(spans).toEqual([22, 22, 24, 24, 28, 28]);
  });

  it("exhaustive search finds 20 as best and 28 as worst over 5040 orders", () => {
    const result = exhaustive(GAME_JAM, CAPACITIES);
    expect(result.best.makespan).toBe(20);
    expect(result.worst.makespan).toBe(28);
    expect(result.evaluated).toBe(5040);
    expect(Object.values(result.histogram).reduce((a, b) => a + b, 0)).toBe(5040);
    const replay = serialSgs(GAME_JAM, CAPACITIES, orderPriority(result.best.order));
    expect(makespan(replay)).toBe(20);
    expect(makespan(serialSgs(GAME_JAM, CAPACITIES, orderPriority([..."FBCDEAG"])))).toBe(20);
  });

  it("schedules never exceed capacity and respect dependencies", () => {
    const caps: Capacities[] = [CAPACITIES, { programmer: 3, artist: 1 }, { programmer: 2, artist: 2 }];
    for (const c of caps) {
      const schedules = [
        ...RULES.map((r) => serialSgs(GAME_JAM, c, ruleComparator(r, GAME_JAM))),
        ...sampleOrders(GAME_JAM, c, 50, 7).map((s) => s.schedule),
      ];
      for (const s of schedules) {
        expect(withinCapacity(s, c)).toBe(true);
        GAME_JAM.forEach((t, i) =>
          t.deps.forEach((d) => expect(s[i].start).toBeGreaterThanOrEqual(s.find((p) => p.id === d)!.finish)),
        );
      }
    }
  });

  it("runs the full search in under 150 ms", () => {
    const t0 = performance.now();
    exhaustive([...GAME_JAM], { programmer: 3, artist: 2 });
    expect(performance.now() - t0).toBeLessThan(150);
  });

  it("samples are seeded", () => {
    const a = sampleOrders(GAME_JAM, CAPACITIES, 40, 1).map((s) => s.makespan);
    expect(sampleOrders(GAME_JAM, CAPACITIES, 40, 1).map((s) => s.makespan)).toEqual(a);
    expect(a.every((m) => m >= 20 && m <= 28)).toBe(true);
  });
});
