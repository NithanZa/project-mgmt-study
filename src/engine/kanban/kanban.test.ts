import { describe, expect, it } from "vitest";
import { simulateLine, type LineConfig } from "@/lib/line-sim";
import { mean } from "@/lib/stats";
import { limited, push } from "./config";
import { BOARD, DAYS, MAX_LIMIT, OUTAGE, VARIABILITY } from "./fixture";
import { cfdGapsAt, columnsAt, flowAt } from "./flow";
import { cycleTimeFromLittle } from "./littles";
import { limitSweep } from "./sweep";

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];
const overSeeds = (config: LineConfig) => SEEDS.map((seed) => simulateLine({ ...config, seed }));
const last = DAYS - 1;

describe("kanban board (phase 13 table, 8-seed means)", () => {
  const rows: [string, LineConfig, number, number, number][] = [
    ["push", push(), 2.0, 19.5, 79],
    ["WIP 1", limited(1), 1.0, 4.0, 4],
    ["WIP 2", limited(2), 2.0, 4.0, 8],
    ["WIP 3", limited(3), 2.0, 5.0, 10],
    ["WIP 4", limited(4), 2.0, 6.0, 12],
    ["WIP 8", limited(8), 2.0, 9.8, 20],
    ["WIP 3, Test down days 20-25", limited(3, 0, OUTAGE), 1.82, 5.5, 9.9],
    ["WIP 2, variability 0.5", limited(2, VARIABILITY), 1.78, 4.3, 7.6],
    ["WIP 3, variability 0.5", limited(3, VARIABILITY), 1.98, 5.0, 10],
    ["WIP 4, variability 0.5", limited(4, VARIABILITY), 2.02, 6.0, 12],
  ];

  it.each(rows)("%s", (_, config, throughput, cycleTime, wip) => {
    const runs = overSeeds(config);
    expect(Math.abs(mean(runs.map((r) => r.throughput)) - throughput)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(mean(runs.map((r) => r.avgCycleTime)) - cycleTime)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(mean(runs.map((r) => r.avgWip)) - wip)).toBeLessThanOrEqual(1);
  });

  it("push piles 63 and 61 items into Analyse and Build by day 60", () => {
    expect(simulateLine(push()).ticks[last].queues.slice(0, 2)).toEqual([63, 61]);
  });

  it("obeys Little's law within 10% on every limited run after warm-up", () => {
    for (const variability of [0, VARIABILITY])
      for (let limit = 1; limit <= MAX_LIMIT; limit++)
        for (const r of overSeeds(limited(limit, variability))) {
          const predicted = cycleTimeFromLittle(r.avgWip, r.throughput);
          expect(Math.abs(predicted - r.avgCycleTime) / r.avgCycleTime).toBeLessThanOrEqual(0.1);
        }
  });
});

describe("limitSweep", () => {
  it("halves throughput at limit 1 and starves limit 2 under variability", () => {
    const [one, two, three] = limitSweep(VARIABILITY);
    expect(one.throughput).toBeCloseTo(1, 5);
    expect(two.throughput).toBeLessThan(1.85);
    expect(three.throughput).toBeGreaterThan(1.95);
  });

  it("covers limits 1 to 12 and reaches the 4-day floor at limit 2 without noise", () => {
    const sweep = limitSweep(0);
    expect(sweep.map((p) => p.limit)).toEqual(Array.from({ length: MAX_LIMIT }, (_, i) => i + 1));
    expect(sweep[1]).toMatchObject({ throughput: 2, cycleTime: 4 });
  });
});

describe("live board measures", () => {
  it("push: WIP passes 100 and recent cycle time keeps rising", () => {
    const r = simulateLine(push());
    expect(flowAt(r, last).wip).toBeGreaterThan(100);
    const cycle = [20, 30, 40, 50, last].map((t) => flowAt(r, t).cycleTime);
    cycle.slice(1).forEach((c, i) => expect(c).toBeGreaterThan(cycle[i]));
  });

  it("limit 3 settles at WIP 10, throughput 2 and cycle time 5, and the CFD gaps agree", () => {
    const r = simulateLine(limited(3));
    expect(flowAt(r, last)).toEqual({ wip: 10, throughput: 2, cycleTime: 5 });
    const gaps = cfdGapsAt(r, last);
    expect(gaps.wip).toBe(10);
    expect(last - (gaps.arrivedTick ?? 0)).toBe(5);
    expect(cycleTimeFromLittle(gaps.wip, 2)).toBe(5);
  });

  it("an outage fills and blocks the columns before Test, dips throughput and recovers", () => {
    const config = limited(3, 0, OUTAGE);
    const r = simulateLine(config);
    const during = columnsAt(config, r, OUTAGE.from + 2);
    expect(during.map((c) => [c.full, c.blocked, c.down])).toEqual([
      [true, true, false],
      [true, true, false],
      [true, false, true],
      [false, false, false],
    ]);
    const throughput = r.ticks.map((_, t) => flowAt(r, t).throughput);
    expect(Math.min(...throughput.slice(OUTAGE.from))).toBeLessThan(1.9);
    expect(throughput[last]).toBe(2);
  });

  it("lists each column's items as a contiguous, first-in-first-out id range", () => {
    const r = simulateLine(limited(3));
    const columns = columnsAt(limited(3), r, last);
    expect(columns.map((c) => c.count)).toEqual(r.ticks[last].queues);
    columns.slice(1).forEach((c, i) => expect(c.first + c.count).toBe(columns[i].first));
    expect(columns.map((c) => c.id)).toEqual(BOARD.map((s) => s.id));
  });
});
