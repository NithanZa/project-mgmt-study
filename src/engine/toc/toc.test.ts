import { describe, expect, it } from "vitest";
import { MARKET, simulateLine, type LineConfig } from "@/lib/line-sim";
import { BAKERY, OVEN } from "./fixture";
import { baseline, elevate, exploitLoss, invest, investDeltas, subordinate } from "./scenarios";

const ovenIndex = BAKERY.findIndex((s) => s.id === OVEN);

describe("theory of constraints scenarios", () => {
  const rows: [string, LineConfig, number, number | null, number | null][] = [
    ["push", baseline(), 25, 18.7, 716],
    ["Pack +50%", invest(baseline(), "pack"), 25, 18.7, 716],
    ["Proof +50%", invest(baseline(), "proof"), 25, 18.7, 716],
    ["Oven +50% (37)", invest(baseline(), OVEN), 37, 6.1, 230],
    ["Oven x2", elevate(baseline(), OVEN, 2), 38, 5.0, 190],
    ["subordinate", subordinate(baseline()), 25, 5.0, 125],
    ["cleaning loss", exploitLoss(baseline(), true), 20, null, null],
  ];

  it.each(rows)("%s", (_, config, throughput, cycleTime, wip) => {
    const r = simulateLine(config);
    expect(Math.abs(r.throughput - throughput) / throughput).toBeLessThanOrEqual(0.02);
    if (cycleTime !== null) expect(Math.abs(r.avgCycleTime - cycleTime)).toBeLessThanOrEqual(0.5);
    if (wip !== null) expect(Math.abs(r.avgWip - wip) / wip).toBeLessThanOrEqual(0.02);
  });

  it("an oven at 37 is the +50% investment", () => {
    expect(invest(baseline(), OVEN).stations[ovenIndex].capacity).toBe(37);
  });

  it("subordinating keeps three hours of oven work upstream", () => {
    expect(subordinate(baseline())).toMatchObject({ release: "drum", bufferTarget: 75 });
  });

  it("doubling the oven moves the constraint to the market", () => {
    const r = simulateLine(elevate(baseline(), OVEN, 2));
    expect(r.constraint).toBe(MARKET);
    expect(r.utilization[ovenIndex]).toBeLessThan(0.8);
    expect(simulateLine(baseline()).constraint).toBe(OVEN);
  });

  it("turning the cleaning loss off restores the baseline", () => {
    expect(simulateLine(exploitLoss(exploitLoss(baseline(), true), false)).throughput).toBe(25);
  });

  it("only the oven investment moves throughput", () => {
    expect(investDeltas()).toEqual({ mix: 0, proof: 0, oven: 12, cool: 0, pack: 0 });
  });
});
