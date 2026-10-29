"use client";

import { LessonShell } from "@/components/lesson/lesson-shell";
import { DEADLINE, MIGRATION, WIDE_PESSIMISTIC } from "@/engine/pert/fixture";
import { expected, projectEstimate, withEstimate } from "@/engine/pert/pert";
import { pct } from "@/lib/format";
import { commitDays } from "@/scenes/pert/format";
import { PertScene } from "@/scenes/pert/scene";
import { PertThumbnail } from "@/scenes/pert/thumbnail";
import { lessonBySlug } from "../meta";
import type { Lesson } from "../types";

const write = MIGRATION.find((t) => t.id === "write")!;
const base = projectEstimate(MIGRATION);
const wide = projectEstimate(
  withEstimate(MIGRATION, write.id, { ...write.estimate, p: WIDE_PESSIMISTIC }),
);
const CHECK = { o: 2, m: 4, p: 12 };
const checkAnswer = expected(CHECK);
const checkOptions = [checkAnswer - 1, checkAnswer, checkAnswer + 1];

export const lesson: Lesson = {
  meta: lessonBySlug("pert"),
  beats: [
    {
      id: "ranges",
      title: "Three numbers beat one guess.",
      body: (
        <>
          Each task gets an optimistic, a most-likely and a pessimistic estimate. The most-likely
          values add up to {base.modeSum} days, the number people usually promise.
        </>
      ),
    },
    {
      id: "expected",
      title: "The expected value leans toward the tail.",
      body: (
        <>
          PERT weights the most-likely value four times: (o + 4m + p) / 6. Long pessimistic tails
          pull every expectation right; {write.name} moves from {write.estimate.m} to{" "}
          {expected(write.estimate).toFixed(1)} days.
        </>
      ),
    },
    {
      id: "project",
      title: "Means and variances add along the chain.",
      body: (
        <>
          The project centres on {base.expected.toFixed(1)} days with sigma{" "}
          {base.sigma.toFixed(1)}. The {base.modeSum}-day promise has a{" "}
          {pct(base.probabilityBy(base.modeSum))} chance.
        </>
      ),
    },
    {
      id: "commit",
      title: "Commit at the confidence you can live with.",
      body: (
        <>
          Drag the deadline or pick a confidence level. An 80% commitment needs{" "}
          {commitDays(base.daysFor(0.8))} days, not {base.modeSum}.
        </>
      ),
    },
    {
      id: "widen",
      title: "Try it: one wide tail dominates the spread.",
      body: (
        <>
          Raise {write.name}&apos;s pessimistic estimate to {WIDE_PESSIMISTIC} days: the mean moves
          to {wide.expected.toFixed(1)} and the chance of finishing by {DEADLINE} days drops from{" "}
          {pct(base.probabilityBy(DEADLINE))} to {pct(wide.probabilityBy(DEADLINE))}.
        </>
      ),
    },
  ],
  Scene: PertScene,
  Thumbnail: PertThumbnail,
  check: {
    question: `A task is estimated ${CHECK.o} / ${CHECK.m} / ${CHECK.p} days. PERT expected duration?`,
    options: checkOptions.map((d) => `${d} days`),
    answer: 1,
    why: `The most-likely counts four times: (${CHECK.o} + ${4 * CHECK.m} + ${CHECK.p}) / 6 = ${checkAnswer} days.`,
  },
};

export default function PertLesson() {
  return <LessonShell lesson={lesson} />;
}
