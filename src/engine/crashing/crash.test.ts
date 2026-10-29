import { describe, expect, it } from "vitest";
import { schedule } from "./cpm";
import { crashCurve, crashOnce, optimum, shorten, spent } from "./crash";
import { BOOTH } from "./fixture";

const curve = crashCurve(BOOTH);

describe("booth schedule", () => {
  it("is 15 days with A B D E critical and Graphics float 1", () => {
    const s = schedule(BOOTH);
    expect(s.duration).toBe(15);
    expect(s.paths).toEqual([["A", "B", "D", "E"]]);
    expect(s.float.C).toBe(1);
  });

  it("has two critical paths after Fabricate is crashed", () => {
    expect(schedule(crashOnce(BOOTH)!.tasks).paths).toEqual([
      ["A", "B", "D", "E"],
      ["A", "C", "D", "E"],
    ]);
  });
});

describe("crashCurve", () => {
  it("buys the cheapest critical day each step", () => {
    expect(curve.map((p) => p.days)).toEqual([15, 14, 13, 12, 11, 10, 9]);
    expect(curve.map((p) => p.direct)).toEqual([0, 400, 1000, 1600, 2900, 4400, 5900]);
    expect(curve.map((p) => p.step?.crashed)).toEqual([
      undefined,
      ["B"],
      ["A"],
      ["A"],
      ["B", "C"],
      ["D"],
      ["D"],
    ]);
  });

  it("stops at 9 days", () => {
    let tasks = BOOTH;
    for (let step = crashOnce(tasks); step; step = crashOnce(step.tasks)) tasks = step.tasks;
    expect(schedule(tasks).duration).toBe(9);
    expect(crashOnce(tasks)).toBeNull();
    expect(spent(BOOTH, tasks)).toBe(5900);
  });

  it("never crashes Graphics alone", () => {
    expect(curve.some((p) => p.step?.crashed.join() === "C")).toBe(false);
  });

  it("crashing Graphics alone costs money but saves no days", () => {
    const tasks = shorten(BOOTH, ["C"]);
    expect(schedule(tasks).duration).toBe(15);
    expect(spent(BOOTH, tasks)).toBe(900);
  });
});

describe("optimum", () => {
  it.each([
    [300, 15],
    [500, 14],
    [800, 12],
    [1000, 12],
    [1400, 11],
    [2000, 9],
  ])("overhead %i per day is cheapest at %i days", (overhead, days) => {
    expect(optimum(curve, overhead).days).toBe(days);
  });
});
