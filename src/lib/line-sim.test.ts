import { describe, expect, it } from "vitest";
import { MARKET, simulateLine, type LineConfig, type LineResult } from "./line-sim";

const line = (capacities: Record<string, number>) =>
  Object.entries(capacities).map(([id, capacity]) => ({ id, name: id, capacity }));

const mean = (results: LineResult[], f: (r: LineResult) => number) =>
  results.reduce((sum, r) => sum + f(r), 0) / results.length;

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];
const overSeeds = (config: LineConfig) => SEEDS.map((seed) => simulateLine({ ...config, seed }));

describe("simulateLine: bakery (phase 11)", () => {
  const bakery = (overrides: Record<string, number> = {}): LineConfig => ({
    stations: line({ mix: 60, proof: 40, oven: 25, cool: 50, pack: 45, ...overrides }),
    arrivalsPerTick: 38,
    ticks: 80,
    seed: 1,
    release: "push",
    variability: 0,
  });

  const rows: [string, LineConfig, number, number, number][] = [
    ["push", bakery(), 25, 18.7, 716],
    ["Pack +50%", bakery({ pack: 67 }), 25, 18.7, 716],
    ["Proof +50%", bakery({ proof: 60 }), 25, 18.7, 716],
    ["Oven +50% (37)", bakery({ oven: 37 }), 37, 6.1, 230],
    ["Oven x2", bakery({ oven: 50 }), 38, 5.0, 190],
    ["subordinate", { ...bakery(), release: "drum", bufferTarget: 75 }, 25, 5.0, 125],
  ];

  it.each(rows)("%s", (_, config, throughput, cycleTime, wip) => {
    const r = simulateLine(config);
    expect(Math.abs(r.throughput - throughput) / throughput).toBeLessThanOrEqual(0.02);
    expect(Math.abs(r.avgCycleTime - cycleTime)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(r.avgWip - wip) / wip).toBeLessThanOrEqual(0.02);
  });

  it("piles up only before the oven under push", () => {
    expect(simulateLine(bakery()).ticks[79].queues).toEqual([38, 38, 1039, 25, 25]);
  });

  it("leaves the oven 73% busy once demand is the constraint", () => {
    const r = simulateLine(bakery({ oven: 50 }));
    expect(r.utilization[2]).toBeCloseTo(0.73, 2);
    expect(r.constraint).toBe(MARKET);
  });

  it("loses a fifth of throughput when the oven loses 20% to cleaning", () => {
    const r = simulateLine({ ...bakery(), efficiency: { oven: 0.8 } });
    expect(r.throughput).toBeCloseTo(20, 5);
    expect(r.constraint).toBe("oven");
  });

  it("conserves items on every tick", () => {
    const configs = [
      bakery(),
      { ...bakery(), release: "drum" as const, bufferTarget: 75, variability: 0.6 },
      { ...bakery(), wipLimit: 30, variability: 1, outage: { station: "proof", from: 20, to: 30 } },
    ];
    for (const config of configs) {
      const r = simulateLine(config);
      r.ticks.forEach((t, i) => {
        expect(r.cfd[i].cumulativeIn).toBe(t.exited + t.wip);
        expect(t.wip).toBe(t.queues.reduce((a, b) => a + b, 0));
      });
    }
  });

  it("records each item's path and caps the item log", () => {
    const r = simulateLine({ ...bakery(), ticks: 200 });
    expect(r.items).toHaveLength(5000);
    const first = r.items[0];
    expect(first.history).toEqual([0, 1, 2, 3, 4]);
    expect(first.exitedTick).toBe(5);
  });
});

describe("simulateLine: machine shop (phase 12 table)", () => {
  const shop = (config: Partial<LineConfig> = {}): LineConfig => ({
    stations: line({ cut: 6, weld: 3, paint: 5 }),
    arrivalsPerTick: 5,
    ticks: 60,
    seed: 1,
    release: "push",
    variability: 0,
    ...config,
  });
  const drum = (bufferTarget: number, variability: number) =>
    shop({ release: "drum", bufferTarget, variability });

  const rows: [string, LineConfig, number, number, number, number][] = [
    ["push", shop(), 3.0, 15.8, 80, 0.97],
    ["drum 6", drum(6, 0), 3.0, 3.0, 9, 0.97],
    ["drum 6, v 1.0", drum(6, 1), 2.17, 4.0, 8.7, 0.71],
    ["drum 9, v 1.0", drum(9, 1), 2.76, 4.6, 12.6, 0.89],
    ["drum 12, v 1.0", drum(12, 1), 2.95, 5.4, 16.0, 0.94],
    ["drum 15, v 1.0", drum(15, 1), 2.99, 6.3, 19.1, 0.96],
    ["drum 18, v 1.0", drum(18, 1), 3.0, 7.3, 22.1, 0.96],
    ["drum 6, v 0.5", drum(6, 0.5), 2.68, 3.3, 8.7, 0.86],
    ["drum 9, v 0.5", drum(9, 0.5), 2.98, 4.0, 12.0, 0.96],
  ];

  it.each(rows)("%s (8-seed mean)", (_, config, throughput, cycleTime, wip, busy) => {
    const rs = overSeeds(config);
    expect(Math.abs(mean(rs, (r) => r.throughput) - throughput)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(mean(rs, (r) => r.utilization[1]) - busy)).toBeLessThanOrEqual(0.05);
    expect(Math.abs(mean(rs, (r) => r.avgCycleTime) - cycleTime)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(mean(rs, (r) => r.avgWip) - wip)).toBeLessThanOrEqual(0.1);
  });

  it("seed 1 starves the drum at buffer 6 and feeds it at 12", () => {
    expect(simulateLine(drum(6, 1)).utilization[1]).toBeLessThan(0.8);
    expect(simulateLine(drum(12, 1)).utilization[1]).toBeGreaterThan(0.9);
  });
});

describe("simulateLine: product board (phase 13 table)", () => {
  const board = (config: Partial<LineConfig> = {}): LineConfig => ({
    stations: line({ analyse: 3, build: 2, test: 3, deploy: 4 }),
    arrivalsPerTick: 4,
    ticks: 60,
    seed: 1,
    release: "push",
    variability: 0,
    ...config,
  });

  const rows: [string, LineConfig, number, number, number][] = [
    ["push", board(), 2.0, 19.5, 79],
    ["WIP 1", board({ wipLimit: 1 }), 1.0, 4.0, 4],
    ["WIP 2", board({ wipLimit: 2 }), 2.0, 4.0, 8],
    ["WIP 3", board({ wipLimit: 3 }), 2.0, 5.0, 10],
    ["WIP 4", board({ wipLimit: 4 }), 2.0, 6.0, 12],
    ["WIP 8", board({ wipLimit: 8 }), 2.0, 9.8, 20],
    ["WIP 3, Test down 20-25", board({ wipLimit: 3, outage: { station: "test", from: 20, to: 25 } }), 1.82, 5.5, 9.9],
    ["WIP 2, v 0.5", board({ wipLimit: 2, variability: 0.5 }), 1.78, 4.3, 7.6],
    ["WIP 3, v 0.5", board({ wipLimit: 3, variability: 0.5 }), 1.98, 5.0, 10],
    ["WIP 4, v 0.5", board({ wipLimit: 4, variability: 0.5 }), 2.02, 6.0, 12],
  ];

  it.each(rows)("%s (8-seed mean)", (_, config, throughput, cycleTime, wip) => {
    const rs = overSeeds(config);
    expect(Math.abs(mean(rs, (r) => r.throughput) - throughput)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(mean(rs, (r) => r.avgCycleTime) - cycleTime)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(mean(rs, (r) => r.avgWip) - wip)).toBeLessThanOrEqual(1);
  });

  it("push leaves Analyse and Build queues of 63 and 61 at day 60", () => {
    expect(simulateLine(board()).ticks[59].queues.slice(0, 2)).toEqual([63, 61]);
  });
});
