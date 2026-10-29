import { describe, expect, it } from "vitest";
import { HIRING, IMPROVEMENTS } from "./fixture";
import type { ImprovementId } from "./types";
import { applyImprovements, summary, withProcessHours } from "./vsm";

const FUTURE_A: ImprovementId[] = [
  "takeHomeFastReview",
  "onsiteWithinTwoDays",
  "sameDayDebrief",
  "offerApprovalOneDay",
];
const FUTURE_B: ImprovementId[] = [...FUTURE_A, "screensWithinOneDay"];

describe("value stream summary", () => {
  it("current state: 25.5 days lead time, 1.5 days of work, 5.9% efficiency", () => {
    const s = summary(HIRING);
    expect(s.leadTimeDays).toBeCloseTo(25.5);
    expect(s.processDays).toBeCloseTo(1.5);
    expect(s.waitDays).toBeCloseTo(24);
    expect(s.efficiency * 100).toBeCloseTo(5.9, 1);
  });

  it("future state A: 12.5 days, 12%", () => {
    const s = summary(applyImprovements(HIRING, FUTURE_A));
    expect(s.leadTimeDays).toBeCloseTo(12.5);
    expect(s.efficiency).toBeCloseTo(0.12);
  });

  it("future state B: 7.5 days, 20%", () => {
    const s = summary(applyImprovements(HIRING, FUTURE_B));
    expect(s.leadTimeDays).toBeCloseTo(7.5);
    expect(s.efficiency).toBeCloseTo(0.2);
  });

  it("a 2-hour onsite moves the current lead time only to 25.1 days", () => {
    const s = summary(withProcessHours(HIRING, "onsite", 2));
    expect(Math.round(s.leadTimeDays * 10) / 10).toBe(25.1);
  });
});

describe("improvements", () => {
  it("never produce negative waits", () => {
    const steps = applyImprovements(HIRING, FUTURE_B);
    for (const s of steps) expect(s.waitDays).toBeGreaterThanOrEqual(0);
  });

  it("are idempotent", () => {
    for (const i of IMPROVEMENTS) {
      const once = i.apply(HIRING);
      expect(i.apply(once)).toEqual(once);
    }
    expect(applyImprovements(applyImprovements(HIRING, FUTURE_B), FUTURE_B)).toEqual(
      applyImprovements(HIRING, FUTURE_B),
    );
  });

  it("do not mutate the input", () => {
    const before = structuredClone(HIRING);
    applyImprovements(HIRING, FUTURE_B);
    expect(HIRING).toEqual(before);
  });
});
