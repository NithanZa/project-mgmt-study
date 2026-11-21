import { describe, expect, it } from "vitest";
import { backwardMarks, feedback, inputsOf, marks, moveRow, partition } from "./dsm";
import { ALPHABETICAL, BIKE } from "./fixture";

describe("design structure matrix", () => {
  const best = partition(BIKE);

  it("has one mark per dependency", () => {
    expect(marks(BIKE)).toHaveLength(11);
  });

  it("counts marks above the diagonal for each order", () => {
    expect(ALPHABETICAL.join(" ")).toBe("C E I L M P R T");
    expect(feedback(BIKE, ALPHABETICAL).count).toBe(4);
    expect(feedback(BIKE, best.order).count).toBe(1);
    expect(feedback(BIKE, [...best.order].reverse()).count).toBe(10);
  });

  it("reports the span of each feedback mark", () => {
    expect(feedback(BIKE, best.order).marks).toEqual([{ row: "E", col: "T", span: 2 }]);
  });

  it("partitions into M C I E P T L R with one coupled block", () => {
    expect(best.order.join(" ")).toBe("M C I E P T L R");
    expect(best.order[0]).toBe("M");
    expect(best.order.at(-1)).toBe("R");
    expect(best.blocks).toHaveLength(1);
    expect([...best.blocks[0]].sort()).toEqual(["E", "P", "T"]);
  });

  it("lists the inputs an activity needs", () => {
    expect(inputsOf(BIKE, "E")).toEqual(["C", "I", "T"]);
    expect(inputsOf(BIKE, "M")).toEqual([]);
  });

  it("finds the one arrow that runs backwards in fixture order", () => {
    expect(backwardMarks(BIKE)).toEqual([{ row: "E", col: "T" }]);
  });

  it("moves a row without losing ids", () => {
    const moved = moveRow(ALPHABETICAL, 0, 5);
    expect(moved.join(" ")).toBe("E I L M P C R T");
    expect([...moved].sort()).toEqual([...ALPHABETICAL].sort());
  });
});
