import { describe, expect, it } from "vitest";
import { days, money, pct } from "./format";

describe("format", () => {
  it("formats days", () => {
    expect(days(12)).toBe("12 days");
    expect(days(1)).toBe("1 day");
    expect(days(15.166)).toBe("15.2 days");
  });
  it("formats money", () => {
    expect(money(5900)).toBe("$5,900");
    expect(money(-400)).toBe("-$400");
  });
  it("formats percentages", () => {
    expect(pct(0.828)).toBe("83%");
    expect(pct(0.059, 1)).toBe("5.9%");
  });
});
