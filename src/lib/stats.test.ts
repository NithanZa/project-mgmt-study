import { describe, expect, it } from "vitest";
import { mean, normalCdf, normalQuantile, quantile, stddev } from "./stats";

describe("stats", () => {
  it("normalCdf(0.8) is 0.7881", () => {
    expect(Math.abs(normalCdf(0.8) - 0.7881)).toBeLessThan(1e-4);
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(-1.96)).toBeCloseTo(0.025, 3);
  });
  it("normalQuantile inverts normalCdf", () => {
    expect(normalQuantile(0.5)).toBeCloseTo(0, 6);
    expect(normalQuantile(0.8)).toBeCloseTo(0.8416, 3);
    expect(normalCdf(normalQuantile(0.95))).toBeCloseTo(0.95, 6);
  });
  it("quantile interpolates", () => {
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5);
    expect(quantile([1, 2, 3, 4], 0)).toBe(1);
    expect(quantile([1, 2, 3, 4], 1)).toBe(4);
  });
  it("mean and stddev", () => {
    expect(mean([2, 4, 6])).toBe(4);
    expect(stddev([2, 4, 6])).toBe(2);
  });
});
