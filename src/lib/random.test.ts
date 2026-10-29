import { describe, expect, it } from "vitest";
import { betaPert, gamma, mulberry32, normal } from "./random";
import { mean, stddev } from "./stats";

const draws = (n: number, f: () => number) => Array.from({ length: n }, f);

describe("random", () => {
  it("mulberry32 is deterministic and in [0, 1)", () => {
    const a = draws(100, mulberry32(7));
    const b = draws(100, mulberry32(7));
    expect(a).toEqual(b);
    expect(a.every((x) => x >= 0 && x < 1)).toBe(true);
  });

  it("normal has mean 0 and sd 1", () => {
    const rng = mulberry32(1);
    const xs = draws(20_000, () => normal(rng));
    expect(Math.abs(mean(xs))).toBeLessThan(0.03);
    expect(Math.abs(stddev(xs) - 1)).toBeLessThan(0.03);
  });

  it("gamma has mean equal to its shape", () => {
    const rng = mulberry32(2);
    expect(Math.abs(mean(draws(20_000, () => gamma(3, rng))) - 3)).toBeLessThan(0.05);
    expect(Math.abs(mean(draws(20_000, () => gamma(0.5, rng))) - 0.5)).toBeLessThan(0.03);
  });

  it("betaPert(3, 5, 9) has mean 5.33 over 20 000 draws", () => {
    const rng = mulberry32(3);
    const xs = draws(20_000, () => betaPert(3, 5, 9, rng));
    expect(Math.abs(mean(xs) - 16 / 3)).toBeLessThan(0.05);
    expect(xs.every((x) => x >= 3 && x <= 9)).toBe(true);
  });
});
