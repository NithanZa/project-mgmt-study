import { describe, expect, it } from "vitest";
import { simulateLine, type LineConfig } from "@/lib/line-sim";
import { drum, push } from "./config";
import { DAYS, WELD_INDEX } from "./fixture";
import { bufferSweep, meansOverSeeds } from "./sweep";

describe("drum-buffer-rope machine shop", () => {
  const rows: [string, LineConfig, number, number, number, number][] = [
    ["push", push(), 3.0, 15.8, 80, 0.97],
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
    const m = meansOverSeeds(config);
    expect(Math.abs(m.throughput - throughput)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(m.drumUtilization - busy)).toBeLessThanOrEqual(0.05);
    expect(Math.abs(m.cycleTime - cycleTime)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(m.wip - wip)).toBeLessThanOrEqual(0.1);
  });

  it("seed 1 starves the drum at buffer 6 and feeds it at 12", () => {
    expect(simulateLine(drum(6, 1)).utilization[WELD_INDEX]).toBeLessThan(0.8);
    expect(simulateLine(drum(12, 1)).utilization[WELD_INDEX]).toBeGreaterThan(0.9);
  });

  it("push piles more than 100 items before the drum by day 60", () => {
    expect(simulateLine(push()).ticks[DAYS - 1].queues[WELD_INDEX]).toBeGreaterThan(100);
  });

  it("the sweep covers targets 3 to 18 and matches the table rows", () => {
    const sweep = bufferSweep(1);
    expect(sweep.map((p) => p.bufferTarget)).toEqual(Array.from({ length: 16 }, (_, i) => i + 3));
    expect(sweep.find((p) => p.bufferTarget === 12)?.drumUtilization).toBeCloseTo(meansOverSeeds(drum(12, 1)).drumUtilization, 10);
    expect(bufferSweep(1)).toBe(sweep);
  });

  it("utilisation rises steeply to 12 and flattens after; cycle time adds about a day per three units", () => {
    const at = (b: number) => bufferSweep(1)[b - 3];
    expect(at(12).drumUtilization - at(6).drumUtilization).toBeGreaterThan(0.15);
    expect(at(18).drumUtilization - at(12).drumUtilization).toBeLessThan(0.05);
    for (const b of [6, 9, 12, 15]) expect(at(b + 3).cycleTime - at(b).cycleTime).toBeGreaterThan(0.5);
    expect((at(18).cycleTime - at(6).cycleTime) / 4).toBeCloseTo(0.83, 1);
  });
});
