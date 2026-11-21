import { describe, expect, it } from "vitest";
import { createElement, type FunctionComponent, type ReactNode } from "react";
import { Term } from "@/components/lesson/term";
import { LESSONS } from "./meta";
import { termIds, textOf, wordCount } from "./teaching";
import type { Lesson } from "./types";

// createElement passes children as rest arguments, which the props type cannot see.
const TermElement = Term as FunctionComponent<{ id: string; children?: ReactNode }>;

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function load(slug: string): Promise<Lesson> {
  const mod = (await import(`./lessons/${slug}.tsx`)) as { lesson: Lesson };
  return mod.lesson;
}

describe("teaching helpers", () => {
  it("reads text, words and term ids from a node", () => {
    const node = createElement(
      "span",
      null,
      "The ",
      createElement(TermElement, { id: "critical-path" }, "critical path"),
      " sets the date & more.",
    );
    expect(textOf(node)).toBe("The critical path sets the date & more.");
    expect(wordCount(node)).toBe(7);
    expect(termIds(node)).toEqual(["critical-path"]);
  });
});

describe.each(LESSONS.map((m) => m.slug))("lesson %s", (slug) => {
  it("imports and matches its slug", async () => {
    const lesson = await load(slug);
    expect(lesson.meta.slug).toBe(slug);
    expect(lesson.beats.length).toBeGreaterThan(0);
  });

  it("keeps every beat body and why within forty words", async () => {
    const lesson = await load(slug);
    for (const beat of lesson.beats) {
      expect(wordCount(beat.body), `${beat.id} body`).toBeLessThanOrEqual(40);
      if (beat.why !== undefined) {
        expect(wordCount(beat.why), `${beat.id} why`).toBeLessThanOrEqual(40);
      }
    }
  });

  it("shapes every predict", async () => {
    const lesson = await load(slug);
    for (const { id, predict } of lesson.beats) {
      if (!predict) continue;
      expect(predict.options.length, `${id} options`).toBeGreaterThanOrEqual(2);
      expect(predict.options.length, `${id} options`).toBeLessThanOrEqual(3);
      expect(Number.isInteger(predict.answer), `${id} answer`).toBe(true);
      expect(predict.answer, `${id} answer`).toBeGreaterThanOrEqual(0);
      expect(predict.answer, `${id} answer`).toBeLessThan(predict.options.length);
      expect(predict.why.trim(), `${id} why`).not.toBe("");
    }
  });

  it("asks one to three predicts", async () => {
    const lesson = await load(slug);
    const predicts = lesson.beats.filter((b) => b.predict).length;
    expect(predicts, "beats with a predict").toBeGreaterThanOrEqual(1);
    expect(predicts, "beats with a predict").toBeLessThanOrEqual(3);
  });

  it("shapes the recap", async () => {
    const lesson = await load(slug);
    expect(lesson.recap, "recap").toBeDefined();
    const ids = new Set(lesson.beats.map((b) => b.id));
    expect(lesson.recap.length).toBeGreaterThanOrEqual(3);
    expect(lesson.recap.length).toBeLessThanOrEqual(6);
    for (const step of lesson.recap) {
      expect(wordCount(step.step), step.step).toBeLessThanOrEqual(12);
      expect(ids.has(step.beat), `recap beat ${step.beat}`).toBe(true);
    }
  });

  it("uses kebab-case Term ids", async () => {
    const lesson = await load(slug);
    for (const beat of lesson.beats) {
      for (const id of [...termIds(beat.body), ...termIds(beat.why)]) {
        expect(id, `${beat.id} term`).toMatch(KEBAB);
      }
    }
  });
});
