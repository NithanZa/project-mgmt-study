import { describe, expect, it } from "vitest";
import { fever } from "./fever";
import { REDESIGN } from "./fixture";
import { bestFeasible, buffers, chain, clashes, committedDate, cpm, float } from "./schedule";

const safe = bestFeasible(REDESIGN, "safe");
const aggressive = bestFeasible(REDESIGN, "aggressive");

describe("critical chain: website redesign", () => {
  it("safe critical path ignoring resources is 23 days through Design", () => {
    const s = cpm(REDESIGN, "safe");
    expect(s.makespan).toBe(23);
    expect(chain(REDESIGN, s).ids).toEqual(["design", "pages", "integrate", "launch"]);
    expect(clashes(REDESIGN, s)).toEqual([{ resource: "developer", from: 8, to: 11 }]);
  });

  it("best resource-feasible safe schedule is 26 days with CMS before Pages", () => {
    expect(safe.makespan).toBe(26);
    expect(clashes(REDESIGN, safe)).toEqual([]);
    expect(safe.start).toEqual({ copy: 0, design: 0, cms: 5, pages: 11, integrate: 21, launch: 25 });
  });

  it("the chain runs through the developer with a CMS → Pages resource link", () => {
    const c = chain(REDESIGN, safe);
    expect(c.ids).toEqual(["copy", "cms", "pages", "integrate", "launch"]);
    expect(c.links).toContainEqual({ from: "cms", to: "pages", kind: "resource" });
    expect(c.links.filter((l) => l.kind === "resource")).toHaveLength(1);
    expect(float(REDESIGN, safe).design).toBe(3);
  });

  it("aggressive chain is 16 days", () => {
    expect(aggressive.makespan).toBe(16);
    expect(aggressive.start).toEqual({ copy: 0, design: 0, cms: 3, pages: 7, integrate: 13, launch: 15 });
    expect(chain(REDESIGN, aggressive).ids).toEqual(["copy", "cms", "pages", "integrate", "launch"]);
  });

  it("project buffer is 5 by half and 6 by root-sum-square", () => {
    expect(buffers(REDESIGN, aggressive, "half").project).toEqual({ days: 5, method: "half" });
    expect(buffers(REDESIGN, aggressive, "rss").project).toEqual({ days: 6, method: "rss" });
    expect(committedDate(REDESIGN, aggressive)).toBe(21);
    expect(committedDate(REDESIGN, aggressive, "rss")).toBe(22);
  });

  it("a 2-day feeding buffer guards Pages and ends at its start", () => {
    const { feeding } = buffers(REDESIGN, aggressive);
    expect(feeding).toEqual([{ before: "pages", from: "design", days: 2 }]);
    expect(aggressive.finish.design + feeding[0].days).toBe(aggressive.start.pages);
  });

  it("fever zones: no overrun green at 0, CMS +2 yellow, CMS +4 red", () => {
    expect(fever(REDESIGN, {})).toMatchObject({ chainComplete: 0, bufferUsed: 0, zone: "green" });
    expect(fever(REDESIGN, { cms: 0 })).toMatchObject({ bufferUsed: 0, zone: "green" });
    const yellow = fever(REDESIGN, { cms: 2 });
    expect(yellow).toMatchObject({ chainComplete: 7 / 16, bufferUsed: 0.4, zone: "yellow" });
    expect(fever(REDESIGN, { cms: 4 }).zone).toBe("red");
  });

  it("a late feeding task is absorbed by its feeding buffer", () => {
    expect(fever(REDESIGN, { design: 2, pages: 0 }).bufferUsed).toBe(0);
    expect(fever(REDESIGN, { design: 3, pages: 0 }).bufferUsed).toBe(1 / 5);
  });
});
