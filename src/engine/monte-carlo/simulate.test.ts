import { describe, expect, test } from "vitest";
import { betaPert, mulberry32 } from "@/lib/random";
import { mean } from "@/lib/stats";
import { SHORTLIST } from "./fixture";
import { convergence, pertTotal, simulate } from "./simulate";

describe("simulate", () => {
  test("the same seed gives identical runs", () => {
    const a = simulate({ streams: 3, runs: 500, seed: 11 });
    const b = simulate({ streams: 3, runs: 500, seed: 11 });
    expect(a.durations).toEqual(b.durations);
    expect(a.sample(42)).toEqual(b.sample(42));
  });

  test("a smaller run count is a prefix of a larger one", () => {
    const small = simulate({ streams: 3, runs: 100, seed: 7 });
    const large = simulate({ streams: 3, runs: 1000, seed: 7 });
    expect(large.durations.subarray(0, 100)).toEqual(small.durations);
    expect(large.upTo(100).p80).toBe(small.p80);
  });

  test("beta-PERT sample mean matches the PERT expected value", () => {
    const rng = mulberry32(7);
    const draws = Array.from({ length: 5000 }, () => betaPert(SHORTLIST.o, SHORTLIST.m, SHORTLIST.p, rng));
    expect(Math.abs(mean(draws) - 5.33)).toBeLessThan(0.05);
  });

  test.each([
    [1, 11.66, 11.61],
    [3, 13.03, 13.0],
    [6, 13.74, 13.71],
  ])("%i streams: mean %f, P50 %f (4000 runs, seed 7)", (streams, m, p50) => {
    const sim = simulate({ streams, runs: 4000, seed: 7 });
    expect(Math.abs(sim.mean - m)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(sim.p50 - p50)).toBeLessThanOrEqual(0.1);
  });

  test("PERT total ignores the number of streams", () => {
    for (const streams of [1, 3, 6]) expect(pertTotal({ streams })).toBeCloseTo(11.67, 2);
    expect(pertTotal({ streams: 3, rush: true })).toBeCloseTo(13.83, 2);
  });

  test("criticality sums to 1 and rushing Speakers makes them the bottleneck", () => {
    const even = simulate({ streams: 3, runs: 4000, seed: 7 }).criticality;
    expect(even.reduce((a, b) => a + b)).toBeCloseTo(1, 10);
    for (const share of even) expect(Math.abs(share - 1 / 3)).toBeLessThan(0.03);
    const rush = simulate({ streams: 3, runs: 4000, seed: 7, rush: true }).criticality;
    expect(rush[1]).toBe(Math.max(...rush));
  });

  test("histogram bins are 0.5 days wide and hold every run", () => {
    const sim = simulate({ streams: 3, runs: 1000, seed: 7 });
    for (const bin of sim.histogram) expect(bin.to - bin.from).toBe(0.5);
    expect(sim.histogram.reduce((n, b) => n + b.count, 0)).toBe(1000);
  });

  test("the P80 estimate converges as runs grow", () => {
    const [few, many] = convergence({ streams: 3, runs: 0, seed: 1 }, [10, 5000]);
    expect(few.sd).toBeGreaterThan(0.25);
    expect(many.sd).toBeLessThan(0.05);
  });

  test("5000 runs finish under 100 ms", () => {
    simulate({ streams: 3, runs: 5000, seed: 1 });
    const start = performance.now();
    simulate({ streams: 3, runs: 5000, seed: 2 });
    expect(performance.now() - start).toBeLessThan(100);
  });
});
