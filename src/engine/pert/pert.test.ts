import { describe, expect, it } from "vitest";
import { MIGRATION, WIDE_PESSIMISTIC } from "./fixture";
import { betaPertPdf, betaShape, expected, projectEstimate, variance, withEstimate } from "./pert";

const TABLE: Record<string, [number, number]> = {
  audit: [2.17, 0.25],
  schema: [3.5, 0.694],
  write: [5.83, 2.25],
  "dry-run": [2.33, 0.444],
  cutover: [1.33, 0.111],
};

describe("task estimates", () => {
  it.each(MIGRATION)("$name matches the table", ({ id, estimate }) => {
    const [mean, spread] = TABLE[id];
    expect(expected(estimate)).toBeCloseTo(mean, 2);
    expect(variance(estimate)).toBeCloseTo(spread, 3);
  });

  it("derives beta shape from the mode's position in the range", () => {
    expect(betaShape({ o: 3, m: 5, p: 12 })).toEqual({ alpha: 1 + 8 / 9, beta: 1 + 28 / 9 });
  });

  it.each(MIGRATION)("$name density integrates to 1 over [o, p]", ({ estimate }) => {
    const steps = 4000;
    const h = (estimate.p - estimate.o) / steps;
    let area = 0;
    for (let i = 0; i < steps; i++) {
      const a = estimate.o + i * h;
      area += ((betaPertPdf(estimate, a) + betaPertPdf(estimate, a + h)) / 2) * h;
    }
    expect(Math.abs(area - 1)).toBeLessThan(0.01);
    expect(betaPertPdf(estimate, estimate.o - 1)).toBe(0);
    expect(betaPertPdf(estimate, estimate.p + 1)).toBe(0);
  });
});

describe("projectEstimate", () => {
  const project = projectEstimate(MIGRATION);

  it("sums modes, expectations and variances along the chain", () => {
    expect(project.modeSum).toBe(13);
    expect(Math.abs(project.expected - 15.17)).toBeLessThan(0.01);
    expect(Math.abs(project.sigma - 1.936)).toBeLessThan(0.001);
  });

  it.each([
    [13, 0.13],
    [15, 0.47],
    [17, 0.83],
    [18, 0.93],
    [20, 0.99],
  ])("P(<= %i days) is %f", (days, p) => {
    expect(Math.abs(project.probabilityBy(days) - p)).toBeLessThan(0.005);
  });

  it("gives P(<= 17) of 0.828", () => {
    expect(Math.abs(project.probabilityBy(17) - 0.828)).toBeLessThan(0.005);
  });

  it("gives the days needed for a confidence level", () => {
    expect(Math.abs(project.daysFor(0.5) - 15.17)).toBeLessThan(0.01);
    expect(Math.abs(project.daysFor(0.8) - 16.8)).toBeLessThan(0.05);
    expect(Math.abs(project.daysFor(0.9) - 17.65)).toBeLessThan(0.01);
    expect(Math.abs(project.daysFor(0.95) - 18.35)).toBeLessThan(0.01);
  });

  it("widening Write migration's pessimistic estimate to 20 shifts and spreads the project", () => {
    const write = MIGRATION.find((t) => t.id === "write")!;
    const tasks = withEstimate(MIGRATION, "write", { ...write.estimate, p: WIDE_PESSIMISTIC });
    const wide = projectEstimate(tasks);
    expect(wide.expected).toBeCloseTo(16.5, 2);
    expect(Math.abs(wide.sigma - 3.09)).toBeLessThan(0.005);
    expect(Math.abs(wide.probabilityBy(17) - 0.56)).toBeLessThan(0.005);
    expect(write.estimate.p).toBe(12);
  });
});
